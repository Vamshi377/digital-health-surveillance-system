import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { Activity, ArrowLeft, CheckCircle } from 'lucide-react'

const ROLES = [
  { value: 'patient', label: 'Patient' },
  { value: 'receptionist',   label: 'Receptionist' },
  { value: 'nurse',          label: 'Nurse' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'doctor',         label: 'Doctor' },
  { value: 'medical_superintendent', label: 'Medical Superintendent' },
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'dmo', label: 'DMO' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: '',
    phoneNumber: '', hospitalId: '', hospitalName: '',
    dateOfBirth: '', age: '', gender: '', district: 'Jagtial', mandal: '', village: '', ward: '', area: '', addressLine: '', aadharNumber: '',
    registrationNumber: '', qualification: '', specialization: '', yearsOfExperience: '',
    nursingRegistrationNumber: '', experience: '', certificationId: '', labType: '',
    highestQualification: '', basicExperience: '',
    employeeId: '', officialEmail: '', departmentAuthority: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (form.role === 'patient') {
        await authAPI.patientRegister({
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth,
          age: form.age,
          gender: form.gender,
          district: form.district,
          city: form.district,
          mandal: form.mandal,
          village: form.village,
          ward: form.ward,
          area: form.area || form.village || form.ward,
          addressLine: form.addressLine,
          contactNumber: form.phoneNumber,
          aadharNumber: form.aadharNumber,
        })
      } else {
        await authAPI.register(form)
      }
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
        <div style={{
          width: '72px', height: '72px', background: 'rgba(0,229,160,0.12)',
          border: '1px solid rgba(0,229,160,0.3)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <CheckCircle size={32} color="var(--accent-primary)" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          {form.role === 'patient' ? 'Sign Up Completed' : 'Registration Submitted'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '28px', fontSize: '0.9rem' }}>
          {form.role === 'patient'
            ? 'Your patient profile is ready. You can now sign in with your mobile number.'
            : "Your account is pending approval. You'll be able to log in once an administrator approves your request."}
        </p>
        <Link to="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '11px 24px', background: 'linear-gradient(135deg, #00e5a0, #00b87a)',
          color: '#080f1a', fontWeight: 700, borderRadius: 'var(--radius-md)',
          textDecoration: 'none', fontSize: '0.9rem',
        }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#00e5a0,#00b87a)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="#080f1a" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>MediSurv</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '36px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            {form.role === 'patient' ? 'Patient Sign Up' : 'Registration'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '28px' }}>
            {form.role === 'patient'
              ? 'Create your patient profile and sign in with your mobile number'
              : 'Staff accounts require administrator approval before login'}
          </p>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.83rem', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label>Full Name</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder={form.role === 'patient' ? 'Patient full name' : 'Dr. Jane Smith'} required />
              </div>
              <div>
                <label>Phone Number</label>
                <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="10 digit phone" required />
              </div>
            </div>
            <div>
              <label>Role</label>
              <select name="role" value={form.role} onChange={handleChange} required>
                <option value="">Select your role</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {form.role === 'patient' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label>Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} required />
                  </div>
                  <div>
                    <label>Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange} required>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label>Aadhar Number</label>
                  <input name="aadharNumber" value={form.aadharNumber} onChange={handleChange} placeholder="12 digit Aadhar number" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label>District</label>
                    <input name="district" value={form.district} onChange={handleChange} required />
                  </div>
                  <div>
                    <label>Mandal</label>
                    <input name="mandal" value={form.mandal} onChange={handleChange} placeholder="e.g. Jagtial" required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label>Village</label>
                    <input name="village" value={form.village} onChange={handleChange} placeholder="Village name" />
                  </div>
                  <div>
                    <label>Ward</label>
                    <input name="ward" value={form.ward} onChange={handleChange} placeholder="Ward if applicable" />
                  </div>
                </div>
                <div>
                  <label>Area / Locality</label>
                  <input name="area" value={form.area} onChange={handleChange} placeholder="Area or locality" required />
                </div>
                <div>
                  <label>Address</label>
                  <input name="addressLine" value={form.addressLine} onChange={handleChange} placeholder="Full address" required />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="staff@hospital.local" required />
                </div>
                <div>
                  <label>Hospital ID</label>
                  <input name="hospitalId" value={form.hospitalId} onChange={handleChange} placeholder="e.g. GH-001" required />
                </div>
                <div>
                  <label>Hospital Name</label>
                  <input name="hospitalName" value={form.hospitalName} onChange={handleChange} placeholder="Government General Hospital" required />
                </div>
                <div>
                  <label>Password</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 8 characters" required minLength={8} />
                </div>
              </>
            )}

            {form.role === 'doctor' && (
              <>
                <div>
                  <label>Registration Number</label>
                  <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} required />
                </div>
                <div>
                  <label>Qualification</label>
                  <input name="qualification" value={form.qualification} onChange={handleChange} required />
                </div>
                <div>
                  <label>Specialization</label>
                  <input name="specialization" value={form.specialization} onChange={handleChange} required />
                </div>
                <div>
                  <label>Years of Experience</label>
                  <input type="number" min="0" name="yearsOfExperience" value={form.yearsOfExperience} onChange={handleChange} required />
                </div>
              </>
            )}

            {form.role === 'nurse' && (
              <>
                <div>
                  <label>Nursing Registration Number</label>
                  <input name="nursingRegistrationNumber" value={form.nursingRegistrationNumber} onChange={handleChange} required />
                </div>
                <div>
                  <label>Qualification</label>
                  <input name="qualification" value={form.qualification} onChange={handleChange} required />
                </div>
                <div>
                  <label>Experience</label>
                  <input type="number" min="0" name="experience" value={form.experience} onChange={handleChange} required />
                </div>
              </>
            )}

            {form.role === 'lab_technician' && (
              <>
                <div>
                  <label>Certification ID</label>
                  <input name="certificationId" value={form.certificationId} onChange={handleChange} required />
                </div>
                <div>
                  <label>Lab Type</label>
                  <input name="labType" value={form.labType} onChange={handleChange} placeholder="Pathology / Diagnostic Lab" required />
                </div>
                <div>
                  <label>Experience</label>
                  <input type="number" min="0" name="experience" value={form.experience} onChange={handleChange} required />
                </div>
              </>
            )}

            {form.role === 'receptionist' && (
              <>
                <div>
                  <label>Highest Qualification</label>
                  <input name="highestQualification" value={form.highestQualification} onChange={handleChange} required />
                </div>
                <div>
                  <label>Basic Experience</label>
                  <input type="number" min="0" name="basicExperience" value={form.basicExperience} onChange={handleChange} />
                </div>
              </>
            )}

            {['medical_superintendent', 'hospital_admin', 'dmo'].includes(form.role) && (
              <>
                <div>
                  <label>Employee ID</label>
                  <input name="employeeId" value={form.employeeId} onChange={handleChange} required />
                </div>
                <div>
                  <label>Official Email</label>
                  <input type="email" name="officialEmail" value={form.officialEmail} onChange={handleChange} required />
                </div>
                <div>
                  <label>Department Authority</label>
                  <input name="departmentAuthority" value={form.departmentAuthority} onChange={handleChange} required />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px', marginTop: '8px',
                background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg,#00e5a0,#00b87a)',
                color: loading ? 'var(--text-muted)' : '#080f1a',
                fontWeight: 700, borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontSize: '0.9rem', fontFamily: 'var(--font-body)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(0,229,160,0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Submitting...' : form.role === 'patient' ? 'Sign Up' : 'Request Access'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
