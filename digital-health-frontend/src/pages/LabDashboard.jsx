import React, { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, Button, SectionHeader, AlertBanner, FormField } from '../components/ui'
import { clinicalAPI } from '../services/api'
import { FlaskConical, Upload, X } from 'lucide-react'

const REFERENCE = {
  plateletCount: { min: 150000, max: 400000, unit: '/µL', label: 'Platelet Count', critical: 50000 },
  wbcCount:      { min: 4000,   max: 11000,  unit: '/µL', label: 'WBC Count' },
  hemoglobin:    { min: 12,     max: 17.5,   unit: 'g/dL', label: 'Hemoglobin' },
}

function evalStatus(key, val) {
  const ref = REFERENCE[key]
  if (!ref || val === '') return null
  const n = Number(val)
  if (isNaN(n)) return null
  if (ref.critical && n < ref.critical) return 'critical'
  if (n < ref.min || n > ref.max) return 'abnormal'
  return 'normal'
}

const statusStyle = {
  normal:   { color: 'var(--accent-primary)',   label: 'Normal' },
  abnormal: { color: 'var(--accent-amber)',      label: 'Abnormal' },
  critical: { color: 'var(--accent-rose)',       label: 'Critical' },
}

export default function LabDashboard() {
  const [recordId, setRecordId] = useState('')
  const [testType, setTestType] = useState('CBC')
  const [values, setValues] = useState({ plateletCount: '', wbcCount: '', hemoglobin: '', summary: '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const valueKeyMap = {
    plateletCount: 'platelet_count',
    wbcCount: 'wbc_count',
    hemoglobin: 'hemoglobin',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!recordId.trim()) {
      setAlert({ type: 'error', message: 'Please enter a Medical Record ID.' })
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      const summary = values.summary
      const mappedValues = Object.entries(values)
        .filter(([key, value]) => key !== 'summary' && value !== '')
        .reduce((acc, [key, value]) => {
          acc[valueKeyMap[key] || key] = Number.isNaN(Number(value)) ? value : Number(value)
          return acc
        }, {})
      fd.append('testName', testType)
      fd.append('values', JSON.stringify(mappedValues))
      fd.append('summary', summary || '')
      if (file) fd.append('reportImage', file)
      await clinicalAPI.submitLabReport(recordId, fd)
      setAlert({ type: 'success', message: 'Lab report submitted successfully!' })
      setValues({ plateletCount: '', wbcCount: '', hemoglobin: '', summary: '' })
      setFile(null)
      setRecordId('')
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Submission failed. Verify the record ID.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Lab Dashboard" subtitle="Enter test results and upload lab reports">
      {alert && <AlertBanner type={alert.type} message={alert.message} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '20px' }}>
        {/* Main form */}
        <Card style={{ padding: '28px' }}>
          <SectionHeader title="Submit Lab Report" subtitle="Enter values against a medical record" />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FormField label="Medical Record ID">
                <input
                  value={recordId}
                  onChange={e => setRecordId(e.target.value)}
                  placeholder="MongoDB ObjectId from nurse record"
                  required
                />
              </FormField>
              <FormField label="Test Type">
                <select value={testType} onChange={e => setTestType(e.target.value)}>
                  <option value="CBC">CBC — Complete Blood Count</option>
                  <option value="LFT">LFT — Liver Function Test</option>
                  <option value="KFT">KFT — Kidney Function Test</option>
                  <option value="DENGUE_NS1">Dengue NS1 Antigen</option>
                  <option value="MALARIA">Malaria RDT</option>
                  <option value="OTHER">Other</option>
                </select>
              </FormField>
            </div>

            {testType === 'CBC' && (
              <div style={{ padding: '18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: '14px' }}>
                  CBC Values
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                  {Object.entries(REFERENCE).map(([key, ref]) => {
                    const status = evalStatus(key, values[key])
                    const ss = status ? statusStyle[status] : null
                    return (
                      <div key={key}>
                        <label>{ref.label}</label>
                        <input
                          type="number" step="any"
                          value={values[key]}
                          onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                          placeholder="Enter value"
                          style={{ borderColor: ss ? ss.color : undefined }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {ref.min.toLocaleString()}–{ref.max.toLocaleString()} {ref.unit}
                          </span>
                          {ss && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: ss.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {ss.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <FormField label="Summary / Interpretation">
              <textarea
                value={values.summary}
                onChange={e => setValues(v => ({ ...v, summary: e.target.value }))}
                rows={3}
                placeholder="Brief summary of findings and interpretation..."
                style={{ resize: 'vertical' }}
              />
            </FormField>

            {/* File upload */}
            <div>
              <label>Upload Report File (Image / PDF — optional)</label>
              <div
                onClick={() => document.getElementById('lab-file').click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]) }}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--accent-primary)' : file ? 'rgba(0,229,160,0.4)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-md)', padding: '28px',
                  textAlign: 'center', cursor: 'pointer',
                  background: file ? 'rgba(0,229,160,0.04)' : dragOver ? 'rgba(0,229,160,0.02)' : 'transparent',
                  transition: 'all var(--transition)',
                }}
              >
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600 }}>{file.name}</span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFile(null) }}
                      style={{ background: 'rgba(244,63,94,0.1)', border: 'none', color: 'var(--accent-rose)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={24} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                      Click to upload or drag & drop
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '4px' }}>PNG, JPG, PDF supported</p>
                  </>
                )}
                <input id="lab-file" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
              </div>
            </div>

            <Button type="submit" variant="primary" loading={loading} icon={FlaskConical} size="lg" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
              Submit Lab Report
            </Button>
          </form>
        </Card>

        {/* Reference sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: '14px' }}>
              CBC Reference Ranges
            </div>
            {[
              { label: 'Platelet Count', range: '1,50,000 – 4,00,000 /µL', critical: '< 50,000 = CRITICAL' },
              { label: 'WBC Count',      range: '4,000 – 11,000 /µL',       critical: null },
              { label: 'Hemoglobin',     range: '12 – 17.5 g/dL',           critical: null },
            ].map(({ label, range, critical }, i, arr) => (
              <div key={label} style={{ marginBottom: i < arr.length - 1 ? '14px' : 0, paddingBottom: i < arr.length - 1 ? '14px' : 0, borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.83rem', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{range}</div>
                {critical && <div style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', fontWeight: 600, marginTop: '2px' }}>{critical}</div>}
              </div>
            ))}
          </Card>

          <Card style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: '14px' }}>
              Status Legend
            </div>
            {[
              { label: 'Normal',   color: 'var(--accent-primary)',   desc: 'Within reference range' },
              { label: 'Abnormal', color: 'var(--accent-amber)',      desc: 'Outside reference range' },
              { label: 'Critical', color: 'var(--accent-rose)',       desc: 'Requires immediate attention' },
            ].map(({ label, color, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '10px', height: '10px', background: color, borderRadius: '50%', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </Card>

          <Card style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: '10px' }}>
              How to get Record ID
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              The Medical Record ID is the MongoDB ObjectId generated when the nurse saves vitals for an appointment. Ask the nurse or check the nurse queue to get the record ID before submitting a lab report.
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
