import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, delta, deltaLabel, color = '#0A5C7A', style = {} }) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0 || delta == null;

  return (
    <div className="stat-card animate-fade-in" style={style}>
      <div className="stat-icon" style={{ background: color + '18' }}>
        <Icon size={22} color={color} strokeWidth={1.8} />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {delta != null && (
          <div className="stat-delta" style={{ color: isNeutral ? 'var(--text-muted)' : isPositive ? '#10B981' : '#F43F5E' }}>
            {isNeutral ? <Minus size={12} /> : isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(delta)}% {deltaLabel || 'vs last week'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
