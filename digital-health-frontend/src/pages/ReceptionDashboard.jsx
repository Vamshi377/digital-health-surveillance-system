import React, { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, Button, SectionHeader, Modal, FormField, AlertBanner } from '../components/ui'
import { clinicalAPI } from '../services/api'
import { Search, UserPlus, Calendar, Phone, MapPin, User, ClipboardList } from 'lucide-react'

const DISTRICTS = [
  'Adilabad','Bhadradri Kothagudem','Hyderabad','Jagtial','Jangaon','Jayashankar Bhupalpally',
  'Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Kumuram Bheem','Mahabubabad',
  'Mahbubnagar','Mancherial','Medak','Medchal-Malkajgiri','Mulugu','Nagarkurnool',
  'Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla',
  'Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy',
  'Warangal','Yadadri Bhongir',
]

export default function ReceptionDashboard() {
  const [phone, setPhone] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [showAppt, setShowAppt] = useState(false)
  const [alert, setAlert] = useState(null)
  const [patientLoading, setPatientLoading] = useState(false)
  const [apptLoading, setApptLoading] = useState(false)

  const [regForm, setRegForm] = useState({
    fullName: '', dateOfBirth: '', gender: '', contactNumber: '', aadharNumber: '',
    city: '', mandal: '', area: '', addressLine: '',
  })
  const [apptForm, setApptForm] = useState({ scheduledAt: '', reason: '' })

  const handleSearch = async () => {
    if (!phone.trim()) return
    setSearching(true)
    setSearchErr('')
    setSearchResult(null)
    try {
      const res = await clinicalAPI.searchPatientByPhone(phone)
      setSearchResult(res.data.patient || res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setSearchErr('No patient found with this phone number. You can register them below.')
      } else {
        setSearchErr(err.response?.data?.message || 'Search failed. Check backend connection.')
      }
    } finally {
      setSearching(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setPatientLoading(true)
    try {
      const res = await clinicalAPI.createPatient(regForm)
      const patient = res.data.patient || res.data
      setSearchResult(patient)
      setShowRegister(false)
      setAlert({ type: 'success', message: `Patient registered! Code: ${patient.patientCode}` })
      setRegForm({ fullName: '', dateOfBirth: '', gender: '', contactNumber: '', aadharNumber: '', city: '', mandal: '', area: '', addressLine: '' })
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Registration failed.' })
    } finally {
      setPatientLoading(false)
    }
  }

  const handleAppointment = async (e) => {
    e.preventDefault()
    if (!searchResult?._id) return
    setApptLoading(true)
    try {
      await clinicalAPI.createAppointment(searchResult._id, apptForm)
      setShowAppt(false)
      setAlert({ type: 'success', message: 'Appointment created successfully! Patient added to nurse queue.' })
      setApptForm({ scheduledAt: '', reason: '' })
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to create appointment.' })
    } finally {
      setApptLoading(false)
    }
  }

  const resetSearch = () => {
    setSearchResult(null)
    setSearchErr('')
    setPhone('')
  }

  return (
    <DashboardLayout title="Reception" subtitle="Patient registration & appointment management">
      {alert && <AlertBanner type={alert.type} message={alert.message} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '20px' }}>
        {/* Search Panel */}
        <Card style={{ padding: '24px', minHeight: '100%' }}>
          <SectionHeader title="Patient Search" subtitle="Find existing patient by phone number" />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '10px', marginBottom: '20px' }}>
            <input
              value={phone}
              onChange={e => { setPhone(e.target.value); setSearchErr('') }}
              placeholder="+91 9XXXXXXXXX"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <Button icon={Search} variant="primary" onClick={handleSearch} loading={searching} className="min-w-[132px]">
              Search
            </Button>
          </div>

          {searchErr && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.5 }}>
              {searchErr}
            </p>
          )}

          {searchResult ? (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '18px', animation: 'fadeUp 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                    {searchResult.fullName}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {searchResult.patientCode}
                  </span>
                </div>
                <span className={`badge ${searchResult.gender === 'male' ? 'badge-blue' : searchResult.gender === 'female' ? 'badge-rose' : 'badge-muted'}`}>
                  {searchResult.gender || 'unknown'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  [Phone,        searchResult.contactNumber || '—'],
                  [MapPin,       [searchResult.area, searchResult.mandal, searchResult.district].filter(Boolean).join(', ') || '—'],
                  [User,         searchResult.age ? `${searchResult.age} years` : '—'],
                  [ClipboardList,`Code: ${searchResult.patientCode}`],
                ].map(([Icon, val], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <Icon size={13} color="var(--text-muted)" />
                    {val}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button icon={Calendar} variant="primary" onClick={() => setShowAppt(true)} style={{ flex: 1, justifyContent: 'center' }}>
                  Create Appointment
                </Button>
                <Button variant="ghost" onClick={resetSearch} size="sm">
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 32px', color: 'var(--text-muted)' }}>
              <Phone size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>Enter a phone number and press Search</p>
            </div>
          )}

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <Button icon={UserPlus} variant="secondary" onClick={() => setShowRegister(true)} style={{ width: '100%', justifyContent: 'center' }}>
              Register New Patient
            </Button>
          </div>
        </Card>

      </div>

      {/* Register Patient Modal */}
      <Modal open={showRegister} onClose={() => setShowRegister(false)} title="Register New Patient" width="600px">
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField label="Full Name">
              <input value={regForm.fullName} onChange={e => setRegForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Patient full name" required />
            </FormField>
            <FormField label="Date of Birth">
              <input type="date" value={regForm.dateOfBirth} onChange={e => setRegForm(f => ({ ...f, dateOfBirth: e.target.value }))} required />
            </FormField>
            <FormField label="Gender">
              <select value={regForm.gender} onChange={e => setRegForm(f => ({ ...f, gender: e.target.value }))} required>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Contact Number">
              <input value={regForm.contactNumber} onChange={e => setRegForm(f => ({ ...f, contactNumber: e.target.value }))} placeholder="+91 9XXXXXXXXX" required />
            </FormField>
            <FormField label="District">
              <select value={regForm.city} onChange={e => setRegForm(f => ({ ...f, city: e.target.value }))} required>
                <option value="">Select district</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
            <FormField label="Mandal">
              <input value={regForm.mandal} onChange={e => setRegForm(f => ({ ...f, mandal: e.target.value }))} placeholder="e.g. Jagtial Urban" required />
            </FormField>
            <FormField label="Area / Locality">
              <input value={regForm.area} onChange={e => setRegForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Kukatpally" required />
            </FormField>
            <FormField label="Aadhar Number">
              <input value={regForm.aadharNumber} onChange={e => setRegForm(f => ({ ...f, aadharNumber: e.target.value }))} placeholder="12 digit Aadhar" required />
            </FormField>
          </div>
          <FormField label="Address">
            <input value={regForm.addressLine} onChange={e => setRegForm(f => ({ ...f, addressLine: e.target.value }))} placeholder="Street address" />
          </FormField>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button variant="secondary" onClick={() => setShowRegister(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" loading={patientLoading} icon={UserPlus}>Register Patient</Button>
          </div>
        </form>
      </Modal>

      {/* Appointment Modal */}
      <Modal open={showAppt} onClose={() => setShowAppt(false)} title={`Create Appointment — ${searchResult?.fullName || ''}`}>
        <form onSubmit={handleAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Scheduled Date & Time">
            <input type="datetime-local" value={apptForm.scheduledAt} onChange={e => setApptForm(f => ({ ...f, scheduledAt: e.target.value }))} required />
          </FormField>
          <FormField label="Reason for Visit">
            <textarea
              value={apptForm.reason}
              onChange={e => setApptForm(f => ({ ...f, reason: e.target.value }))}
              rows={3}
              placeholder="e.g. Fever, body pain, follow-up..."
              style={{ resize: 'vertical' }}
            />
          </FormField>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowAppt(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" loading={apptLoading} icon={Calendar}>Create Appointment</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
