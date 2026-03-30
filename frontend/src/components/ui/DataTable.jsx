import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function DataTable({ columns, data, loading, emptyMessage = 'No records found', onRowClick }) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: 'var(--neutral-400)',
        fontSize: '0.9rem',
      }}>
        <div style={{ marginBottom: 8, fontSize: '2rem', opacity: 0.3 }}>⚕</div>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--neutral-100)' }}>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding: '11px 16px',
                textAlign: col.align ?? 'left',
                fontWeight: 600,
                color: 'var(--neutral-500)',
                fontSize: '0.75rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: '1px solid var(--neutral-50)',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-50)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{
                  padding: '12px 16px',
                  color: 'var(--neutral-700)',
                  textAlign: col.align ?? 'left',
                  verticalAlign: 'middle',
                }}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      display: 'inline-block',
      width: 32, height: 32, borderRadius: '50%',
      border: '3px solid var(--neutral-200)',
      borderTopColor: 'var(--brand-500)',
      animation: 'spin 0.7s linear infinite',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
