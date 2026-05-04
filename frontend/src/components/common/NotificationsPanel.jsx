import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { FiBell } from 'react-icons/fi';
import { motion } from 'framer-motion';
const G1 = '#2d6a4f';

const TYPE_ICON = {
  order_placed:    '🛒',
  order_updated:   '📦',
  new_message:     '💬',
  product_sold:    '✅',
  review_received: '⭐',
};

export default function NotificationsPanel() {
  const { user }        = useAuth();
  const navigate        = useNavigate();
  const [open,  setOpen]  = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [count,  setCount]  = useState(0);
  const panelRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = e => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const { data } = await notificationsAPI.unreadCount();
        setCount(data.count);
      } catch { /* silent */ }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async () => {
    try {
      const { data } = await notificationsAPI.list();
      setNotifs(data.results || data);
    } catch { /* silent */ }
  };

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) loadNotifications();
  };

  const markRead = async (notif) => {
    if (!notif.is_read) {
      await notificationsAPI.markRead(notif.id);
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setCount(c => Math.max(0, c - 1));
    }
    if (notif.link) { navigate(notif.link); setOpen(false); }
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setCount(0);
  };
  const [green, setgreen] = useState(false);


  if (!user) return null;

  return (
    <div ref={panelRef} style={{ position:'relative' }}>
      {/* Bell button */}
      <button onClick={handleOpen}
        style={{ position:'relative', background:'none', border:'none', cursor:'pointer', fontSize:20, lineHeight:1, padding:'4px 6px', color:'#5a7a5e' }}>
         <motion.div
            whileHover={{ scale: 1.15, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center bg-beige rounded-full border:'1px solid #5a7a5e', cursor-pointer"
          >
            <FiBell size={18} className={`cursor-pointer transition ${  green ? 'text-green-600 fill-green-600' : 'text-black'}`} onMouseEnter={() => setgreen(true)}  onMouseLeave={() => setgreen(false)}/>
          </motion.div>
        {count > 0 && (
          <span style={{ position:'absolute', top:0, right:0, background:'#e74c3c', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{ position:'absolute', top:44, right:0, width:340, background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:300, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #d0ebd6', background:'#f8fdf9' }}>
            <span style={{ fontWeight:600, fontSize:14 }}>Notifications</span>
            {count > 0 && (
              <button onClick={markAllRead}
                style={{ background:'none', border:'none', color:G1, fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight:360, overflowY:'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding:32, textAlign:'center', color:'#5a7a5e', fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🔔</div>
                No notifications yet
              </div>
            ) : notifs.map(n => (
              <div key={n.id} onClick={() => markRead(n)}
                style={{ display:'flex', gap:12, padding:'12px 16px', cursor:'pointer', background: n.is_read ? '#fff' : '#f0faf2', borderBottom:'1px solid #f5f5f5', transition:'background 0.15s' }}>
                <div style={{ fontSize:22, flexShrink:0, lineHeight:1.2 }}>{TYPE_ICON[n.notif_type] || '🔔'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight: n.is_read ? 400 : 600, color:'#1a2e1d', marginBottom:2 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize:11, color:'#5a7a5e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.body}</div>}
                  <div style={{ fontSize:10, color:'#5a7a5e', marginTop:3 }}>
                    {new Date(n.created_at).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
                {!n.is_read && <div style={{ width:8, height:8, borderRadius:'50%', background:G1, flexShrink:0, marginTop:4 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
