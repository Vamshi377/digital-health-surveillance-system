import React from 'react';

export default function FormField({ label, error, hint, required, children, style: extraStyle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...extraStyle }}>
      {label && (
        <label style={{
          fontSize: '0.8rem',
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
        <span style={{ fontSize: '0.775rem', color: 'var(--danger-500)', fontWeight: 500 }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '0.775rem', color: 'var(--neutral-400)' }}>{hint}</span>
      )}
    </div>
  );
}

export function Input({ error, ...props }) {
  return (
    <input
      style={{
        height: 38,
        padding: '0 12px',
        border: `1px solid ${error ? 'var(--danger-500)' : 'var(--neutral-200)'}`,
        borderRadius: 'var(--radius-md)',
        background: 'var(--neutral-0)',
        color: 'var(--neutral-800)',
        fontSize: '0.875rem',
        outline: 'none',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        width: '100%',
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
        height: 38,
        padding: '0 12px',
        border: `1px solid ${error ? 'var(--danger-500)' : 'var(--neutral-200)'}`,
        borderRadius: 'var(--radius-md)',
        background: 'var(--neutral-0)',
        color: 'var(--neutral-800)',
        fontSize: '0.875rem',
        outline: 'none',
        width: '100%',
        cursor: 'pointer',
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
        padding: '10px 12px',
        border: `1px solid ${error ? 'var(--danger-500)' : 'var(--neutral-200)'}`,
        borderRadius: 'var(--radius-md)',
        background: 'var(--neutral-0)',
        color: 'var(--neutral-800)',
        fontSize: '0.875rem',
        outline: 'none',
        resize: 'vertical',
        minHeight: 90,
        width: '100%',
        fontFamily: 'var(--font-sans)',
        transition: 'border-color var(--transition-fast)',
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
