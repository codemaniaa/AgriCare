// src/components/admin/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
 
const NAV = [
  { id: 'dashboard', path: '/admin',          label: 'Dashboard', icon: '📊' },
  { id: 'users',     path: '/admin/users',    label: 'Users',     icon: '👥' },
  { id: 'products',  path: '/admin/products', label: 'Products',  icon: '📦' },
  { id: 'orders',    path: '/admin/orders',   label: 'Orders',    icon: '🧾' },
  { id: 'auctions',  path: '/admin/auctions', label: 'Auctions',  icon: '🔨' },
];
 

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime]               = useState('');
  const { admin, logoutAdmin }         = useAdminAuth();
  const location                       = useLocation();
  const navigate                       = useNavigate();

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/signin');
  }
 
  const pageTitle = NAV.find(n => location.pathname === n.path || location.pathname.startsWith(n.path + '/'))?.label || 'Admin';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0e14', fontFamily: "'Sora', sans-serif", color: '#e2e8f0' }}>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }} />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 240, background: '#111520', borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100,
        transform: sidebarOpen || window.innerWidth > 900 ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#4ade80,#16a34a)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌿</div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>AgriCare</div>
            <div style={{ fontSize: '0.6rem', background: 'rgba(74,222,128,0.12)', color: '#4ade80', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(74,222,128,0.2)', fontFamily: 'monospace', marginTop: 2 }}>ADMIN</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '6px 8px 4px' }}>Overview</div>
          {NAV.slice(0, 1).map(n => <NavItem key={n.id} item={n} active={location.pathname === n.path} />)}

          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '10px 8px 4px' }}>Management</div>
          {NAV.slice(1).map(n => <NavItem key={n.id} item={n} active={location.pathname.startsWith(n.path)} />)}
        </nav>

        {/* Admin info */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#171c28', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#4ade80,#16a34a)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#0b0e14', flexShrink: 0 }}>
              {(admin?.username || 'A')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin?.username || 'Admin'}</div>
              <div style={{ fontSize: '0.65rem', color: '#4ade80', fontFamily: 'monospace' }}>superuser</div>
            </div>
            <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, padding: 4, borderRadius: 4, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#f87171'}
              onMouseLeave={e => e.target.style.color = '#64748b'}
            >⏻</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ marginLeft: window.innerWidth > 900 ? 240 : 0, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <header style={{ height: 60, background: '#111520', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={{ display: window.innerWidth <= 900 ? 'block' : 'none', background: 'none', border: 'none', color: '#e2e8f0', fontSize: 18, cursor: 'pointer' }}>☰</button>
          <div style={{ flex: 1, fontSize: '1rem', fontWeight: 600 }}>{pageTitle}</div>
          <div style={{ background: '#171c28', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, width: 220 }}>
            <span style={{ color: '#64748b', fontSize: 13 }}>🔍</span>
            <input placeholder="Quick search…" style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontFamily: 'Sora, sans-serif', fontSize: '0.8rem', width: '100%' }} />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#64748b' }}>{time}</div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'pulse 2s infinite' }} title="System online" />
        </header>

        {/* Page content */}
         
          <div>
          <main style={{ padding: 24, flex: 1 }}>
                  <Outlet />
                </main>
          </div>

      
        
      </div>
    </div>
  );
}

function NavItem({ item, active }) {
  return (
    <Link to={item.path} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 8,
        color: active ? '#4ade80' : '#94a3b8',
        background: active ? 'rgba(74,222,128,0.1)' : 'transparent',
        border: `1px solid ${active ? 'rgba(74,222,128,0.2)' : 'transparent'}`,
        fontSize: '0.82rem', fontWeight: 500,
        transition: 'all 0.18s', cursor: 'pointer',
      }}>
        <span style={{ fontSize: 16, width: 18 }}>{item.icon}</span>
        {item.label}
        {item.badge && (
          <span style={{ marginLeft: 'auto', background: '#f87171', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10, fontFamily: 'monospace' }}>
            {item.badge}
          </span>
        )}
      </div>
    </Link>
  );
}
