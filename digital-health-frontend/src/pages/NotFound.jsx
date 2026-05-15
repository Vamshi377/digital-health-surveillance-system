import React from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', textAlign: 'center', padding: '24px',
    }}>
      {/* Decorative blob */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(0,229,160,0.04) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '8rem', fontWeight: 800, color: 'var(--border-default)', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '0' }}>
          404
        </div>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '60px', height: '60px',
          background: 'linear-gradient(135deg, #00e5a0, #00b87a)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(0,229,160,0.4)',
        }}>
          <Activity size={28} color="#080f1a" strokeWidth={2.5} />
        </div>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '320px', lineHeight: 1.6 }}>
        The page you're looking for doesn't exist or you don't have permission to access it.
      </p>
      <Link to="/login" style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '11px 24px',
        background: 'linear-gradient(135deg, #00e5a0, #00b87a)',
        color: '#080f1a', fontWeight: 700, borderRadius: 'var(--radius-md)',
        textDecoration: 'none', fontSize: '0.9rem',
        boxShadow: '0 4px 20px rgba(0,229,160,0.3)',
      }}>
        <ArrowLeft size={16} /> Back to Login
      </Link>
    </div>
  )
}
