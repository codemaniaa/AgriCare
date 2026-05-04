// src/components/admin/AdminUI.jsx
// Reusable building blocks used across all admin pages

import { useState, useEffect, useCallback } from 'react';

// ── THEME TOKENS ─────────────────────────────────────────────────
export const T = {
  bg: '#0b0e14', bg2: '#111520', bg3: '#171c28',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  green: '#4ade80', greenDim: 'rgba(74,222,128,0.12)',
  blue: '#60a5fa', blueDim: 'rgba(96,165,250,0.12)',
  amber: '#fbbf24', amberDim: 'rgba(251,191,36,0.12)',
  red: '#f87171', redDim: 'rgba(248,113,113,0.12)',
  purple: '#a78bfa', purpleDim: 'rgba(167,139,250,0.12)',
  cyan: '#22d3ee', cyanDim: 'rgba(34,211,238,0.12)',
  text: '#e2e8f0', textMid: '#94a3b8', textDim: '#64748b',
  mono: "'JetBrains Mono', monospace",
  sans: "'Sora', sans-serif",
};

// ── STATUS BADGE ──────────────────────────────────────────────────
const BADGE_MAP = {
  active: { bg: T.greenDim, color: T.green, border: 'rgba(74,222,128,0.25)' },
  approved: { bg: T.greenDim, color: T.green, border: 'rgba(74,222,128,0.25)' },
  delivered: { bg: T.greenDim, color: T.green, border: 'rgba(74,222,128,0.25)' },
  completed: { bg: T.greenDim, color: T.green, border: 'rgba(74,222,128,0.25)' },
  pending: { bg: T.amberDim, color: T.amber, border: 'rgba(251,191,36,0.25)' },
  scheduled: { bg: T.amberDim, color: T.amber, border: 'rgba(251,191,36,0.25)' },
  processing: { bg: T.amberDim, color: T.amber, border: 'rgba(251,191,36,0.25)' },
  confirmed: { bg: T.blueDim, color: T.blue, border: 'rgba(96,165,250,0.25)' },
  shipped: { bg: T.blueDim, color: T.blue, border: 'rgba(96,165,250,0.25)' },
  buyer: { bg: T.cyanDim, color: T.cyan, border: 'rgba(34,211,238,0.25)' },
  seller: { bg: T.blueDim, color: T.blue, border: 'rgba(96,165,250,0.25)' },
  admin: { bg: T.purpleDim, color: T.purple, border: 'rgba(167,139,250,0.25)' },
  banned: { bg: T.redDim, color: T.red, border: 'rgba(248,113,113,0.25)' },
  rejected: { bg: T.redDim, color: T.red, border: 'rgba(248,113,113,0.25)' },
  cancelled: { bg: T.redDim, color: T.red, border: 'rgba(248,113,113,0.25)' },
  ended: { bg: 'rgba(100,116,139,0.12)', color: '#64748b', border: 'rgba(100,116,139,0.2)' },
  sold: { bg: 'rgba(100,116,139,0.12)', color: '#64748b', border: 'rgba(100,116,139,0.2)' },
  refunded: { bg: T.purpleDim, color: T.purple, border: 'rgba(167,139,250,0.25)' },
};

export function Badge({ status }) {
  const s = (status || '').toLowerCase();
  const style = BADGE_MAP[s] || { bg: 'rgba(100,116,139,0.12)', color: '#64748b', border: 'rgba(100,116,139,0.2)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: 20, fontSize: '0.68rem', fontWeight: 600,
      fontFamily: T.mono, whiteSpace: 'nowrap',
      background: style.bg, color: style.color, border: `1px solid ${style.border}`,
    }}>
      {s}
    </span>
  );
}

// ── STAT CARD ─────────────────────────────────────────────────────
const CARD_COLORS = {
  green:  { accent: T.green,  dim: T.greenDim },
  blue:   { accent: T.blue,   dim: T.blueDim },
  amber:  { accent: T.amber,  dim: T.amberDim },
  red:    { accent: T.red,    dim: T.redDim },
  purple: { accent: T.purple, dim: T.purpleDim },
  cyan:   { accent: T.cyan,   dim: T.cyanDim },
};

