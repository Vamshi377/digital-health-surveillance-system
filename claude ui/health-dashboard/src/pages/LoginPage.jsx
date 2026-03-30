import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roles = [
  { value: 'reception', label: 'Receptionist',  color: '#10B981', emoji: '🏥' },
  { value: 'nurse',     label: 'Nurse',          color: '#3B82F6', emoji: '💉' },
  { value: 'lab',       label: 'Lab Technician', color: '#F59E0B', emoji: '🔬' },
  { value: 'doctor',    label: 'Doctor',          color: '#7C3AED', emoji: '⚕️' },
  { value: 'patient',   label: 'Patient',         color: '#1EB5F0', emoji: '🩺' },
  { value: 'admin',     label: 'Admin',           color: '#F43F5E', emoji: '🛡️' },
  { value: 'dmo',       label: 'DMO',             color: '#0A5C7A', emoji: '📊' },
];

const roleRedirects = {
  reception: '/reception',
  nurse:     '/nurse',
  lab:       '/lab',
  doctor:    '/doctor',
  patient:   '/patient',
  admin:     '/admin',
  dmo:       '/dmo',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'doctor' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedRole = roles.find(r => r.value === form.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900)); // simulate network
    const user = login(form);
    setLoading(false);
    navigate(roleRedirects[user.role] || '/doctor');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-primary)',
    }}>
      {/* Left Panel */}
      <div style={{
        flex: '0 0 480px',
        background: 'var(--teal-950)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 48px',
        position: 'relative',
        overflow: 'hidden',
      }} className="login-left">
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,181,240,0.12) 0%, transparent 70%)',
          top: -100, right: -200,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          bottom: 100, left: -50,
          pointerEvents: 'none',
        }} />

        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--teal-800)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(30,181,240,0.3)',
            }}>
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                <rect x="17" y="5" width="6" height="30" rx="3" fill="white" />
                <rect x="5" y="17" width="30" height="6" rx="3" fill="white" />
              </svg>
            </div>
            <div>
              <div style={{ color: 'white', fontFamily: "'DM Serif Display',serif", fontSize: 22, lineHeight: 1 }}>HealthPulse</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.1em', marginTop: 2 }}>DIGITAL HEALTH RECORD SYSTEM</div>
            </div>
          </div>
        </div>

        {/* Main text */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingBottom: 40 }}>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            color: 'white',
            fontSize: 38,
            lineHeight: 1.2,
            fontWeight: 400,
            marginBottom: 16,
          }}>
            Unified Healthcare<br />
            <span style={{ color: 'var(--teal-400)' }}>at Your Fingertips</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7 }}>
            Seamlessly manage patient records, lab reports, diagnoses, and district-wide disease surveillance from one secure platform.
          </p>

          {/* Features */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: Shield, text: 'Role-based access control' },
              { icon: Activity, text: 'Real-time disease surveillance' },
              { icon: Activity, text: 'End-to-end patient journey tracking' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(30,181,240,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={13} color="var(--teal-400)" />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
          animation: 'fadeIn 0.5s ease both',
        }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 28, fontWeight: 400,
              color: 'var(--text-primary)', marginBottom: 8,
            }}>Welcome back</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Role Selector */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 10 }}>Sign in as</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
              }}>
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    style={{
                      padding: '10px 6px',
                      borderRadius: 10,
                      border: `2px solid ${form.role === r.value ? r.color : 'var(--border-color)'}`,
                      background: form.role === r.value ? r.color + '10' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                      boxShadow: form.role === r.value ? `0 0 0 3px ${r.color}20` : 'none',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{r.emoji}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: form.role === r.value ? r.color : 'var(--text-muted)', lineHeight: 1.2 }}>
                      {r.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                placeholder="you@hospital.gov.in"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: '#FFF1F2', border: '1px solid #FECDD3',
                color: '#BE123C', fontSize: 13, marginBottom: 16,
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: selectedRole?.color || 'var(--teal-800)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                transition: 'all 0.2s',
                fontFamily: 'var(--font-body)',
                boxShadow: `0 4px 16px ${(selectedRole?.color || '#0A5C7A')}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }} />
                  Signing in...
                </>
              ) : `Sign In as ${selectedRole?.label}`}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
            Protected by enterprise-grade encryption · ABDM Compliant
          </p>
        </div>
      </div>
    </div>
  );
}
