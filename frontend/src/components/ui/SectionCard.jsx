import React from 'react';

export default function SectionCard({ title, subtitle, actions, children, style: extraStyle, bodyStyle }) {
  return (
    <div className="card" style={extraStyle}>
      {(title || actions) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 0',
          marginBottom: 16,
          flexWrap: 'wrap', gap: 10,
        }}>
          <div>
            {title && (
              <h3 style={{
                fontSize: '1.08rem', fontWeight: 700,
                color: 'var(--neutral-800)',
              }}>{title}</h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', marginTop: 4, lineHeight: 1.55 }}>{subtitle}</p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </div>
      )}
      <div style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}
