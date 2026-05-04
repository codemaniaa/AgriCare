import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ordersAPI, productsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatPrice, extractError } from '../utils';
import Navbar from '../components/layout/Navbar';
import { Toast, Spinner } from '../components/common';
import { BottomNav} from '../components/layout/SubNavbar';

const G1 = '#2d6a4f';

const CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan',
  'Gujranwala','Sialkot','Peshawar','Quetta','Okara','Sahiwal',
  'Sheikhupura','Hyderabad','Bahawalpur',
];

const PAYMENT_METHODS = [
  { id:'cod',           icon:'💵', label:'Cash on Delivery',  desc:'Pay when you receive the product' },
  { id:'jazzcash',      icon:'🟡', label:'JazzCash',          desc:'Pay via JazzCash mobile wallet'    },
  { id:'easypaisa',     icon:'🟢', label:'Easypaisa',         desc:'Pay via Easypaisa mobile wallet'  },
  { id:'bank_transfer', icon:'🏦', label:'Bank Transfer',     desc:'Direct bank account transfer'     },
];

export default function PlaceOrderPage() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const productId   = location.state?.productId;
  const initQty     = location.state?.quantity || 1;

  const [product, setProduct]  = useState(location.state?.product || null);
  const [loading, setLoading]  = useState(!product);
  const [placing, setPlacing]  = useState(false);
  const [toast,   setToast]    = useState(null);

  const [qty,     setQty]      = useState(initQty);
  const [method,  setMethod]   = useState('cod');
  const [form,    setForm]     = useState({
    delivery_name:    user?.full_name || '',
    delivery_phone:   '',
    delivery_city:    user?.city || '',
    delivery_address: '',
    notes:            '',
  });

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    if (!product && productId) {
      productsAPI.detail(productId)
        .then(r => setProduct(r.data))
        .finally(() => setLoading(false));
    }
  }, [user, product, productId, navigate]);

  if (loading) return <><Navbar /><Spinner /></>;
  if (!product) return <><Navbar /><div style={{ padding:40, textAlign:'center', color:'#5a7a5e' }}>Product not found. <span style={{ color:G1, cursor:'pointer' }} onClick={() => navigate('/')}>Go home</span></div></>;

  const total = Number(product.price) * qty;
  const set   = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.delivery_name)    { setToast({ msg:'Enter delivery name.',    type:'error' }); return; }
    if (!form.delivery_phone)   { setToast({ msg:'Enter phone number.',     type:'error' }); return; }
    if (!form.delivery_city)    { setToast({ msg:'Select delivery city.',   type:'error' }); return; }
    if (!form.delivery_address) { setToast({ msg:'Enter delivery address.', type:'error' }); return; }

    setPlacing(true);
    try {
      const { data: order } = await ordersAPI.create({
        product: product.id,
        quantity: qty,
        payment_type: method,
        ...form,
      });

      if (method === 'cod') {
        setToast({ msg: 'Order placed! 🎉 Pay on delivery.', type:'success' });
        setTimeout(() => navigate('/orders'), 1600);
      } else {
        // Redirect to transaction page
        navigate('/transaction', { state: { order, product, method } });
      }
    } catch (err) {
      setToast({ msg: extractError(err), type:'error' });
    } finally {
      setPlacing(false);
    }
  };

  const inputSt = { width:'100%', padding:'10px 14px', border:'1.5px solid #d0ebd6', borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box' };
  const labelSt = { fontSize:12, fontWeight:500, color:'#1a2e1d', marginBottom:4, display:'block' };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#f8fdf9', minHeight:'100vh' }}>
      <Navbar />

      <div style={{ background:'#fff', borderBottom:'1px solid #d0ebd6', padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => navigate(-1)} style={{ width:36, height:36, border:'1.5px solid #d0ebd6', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:18 }}>←</button>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600 }}>Place Order</div>
        <div style={{ marginLeft:'auto', fontSize:12, color:'#5a7a5e' }}>Step 1 of 2</div>
      </div>

      <div style={{ maxWidth:820, margin:'0 auto', padding:'24px 20px 80px', display:'grid', gridTemplateColumns:'1fr 340px', gap:24 }}>

        {/* ── LEFT: Form ── */}
        <form onSubmit={handleSubmit}>

          {/* Delivery Info */}
          <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:20, marginBottom:16 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              📍 Delivery Information
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={labelSt}>Full Name *</label>
                <input style={inputSt} value={form.delivery_name} onChange={set('delivery_name')} placeholder="Recipient name" required />
              </div>
              <div>
                <label style={labelSt}>Phone Number *</label>
                <input style={inputSt} value={form.delivery_phone} onChange={set('delivery_phone')} placeholder="03XX-XXXXXXX" required />
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>City *</label>
              <select style={inputSt} value={form.delivery_city} onChange={set('delivery_city')} required>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={labelSt}>Full Address *</label>
              <textarea style={{ ...inputSt, resize:'vertical' }} rows={3} value={form.delivery_address} onChange={set('delivery_address')} placeholder="Street, area, landmark..." required />
            </div>
            <div>
              <label style={labelSt}>Order Notes (optional)</label>
              <input style={inputSt} value={form.notes} onChange={set('notes')} placeholder="Special instructions for seller..." />
            </div>
          </div>

          {/* Quantity */}
          <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:20, marginBottom:16 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>📦 Quantity</div>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #d0ebd6', borderRadius:10, overflow:'hidden' }}>
                <button type="button" onClick={() => setQty(q => Math.max(1, q-1))}
                  style={{ width:40, height:40, border:'none', background:'#f0faf2', cursor:'pointer', fontSize:20, color:G1, fontWeight:700 }}>−</button>
                <span style={{ width:56, textAlign:'center', fontWeight:700, fontSize:16 }}>{qty}</span>
                <button type="button" onClick={() => setQty(q => Math.min(product.stock_qty, q+1))}
                  style={{ width:40, height:40, border:'none', background:'#f0faf2', cursor:'pointer', fontSize:20, color:G1, fontWeight:700 }}>+</button>
              </div>
              <div style={{ fontSize:13, color:'#5a7a5e' }}>
                {product.stock_qty} kg available &nbsp;·&nbsp; <strong style={{ color:G1 }}>{formatPrice(total)}</strong> total
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:20, marginBottom:20 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>💳 Payment Method</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {PAYMENT_METHODS.map(pm => (
                <label key={pm.id}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', border:`1.5px solid ${method === pm.id ? G1 : '#d0ebd6'}`, borderRadius:12, cursor:'pointer', background: method === pm.id ? '#f0faf2' : '#fff', transition:'all 0.2s' }}>
                  <input type="radio" name="payment" value={pm.id} checked={method === pm.id} onChange={() => setMethod(pm.id)} style={{ accentColor:G1, width:16, height:16 }} />
                  <span style={{ fontSize:22 }}>{pm.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{pm.label}</div>
                    <div style={{ fontSize:11, color:'#5a7a5e' }}>{pm.desc}</div>
                  </div>
                  {method === pm.id && <span style={{ color:G1, fontSize:18 }}>✓</span>}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={placing}
            style={{ width:'100%', padding:14, background:G1, color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {placing ? 'Placing Order…' : method === 'cod' ? '✓ Place Order (COD)' : `Continue to Payment →`}
          </button>
        </form>

        {/* ── RIGHT: Order Summary ── */}
        <div>
          <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:20, position:'sticky', top:84 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>🛒 Order Summary</div>

            {/* Product */}
            <div style={{ display:'flex', gap:12, marginBottom:16, paddingBottom:16, borderBottom:'1px solid #d0ebd6' }}>
              <div style={{ width:72, height:64, borderRadius:10, background:'#f0faf2', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                {product.primary_image
                  ? <img src={product.primary_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : '🌾'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:2, lineHeight:1.3 }}>{product.title}</div>
                <div style={{ fontSize:11, color:'#5a7a5e', marginBottom:4 }}>Seller: {product.seller_name}</div>
                <div style={{ fontSize:12, color:G1, fontWeight:700 }}>{formatPrice(product.price)}/kg</div>
              </div>
            </div>

            {/* Breakdown */}
            {[
              ['Quantity',   `${qty} kg`],
              ['Unit Price', formatPrice(product.price)],
              ['Payment',    PAYMENT_METHODS.find(p=>p.id===method)?.label],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                <span style={{ color:'#5a7a5e' }}>{k}</span>
                <span style={{ fontWeight:500 }}>{v}</span>
              </div>
            ))}

            <div style={{ borderTop:'1px solid #d0ebd6', marginTop:12, paddingTop:12, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:700, fontSize:15 }}>Total</span>
              <span style={{ fontWeight:700, fontSize:18, color:G1 }}>{formatPrice(total)}</span>
            </div>

            {method === 'cod' && (
              <div style={{ marginTop:12, padding:'10px 12px', background:'#fff8e1', borderRadius:8, border:'1px solid #ffe082', fontSize:11, color:'#856404' }}>
                ⚠️ COD orders: pay the seller in cash when your order arrives.
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
