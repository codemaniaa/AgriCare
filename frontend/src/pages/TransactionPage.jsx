import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentsAPI } from '../api';
import { formatPrice, extractError } from '../utils';
import Navbar from '../components/layout/Navbar';
import { Toast } from '../components/common';
import {BottomNav} from '../components/layout/SubNavbar';

const G1 = '#2d6a4f';

const GATEWAY_INFO = {
  jazzcash:      { icon:'🟡', name:'JazzCash',      color:'#e91e8c', fieldLabel:'JazzCash Mobile Number', placeholder:'03XX-XXXXXXX',  hint:'Your registered JazzCash number'  },
  easypaisa:     { icon:'🟢', name:'Easypaisa',     color:'#4caf50', fieldLabel:'Easypaisa Mobile Number',placeholder:'03XX-XXXXXXX',  hint:'Your registered Easypaisa number' },
  bank_transfer: { icon:'🏦', name:'Bank Transfer', color:'#1565c0', fieldLabel:'Bank Account Number',    placeholder:'IBAN or Account No', hint:'Your bank account number'      },
};

const STATUS_CONFIG = {
  pending:  { icon:'⏳', color:'#856404',  bg:'#fff3cd', msg:'Processing payment…'         },
  success:  { icon:'✅', color:'#0f5132',  bg:'#d1e7dd', msg:'Payment Successful!'          },
  failed:   { icon:'❌', color:'#721c24',  bg:'#f8d7da', msg:'Payment Failed'               },
  timeout:  { icon:'⏰', color:'#856404',  bg:'#fff3cd', msg:'Gateway Timeout — Retry?'     },
  initiated:{ icon:'🔄', color:'#055160',  bg:'#cff4fc', msg:'Initiating transaction…'      },
};