export function StatCard({ icon, label, value, trend, trendUp, color = 'green', loading }) {
  const { accent, dim } = CARD_COLORS[color] || CARD_COLORS.green;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (loading || value === undefined) return;
    const end = typeof value === 'number' ? value : parseInt(String(value).replace(/\D/g, '')) || 0;
    let start = 0;
    const step = Math.ceil(end / 50);
    const id = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplayed(start);
      if (start >= end) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [value, loading]);

  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: '18px 20px', position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Glow blob */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: dim, pointerEvents: 'none' }} />

      <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: T.textDim, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>

      {loading ? (
        <div style={{ height: 38, background: T.bg3, borderRadius: 6, animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
      ) : (
        <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: T.mono, lineHeight: 1, marginBottom: 8, color: accent }}>
          {displayed.toLocaleString()}
        </div>
      )}

      {trend && (
        <div style={{ fontSize: '0.7rem', color: T.textDim, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: trendUp ? T.green : T.red }}>{trendUp ? '↑' : '↓'} {trend}</span>
          &nbsp;vs last month
        </div>
      )}
    </div>
  );
}

// ── DATA TABLE ────────────────────────────────────────────────────
export function DataTable({ columns, data, loading, emptyText = 'No data found', keyField = 'id' }) {
  if (loading) return <LoadingRows cols={columns.length} />;
  if (!data || data.length === 0) return <EmptyState text={emptyText} />;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: '10px 16px', textAlign: 'left',
                color: T.textDim, fontSize: '0.68rem', fontWeight: 600,
                letterSpacing: '0.8px', textTransform: 'uppercase',
                borderBottom: `1px solid ${T.border}`, background: T.bg3,
                whiteSpace: 'nowrap',
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row[keyField]} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = T.bg3}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '12px 16px', color: T.textMid, verticalAlign: 'middle' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingRows({ cols }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {[...Array(6)].map((_, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
            {[...Array(cols)].map((_, j) => (
              <td key={j} style={{ padding: '12px 16px' }}>
                <div style={{ height: 14, borderRadius: 4, background: T.bg3, width: `${40 + Math.random() * 50}%` }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────
export function EmptyState({ text = 'No data found', icon = '📭' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: 12 }}>{icon}</div>
      <div style={{ color: T.textDim, fontSize: '0.83rem' }}>{text}</div>
    </div>
  );
}

// ── TABLE CARD WRAPPER ────────────────────────────────────────────
export function TableCard({ title, count, toolbar, children, footer }) {
  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: '0.87rem', fontWeight: 600 }}>
          {title}{' '}
          {count !== undefined && <span style={{ color: T.textDim, fontWeight: 400 }}>({count?.toLocaleString()})</span>}
        </span>
        {toolbar}
      </div>
      {children}
      {footer}
    </div>
  );
}

// ── FILTER ROW ────────────────────────────────────────────────────
export function FilterRow({ children }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}

export function FilterInput({ placeholder, value, onChange, width = 200 }) {
  return (
    <input
      placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      style={{
        background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 7,
        padding: '7px 12px', color: T.text, fontFamily: T.sans, fontSize: '0.78rem',
        outline: 'none', width, transition: 'border-color 0.2s',
      }}
      onFocus={e => e.target.style.borderColor = T.green}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  );
}

export function FilterSelect({ value, onChange, options, placeholder = 'All' }) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 7,
        padding: '7px 12px', color: T.text, fontFamily: T.sans, fontSize: '0.78rem',
        outline: 'none', cursor: 'pointer', appearance: 'none',
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o} style={{ background: T.bg2 }}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

// ── BUTTONS ───────────────────────────────────────────────────────
const BTN_STYLES = {
  primary: { background: T.green, color: '#0b0e14', border: 'none' },
  danger:  { background: T.redDim, color: T.red, border: `1px solid rgba(248,113,113,0.25)` },
  warning: { background: T.amberDim, color: T.amber, border: `1px solid rgba(251,191,36,0.25)` },
  success: { background: T.greenDim, color: T.green, border: `1px solid rgba(74,222,128,0.25)` },
  ghost:   { background: T.bg3, color: T.textMid, border: `1px solid ${T.border}` },
  blue:    { background: T.blueDim, color: T.blue, border: `1px solid rgba(96,165,250,0.25)` },
};

export function Btn({ variant = 'ghost', size = 'md', icon, children, onClick, disabled, title, loading: btnLoading }) {
  const base = BTN_STYLES[variant] || BTN_STYLES.ghost;
  const pad  = size === 'sm' ? '5px 10px' : size === 'icon' ? '6px' : '8px 14px';
  const fs   = size === 'sm' ? '0.72rem' : '0.78rem';

  return (
    <button
      onClick={onClick} disabled={disabled || btnLoading} title={title}
      style={{
        ...base, display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: pad, borderRadius: 7, fontSize: fs, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: T.sans,
        transition: 'all 0.18s', opacity: disabled ? 0.5 : 1,
        width: size === 'icon' ? 30 : 'auto', height: size === 'icon' ? 30 : 'auto',
        justifyContent: 'center',
      }}
    >
      {btnLoading ? <Spinner size={12} /> : icon}
      {children}
    </button>
  );
}

// ── SPINNER ───────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.1)`,
      borderTopColor: T.green,
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

// ── LOADING PAGE ──────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Spinner size={32} />
    </div>
  );
}

