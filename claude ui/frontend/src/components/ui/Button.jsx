import React from 'react';

const VARIANTS = {
  primary: {
    background: 'var(--brand-500)',
    color: '#fff',
    border: '1px solid var(--brand-500)',
    hoverBg: 'var(--brand-600)',
    hoverBorder: 'var(--brand-600)',
  },
  secondary: {
    background: 'var(--neutral-0)',
    color: 'var(--neutral-700)',
    border: '1px solid var(--neutral-200)',
    hoverBg: 'var(--neutral-50)',
    hoverBorder: 'var(--neutral-300)',
  },
  danger: {
    background: 'var(--danger-500)',
    color: '#fff',
    border: '1px solid var(--danger-500)',
    hoverBg: 'var(--danger-700)',
    hoverBorder: 'var(--danger-700)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--brand-600)',
    border: '1px solid transparent',
    hoverBg: 'var(--brand-50)',
    hoverBorder: 'var(--brand-200)',
  },
};

const SIZES = {
  sm: { padding: '6px 14px', fontSize: '0.8rem', height: 32 },
  md: { padding: '9px 18px', fontSize: '0.875rem', height: 38 },
  lg: { padding: '12px 24px', fontSize: '0.95rem', height: 44 },
};

export default function Button({
  children, variant = 'primary', size = 'md',
  icon: Icon, iconPos = 'left', loading, disabled, style: extraStyle, ...props
}) {
  const v = VARIANTS[variant];
  const s = SIZES[size];

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        flexDirection: iconPos === 'right' ? 'row-reverse' : 'row',
        justifyContent: 'center',
        padding: s.padding,
        height: s.height,
        fontSize: s.fontSize,
        fontWeight: 600,
        background: v.background,
        color: v.color,
        border: v.border,
        borderRadius: 'var(--radius-md)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'all var(--transition-fast)',
        whiteSpace: 'nowrap',
        boxShadow: variant === 'primary' ? 'var(--shadow-brand)' : 'none',
        fontFamily: 'var(--font-sans)',
        ...extraStyle,
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = v.hoverBg;
          e.currentTarget.style.borderColor = v.hoverBorder;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = v.background;
        e.currentTarget.style.borderColor = v.border.replace('1px solid ', '');
      }}
      {...props}
    >
      {loading ? <MiniSpinner /> : Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

function MiniSpinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 14, height: 14, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.4)',
      borderTopColor: '#fff',
      animation: 'spin 0.6s linear infinite',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}