export default function TransactionPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { order, product, method } = location.state || {};

  const gw = GATEWAY_INFO[method] || GATEWAY_INFO.jazzcash;

  const [form,    setForm]    = useState({ account_number:'', account_name:'' });
  const [step,    setStep]    = useState('form');   // form | processing | done
  const [txnId,   setTxnId]   = useState(null);
  const [txnData, setTxnData] = useState(null);
  const [attempts,setAttempts]= useState(0);
  const [toast,   setToast]   = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!order || !method) navigate('/orders');
  }, [order, method, navigate]);

  // Poll transaction status every 2s while processing
  useEffect(() => {
    if (step === 'processing' && txnId) {
      pollRef.current = setInterval(async () => {
        try {
          const { data } = await paymentsAPI.status(txnId);
          setTxnData(data);
          if (['success','failed','timeout'].includes(data.status)) {
            clearInterval(pollRef.current);
            setStep('done');
            if (data.status === 'success') {
              setTimeout(() => navigate('/orders'), 2500);
            }
          }
        } catch { /* silent */ }
      }, 2000);
    }
    return () => clearInterval(pollRef.current);
  }, [step, txnId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.account_number) { setToast({ msg:'Enter account number.', type:'error' }); return; }
    if (!form.account_name)   { setToast({ msg:'Enter account holder name.', type:'error' }); return; }

    setStep('processing');
    setAttempts(a => a + 1);

    try {
      const { data } = await paymentsAPI.initiate({
        order_id:       order.id,
        gateway:        method,
        account_number: form.account_number,
        account_name:   form.account_name,
      });
      setTxnId(data.txn_id);
      setTxnData(data);
      if (['success','failed','timeout'].includes(data.status)) {
        setStep('done');
        clearInterval(pollRef.current);
        if (data.status === 'success') setTimeout(() => navigate('/orders'), 2500);
      }
    } catch (err) {
      setStep('done');
      setTxnData({ status:'failed', failure_reason: extractError(err) });
    }
  };

  const handleRetry = async () => {
    if (!txnId) { setStep('form'); return; }
    setStep('processing');
    try {
      const { data } = await paymentsAPI.retry(txnId);
      setTxnId(data.txn_id || txnId);
      setTxnData(data);
      if (['success','failed','timeout'].includes(data.status)) {
        setStep('done');
        if (data.status === 'success') setTimeout(() => navigate('/orders'), 2500);
      }
    } catch (err) {
      setTxnData({ status:'failed', failure_reason: extractError(err) });
    }
  };

  if (!order) return null;

  const total   = formatPrice(order.total_price);
  const statCfg = txnData ? (STATUS_CONFIG[txnData.status] || STATUS_CONFIG.initiated) : STATUS_CONFIG.initiated;

  const inputSt = { width:'100%', padding:'11px 14px', border:'1.5px solid #d0ebd6', borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box' };
  const labelSt = { fontSize:12, fontWeight:500, color:'#1a2e1d', marginBottom:4, display:'block' };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#f8fdf9', minHeight:'100vh' }}>
      <Navbar />

      <div style={{ background:'#fff', borderBottom:'1px solid #d0ebd6', padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => navigate(-1)} style={{ width:36, height:36, border:'1.5px solid #d0ebd6', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:18 }}>←</button>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600 }}>Complete Payment</div>
        <div style={{ marginLeft:'auto', fontSize:12, color:'#5a7a5e' }}>Step 2 of 2</div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'24px 20px 80px' }}>

        {/* Gateway header */}
        <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:20, marginBottom:16, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:12, background: gw.color + '18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>
            {gw.icon}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'#1a2e1d' }}>{gw.name} Payment</div>
            <div style={{ fontSize:12, color:'#5a7a5e' }}>Order #{order.id} · {product?.title}</div>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <div style={{ fontSize:11, color:'#5a7a5e' }}>Amount</div>
            <div style={{ fontSize:18, fontWeight:700, color:G1 }}>{total}</div>
          </div>
        </div>

        {/* ─── FORM STATE ─── */}
        {step === 'form' && (
          <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:24 }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:14 }}>
                <label style={labelSt}>{gw.fieldLabel} *</label>
                <input style={inputSt} value={form.account_number}
                  onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                  placeholder={gw.placeholder} required />
                <div style={{ fontSize:11, color:'#5a7a5e', marginTop:4 }}>💡 {gw.hint}</div>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={labelSt}>Account Holder Name *</label>
                <input style={inputSt} value={form.account_name}
                  onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
                  placeholder="Full name on account" required />
              </div>

              {/* Amount display — non-editable */}
              <div style={{ background:'#f8fdf9', border:'1px solid #d0ebd6', borderRadius:10, padding:14, marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                  <span style={{ color:'#5a7a5e' }}>Order Amount</span>
                  <span style={{ fontWeight:600 }}>{total}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                  <span style={{ color:'#5a7a5e' }}>Gateway Fees</span>
                  <span style={{ fontWeight:600, color:G1 }}>Free</span>
                </div>
                <div style={{ borderTop:'1px solid #d0ebd6', paddingTop:8, display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontWeight:700 }}>Total Deduction</span>
                  <span style={{ fontWeight:700, fontSize:16, color:G1 }}>{total}</span>
                </div>
              </div>

              <div style={{ background:'#e8f4fd', borderRadius:8, padding:'10px 12px', fontSize:11, color:'#1565c0', marginBottom:16 }}>
                🔒 Your payment details are encrypted and processed securely.
                {method !== 'bank_transfer' && ' You will receive a confirmation SMS.'}
              </div>

              <button type="submit"
                style={{ width:'100%', padding:13, background:gw.color, color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {gw.icon} Pay {total} via {gw.name}
              </button>
            </form>
          </div>
        )}

        {/* ─── PROCESSING STATE ─── */}
        {step === 'processing' && (
          <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:40, textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>
              <div style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>⚙️</div>
            </div>
            <div style={{ fontWeight:600, fontSize:16, marginBottom:8 }}>Processing Payment…</div>
            <div style={{ fontSize:13, color:'#5a7a5e', marginBottom:20 }}>
              Connecting to {gw.name}. Please do not close this page.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {['Connecting to gateway','Validating account','Processing transaction'].map((step, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:'#f8fdf9', borderRadius:8 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'#d8f3dc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✓</div>
                  <span style={{ fontSize:13, color:'#5a7a5e' }}>{step}</span>
                </div>
              ))}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ─── DONE STATE ─── */}
        {step === 'done' && txnData && (
          <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:32, textAlign:'center' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>{statCfg.icon}</div>
            <div style={{ fontWeight:700, fontSize:18, marginBottom:6, color: statCfg.color }}>{statCfg.msg}</div>

            {txnData.status === 'success' && (
              <>
                <div style={{ fontSize:13, color:'#5a7a5e', marginBottom:20 }}>
                  Your payment has been confirmed. Order #{order.id} is now active.
                </div>
                <div style={{ background:'#d1e7dd', borderRadius:10, padding:14, marginBottom:20 }}>
                  <div style={{ fontSize:11, color:'#0f5132' }}>Transaction ID</div>
                  <div style={{ fontWeight:700, fontSize:13, color:'#0f5132' }}>{txnData.txn_id}</div>
                </div>
                <button onClick={() => navigate('/orders')}
                  style={{ width:'100%', padding:12, background:G1, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  View My Orders →
                </button>
              </>
            )}

            {txnData.status === 'failed' && (
              <>
                <div style={{ fontSize:13, color:'#721c24', marginBottom:16 }}>
                  {txnData.failure_reason || 'Payment was declined by the gateway.'}
                </div>
                {attempts < 3 ? (
                  <button onClick={handleRetry}
                    style={{ width:'100%', padding:12, background:'#e74c3c', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:10 }}>
                    🔄 Retry Payment (Attempt {attempts + 1}/3)
                  </button>
                ) : (
                  <div style={{ fontSize:12, color:'#721c24', marginBottom:12 }}>Max retries reached. Please try a different payment method.</div>
                )}
                <button onClick={() => navigate(-2)}
                  style={{ width:'100%', padding:12, background:'#fff', color:G1, border:`1.5px solid ${G1}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  ← Change Payment Method
                </button>
              </>
            )}

            {txnData.status === 'pending' && method === 'bank_transfer' && (
              <>
                <div style={{ fontSize:13, color:'#5a7a5e', marginBottom:16 }}>
                  Your bank transfer is under review. We'll notify you once verified (1–2 business days).
                </div>
                <button onClick={() => navigate('/orders')}
                  style={{ width:'100%', padding:12, background:G1, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  View My Orders →
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
