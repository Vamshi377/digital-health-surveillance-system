import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, Button, StatCard, SectionHeader, Modal, FormField, AlertBanner, LoadingSpinner, EmptyState } from '../components/ui'
import { clinicalAPI } from '../services/api'
import { Heart, Thermometer, Wind, Clock, ChevronRight, ClipboardList, AlertTriangle, RefreshCw } from 'lucide-react'

export default function NurseDashboard() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [alert, setAlert] = useState(null)
  const [saving, setSaving] = useState(false)
  const [spo2Error, setSpo2Error] = useState('')

  const [vitals, setVitals] = useState({
    symptoms: '', temperature: '', bpSystolic: '', bpDiastolic: '',
    pulse: '', spo2: '', nurseNotes: '',
  })

  useEffect(() => { fetchQueue() }, [])

  const fetchQueue = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await clinicalAPI.getNurseQueue()
      const nextQueue = Array.isArray(res.data?.queue)
        ? res.data.queue
        : Array.isArray(res.data?.appointments)
          ? res.data.appointments
          : Array.isArray(res.data)
            ? res.data
            : []
      setQueue(nextQueue)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load queue. Check backend connection.')
      setQueue([])
    } finally {
      setLoading(false)
    }
  }

  const openRecord = (appt) => {
    setSelected(appt)
    setVitals({ symptoms: '', temperature: '', bpSystolic: '', bpDiastolic: '', pulse: '', spo2: '', nurseNotes: '' })
    setSpo2Error('')
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selected) return

    if (vitals.spo2 && Number(vitals.spo2) > 100) {
      setSpo2Error('SpO₂ cannot be greater than 100.')
      return
    }
    setSpo2Error('')
    setSaving(true)
    try {
      await clinicalAPI.createRecord(selected._id, {
        symptoms: vitals.symptoms.split(',').map(item => item.trim()).filter(Boolean),
        vitals: {
          temperature: vitals.temperature || undefined,
          bpSystolic: vitals.bpSystolic || undefined,
          bpDiastolic: vitals.bpDiastolic || undefined,
          pulse: vitals.pulse || undefined,
          spo2: vitals.spo2 || undefined,
        },
        nurseNotes: vitals.nurseNotes,
        chiefComplaint: vitals.symptoms,
      })
      setAlert({ type: 'success', message: 'Vitals recorded successfully! Patient moved to next queue.' })
      setShowForm(false)
      setSelected(null)
      setVitals({ symptoms: '', temperature: '', bpSystolic: '', bpDiastolic: '', pulse: '', spo2: '', nurseNotes: '' })
      fetchQueue()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save vitals.' })
    } finally {
      setSaving(false)
    }
  }

  const spo2Critical = vitals.spo2 && Number(vitals.spo2) > 0 && Number(vitals.spo2) < 90

  // Derive stats purely from live queue data
  const waitingCount = queue.length

  return (
    <DashboardLayout title="Nurse Station" subtitle="Patient vitals & symptom recording">
      {alert && <AlertBanner type={alert.type} message={alert.message} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard label="In Queue"    value={loading ? '—' : waitingCount} icon={Clock}         accent="var(--accent-amber)" />
        <StatCard label="Status"      value={loading ? '—' : waitingCount === 0 ? 'Clear' : 'Active'} icon={ClipboardList} accent="var(--accent-primary)" />
      </div>

      <Card>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionHeader title="Nurse Queue" subtitle="Appointments awaiting vitals recording" />
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchQueue}>Refresh</Button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
            <Button variant="secondary" onClick={fetchQueue} icon={RefreshCw}>Retry</Button>
          </div>
        ) : queue.length === 0 ? (
          <EmptyState icon={Heart} title="Queue is empty" subtitle="All appointments have been processed." />
        ) : (
          <div style={{ padding: '12px' }}>
            {queue.map(appt => {
              const patient = appt.patient || {}
              return (
                <div
                  key={appt._id}
                  onClick={() => openRecord(appt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', transition: 'all var(--transition)',
                    border: '1px solid transparent', marginBottom: '8px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border-default)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-rose), #c0392b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem', flexShrink: 0 }}>
                    {(patient.fullName || 'P')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {patient.fullName || 'Unknown Patient'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {[patient.patientCode, appt.reason, patient.age ? `${patient.age}y` : null].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {appt.scheduledAt && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    <span className="badge badge-amber" style={{ marginTop: '4px', display: 'inline-flex' }}>Waiting</span>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Vitals Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={`Record Vitals — ${selected?.patient?.fullName || 'Patient'}`} width="580px">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Symptoms" error={null}>
            <textarea
              value={vitals.symptoms}
              onChange={e => setVitals(v => ({ ...v, symptoms: e.target.value }))}
              rows={2}
              placeholder="e.g. Fever, headache, body pain, nausea..."
              style={{ resize: 'vertical' }}
              required
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            <FormField label="Temperature (°F)">
              <input type="number" step="0.1" min="90" max="115" value={vitals.temperature} onChange={e => setVitals(v => ({ ...v, temperature: e.target.value }))} placeholder="98.6" />
            </FormField>
            <FormField label="BP Systolic (mmHg)">
              <input type="number" value={vitals.bpSystolic} onChange={e => setVitals(v => ({ ...v, bpSystolic: e.target.value }))} placeholder="120" />
            </FormField>
            <FormField label="BP Diastolic (mmHg)">
              <input type="number" value={vitals.bpDiastolic} onChange={e => setVitals(v => ({ ...v, bpDiastolic: e.target.value }))} placeholder="80" />
            </FormField>
            <FormField label="Pulse (bpm)">
              <input type="number" value={vitals.pulse} onChange={e => setVitals(v => ({ ...v, pulse: e.target.value }))} placeholder="72" />
            </FormField>
            <FormField label="SpO₂ (%)" error={spo2Error}>
              <input
                type="number" max="100" min="0"
                value={vitals.spo2}
                onChange={e => { setVitals(v => ({ ...v, spo2: e.target.value })); setSpo2Error('') }}
                placeholder="97"
                style={{ borderColor: spo2Critical || spo2Error ? 'var(--accent-rose)' : undefined }}
              />
            </FormField>
          </div>

          {spo2Critical && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.83rem' }}>
              <AlertTriangle size={14} /> Critical SpO₂ detected — immediate attention required.
            </div>
          )}

          {/* Live vitals preview pills */}
          {(vitals.temperature || vitals.pulse || vitals.spo2) && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {vitals.temperature && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: '999px', color: 'var(--accent-amber)', fontSize: '0.78rem', fontWeight: 600 }}>
                  <Thermometer size={12} /> {vitals.temperature}°F
                </div>
              )}
              {vitals.pulse && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'rgba(244,63,94,0.1)', borderRadius: '999px', color: 'var(--accent-rose)', fontSize: '0.78rem', fontWeight: 600 }}>
                  <Heart size={12} /> {vitals.pulse} bpm
                </div>
              )}
              {vitals.spo2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'rgba(0,153,255,0.1)', borderRadius: '999px', color: 'var(--accent-secondary)', fontSize: '0.78rem', fontWeight: 600 }}>
                  <Wind size={12} /> SpO₂ {vitals.spo2}%
                </div>
              )}
            </div>
          )}

          <FormField label="Nurse Notes">
            <textarea
              value={vitals.nurseNotes}
              onChange={e => setVitals(v => ({ ...v, nurseNotes: e.target.value }))}
              rows={2}
              placeholder="Any additional observations..."
              style={{ resize: 'vertical' }}
            />
          </FormField>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" loading={saving} icon={Heart}>Save Vitals</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
