import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auctionsAPI, chatAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAuction, useAuctionWS, useCountdown } from '../hooks/useAuctions';
import { formatPrice, extractError } from '../utils';
import Navbar from '../components/layout/Navbar';
import { Toast, Spinner } from '../components/common';
import { ImageZoomModal } from '../components/common/Skeletons';
import { BottomNav } from '../components/layout/SubNavbar';
const G1 = '#2d6a4f';
 
/* ── Countdown display ──────────────────────────────── */
function Countdown({ endTime, large }) {
  const { h, m, s, expired, total } = useCountdown(endTime);
  const fmt = n => String(n).padStart(2, '0');
  const urgent = total < 600; // < 10 mins

  if (expired) return (
    <div style={{ padding:'8px 16px', background:'#f8d7da', borderRadius:10, color:'#721c24', fontWeight:700, fontSize: large ? 20 : 14, textAlign:'center' }}>
      Auction Ended
    </div>
  );

  return (
    <div style={{ display:'flex', gap: large ? 8 : 4, justifyContent:'center' }}>
      {[['H', h], ['M', m], ['S', s]].map(([label, val]) => (
        <div key={label} style={{ textAlign:'center' }}>
          <div style={{ background: urgent ? '#fee2e2' : '#f0faf2', border:`2px solid ${urgent ? '#f87171' : '#d0ebd6'}`, borderRadius:8, padding: large ? '10px 14px' : '6px 10px', minWidth: large ? 52 : 36 }}>
            <div style={{ fontWeight:800, fontSize: large ? 26 : 16, color: urgent ? '#dc2626' : G1, fontFamily:"'DM Sans',sans-serif", lineHeight:1 }}>{fmt(val)}</div>
          </div>
          <div style={{ fontSize:9, color:'#5a7a5e', marginTop:2 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Bid history row ─────────────────────────────────── */
function BidRow({ bid, isFirst }) {
  const since = (() => {
    const diff = Math.floor((Date.now() - new Date(bid.created_at)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    return `${Math.floor(diff/3600)}h ago`;
  })();

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #f0faf2' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', background: isFirst ? G1 : '#e0e0e0', display:'flex', alignItems:'center', justifyContent:'center', color: isFirst ? '#fff' : '#555', fontWeight:700, fontSize:12, flexShrink:0 }}>
        {bid.bidder_initial}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#1a2e1d' }}>{bid.bidder_name}</div>
        <div style={{ fontSize:10, color:'#5a7a5e' }}>{formatPrice(bid.amount)}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:13, fontWeight:700, color: isFirst ? G1 : '#888' }}>{formatPrice(bid.amount)}</div>
        {isFirst && <div style={{ fontSize:9, background:'#fff3cd', color:'#856404', borderRadius:10, padding:'1px 6px', fontWeight:600 }}>Leading</div>}
        <div style={{ fontSize:10, color:'#5a7a5e' }}>{since}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AUCTION DETAIL PAGE
═══════════════════════════════════════════════════════ */
export default function AuctionDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { auction, loading, setAuction } = useAuction(id);

  const [bidAmount,  setBidAmount]  = useState('');
  const [bidding,    setBidding]    = useState(false);
  const [bids,       setBids]       = useState([]);
  const [toast,      setToast]      = useState(null);
  const [activeImg,  setActiveImg]  = useState(0);
  const [showZoom,   setShowZoom]   = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const bidInputRef  = useRef(null);

  // WS: receive live bids
  const handleWsBid = useCallback((data) => {
    setAuction(prev => prev ? {
      ...prev,
      current_price:  data.current_price,
      total_bids:     data.total_bids,
      
    } : prev);
    setBids(prev => [{
      id:           data.bid_id,
      bidder_name:  data.bidder,
      bidder_initial: data.bidder?.[0]?.toUpperCase() || '?',
      amount:       data.amount,
      is_winning:   true,
      created_at:   data.timestamp,
    }, ...prev.map((b, i) => i === 0 ? { ...b, is_winning: false } : b)]);
    setBidAmount('');
  }, [setAuction]);

 
    const handleAuctionEnd = useCallback((data) => {
  setAuction(prev => prev ? {
    ...prev,
    status: 'ended',
    winner_name: data.winner,
    winner_id: data.winner_id,
    current_price: data.final_price
  } : prev);

  setToast({ msg: '🏁 Auction Ended!', type: 'success' });
}, [setAuction]);

 const { connected } = useAuctionWS(id, handleWsBid, handleAuctionEnd);
  // Load initial bids
  useEffect(() => {
    if (id) auctionsAPI.bids(id).then(r => setBids(r.data)).catch(() => {});
  }, [id]);

  // Pre-fill bid amount with minimum
  useEffect(() => {
    if (auction) setBidAmount(String(Math.ceil(auction.min_next_bid)));
  }, [auction]);

  const handleChat = async () => {
    if (!user) { navigate('/signin'); return; }
    try {
      const { data } = await chatAPI.start(auction.seller_id || auction.seller);
      navigate('/chat', { state: { convId: data.id } });
    } catch { navigate('/chat'); }
  };

  const placeBid = async () => {
    if (!user) { navigate('/signin'); return; }
    const amount = Number(bidAmount);
    if (!amount || amount < auction.min_next_bid) {
      setToast({ msg: `Minimum bid: ${formatPrice(auction.min_next_bid)}`, type:'error' });
      return;
    }
    setBidding(true);
    try {
      const { data } = await auctionsAPI.placeBid(id, amount);
      setAuction(prev => ({ ...prev, current_price: data.current_price, total_bids: data.total_bids }));
      setBidAmount(String(Math.ceil(data.min_next_bid || amount + Number(auction.min_bid_increment))));
      setToast({ msg: `✅ Bid of ${formatPrice(amount)} placed!`, type:'success' });
      setShowMobile(false);
    } catch (err) { setToast({ msg: extractError(err), type:'error' }); }
    finally { setBidding(false); }
  };

  const quickBid = (add) => {
    const current = Number(bidAmount) || Number(auction?.min_next_bid) || 0;
    setBidAmount(String(Math.ceil(current + add)));
    bidInputRef.current?.focus();
  };

  if (loading) return <><Navbar /><div style={{ padding:40, display:'flex', justifyContent:'center' }}><Spinner /></div></>;
  if (!auction) return <><Navbar /><div style={{ padding:40, textAlign:'center', color:'#5a7a5e' }}>Auction not found.</div></>;

  const images       = auction.product_images || [];
  const isActive     = auction.status === 'active';
  const isSeller     = user?.username === auction.seller_name;
  const canBid       = user && !isSeller && isActive;
  const minNextBid   = auction.min_next_bid || (Number(auction.current_price) + Number(auction.min_bid_increment));

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#f8fdf9', minHeight:'100vh' }}>
      <Navbar />

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'20px 20px 80px' }}>

        {/* Breadcrumb */}
        <div style={{ display:'flex', gap:6, fontSize:12, color:'#5a7a5e', marginBottom:16, alignItems:'center' }}>
          <span style={{ cursor:'pointer', color:G1 }} onClick={() => navigate('/')}>Home</span>
          <span>›</span>
          <span style={{ cursor:'pointer', color:G1 }} onClick={() => navigate('/auctions')}>Auctions</span>
          <span>›</span>
          <span>{auction.product_title}</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px 320px', gap:20, alignItems:'start' }}>

          {/* ─── COL 1: Image + Info ─── */}
          <div>
            {/* Main image */}
            <div onClick={() => images.length > 0 && setShowZoom(true)}
              style={{ height:340, background:'#f0faf2', borderRadius:14, overflow:'hidden', marginBottom:10, border:'1px solid #d0ebd6', cursor: images.length > 0 ? 'zoom-in' : 'default', position:'relative' }}>
              {images[activeImg]
                ? <img src={images[activeImg]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:72 }}>🌾</div>}
              {/* Live badge */}
              {isActive && (
                <div style={{ position:'absolute', top:12, left:12, background:G1, color:'#fff', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#7dff8a', display:'inline-block', animation:'pulse 1s ease infinite' }} />
                  LIVE
                </div>
              )}
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                {images.slice(0,5).map((img, i) => (
                  <div key={i} onClick={() => setActiveImg(i)}
                    style={{ width:68, height:56, borderRadius:8, overflow:'hidden', cursor:'pointer', border:`2px solid ${i===activeImg ? G1 : '#d0ebd6'}` }}>
                    <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Product info */}
            <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:18 }}>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, marginBottom:14 }}>{auction.product_title}</h1>
              {[
                ['Base Price',     formatPrice(auction.base_price)],
                ['Min Increment',  formatPrice(auction.min_bid_increment) + '/bid'],
                ['Quantity',       `${auction.product_stock || '—'} kg`],
                ['Location',       `📍 ${auction.product_location}`],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                  <span style={{ color:'#5a7a5e' }}>{k}</span>
                  <span style={{ fontWeight:500 }}>{v}</span>
                </div>
              ))}

              {/* Seller info */}
              <div style={{ marginTop:14, padding:14, background:'#f8fdf9', borderRadius:12, border:'1px solid #d0ebd6' }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:8, color:'#1a2e1d' }}>Seller Information</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:G1, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>
                      {auction.seller_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{auction.seller_name}</div>
                      <div style={{ fontSize:10, color:G1, fontWeight:600 }}>Verified Seller ✓</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    {isActive && (
                      <span style={{ background:'#d8f3dc', color:G1, padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700 }}>Live</span>
                    )}
                  </div>
                </div>
                <button onClick={handleChat}
                  style={{ marginTop:10, width:'100%', padding:'9px 0', background:'#fff3e0', color:'#e65100', border:'1px solid #ffcc80', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  💬 Chat with Seller
                </button>
              </div>
            </div>
          </div>

          {/* ─── COL 2: Current bid + Timer ─── */}
          <div>
            <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:18, marginBottom:16 }}>
              {/* WS indicator */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, fontSize:11, color: connected ? G1 : '#856404' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background: connected ? G1 : '#d4a017' }} />
                {connected ? 'Live updates active' : 'Connecting…'}
              </div>

              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:'#5a7a5e', textAlign:'center', marginBottom:4 }}>Current Highest Bid</div>
                <div style={{ background: isActive ? G1 : '#888', borderRadius:12, padding:'14px 0', textAlign:'center' }}>
                  <div style={{ fontSize:30, fontWeight:800, color:'#fff', fontFamily:"'DM Sans',sans-serif" }}>
                    {formatPrice(auction.current_price)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'#5a7a5e', textAlign:'center', marginBottom:8 }}>Time Remaining</div>
                <Countdown endTime={auction.auction_end} large />
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                <span style={{ color:'#5a7a5e' }}>Number of Bidders</span>
                <span style={{ fontWeight:700, color:G1 }}>{auction.total_bids}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'#5a7a5e' }}>Min. Next Bid</span>
                <span style={{ fontWeight:700, color:'#e65100' }}>{formatPrice(minNextBid)}</span>
              </div>
            </div>

            {/* Bid history */}
            <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:18 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                Bid History
                <span style={{ fontSize:11, color:'#5a7a5e' }}>{bids.length} bids</span>
              </div>
              <div style={{ maxHeight:280, overflowY:'auto' }}>
                {bids.length === 0
                  ? <div style={{ textAlign:'center', color:'#5a7a5e', fontSize:12, padding:20 }}>No bids yet. Be the first!</div>
                  : bids.map((b, i) => <BidRow key={b.id || i} bid={b} isFirst={i === 0} />)}
              </div>
            </div>
          </div>

          {/* ─── COL 3: Bid panel ─── */}
          <div>
            <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:18, position:'sticky', top:84 }}>
              {isSeller ? (
                <div style={{ textAlign:'center', padding:20 }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
                  <div style={{ fontWeight:600, marginBottom:4 }}>Your Auction</div>
                  <div style={{ fontSize:12, color:'#5a7a5e', marginBottom:16 }}>Current: {formatPrice(auction.current_price)}</div>
                  {isActive && auction.total_bids === 0 && (
                    <button onClick={() => auctionsAPI.endNow(id).then(() => { setToast({ msg:'Auction ended.', type:'success' }); setAuction(a => ({ ...a, status:'ended' })); }).catch(e => setToast({ msg: extractError(e), type:'error' }))}
                      style={{ width:'100%', padding:10, background:'#fee2e2', color:'#991b1b', border:'none', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                      End Auction Early
                    </button>
                  )}
                </div>
              ) : !user ? (
                <div style={{ textAlign:'center', padding:20 }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🔐</div>
                  <div style={{ fontWeight:600, marginBottom:12 }}>Sign in to bid</div>
                  <button onClick={() => navigate('/signin')}
                    style={{ width:'100%', padding:11, background:G1, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                    Sign In
                  </button>
                </div>
              ) : !isActive ? (
                <div style={{ textAlign:'center', padding:20 }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🏁</div>
                  <div style={{ fontWeight:600, color:'#721c24', marginBottom:8 }}>Auction Ended</div>
                  {auction.winner_name && (
                    <div style={{ fontSize:12, color:'#5a7a5e' }}>Winner: <strong>{auction.winner_name}</strong> — {formatPrice(auction.current_price)}</div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Place Your Bid</div>

                  <div style={{ marginBottom:12 }}>
                    <input ref={bidInputRef}
                      type="number" value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      placeholder={`Min: ${formatPrice(minNextBid)}`}
                      style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #d0ebd6', borderRadius:10, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', fontWeight:600, boxSizing:'border-box' }}
                    />
                    <div style={{ fontSize:10, color:'#5a7a5e', marginTop:4 }}>
                      Min bid: {formatPrice(minNextBid)} · Increment: {formatPrice(auction.min_bid_increment)}
                    </div>
                  </div>

                  {/* Quick bid buttons */}
                  <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                    {[5, 25, 100, 500].map(add => (
                      <button key={add} onClick={() => quickBid(add)}
                        style={{ flex:1, padding:'8px 0', border:'1.5px solid #d0ebd6', borderRadius:8, background:'#f8fdf9', color:G1, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                        +{add}
                      </button>
                    ))}
                  </div>

                  <button onClick={placeBid} disabled={bidding}
                    style={{ width:'100%', padding:13, background: bidding ? '#ccc' : G1, color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor: bidding ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:10 }}>
                    {bidding ? '⏳ Placing Bid…' : '🔨 Place Bid'}
                  </button>

                  <div style={{ fontSize:10, color:'#5a7a5e', textAlign:'center', lineHeight:1.5 }}>
                    Minimum bid: {formatPrice(minNextBid)} and quick increment will be ones for minimum bid rules.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Similar Auctions */}
        <SimilarAuctions currentId={id} category={auction.product_category} />
      </div>

      {/* Mobile sticky bid bar */}
      {canBid && (
        <div style={{ position:'fixed', bottom:64, left:0, right:0, background:'#fff', borderTop:'1px solid #d0ebd6', padding:'10px 16px', display:'flex', gap:10, alignItems:'center', zIndex:150 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'#5a7a5e' }}>Current Bid</div>
            <div style={{ fontSize:16, fontWeight:700, color:G1 }}>{formatPrice(auction.current_price)}</div>
          </div>
          <Countdown endTime={auction.auction_end} />
          <button onClick={() => setShowMobile(true)}
            style={{ padding:'10px 20px', background:G1, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Bid Now
          </button>
        </div>
      )}

      {/* Mobile bid sheet */}
      {showMobile && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:400, display:'flex', alignItems:'flex-end' }}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:24, width:'100%' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>Bidding Bid</div>
              <button onClick={() => setShowMobile(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888' }}>✕</button>
            </div>
            <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
              placeholder={`Min: ${formatPrice(minNextBid)}`}
              style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #d0ebd6', borderRadius:10, fontSize:15, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box', marginBottom:12, fontWeight:600 }}
            />
            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
              <button onClick={() => quickBid(5)}  style={{ flex:1, padding:'10px 0', border:'1.5px solid #d0ebd6', borderRadius:8, background:'#f8fdf9', color:G1, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>+Rs5</button>
              <button onClick={() => quickBid(25)} style={{ flex:1, padding:'10px 0', border:'1.5px solid #d0ebd6', borderRadius:8, background:'#f8fdf9', color:G1, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>+Rs25</button>
            </div>
            <button onClick={placeBid} disabled={bidding}
              style={{ width:'100%', padding:14, background:G1, color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {bidding ? 'Placing Bid…' : '🔨 Place Bid'}
            </button>
          </div>
        </div>
      )}

      {showZoom && images.length > 0 && (
        <ImageZoomModal images={images.map(i => ({ image: i }))} activeIndex={activeImg} onClose={() => setShowZoom(false)} />
      )}

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ── Similar Auctions strip ──────────────────────────── */
function SimilarAuctions({ currentId, category }) {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!category) return;
    auctionsAPI.list({ 'product__category': category, status:'active' })
      .then(r => setItems((r.data.results || r.data).filter(a => String(a.id) !== String(currentId)).slice(0,4)))
      .catch(() => {});
  }, [category, currentId]);

  if (!items.length) return null;

  return (
    <div style={{ marginTop:40 }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, marginBottom:16 }}>Similar Auctions</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {items.map(a => (
          <div key={a.id} onClick={() => navigate(`/auctions/${a.id}`)}
            style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:12, overflow:'hidden', cursor:'pointer' }}>
            <div style={{ height:100, background:'#f0faf2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>
              {a.product_image ? <img src={a.product_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '🌾'}
            </div>
            <div style={{ padding:10 }}>
              <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{a.product_title}</div>
              <div style={{ fontSize:13, fontWeight:700, color:G1 }}>{formatPrice(a.current_price)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
