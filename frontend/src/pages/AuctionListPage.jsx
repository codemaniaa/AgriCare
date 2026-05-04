import React, { useState,} from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionsAPI } from '../api';
import { useAuctions, useCountdown } from '../hooks/useAuctions';
import { formatPrice } from '../utils';
import Navbar from '../components/layout/Navbar';
import { Spinner } from '../components/common';
import { BottomNav } from '../components/layout/SubNavbar';

const G1 = '#2d6a4f';
const CATS = ['grains','fruits','vegetables','livestock','tools','fertilizers'];

/* ── Countdown badge ─────────────────────────────────── */
function CountdownBadge({ endTime, compact }) {
  const { h, m, s, expired } = useCountdown(endTime);
  if (expired) return <span style={{ padding:'3px 10px', background:'#f8d7da', color:'#721c24', borderRadius:20, fontSize:11, fontWeight:600 }}>Ended</span>;
  const fmt = n => String(n).padStart(2,'0');
  const urgentColor = h === 0 && m < 10 ? '#e74c3c' : '#e65100';
  return (
    <span style={{ padding: compact ? '2px 8px' : '4px 12px', background:'#fff3e0', color: urgentColor, borderRadius:20, fontSize: compact ? 10 : 12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4, fontFamily:"'DM Sans',sans-serif" }}>
      {h > 0 && `${fmt(h)}:`}{fmt(m)}:{fmt(s)}
      {!compact && <span style={{ fontSize:9, opacity:0.7, marginLeft:2 }}>remaining</span>}
    </span>
  );
}
 
