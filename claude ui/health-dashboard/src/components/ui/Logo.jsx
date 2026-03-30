import React from 'react';

export default function Logo({ size = 36, light = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill={light ? 'rgba(255,255,255,0.15)' : '#0A5C7A'} />
        {/* Cross */}
        <rect x="17" y="8" width="6" height="24" rx="3" fill={light ? 'white' : 'white'} />
        <rect x="8" y="17" width="24" height="6" rx="3" fill={light ? 'white' : 'white'} />
        {/* Heartbeat pulse line */}
        <path d="M8 28 L14 28 L16 24 L18 32 L20 20 L22 28 L32 28"
              stroke={light ? 'rgba(255,255,255,0.5)' : 'rgba(30,181,240,0.8)'}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              fill="none" opacity="0.6" />
      </svg>
      <div>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: size * 0.55,
          fontWeight: 400,
          color: light ? 'white' : '#042030',
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}>
          HealthPulse
        </div>
        <div style={{
          fontSize: size * 0.28,
          color: light ? 'rgba(255,255,255,0.6)' : '#6B7280',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginTop: 1,
        }}>
          Health Record System
        </div>
      </div>
    </div>
  );
}
