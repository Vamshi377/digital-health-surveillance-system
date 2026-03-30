import React from 'react';

export default function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 28,
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {Icon && (
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-brand)',
            flexShrink: 0,
          }}>
            <Icon size={22} color="white" />
          </div>
        )}
        <div>
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 700,
            color: 'var(--neutral-900)',
            fontFamily: 'var(--font-serif)',
            lineHeight: 1.2,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '0.98rem', color: 'var(--neutral-500)', marginTop: 4, lineHeight: 1.6 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
