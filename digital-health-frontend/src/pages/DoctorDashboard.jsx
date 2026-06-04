import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, Button, StatCard, SectionHeader, Modal, FormField, AlertBanner, LoadingSpinner, EmptyState } from '../components/ui'
import { clinicalAPI } from '../services/api'
import { Stethoscope, Activity, Brain, Plus, Trash2, ChevronRight, RefreshCw, Pill } from 'lucide-react'

export default function DoctorDashboard() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [diagnosis, setDiagnosis] = useState({
    diseaseName: '',
    diagnosisNotes: '',
    doctorSeverity: '',
    followUpDate: '',
    generalAdvice: '',
    prescriptions: [{ medicine: '', dosage: '', frequency: '', durationDays: '', instructions: '' }],
  })

  useEffect(() => { fetchQueue() }, [])

  const fetchQueue = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await clinicalAPI.getDoctorDashboard()
      const records = res.data.records || res.data || []
      setQueue(records.filter(record => record?.patient?._id || record?.patient?.patientCode))
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load records. Check backend connection.')
      setQueue([])
    } finally {
      setLoading(false)
    }
  }

  const openRecord = async (record) => {
    setSelected(record)
    setSummary(null)
    setSummaryError('')
    setSummaryLoading(true)
    try {
      const res = await clinicalAPI.getRecordSummary(record._id)
      setSummary(res.data)
    } catch (err) {
      setSummaryError(err.response?.data?.error || err.response?.data?.message || 'Failed to load patient summary.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const addPrescription = () =>
    setDiagnosis(d => ({ ...d, prescriptions: [...d.prescriptions, { medicine: '', dosage: '', frequency: '', durationDays: '', instructions: '' }] }))

  const removePrescription = (i) =>
    setDiagnosis(d => ({ ...d, prescriptions: d.prescriptions.filter((_, idx) => idx !== i) }))

  const updatePrescription = (i, field, val) =>
    setDiagnosis(d => ({ ...d, prescriptions: d.prescriptions.map((p, idx) => idx === i ? { ...p, [field]: val } : p) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    try {
      const medicines = diagnosis.prescriptions
        .filter(item => item.medicine && item.dosage && item.frequency && Number(item.durationDays) > 0)
        .map(item => ({
          medicineName: item.medicine,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: Number(item.durationDays),
          instructions: item.instructions || '',
        }))

      const res = await clinicalAPI.submitDiagnosis(selected._id, {
        diseaseName: diagnosis.diseaseName.trim(),
        diagnosisNotes: diagnosis.diagnosisNotes,
        doctorSeverity: diagnosis.doctorSeverity || null,
        prescription: {
          medicines,
          generalAdvice: diagnosis.generalAdvice,
          followUpDate: diagnosis.followUpDate || null,
        },
      })
      setAlert({
        type: 'success',
        message: res.data.dietPlan
          ? 'Patient diagnosed successfully. ML severity and Gemini AI diet plan were generated.'
          : `Patient diagnosed successfully. ${res.data.mlPredictionError ? `ML used fallback severity because ${res.data.mlPredictionError}. ` : ''}Diet plan was not generated: ${res.data.dietPlanError || 'Gemini unavailable.'}`,
      })
      setShowDiagnosis(false)
      setSelected(null)
      setSummary(null)
      setDiagnosis({
        diseaseName: '',
        diagnosisNotes: '',
        doctorSeverity: '',
        followUpDate: '',
        generalAdvice: '',
        prescriptions: [{ medicine: '', dosage: '', frequency: '', durationDays: '', instructions: '' }],
      })
      fetchQueue()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || err.response?.data?.error || 'Failed to submit diagnosis.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout title="Doctor Dashboard" subtitle="Patient summaries, diagnosis, and prescriptions">
      {alert && <AlertBanner type={alert.type} message={alert.message} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard label="Pending Review" value={loading ? '—' : queue.length} icon={Stethoscope} accent="var(--accent-violet)" />
        <StatCard label="ML Predictions" value={loading ? '—' : '—'}          icon={Brain}       accent="var(--accent-secondary)" />
      </div>

      <div className={selected ? 'grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]' : 'grid gap-5'}>
        {/* Queue list */}
        <Card>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <SectionHeader title="Pending Records" subtitle="Click a record to view full summary" />
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchQueue}>Refresh</Button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '14px' }}>{error}</p>
              <Button variant="secondary" onClick={fetchQueue} icon={RefreshCw}>Retry</Button>
            </div>
          ) : queue.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No pending records" subtitle="All patients have been diagnosed." />
          ) : (
            <div style={{ padding: '12px' }}>
              {queue.map(rec => {
                const patient = rec.patient || {}
                const isActive = selected?._id === rec._id
                return (
                  <div
                    key={rec._id}
                    onClick={() => openRecord(rec)}
                    style={{
                      padding: '14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      transition: 'all var(--transition)', marginBottom: '6px',
                      background: isActive ? 'rgba(139,92,246,0.1)' : 'transparent',
                      border: isActive ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(patient.fullName || 'P')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {patient.fullName || 'Patient'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {[patient.patientCode, patient.age ? `${patient.age}y` : null].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Patient Summary Panel */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeUp 0.3s ease' }}>
            {summaryLoading ? (
              <LoadingSpinner />
            ) : summaryError ? (
              <Card style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--accent-rose)', fontSize: '0.875rem' }}>{summaryError}</p>
              </Card>
            ) : summary ? (
              <>
                {/* Patient header */}
                <Card style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#0099ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.2rem' }}>
                        {(summary.record?.patient?.fullName || 'P')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{summary.record?.patient?.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{summary.record?.patient?.patientCode}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {[summary.record?.patient?.area, summary.record?.patient?.district].filter(Boolean).join(', ')}
                          {summary.record?.patient?.age ? ` · ${summary.record.patient.age}y` : ''}
                          {summary.record?.patient?.gender ? ` · ${summary.record.patient.gender}` : ''}
                        </div>
                      </div>
                    </div>
                    <Button icon={Stethoscope} variant="primary" onClick={() => setShowDiagnosis(true)}>Add Diagnosis</Button>
                  </div>
                </Card>

                {/* Vitals */}
                {summary.record?.vitals ? (
                  <Card style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: '14px' }}>Vitals Snapshot</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Temp',  value: summary.record.vitals.temperature ? `${summary.record.vitals.temperature}°F` : null, color: '#f59e0b' },
                        { label: 'BP',    value: summary.record.vitals.bpSystolic   ? `${summary.record.vitals.bpSystolic}/${summary.record.vitals.bpDiastolic} mmHg` : null, color: '#f43f5e' },
                        { label: 'Pulse', value: summary.record.vitals.pulse        ? `${summary.record.vitals.pulse} bpm` : null, color: '#0099ff' },
                        { label: 'SpO₂',  value: summary.record.vitals.spo2         ? `${summary.record.vitals.spo2}%` : null, color: '#00e5a0' },
                      ].filter(x => x.value).map(({ label, value, color }) => (
                        <div key={label} style={{ padding: '12px 16px', background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 'var(--radius-md)', textAlign: 'center', minWidth: '90px' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color }}>{value}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {summary.record?.symptoms?.length > 0 && (
                      <div style={{ marginTop: '14px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Symptoms: </strong>
                        {summary.record.symptoms.join(', ')}
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card style={{ padding: '20px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No vitals recorded yet.</p>
                  </Card>
                )}

                {/* Lab Report */}
                {summary.latestLabReport ? (
                  <Card style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: '14px' }}>
                      Lab Report — {summary.latestLabReport.testName}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                      {[
                        { label: 'Platelet Count', value: summary.latestLabReport.values?.platelet_count },
                        { label: 'WBC Count',      value: summary.latestLabReport.values?.wbc_count },
                        { label: 'Hemoglobin',     value: summary.latestLabReport.values?.hemoglobin },
                      ].map(({ label, value }) => value !== undefined && value !== null ? (
                        <div key={label} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{Number(value).toLocaleString()}</div>
                        </div>
                      ) : null)}
                    </div>
                    {summary.latestLabReport.isCritical && (
                      <div style={{ marginTop: '10px', padding: '8px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.8rem', fontWeight: 600 }}>
                        ⚠ Critical values detected in this report
                      </div>
                    )}
                    {summary.latestLabReport.summary && (
                      <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {summary.latestLabReport.summary}
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card style={{ padding: '20px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No lab report submitted yet.</p>
                  </Card>
                )}

                {/* Past diagnosis history */}
                {summary.diagnosisHistory?.length > 0 && (
                  <Card style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: '14px' }}>
                      Diagnosis History
                    </div>
                    {summary.diagnosisHistory.map((d, i) => (
                      <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: i < summary.diagnosisHistory.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{d.diseaseName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}</div>
                      </div>
                    ))}
                  </Card>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Diagnosis Modal */}
      <Modal open={showDiagnosis} onClose={() => setShowDiagnosis(false)} title="Submit Diagnosis & Prescription" width="680px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Disease / Diagnosis">
            <input
              value={diagnosis.diseaseName}
              onChange={e => setDiagnosis(d => ({ ...d, diseaseName: e.target.value }))}
              placeholder="Leave blank to reuse latest diagnosis on follow-up visits"
            />
          </FormField>
          <FormField label="Diagnosis Notes">
            <textarea
              value={diagnosis.diagnosisNotes}
              onChange={e => setDiagnosis(d => ({ ...d, diagnosisNotes: e.target.value }))}
              rows={3}
              placeholder="Clinical assessment, treatment rationale..."
              style={{ resize: 'vertical' }}
            />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Doctor Severity">
              <select value={diagnosis.doctorSeverity} onChange={e => setDiagnosis(d => ({ ...d, doctorSeverity: e.target.value }))}>
                <option value="">Not recorded</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </FormField>
            <FormField label="Follow-up Date">
              <input type="date" value={diagnosis.followUpDate} onChange={e => setDiagnosis(d => ({ ...d, followUpDate: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="General Advice">
            <textarea
              value={diagnosis.generalAdvice}
              onChange={e => setDiagnosis(d => ({ ...d, generalAdvice: e.target.value }))}
              rows={2}
              placeholder="General care advice for the patient..."
              style={{ resize: 'vertical' }}
            />
          </FormField>

          {/* Prescription rows */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ margin: 0 }}>Prescription</label>
              <Button icon={Plus} variant="secondary" size="sm" type="button" onClick={addPrescription}>Add Medicine</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {diagnosis.prescriptions.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <label>Medicine</label>
                    <input value={p.medicine} onChange={e => updatePrescription(i, 'medicine', e.target.value)} placeholder="e.g. Paracetamol" required />
                  </div>
                  <div>
                    <label>Dosage</label>
                    <input value={p.dosage} onChange={e => updatePrescription(i, 'dosage', e.target.value)} placeholder="500mg" />
                  </div>
                  <div>
                    <label>Frequency</label>
                    <input value={p.frequency} onChange={e => updatePrescription(i, 'frequency', e.target.value)} placeholder="TDS" />
                  </div>
                  <div>
                    <label>Days</label>
                    <input type="number" min="1" value={p.durationDays} onChange={e => updatePrescription(i, 'durationDays', e.target.value)} placeholder="5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePrescription(i)}
                    disabled={diagnosis.prescriptions.length === 1}
                    style={{ padding: '8px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', color: 'var(--accent-rose)', cursor: diagnosis.prescriptions.length === 1 ? 'not-allowed' : 'pointer', opacity: diagnosis.prescriptions.length === 1 ? 0.4 : 1, alignSelf: 'flex-end' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.83rem', color: 'var(--accent-violet)' }}>
            <Brain size={14} /> ML severity prediction will be triggered automatically after submission.
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowDiagnosis(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting} icon={Stethoscope}>Submit Diagnosis</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
