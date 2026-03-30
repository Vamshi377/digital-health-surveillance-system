import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ title, value, sub, icon: Icon, gradient, trend, trendValue }) {
  const trendIcon =
    trend === 'up'   ? <TrendingUp  size={12} /> :
    trend === 'down' ? <TrendingDown size={12} /> :
                       <Minus size={12} />;

  const trendColor =
    trend === 'up'   ? 'var(--success-500)' :
    trend === 'down' ? 'var(--danger-500)'  :
                       'var(--neutral-400)';

  return (
    <div className="card" style={{
      padding: 0,
      overflow: 'hidden',
      transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {/* Color bar */}
      <div className={gradient} style={{ height: 4 }} />

      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neutral-500)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {title}
          </span>
          {Icon && (
            <div className={gradient} style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} color="white" />
            </div>
          )}
        </div>

        <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--neutral-900)', lineHeight: 1, marginBottom: 8, fontFamily: 'var(--font-serif)' }}>
          {value ?? '—'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {trendValue && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: trendColor, fontSize: '0.75rem', fontWeight: 600 }}>
              {trendIcon} {trendValue}
            </span>
          )}
          {sub && (
            <span style={{ fontSize: '0.775rem', color: 'var(--neutral-400)' }}>{sub}</span>
          )}
        </div>
      </div>
    </div>
  );
}
