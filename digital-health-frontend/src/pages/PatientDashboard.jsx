import React, { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, StatCard, SectionHeader, AlertBanner, LoadingSpinner, EmptyState, Button } from '../components/ui'
import { clinicalAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { User, ClipboardList, Brain, Calendar, MapPin, Pill, RefreshCw, Bell, Download, QrCode, Bot, Send, Utensils } from 'lucide-react'

const severityStyle = {
  low:      { color: '#00e5a0', bg: 'rgba(0,229,160,0.1)',  border: 'rgba(0,229,160,0.25)' },
  moderate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  high:     { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.25)' },
}

function buildQrMatrix(text, size = 25) {
  let seed = 0
  for (let i = 0; i < text.length; i += 1) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0
  }

  const finder = (row, col) => {
    const inTopLeft = row < 7 && col < 7
    const inTopRight = row < 7 && col >= size - 7
    const inBottomLeft = row >= size - 7 && col < 7
    if (!inTopLeft && !inTopRight && !inBottomLeft) return null
    const localRow = row < 7 ? row : row - (size - 7)
    const localCol = col < 7 ? col : col - (size - 7)
    return localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6 || (localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4)
  }

  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const fixed = finder(row, col)
      if (fixed !== null) return fixed
      seed = (seed * 1664525 + 1013904223 + row * 97 + col * 53) >>> 0
      return ((seed >> ((row + col) % 16)) & 1) === 1
    })
  )
}