/* ── Auction Card ─────────────────────────────────────── */
function AuctionCard({ auction }) {
  const navigate = useNavigate();
  const img = auction.product_image;

  return (
    <div onClick={() => navigate(`/auctions/${auction.id}`)}
      style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>

      {/* Image */}
      <div style={{ position:'relative', height:160, background:'#f0faf2', overflow:'hidden' }}>
        {img
          ? <img src={img} alt={auction.product_title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>🌾</div>}
        {/* Status overlay */}
        <div style={{ position:'absolute', top:10, left:10, display:'flex', gap:6 }}>
          {auction.status === 'active'
            ? <span style={{ background:'#2d6a4f', color:'#fff', padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#7dff8a', display:'inline-block' }} />LIVE
              </span>
            : <span style={{ background:'#721c24', color:'#fff', padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700 }}>ENDED</span>}
        </div>
        {/* Bid count badge */}
        <div style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.6)', color:'#fff', padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:600 }}>
          {auction.total_bids} bids
        </div>
      </div>

      <div style={{ padding:14 }}>
        <div style={{ fontWeight:600, fontSize:13, color:'#1a2e1d', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{auction.product_title}</div>
        <div style={{ fontSize:11, color:'#5a7a5e', marginBottom:10 }}>📍 {auction.product_location} &nbsp;·&nbsp; {auction.seller_name}</div>

        {/* Current bid */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:10, color:'#5a7a5e', marginBottom:2 }}>Current Highest Bid</div>
            <div style={{ fontSize:18, fontWeight:700, color:G1 }}>{formatPrice(auction.current_price)}</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:'#5a7a5e', marginBottom:2, textAlign:'right' }}>Base Price</div>
            <div style={{ fontSize:12, color:'#888' }}>{formatPrice(auction.base_price)}</div>
          </div>
        </div>

        {/* Timer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <CountdownBadge endTime={auction.auction_end} />
          <button onClick={e => { e.stopPropagation(); navigate(`/auctions/${auction.id}`); }}
            style={{ padding:'6px 14px', background:G1, color:'#fff', border:'none', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Bid Now →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AUCTION LIST PAGE
═══════════════════════════════════════════════════════ */
export default function AuctionListPage() {
  const navigate = useNavigate();
  const [category,  setCategory]  = useState('');
  const [statusF,   setStatusF]   = useState('active');
  const [minPrice,  setMinPrice]  = useState('');
  const [maxPrice,  setMaxPrice]  = useState('');
  const [location,  setLocation]  = useState('');
  const [page,      setPage]      = useState(1);
  const [sort,      setSort]      = useState('auction_end');

  const params = {
    page, ordering: sort,
    ...(category  && { 'product__category': category }),
    ...(statusF   && { status: statusF }),
    ...(minPrice  && { min_price: minPrice }),
    ...(maxPrice  && { max_price: maxPrice }),
    ...(location  && { search: location }),
  };

  const { auctions, count, loading } = useAuctions(params);
  const totalPages = Math.ceil(count / 12);

  const clearFilters = () => { setCategory(''); setStatusF('active'); setMinPrice(''); setMaxPrice(''); setLocation(''); setPage(1); };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#f8fdf9', minHeight:'100vh' }}>
      <Navbar />

      {/* Header banner */}
      <div style={{ background:'linear-gradient(135deg, #1b4332, #2d6a4f)', padding:'28px 20px', textAlign:'center' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:600, color:'#fff', marginBottom:6 }}>🔨 Live Auctions</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.8)' }}>Bid on fresh farm produce — real-time competitive pricing</div>
        {count > 0 && <div style={{ marginTop:10, display:'inline-block', background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'4px 16px', fontSize:12, color:'#fff', fontWeight:500 }}>{count} auctions live</div>}
      </div>

      {/* Status tabs */}
      <div style={{ background:'#fff', borderBottom:'1px solid #d0ebd6', padding:'0 20px', display:'flex', gap:4 }}>
        {[['active','🔴 Live'],['ended','⚫ Ended'],['','All']].map(([v,l]) => (
          <button key={v} onClick={() => { setStatusF(v); setPage(1); }}
            style={{ padding:'12px 18px', background:'none', border:'none', borderBottom: statusF===v ? `2px solid ${G1}` : '2px solid transparent', color: statusF===v ? G1 : '#5a7a5e', fontSize:13, fontWeight: statusF===v ? 600 : 400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
            {l}
          </button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ padding:'6px 12px', border:'1.5px solid #d0ebd6', borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:'none', cursor:'pointer' }}>
            <option value="auction_end">Ending Soon</option>
            <option value="-current_price">Highest Bid</option>
            <option value="-total_bids">Most Bids</option>
            <option value="-created_at">Newest</option>
          </select>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'20px 20px 80px', display:'flex', gap:24 }}>

        {/* Sidebar filters */}
        <div className="agricare-sidebar" style={{ width:220, minWidth:220, flexShrink:0 }}>
          <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:12, padding:16, marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontWeight:600, fontSize:13 }}>Filters</span>
              <button onClick={clearFilters} style={{ background:'none', border:'none', color:G1, fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Reset</button>
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, marginBottom:8 }}>Category</div>
              {CATS.map(c => (
                <label key={c} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer' }}>
                  <input type="radio" name="acat" checked={category===c} onChange={() => { setCategory(c); setPage(1); }} style={{ accentColor:G1 }} />
                  <span style={{ fontSize:13, color:'#5a7a5e', textTransform:'capitalize' }}>{c}</span>
                </label>
              ))}
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <input type="radio" name="acat" checked={category===''} onChange={() => { setCategory(''); setPage(1); }} style={{ accentColor:G1 }} />
                <span style={{ fontSize:13, color:'#5a7a5e' }}>All</span>
              </label>
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, marginBottom:8 }}>Bid Range (Rs)</div>
              <div style={{ display:'flex', gap:6 }}>
                <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min"
                  style={{ width:'50%', padding:'7px 10px', border:'1.5px solid #d0ebd6', borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:'none' }} />
                <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max"
                  style={{ width:'50%', padding:'7px 10px', border:'1.5px solid #d0ebd6', borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:'none' }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize:12, fontWeight:600, marginBottom:8 }}>Location</div>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City or area"
                style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #d0ebd6', borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:12, padding:14 }}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Live Stats</div>
            {[
              ['Total Auctions', count],
              ['Active Now',     auctions.filter(a=>a.status==='active').length],
              ['Ending Soon',    auctions.filter(a => { const diff = new Date(a.auction_end)-Date.now(); return diff > 0 && diff < 3600000; }).length],
            ].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                <span style={{ color:'#5a7a5e' }}>{l}</span>
                <span style={{ fontWeight:600, color:G1 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex:1 }}>
          {loading ? <Spinner /> : auctions.length === 0 ? (
            <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:60, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔨</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>No auctions found</div>
              <div style={{ fontSize:13, color:'#5a7a5e', marginBottom:20 }}>Try different filters or check back soon.</div>
              <button onClick={clearFilters}
                style={{ padding:'10px 24px', background:G1, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
                {auctions.map(a => <AuctionCard key={a.id} auction={a} />)}
              </div>
              {totalPages > 1 && (
                <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                  {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                    <button key={p} onClick={() => { setPage(p); window.scrollTo(0,0); }}
                      style={{ width:34, height:34, border:'1.5px solid #d0ebd6', borderRadius:8, background: page===p ? G1 : '#fff', color: page===p ? '#fff' : '#5a7a5e', fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export { CountdownBadge };
