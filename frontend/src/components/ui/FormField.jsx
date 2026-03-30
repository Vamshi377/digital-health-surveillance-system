import React from 'react';

export default function FormField({ label, error, hint, required, children, style: extraStyle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...extraStyle }}>
      {label && (
        <label style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--neutral-600)',
          letterSpacing: '0.02em',
        }}>
          {label}
          {required && <span style={{ color: 'var(--danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {error && (
        <span style={{ fontSize: '0.84rem', color: 'var(--danger-500)', fontWeight: 500 }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '0.84rem', color: 'var(--neutral-500)' }}>{hint}</span>
      )}
    </div>
  );
}

export function Input({ error, ...props }) {
  return (
    <input
      style={{
        height: 44,
        padding: '0 14px',
        border: `1px solid ${error ? 'var(--danger-500)' : 'var(--neutral-200)'}`,
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
        color: 'var(--neutral-800)',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        width: '100%',
        boxShadow: 'var(--shadow-xs)'
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--brand-400)';
        e.target.style.boxShadow = '0 0 0 3px rgba(26,111,240,0.12)';
      }}
      onBlur={e => {
        e.target.style.borderColor = error ? 'var(--danger-500)' : 'var(--neutral-200)';
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    />
  );
}

export function Select({ error, children, ...props }) {
  return (
    <select
      style={{
        height: 44,
        padding: '0 14px',
        border: `1px solid ${error ? 'var(--danger-500)' : 'var(--neutral-200)'}`,
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
        color: 'var(--neutral-800)',
        fontSize: '0.95rem',
        outline: 'none',
        width: '100%',
        cursor: 'pointer',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        boxShadow: 'var(--shadow-xs)'
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--brand-400)';
        e.target.style.boxShadow = '0 0 0 3px rgba(26,111,240,0.12)';
      }}
      onBlur={e => {
        e.target.style.borderColor = error ? 'var(--danger-500)' : 'var(--neutral-200)';
        e.target.style.boxShadow = 'var(--shadow-xs)';
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ error, ...props }) {
  return (
    <textarea
      style={{
        padding: '12px 14px',
        border: `1px solid ${error ? 'var(--danger-500)' : 'var(--neutral-200)'}`,
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
        color: 'var(--neutral-800)',
        fontSize: '0.95rem',
        outline: 'none',
        resize: 'vertical',
        minHeight: 108,
        width: '100%',
        fontFamily: 'var(--font-sans)',
        transition: 'border-color var(--transition-fast)',
        boxShadow: 'var(--shadow-xs)'
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--brand-400)';
        e.target.style.boxShadow = '0 0 0 3px rgba(26,111,240,0.12)';
      }}
      onBlur={e => {
        e.target.style.borderColor = error ? 'var(--danger-500)' : 'var(--neutral-200)';
        e.target.style.boxShadow = 'var(--shadow-xs)';
      }}
      {...props}
    />
  );
}
