import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI, chatAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { ProductCard, Spinner, Toast } from '../components/common';
import { BottomNav } from '../components/layout/SubNavbar';

const G1 = '#2d6a4f';

export default function WishlistPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [items,    setItems]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [toast,    setToast]   = useState(null);

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    wishlistAPI.list()
      .then(({ data }) => setItems(data.results || data))
      .catch(() => setToast({ msg:'Failed to load wishlist.', type:'error' }))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleChat = async (product) => {
    try {
      const { data } = await chatAPI.start(product.seller_id);
      navigate('/chat', { state: { convId: data.id } });
    } catch { navigate('/chat'); }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistAPI.toggle(productId);
      setItems(prev => prev.filter(p => p.id !== productId));
      setToast({ msg:'Removed from wishlist.', type:'success' });
    } catch {
      setToast({ msg:'Failed to remove.', type:'error' });
    }
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#f8fdf9', minHeight:'100vh' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #d0ebd6', padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => navigate(-1)}
          style={{ width:36, height:36, border:'1.5px solid #d0ebd6', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:18 }}>←</button>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600 }}>
          My Wishlist {!loading && <span style={{ fontSize:14, fontWeight:400, color:'#5a7a5e' }}>({items.length})</span>}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 20px 80px' }}>
        {loading ? <Spinner /> : items.length === 0 ? (
          <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:60, textAlign:'center' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>❤️</div>
            <div style={{ fontSize:16, fontWeight:600, color:'#1a2e1d', marginBottom:6 }}>Your wishlist is empty</div>
            <div style={{ fontSize:13, color:'#5a7a5e', marginBottom:20 }}>Save products you like by tapping the heart icon.</div>
            <button onClick={() => navigate('/')}
              style={{ padding:'10px 24px', background:G1, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              Browse Products
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {items.map(product => (
              <div key={product.id} style={{ position:'relative' }}>
                <ProductCard product={product} onChat={handleChat} />
                {/* Remove button overlay */}
                <button onClick={() => handleRemove(product.id)}
                  title="Remove from wishlist"
                  style={{ position:'absolute', top:8, left:8, width:28, height:28, background:'rgba(255,255,255,0.95)', border:'none', borderRadius:'50%', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', zIndex:10 }}>
                  ❤️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
