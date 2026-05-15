import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, IdCard, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import FormField, { Input, Select, Textarea } from '../components/ui/FormField';
import { authService } from '../services/api';
import { TELANGANA_DISTRICTS } from '../constants/locations';

const EMPTY_FORM = {
  fullName: '',
  dateOfBirth: '',
  gender: 'male',
  city: '',
  mandal: '',
  area: '',
  addressLine: '',
  contactNumber: '',
  aadharNumber: ''
};

export default function PatientRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await authService.registerPatientIdentity(form);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-app)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18, background: 'transparent', border: 'none', color: 'var(--brand-600)', cursor: 'pointer', fontWeight: 600 }}
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>

        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <IdCard size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: 4 }}>Patient Self Registration</h1>
              <p style={{ color: 'var(--neutral-500)', fontSize: '0.92rem' }}>Create your lifetime unique patient ID using your personal details and Aadhaar number.</p>
            </div>
          </div>

          {result?.patient && (
            <div className="card" style={{ padding: '16px 18px', marginBottom: 18, border: '1px solid rgba(34,197,94,0.25)', boxShadow: 'none' }}>
              <div style={{ color: 'var(--success-700)', fontWeight: 700, marginBottom: 8 }}>
                {result.alreadyExists ? 'Patient already registered' : 'Registration completed'}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--neutral-600)', lineHeight: 1.7 }}>
                <strong>Global Patient ID:</strong> {result.patient.patientCode}
                <strong style={{ marginLeft: 14 }}>Mobile:</strong> {result.patient.contactNumber}
              </div>
              <div style={{ marginTop: 12 }}>
                <Button onClick={() => navigate('/login')}>Go to Login</Button>
              </div>
            </div>
          )}

          {error && (
            <div className="card" style={{ padding: '14px 18px', marginBottom: 18, border: '1px solid rgba(239,68,68,0.25)', boxShadow: 'none' }}>
              <div style={{ color: 'var(--danger-700)', fontWeight: 600 }}>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Full Name" required><Input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} /></FormField>
            <FormField label="Date of Birth" required><Input type="date" value={form.dateOfBirth} onChange={(event) => setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} /></FormField>
            <FormField label="Gender" required>
              <Select value={form.gender} onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField label="District" required>
              <Select value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}>
                <option value="">Select district</option>
                {TELANGANA_DISTRICTS.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Mandal" required><Input value={form.mandal} onChange={(event) => setForm((prev) => ({ ...prev, mandal: event.target.value }))} /></FormField>
            <FormField label="Area / Village" required><Input value={form.area} onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))} /></FormField>
            <FormField label="Mobile Number" required><Input value={form.contactNumber} onChange={(event) => setForm((prev) => ({ ...prev, contactNumber: event.target.value }))} /></FormField>
            <FormField label="Aadhaar Number" required><Input value={form.aadharNumber} onChange={(event) => setForm((prev) => ({ ...prev, aadharNumber: event.target.value }))} /></FormField>
            <FormField label="Address" style={{ gridColumn: '1 / -1' }}><Textarea value={form.addressLine} onChange={(event) => setForm((prev) => ({ ...prev, addressLine: event.target.value }))} /></FormField>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--neutral-500)', fontSize: '0.82rem' }}>
                <ShieldCheck size={15} color="var(--success-500)" />
                Aadhaar is used to avoid duplicate lifetime patient identities.
              </div>
              <Button type="submit" loading={loading}>Register and Get Patient ID</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