// ── MODAL ─────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, maxWidth = 500 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.bg2, border: `1px solid ${T.border2}`, borderRadius: 16,
        width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
        animation: 'modalIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 6px', borderRadius: 4 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {footer && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '16px 20px', borderTop: `1px solid ${T.border}` }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── CONFIRM MODAL ─────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title = 'Confirm Action', message, target, loading: confirmLoading }) {
  return (
    <Modal open={open} onClose={onClose} title={`⚠️ ${title}`} maxWidth={380}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm} loading={confirmLoading}>Delete</Btn>
        </>
      }
    >
      <p style={{ color: T.textMid, fontSize: '0.85rem', lineHeight: 1.6 }}>
        {message || 'Are you sure you want to delete '}
        {target && <strong style={{ color: T.red }}> "{target}"</strong>}? This action cannot be undone.
      </p>
    </Modal>
  );
}

// ── FORM COMPONENTS ───────────────────────────────────────────────
export function FormGroup({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: T.textMid, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: '0.72rem', color: T.textDim, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function FormInput({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} {...rest}
      style={{ width: '100%', background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', color: T.text, fontFamily: T.sans, fontSize: '0.83rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
      onFocus={e => e.target.style.borderColor = T.green}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  );
}

export function FormSelect({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', color: T.text, fontFamily: T.sans, fontSize: '0.83rem', outline: 'none', cursor: 'pointer', appearance: 'none', boxSizing: 'border-box' }}
      onFocus={e => e.target.style.borderColor = T.green}
      onBlur={e => e.target.style.borderColor = T.border}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o} style={{ background: T.bg2 }}>{o.label ?? o}</option>)}
    </select>
  );
}

// ── TOAST HOOK ────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const ToastContainer = () => (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 999 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: T.bg2, border: `1px solid ${T.border2}`, borderRadius: 10,
          padding: '12px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)', minWidth: 240,
          borderLeft: `3px solid ${t.type === 'success' ? T.green : t.type === 'error' ? T.red : T.amber}`,
          animation: 'toastIn 0.3s ease',
        }}>
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : '⚠️'}</span>
          <span style={{ color: T.text }}>{t.message}</span>
        </div>
      ))}
    </div>
  );

  return { show, ToastContainer };
}

// ── PAGINATION ────────────────────────────────────────────────────
export function Pagination({ current, total, pageSize = 15, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) pages.push(i);

  const btnStyle = (active) => ({
    width: 30, height: 30, borderRadius: 6,
    background: active ? T.greenDim : T.bg3,
    border: `1px solid ${active ? 'rgba(74,222,128,0.3)' : T.border}`,
    color: active ? T.green : T.textMid,
    fontSize: '0.78rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderTop: `1px solid ${T.border}`, gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.75rem', color: T.textDim, flex: 1 }}>
        Showing {((current - 1) * pageSize) + 1}–{Math.min(current * pageSize, total)} of {total?.toLocaleString()}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={btnStyle(false)} onClick={() => onChange(current - 1)} disabled={current === 1}>‹</button>
        {pages.map(p => (
          <button key={p} style={btnStyle(p === current)} onClick={() => onChange(p)}>{p}</button>
        ))}
        <button style={btnStyle(false)} onClick={() => onChange(current + 1)} disabled={current === totalPages}>›</button>
      </div>
    </div>
  );
}

// ── USER AVATAR CELL ──────────────────────────────────────────────
const AV_COLORS = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#fb923c'];
export function UserCell({ name, email }) {
  const color = AV_COLORS[(name || '').charCodeAt(0) % AV_COLORS.length];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0b0e14', flexShrink: 0 }}>
        {(name || '?')[0].toUpperCase()}
      </div>
      <div>
        <div style={{ color: T.text, fontWeight: 500, fontSize: '0.83rem' }}>{name}</div>
        {email && <div style={{ color: T.textDim, fontSize: '0.7rem', fontFamily: T.mono }}>{email}</div>}
      </div>
    </div>
  );
}

// ── PAGE HEADER ───────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: T.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.8rem', color: T.textDim, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

// ── INJECT GLOBAL CSS ─────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(-10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes toastIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0b0e14; color: #e2e8f0; font-family: 'Sora', sans-serif; }
  input::placeholder { color: #64748b !important; }
  select option { background: #111520; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0b0e14; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #4ade80; }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}