function answerPatientQuery(query, { history, latestSeverity, medicalRecords, diagnoses, prescriptions, predictions, notifications, dietPlans }) {
  const text = query.toLowerCase()
  const latestDiagnosis = diagnoses[0]
  const latestPrescription = prescriptions[0]
  const latestPrediction = predictions[0]
  const latestRecord = medicalRecords[0]
  const latestDiet = dietPlans[0]
  const nextFollowUp = notifications.find(item => item.category === 'follow_up' && item.followUpDate)

  if (text.includes('severity') || text.includes('risk') || text.includes('prediction')) {
    return latestPrediction
      ? `Your latest ML severity is ${latestSeverity || latestPrediction.predictedSeverity}. Risk score is ${Math.round((latestPrediction.probability || 0) * 100)}%.`
      : 'No ML severity prediction is available yet.'
  }

  if (text.includes('medicine') || text.includes('prescription') || text.includes('tablet')) {
    const meds = latestPrescription?.medicines || []
    return meds.length
      ? `Your latest medicines are: ${meds.map(item => [item.medicineName, item.dosage, item.frequency].filter(Boolean).join(' ')).join(', ')}.`
      : 'No prescription is available in your records yet.'
  }

  if (text.includes('follow')) {
    return nextFollowUp
      ? `Your follow-up is scheduled for ${new Date(nextFollowUp.followUpDate).toLocaleDateString('en-IN')}.`
      : 'No follow-up reminder is currently available.'
  }

  if (text.includes('diet') || text.includes('food') || text.includes('eat')) {
    return latestDiet
      ? `Your latest AI diet guidance recommends: ${(latestDiet.recommendedFoods || []).slice(0, 5).join(', ')}. Avoid: ${(latestDiet.avoidFoods || []).slice(0, 4).join(', ')}.`
      : 'No AI diet plan is available yet. It will appear after your doctor completes diagnosis.'
  }

  if (text.includes('diagnosis') || text.includes('disease')) {
    return latestDiagnosis
      ? `Your latest diagnosis is ${latestDiagnosis.diseaseName}.`
      : 'No diagnosis has been recorded yet.'
  }

  if (text.includes('visit') || text.includes('record')) {
    return latestRecord
      ? `You have ${medicalRecords.length} visit record(s). Latest visit status is ${latestRecord.status?.replace(/_/g, ' ') || 'pending'}.`
      : 'No visit records are available yet.'
  }

  if (text.includes('code') || text.includes('qr')) {
    return `Your patient code is ${history?.patient?.patientCode || 'not available yet'}. Use the QR health card for quick hospital lookup.`
  }

  return 'You can ask about your latest diagnosis, medicines, follow-up date, ML severity, visit records, or patient code.'
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: 'Hi, I can answer questions from your health records. Try asking: What is my latest severity?' },
  ])

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await clinicalAPI.getMyHistory()
      const noteRes = await clinicalAPI.getMyNotifications()
      setHistory(res.data)
      setNotifications(noteRes.data.notifications || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load health records. Check backend connection.')
      setHistory(null)
    } finally {
      setLoading(false)
    }
  }

  const medicalRecords = history?.medicalRecords || []
  const diagnoses = history?.diagnoses || []
  const prescriptions = history?.prescriptions || []
  const predictions = history?.predictions || []
  const dietPlans = history?.dietPlans || []

  const latestSeverity = predictions[0]?.predictedSeverity || null
  const ss = latestSeverity ? severityStyle[latestSeverity] : null

  const patientName    = history?.patient?.fullName || user?.fullName || '—'
  const patientCode    = history?.patient?.patientCode || '—'
  const patientDistrict= history?.patient?.district || ''
  const patientArea    = history?.patient?.area     || ''
  const patientAge     = history?.patient?.age
  const qrPayload = `${patientCode}|${patientName}|${patientDistrict}|${history?.patient?._id || user?.id || ''}`
  const qrMatrix = useMemo(() => buildQrMatrix(qrPayload), [qrPayload])

  const exportHistory = async () => {
    const res = await clinicalAPI.exportMyHistory()
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'patient-history.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const sendChatMessage = (e) => {
    e.preventDefault()
    const question = chatInput.trim()
    if (!question) return

    const response = answerPatientQuery(question, {
      history,
      latestSeverity,
      medicalRecords,
      diagnoses,
      prescriptions,
      predictions,
      notifications,
      dietPlans,
    })
    setChatMessages(prev => [...prev, { from: 'user', text: question }, { from: 'bot', text: response }])
    setChatInput('')
  }

  return (
    <DashboardLayout title="My Health Records" subtitle="Personal medical history and visit records">

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Card style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
          <Button variant="secondary" onClick={fetchHistory} icon={RefreshCw}>Retry</Button>
        </Card>
      ) : (
        <>
          {/* Profile card */}
          <Card style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: '#080f1a',
                flexShrink: 0, boxShadow: '0 0 30px rgba(0,229,160,0.25)',
              }}>
                {patientName[0]?.toUpperCase() || 'P'}
              </div>

              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  {patientName}
                </h2>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <User size={13} />
                    Code: <strong style={{ color: 'var(--accent-primary)' }}>{patientCode}</strong>
                  </span>
                  {(patientArea || patientDistrict) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <MapPin size={13} />
                      {[patientArea, patientDistrict].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {patientAge && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Calendar size={13} />
                      Age: {patientAge} years
                    </span>
                  )}
                </div>
              </div>

              {ss && (
                <div style={{ padding: '14px 20px', background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Latest Severity</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: ss.color, textTransform: 'capitalize' }}>
                    {latestSeverity}
                  </div>
                </div>
              )}

              <Button icon={Download} variant="secondary" size="sm" onClick={exportHistory}>Export CSV</Button>
              <Button icon={RefreshCw} variant="secondary" size="sm" onClick={fetchHistory}>Refresh</Button>
            </div>
          </Card>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard label="Total Visits"    value={medicalRecords.length} icon={Calendar}      accent="var(--accent-primary)" />
            <StatCard label="Total Diagnoses" value={diagnoses.length}      icon={ClipboardList}  accent="var(--accent-secondary)" />
            <StatCard label="ML Predictions"  value={predictions.length}    icon={Brain}         accent="var(--accent-violet)" />
            <StatCard label="Notifications"   value={notifications.length}  icon={Bell}          accent="var(--accent-amber)" />
            <StatCard label="Diet Plans"       value={dietPlans.length}      icon={Utensils}      accent="var(--accent-primary)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '20px', marginBottom: '24px' }}>
            <Card style={{ padding: '22px' }}>
              <SectionHeader title="QR Health Card" subtitle="Use this card for quick hospital lookup during repeat visits" />
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap', marginTop: '18px' }}>
                <div style={{ width: '158px', height: '158px', borderRadius: '18px', background: '#fff', border: '1px solid var(--border-subtle)', padding: '12px', boxShadow: '0 18px 40px rgba(15,23,42,0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${qrMatrix.length},1fr)`, gap: '1px', width: '100%', height: '100%' }}>
                    {qrMatrix.flatMap((row, rowIndex) =>
                      row.map((active, colIndex) => (
                        <span
                          key={`${rowIndex}-${colIndex}`}
                          style={{ background: active ? '#0f172a' : '#fff', borderRadius: active ? '1px' : 0 }}
                        />
                      ))
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '210px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 800, marginBottom: '10px' }}>
                    <QrCode size={18} />
                    {patientCode}
                  </div>
                  <div style={{ display: 'grid', gap: '7px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Name:</strong> {patientName}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Age:</strong> {patientAge || 'Not available'}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Area:</strong> {[patientArea, patientDistrict].filter(Boolean).join(', ') || 'Not available'}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Latest Severity:</strong> {latestSeverity || 'Pending'}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card style={{ padding: '22px' }}>
              <SectionHeader title="Patient Chatbot" subtitle="Ask simple questions from your own health records" />
              <div style={{ height: '230px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '18px', paddingRight: '4px' }}>
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      alignSelf: message.from === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '86%',
                      padding: '10px 13px',
                      borderRadius: message.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: message.from === 'user' ? 'linear-gradient(135deg,#0ea5e9,#14b8a6)' : 'var(--bg-elevated)',
                      color: message.from === 'user' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.84rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {message.from === 'bot' && <Bot size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />}
                    {message.text}
                  </div>
                ))}
              </div>
              <form onSubmit={sendChatMessage} style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask about severity, medicines, follow-up..."
                  style={{ minWidth: 0 }}
                />
                <Button type="submit" icon={Send} variant="primary">Ask</Button>
              </form>
            </Card>
          </div>

          <Card style={{ marginBottom: '24px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <SectionHeader title="AI Diet Guidance" subtitle="Generated after doctor diagnosis using your symptoms, labs, prescription, and ML severity" />
            </div>
            {dietPlans.length === 0 ? (
              <EmptyState icon={Utensils} title="No diet plan yet" subtitle="A Gemini AI diet plan will appear here after your doctor completes diagnosis." />
            ) : (
              <div style={{ padding: '16px', display: 'grid', gap: '14px' }}>
                {dietPlans.slice(0, 2).map(plan => (
                  <div key={plan._id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
                          {plan.diseaseName} Diet Plan
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(plan.createdAt).toLocaleString('en-IN')} · {plan.modelSource}
                        </div>
                      </div>
                      <span className={`badge ${plan.severity === 'high' ? 'badge-rose' : plan.severity === 'moderate' ? 'badge-amber' : 'badge-green'}`}>
                        {plan.severity}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '14px' }}>{plan.summary}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '8px' }}>Recommended</div>
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                          {(plan.recommendedFoods || []).map(item => <span key={item} className="badge badge-green">{item}</span>)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '8px' }}>Avoid</div>
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                          {(plan.avoidFoods || []).map(item => <span key={item} className="badge badge-rose">{item}</span>)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px' }}>
                      {Object.entries(plan.mealPlan || {}).map(([slot, value]) => (
                        <div key={slot} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{slot}</div>
                          <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {plan.hydrationAdvice ? (
                      <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Hydration:</strong> {plan.hydrationAdvice}
                      </div>
                    ) : null}

                    {(plan.warningSigns || []).length > 0 ? (
                      <div style={{ marginTop: '12px', color: 'var(--accent-rose)', fontSize: '0.84rem' }}>
                        <strong>Warning signs:</strong> {plan.warningSigns.join(', ')}
                      </div>
                    ) : null}

                    <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.5 }}>{plan.disclaimer}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ marginBottom: '24px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <SectionHeader title="Notifications" subtitle="Follow-up reminders and lab report updates" />
            </div>
            {notifications.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications" subtitle="New lab reports and follow-up reminders will appear here." />
            ) : (
              <div style={{ padding: '12px' }}>
                {notifications.slice(0, 6).map(note => (
                  <div key={note._id} style={{ padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '10px', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{note.title}</strong>
                      <span className="badge badge-blue">{note.category?.replace(/_/g, ' ') || 'general'}</span>
                    </div>
                    <p style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>{note.message}</p>
                    <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                      {new Date(note.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Records */}
          <Card>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <SectionHeader
                title="Visit History"
                subtitle={medicalRecords.length ? `${medicalRecords.length} visits on record` : 'No visits yet'}
              />
            </div>

            {!medicalRecords.length ? (
              <EmptyState
                icon={ClipboardList}
                title="No records found"
                subtitle="Your medical records will appear here after hospital visits."
              />
            ) : (
              <div style={{ padding: '12px' }}>
                {medicalRecords.map((rec, i) => {
                  const diagnosis = diagnoses.find(item => String(item.medicalRecord) === String(rec._id))
                  const linkedPrescription = diagnosis
                    ? prescriptions.find(item => String(item.diagnosis) === String(diagnosis._id))
                    : null
                  const linkedPrediction = diagnosis
                    ? predictions.find(item => String(item.diagnosis) === String(diagnosis._id))
                    : null
                  const sev = linkedPrediction?.predictedSeverity
                  const recSS = sev ? severityStyle[sev] : null
                  return (
                    <div
                      key={rec._id || i}
                      style={{
                        padding: '20px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)', marginBottom: '12px',
                        background: 'var(--bg-card)', transition: 'all var(--transition)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-card)' }}
                    >
                      {/* Record header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                              {diagnosis?.diseaseName || 'Diagnosis Pending'}
                            </span>
                            {recSS && (
                              <span style={{ padding: '2px 10px', background: recSS.bg, border: `1px solid ${recSS.border}`, borderRadius: '999px', color: recSS.color, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {sev}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {rec.appointmentAt
                              ? new Date(rec.appointmentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : 'Date unknown'}
                            {rec.appointment?.reason && ` · ${rec.appointment.reason}`}
                          </div>
                        </div>
                        <span className={`badge ${
                          rec.status === 'diagnosed'  ? 'badge-green' :
                          rec.status === 'lab_done'   ? 'badge-blue'  :
                          rec.status === 'nurse_done' ? 'badge-violet' :
                          'badge-amber'
                        }`}>
                          {rec.status?.replace(/_/g, ' ') || 'pending'}
                        </span>
                      </div>

                      {/* Vitals pills */}
                      {rec.vitals && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {[
                            { label: 'Temp',  val: rec.vitals.temperature ? `${rec.vitals.temperature}°F` : null, color: '#f59e0b' },
                            { label: 'BP',    val: rec.vitals.bpSystolic  ? `${rec.vitals.bpSystolic}/${rec.vitals.bpDiastolic} mmHg` : null, color: '#f43f5e' },
                            { label: 'Pulse', val: rec.vitals.pulse       ? `${rec.vitals.pulse} bpm` : null, color: '#0099ff' },
                            { label: 'SpO₂',  val: rec.vitals.spo2        ? `${rec.vitals.spo2}%` : null, color: '#00e5a0' },
                          ].filter(x => x.val).map(({ label, val, color }) => (
                            <div key={label} style={{ padding: '4px 12px', background: `${color}10`, border: `1px solid ${color}20`, borderRadius: '999px', fontSize: '0.75rem', color }}>
                              <strong>{label}:</strong> {val}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Symptoms */}
                      {rec.symptoms?.length > 0 && (
                        <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          <strong style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Symptoms: </strong>
                          {rec.symptoms.join(', ')}
                        </div>
                      )}

                      {/* Prescription */}
                      {linkedPrescription?.medicines?.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Pill size={11} /> Prescription
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {linkedPrescription.medicines.map((p, j) => (
                              <div key={j} style={{ padding: '5px 12px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--accent-violet)' }}>
                                <strong>{p.medicineName}</strong>
                                {p.dosage      && ` · ${p.dosage}`}
                                {p.frequency   && ` · ${p.frequency}`}
                                {p.durationDays && ` · ${p.durationDays}d`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ML Prediction */}
                      {linkedPrediction && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 'var(--radius-sm)' }}>
                          <Brain size={14} color="var(--accent-violet)" />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            ML Prediction:&nbsp;
                            <strong style={{ color: recSS?.color || 'var(--accent-violet)', textTransform: 'capitalize' }}>
                              {linkedPrediction.predictedSeverity}
                            </strong>
                            {linkedPrediction.probability != null && (
                              <span style={{ color: 'var(--text-muted)' }}>
                                {` Risk Score: ${(linkedPrediction.probability * 100).toFixed(0)}%`}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </DashboardLayout>
  )
}
