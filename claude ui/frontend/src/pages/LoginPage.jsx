import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_ROUTES = {
  reception: '/reception',
  nurse:     '/nurse',
  lab:       '/lab',
  doctor:    '/doctor',
  patient:   '/patient',
  admin:     '/admin',
  dmo:       '/dmo',
};

export default function LoginPage() {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => {
    setError(null);
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    try {
      const user = await login(form);
      navigate(ROLE_ROUTES[user.role] ?? '/');
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
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Left panel */}
      <div style={{
        background: 'linear-gradient(160deg, #0f1e3d 0%, #0d42ab 55%, #1a6ff0 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -120, left: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(26,111,240,0.25)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 44, height: 44,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z" fill="white" fillOpacity="0.9"/>
              <path d="M9 12h6M12 9v6" stroke="#1a6ff0" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', fontFamily: 'var(--font-serif)', letterSpacing: '-0.01em' }}>
              MediCore
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Clinical Management
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            color: '#fff',
            fontFamily: 'var(--font-serif)',
            fontSize: '2.6rem',
            fontWeight: 400,
            lineHeight: 1.2,
            marginBottom: 20,
          }}>
            Unified care.<br />
            <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>Every patient.</em>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 380 }}>
            A secure, role-based clinical management platform built for hospitals and healthcare networks of every scale.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32 }}>
            {['HIPAA Compliant', 'Real-time Updates', 'Role-based Access', 'Audit Trail'].map(f => (
              <span key={f} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-full)',
                padding: '5px 14px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.75rem',
                fontWeight: 500,
                backdropFilter: 'blur(8px)',
              }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
            © {new Date().getFullYear()} MediCore Health Systems. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-app)',
        padding: 40,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--neutral-900)',
              fontFamily: 'var(--font-serif)',
              marginBottom: 8,
            }}>
              Sign in to your account
            </h1>
            <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
              Enter your credentials to access the portal
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@hospital.org"
                required
                autoComplete="email"
                style={{
                  width: '100%', height: 44,
                  padding: '0 14px',
                  border: '1.5px solid var(--neutral-200)',
                  borderRadius: 'var(--radius-md)',
                  background: '#fff',
                  color: 'var(--neutral-800)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--brand-400)'; e.target.style.boxShadow = '0 0 0 3px rgba(26,111,240,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--neutral-200)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', height: 44,
                    padding: '0 44px 0 14px',
                    border: '1.5px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    background: '#fff',
                    color: 'var(--neutral-800)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--brand-400)'; e.target.style.boxShadow = '0 0 0 3px rgba(26,111,240,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--neutral-200)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--neutral-400)', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'var(--danger-50)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                color: 'var(--danger-700)',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                height: 46,
                background: loading ? 'var(--brand-400)' : 'var(--brand-500)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: 'var(--shadow-brand)',
                transition: 'background var(--transition-fast)',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--brand-600)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = loading ? 'var(--brand-400)' : 'var(--brand-500)'; }}
            >
              {loading ? (
                <>
                  <span style={{
                    display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>

            {/* Security note */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              background: 'var(--neutral-50)',
              border: '1px solid var(--neutral-100)',
              borderRadius: 'var(--radius-md)',
            }}>
              <ShieldCheck size={15} color="var(--success-500)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.775rem', color: 'var(--neutral-500)' }}>
                Your session is encrypted and protected. This portal is for authorised personnel only.
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
