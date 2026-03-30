import React from 'react';

export function Badge({ variant = 'neutral', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function Avatar({ name, size = 36, color }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const colors = ['#0A5C7A','#10B981','#7C3AED','#F59E0B','#F43F5E','#3B82F6'];
  const bg = color || colors[name?.charCodeAt(0) % colors.length] || '#0A5C7A';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
}

export function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      {Icon && <Icon size={48} color="var(--neutral-300)" style={{ marginBottom: 16 }} />}
      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 15 }}>{title}</div>
      {desc && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>{desc}</div>}
    </div>
  );
}

export function SectionCard({ title, subtitle, action, children, style = {} }) {
  return (
    <div className="card" style={style}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <div className="section-title">{title}</div>}
            {subtitle && <div className="section-subtitle">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

export function Tag({ children, color = 'var(--teal-600)' }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      background: color + '1A',
      color,
    }}>{children}</span>
  );
}
