// src/pages/admin/AdminDashboardHome.jsx
import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../api';
import { StatCard, TableCard, Badge, Btn, PageHeader, PageLoader, EmptyState, useToast, T,} from '../../components/admin/AdminUI';
 
// ── Mini bar chart (pure SVG, no deps) ───────────────────────────
function BarChart({ data = [], color = T.green, height = 130 }) {
  const max = Math.max(...data.map(d => d.count || 0), 1);
  const W = 520, H = height, padX = 4;
  const barW = (W - padX * (data.length + 1)) / Math.max(data.length, 1);

  const bars = data.map((d, i) => {
    const bH = ((d.count || 0) / max) * H * 0.85;
    const x  = padX + i * (barW + padX);
    const y  = H - bH;
    return (
      <g key={i}>
        <rect x={x.toFixed(1)} y={y.toFixed(1)} width={barW.toFixed(1)} height={Math.max(bH, 2).toFixed(1)}
          rx="2" fill={`url(#barGrad-${color.replace('#', '')})`} opacity="0.8">
          <title>{d.day || d.month}: {d.count}</title>
        </rect>
      </g>
    );
  });

  // Line overlay for revenue
  const points = data.map((d, i) => {
    const x = (padX + i * (barW + padX) + barW / 2).toFixed(1);
    const y = (H - ((d.revenue || d.count || 0) / Math.max(...data.map(x => x.revenue || x.count || 0), 1)) * H * 0.85).toFixed(1);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`barGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {bars}
      {data.length > 1 && (
        <polyline points={points} fill="none" stroke={T.blue} strokeWidth="1.5"
          strokeDasharray="4 2" opacity="0.6" />
      )}
    </svg>
  );
}

// ── Donut chart ───────────────────────────────────────────────────
function DonutChart({ buyers, sellers }) {
  const total = buyers + sellers || 1;
  const buyerPct = Math.round((buyers / total) * 100);
  const r = 45, circ = 2 * Math.PI * r;
  const buyerDash  = (buyers / total) * circ;
  const sellerDash = (sellers / total) * circ;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 120 120" width={120} height={120}>
        <circle cx="60" cy="60" r={r} fill="none" stroke={T.bg3} strokeWidth="18" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={T.cyan} strokeWidth="18"
          strokeDasharray={`${buyerDash.toFixed(1)} ${circ.toFixed(1)}`}
          strokeDashoffset="0" transform="rotate(-90 60 60)" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={T.blue} strokeWidth="18"
          strokeDasharray={`${sellerDash.toFixed(1)} ${circ.toFixed(1)}`}
          strokeDashoffset={`-${buyerDash.toFixed(1)}`} transform="rotate(-90 60 60)" />
        <text x="60" y="55" textAnchor="middle" fill={T.text}
          fontSize="16" fontWeight="700" fontFamily="JetBrains Mono, monospace">{buyerPct}%</text>
        <text x="60" y="69" textAnchor="middle" fill={T.textDim}
          fontSize="8" fontFamily="Sora, sans-serif">Buyers</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Buyers', count: buyers, color: T.cyan },
          { label: 'Sellers', count: sellers, color: T.blue },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: T.text }}>{item.label}</div>
              <div style={{ color: T.textDim }}>{item.count?.toLocaleString()} ({Math.round((item.count / total) * 100)}%)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Activity feed ─────────────────────────────────────────────────


export default function AdminDashboardHome() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { show, ToastContainer } = useToast();
  
  const [activity, setActivity] = useState([]);
  const [pending, setPending] = useState([]);
useEffect(() => {
  adminAPI.stats()
    .then(data => {
      console.log("REAL STATS:", data); // 👈 IMPORTANT
      setStats(data);
    })
    .catch((err) => {
      console.error("STATS API ERROR:", err);
      show("Failed to load dashboard stats", "error");
      setStats(null);
    })
    .finally(() => setLoading(false));

    // Activity
  adminAPI.activity()
    .then(data => setActivity(data))
    .catch(() => setActivity([]));

  // Pending approvals
  adminAPI.pending()
    .then(data => setPending(data))
    .catch(() => setPending([]));

}, []);

  const refresh = () => {
    setLoading(true);
    adminAPI.stats()
      .then(d => { setStats(d); show('Stats refreshed', 'success'); })
      .catch(() => show('Could not refresh stats', 'error'))
      .finally(() => setLoading(false));
  };

  if (loading && !stats) return <PageLoader />;

  const s = stats || {};

  const handleApprove = async (item) => {
  try {
    await adminAPI.approveItem(item.id, item.type);
    show(`${item.name} approved`, 'success');

    // remove from list
    setPending(prev => prev.filter(p => p.id !== item.id));
  } catch {
    show('Approve failed', 'error');
  }
};

const handleReject = async (item) => {
  try {
    await adminAPI.rejectItem(item.id, item.type);
    show(`${item.name} rejected`, 'error');

    setPending(prev => prev.filter(p => p.id !== item.id));
  } catch {
    show('Reject failed', 'error');
  }
};
  return (
    <div>
      <PageHeader
        title="Dashboard Overview"
        subtitle="Real-time platform statistics and activity"
        actions={<Btn variant="ghost" icon="↻" onClick={refresh}>Refresh</Btn>}
      />
          
      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon="👥" label="Total Users"    value={s.total_users}    trend="12%" trendUp color="green"  loading={loading} />
        <StatCard icon="🏪" label="Sellers"        value={s.total_sellers}  trend="8%"  trendUp color="blue"   loading={loading} />
        <StatCard icon="🛒" label="Buyers"         value={s.total_buyers}   trend="15%" trendUp color="cyan"   loading={loading} />
        <StatCard icon="📦" label="Products"       value={s.total_products} trend="3%"  trendUp color="amber"  loading={loading} />
        <StatCard icon="🧾" label="Orders"         value={s.total_orders}   trend="22%" trendUp color="purple" loading={loading} />
        <StatCard icon="🔨" label="Auctions"       value={s.total_auctions} color="red" loading={loading} />
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 24 }}>
        {/* Orders bar chart */}
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 3 }}>Orders — Last 30 Days</div>
          <div style={{ fontSize: '0.72rem', color: T.textDim, marginBottom: 14 }}>Daily volume with revenue trend overlay</div>
          <BarChart data={Array.isArray(s.orders_by_day) ? s.orders_by_day : []} />
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.7rem', color: T.textDim }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, background: T.green, borderRadius: 2, display: 'inline-block' }} />
              Orders
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 14, height: 2, background: T.blue, display: 'inline-block' }} />
              Revenue trend
            </span>
          </div>
        </div>

        {/* User distribution */}
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 3 }}>User Distribution</div>
            <div style={{ fontSize: '0.72rem', color: T.textDim, marginBottom: 14 }}>Breakdown by role</div>
            <DonutChart buyers={s.total_buyers || 0} sellers={s.total_sellers || 0} />
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: '0.7rem', color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Revenue Today</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: T.green, fontFamily: T.mono }}>
              Rs. {(s.revenue_total || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: T.textDim, marginTop: 3 }}>
              {s.new_users_today || 0} new users joined today
            </div>
          </div>

          {/* Quick stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Active Auctions', value: s.active_auctions || 0, color: T.cyan },
              { label: 'Pending Products', value: s.pending_products || 0, color: T.amber },
            ].map(item => (
              <div key={item.label} style={{ background: T.bg3, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '0.65rem', color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{item.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: item.color, fontFamily: T.mono, marginTop: 4 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Activity feed */}
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontSize: '0.85rem', fontWeight: 600 }}>
            ⚡ Recent Activity
          </div>
          <div style={{ padding: '8px 20px' }}>
            {activity.length === 0 ? (
  <div style={{ padding: 20, color: T.textDim }}>No recent activity</div>
) : (
  activity.map((item, i) => (
    <div key={i} style={{
      display: 'flex',
      gap: 12,
      padding: '10px 0',
      borderBottom: i < activity.length - 1 ? `1px solid ${T.border}` : 'none'
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: T.blue,
        marginTop: 5
      }} />

      <div>
        <div style={{ fontSize: '0.78rem', color: T.textMid }}>
          {item.icon} {item.text}
        </div>

        <div style={{
          fontSize: '0.65rem',
          color: T.textDim,
          marginTop: 2,
          fontFamily: T.mono
        }}>
          {new Date(item.time).toLocaleString()}
        </div>
      </div>
    </div>
  ))
)}
          </div>
        </div>

        {/* Pending approvals */}
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>⏳ Pending Approvals</span>
            <Badge status="pending" />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                {['Product', 'Seller', 'Action'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: T.textDim, fontSize: '0.67rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', background: T.bg3, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
           
           <tbody>
  {pending.length === 0 ? (
    <tr>
      <td colSpan="3" style={{ padding: 20, textAlign: 'center', color: T.textDim }}>
        No pending items
      </td>
    </tr>
  ) : (
    pending.map((item, i) => (
      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
        
        {/* Name */}
        <td style={{ padding: '10px 16px', color: T.text }}>
          {item.name}
        </td>

        {/* Seller */}
        <td style={{ padding: '10px 16px' }}>
          {item.seller}
        </td>

        {/* Actions */}
        <td style={{ padding: '10px 16px' }}>
          <div style={{ display: 'flex', gap: 5 }}>

            <Btn
              variant="success"
              size="sm"
              onClick={() => handleApprove(item)}
            >
              ✓
            </Btn>

            <Btn
              variant="danger"
              size="sm"
              onClick={() => handleReject(item)}
            >
              ✕
            </Btn>

          </div>
        </td>
      </tr>
    ))
  )}
</tbody>

          </table>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
