import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'dmo', label: 'DMO' },
  { value: 'patient', label: 'Patient' }
];

const PRESETS = [
  { label: 'Reception', email: 'reception@health.local', password: 'Reception@123', role: 'receptionist' },
  { label: 'Nurse', email: 'nurse@health.local', password: 'Nurse@123', role: 'nurse' },
  { label: 'Lab', email: 'lab@health.local', password: 'Lab@123', role: 'lab_technician' },
  { label: 'Doctor', email: 'doctor@health.local', password: 'Doctor@123', role: 'doctor' },
  { label: 'Admin', email: 'hospitaladmin@health.local', password: 'HospitalAdmin@123', role: 'hospital_admin' },
  { label: 'DMO', email: 'dmo@health.local', password: 'Dmo@123', role: 'dmo' }
];

const ROLE_ROUTES = {
  receptionist: '/reception',
  nurse: '/nurse',
  lab_technician: '/lab',
  doctor: '/doctor',
  patient: '/patient',
  hospital_admin: '/admin',
  dmo: '/dmo'
};

export default function LoginPage() {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', phoneNumber: '', role: 'doctor' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const isPatientLogin = form.role === 'patient';

  const subtitle = useMemo(() => {
    const selected = ROLE_OPTIONS.find((item) => item.value === form.role);
    return selected ? `${selected.label} access` : 'Secure access';
  }, [form.role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.role) return;
    if (isPatientLogin) {
      if (!form.phoneNumber) return;
    } else if (!form.email || !form.password) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const user = await login(form);
      navigate(ROLE_ROUTES[user.role] || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'var(--font-sans)'
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0f1e3d 0%, #0d42ab 55%, #1a6ff0 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -120, left: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 44,
            height: 44,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z" fill="white" fillOpacity="0.9" />
              <path d="M9 12h6M12 9v6" stroke="#1a6ff0" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', fontFamily: 'var(--font-serif)', letterSpacing: '-0.01em' }}>Digital Surveillance</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Health Intelligence Platform</div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontSize: '2.6rem', fontWeight: 400, lineHeight: 1.2, marginBottom: 20 }}>
            Unified care.<br />
            <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>Every patient.</em>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 380 }}>
            Role-based access for reception, nursing, laboratory, doctor workflows, patient records, and district analytics.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32 }}>
            {['Patient records', 'Lab uploads', 'Follow-up alerts', 'DMO analytics'].map((feature) => (
              <span key={feature} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-full)',
                padding: '5px 14px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.75rem',
                fontWeight: 500,
                backdropFilter: 'blur(8px)'
              }}>{feature}</span>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
          Demo-ready login for the digital health platform.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-app)', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--neutral-900)', fontFamily: 'var(--font-serif)', marginBottom: 8 }}>
              Sign in to your account
            </h1>
            <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>{subtitle}</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setError(null);
                  setForm({ email: preset.email, password: preset.password, phoneNumber: '', role: preset.role });
                }}
                style={{
                  border: '1px solid var(--neutral-200)',
                  background: '#fff',
                  borderRadius: '999px',
                  padding: '7px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--neutral-700)'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 6 }}>Role</label>
              <select
                name="role"
                value={form.role}
                onChange={(event) => {
                  setError(null);
                  setForm((prev) => ({ ...prev, role: event.target.value }));
                }}
                style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--neutral-800)', fontSize: '0.9rem', outline: 'none' }}
              >
                {ROLE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            {isPatientLogin ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 6 }}>Mobile number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={(event) => {
                      setError(null);
                      setForm((prev) => ({ ...prev, phoneNumber: event.target.value }));
                    }}
                    placeholder="10-digit mobile number"
                    required
                    autoComplete="tel"
                    style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--neutral-800)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 6 }}>Email address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(event) => {
                      setError(null);
                      setForm((prev) => ({ ...prev, email: event.target.value }));
                    }}
                    placeholder="you@hospital.org"
                    required
                    autoComplete="email"
                    style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--neutral-800)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 6 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={(event) => {
                        setError(null);
                        setForm((prev) => ({ ...prev, password: event.target.value }));
                      }}
                      placeholder="********"
                      required
                      autoComplete="current-password"
                      style={{ width: '100%', height: 44, padding: '0 44px 0 14px', border: '1.5px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', background: '#fff', color: 'var(--neutral-800)', fontSize: '0.9rem', outline: 'none' }}
                    />
                    <button type="button" onClick={() => setShowPw((value) => !value)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)', display: 'flex', alignItems: 'center' }}>
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div style={{ background: 'var(--danger-50)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--danger-700)', fontSize: '0.85rem', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ height: 46, background: loading ? 'var(--brand-400)' : 'var(--brand-500)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: 'var(--shadow-brand)', fontFamily: 'var(--font-sans)' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {isPatientLogin && (
              <button
                type="button"
                onClick={() => navigate('/patient-register')}
                style={{ height: 44, background: '#fff', color: 'var(--brand-600)', border: '1px solid var(--brand-200)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Generate Unique Patient ID
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--neutral-50)', border: '1px solid var(--neutral-100)', borderRadius: 'var(--radius-md)' }}>
              <ShieldCheck size={15} color="var(--success-500)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.775rem', color: 'var(--neutral-500)' }}>
                {isPatientLogin
                  ? 'Register once to get a lifetime unique patient ID, then log in anytime using your registered mobile number.'
                  : 'Your session is encrypted and protected. Use the role selector because this backend validates role during login.'}
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
