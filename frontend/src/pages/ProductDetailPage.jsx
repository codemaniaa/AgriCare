import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProduct } from '../hooks';
import { productsAPI, chatAPI, ordersAPI, wishlistAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatPrice, extractError } from '../utils';
import Navbar from '../components/layout/Navbar';
import { Toast } from '../components/common';
import {
  ProductDetailSkeleton,
  OrderConfirmModal,
  ImageZoomModal,
} from '../components/common/Skeletons';
import { BottomNav } from '../components/layout/SubNavbar';

import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMapPin,
  FiUser,
  FiEye,
  FiCalendar,
  FiPackage,
  FiTag,
  FiShoppingCart,
  FiMessageCircle,
  FiStar,
  FiZoomIn,
  FiChevronRight as FiCrumb,
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

/* ───────────────── Design tokens ───────────────── */
const T = {
  green:    '#16734a',
  greenDk:  '#0f5236',
  greenLt:  '#e9f6ee',
  ink:      '#0d1f17',
  ink2:     '#3b4a40',
  muted:    '#6b7d72',
  line:     '#e3ece5',
  bg:       '#f6faf7',
  white:    '#ffffff',
  amber:    '#e0a800',
  red:      '#e53935',
  shadow:   '0 6px 24px rgba(16, 64, 38, 0.08)',
  shadowLg: '0 18px 48px rgba(16, 64, 38, 0.14)',
  fontUI:   "'Sora', 'Inter', system-ui, sans-serif",
  fontBody: "'Inter', system-ui, sans-serif",
  fontHead: "'Clash Display', 'Inter', system-ui, sans-serif",
};

const STATUS_BADGE = {
  available: { bg: '#dff5e6', color: '#0f5236', dot: '#16a34a', label: 'Available' },
  sold:      { bg: '#fde2e2', color: '#8a1c1c', dot: '#e53935', label: 'Sold Out' },
  auction:   { bg: '#fff3cd', color: '#8a6100', dot: '#e0a800', label: 'Auction' },
};

/* ───────────────── Inject fonts + global styles once ───────────────── */
function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById('pdp-fonts')) return;
    const link1 = document.createElement('link');
    link1.id = 'pdp-fonts';
    link1.rel = 'stylesheet';
    link1.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap';
    document.head.appendChild(link1);

    const link2 = document.createElement('link');
    link2.rel = 'stylesheet';
    link2.href = 'https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&display=swap';
    document.head.appendChild(link2);

    const style = document.createElement('style');
    style.innerHTML = `
      .pdp-btn { position:relative; display:inline-flex; align-items:center; justify-content:center;
        gap:8px; border:none; cursor:pointer; font-family:${T.fontUI}; font-weight:600;
        letter-spacing:0.01em; transition:transform .18s ease, box-shadow .18s ease, background .18s ease, opacity .18s;
        will-change: transform; }
      .pdp-btn:focus-visible { outline:3px solid ${T.green}33; outline-offset:2px; }
      .pdp-btn:disabled { opacity:.6; cursor:not-allowed; }
      .pdp-btn-primary { color:#fff; background:linear-gradient(135deg, ${T.green}, ${T.greenDk});
        box-shadow:0 8px 20px rgba(22,115,74,.28); padding:14px 22px; border-radius:14px; font-size:14px; }
      .pdp-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 14px 28px rgba(22,115,74,.34); }
      .pdp-btn-primary:active:not(:disabled) { transform:translateY(0); }
      .pdp-btn-secondary { color:${T.green}; background:${T.white}; border:1.5px solid ${T.line};
        padding:13px 22px; border-radius:14px; font-size:14px; }
      .pdp-btn-secondary:hover:not(:disabled) { transform:translateY(-2px); border-color:${T.green};
        box-shadow:0 10px 22px rgba(22,115,74,.12); }
      .pdp-btn-ghost { background:transparent; color:${T.ink2}; padding:8px 12px; border-radius:10px; font-size:13px; }
      .pdp-btn-ghost:hover { background:${T.greenLt}; color:${T.green}; }

      .pdp-icon-btn { width:42px; height:42px; border-radius:50%; display:inline-flex;
        align-items:center; justify-content:center; background:${T.white}; border:1px solid ${T.line};
        cursor:pointer; transition:all .2s ease; box-shadow:${T.shadow}; }
      .pdp-icon-btn:hover { transform:scale(1.06); border-color:${T.green}; color:${T.green}; }

      .pdp-slide { transition: transform .45s cubic-bezier(.22,.61,.36,1), opacity .45s ease; }
      .pdp-thumb { transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
      .pdp-thumb:hover { transform:translateY(-2px); }

      .pdp-grid { display:grid; grid-template-columns: 1.05fr .95fr; gap:36px; }
      @media (max-width: 900px){ .pdp-grid { grid-template-columns: 1fr; gap:24px; } }

      .pdp-stat { display:flex; align-items:center; gap:10px; padding:12px 14px;
        background:${T.white}; border:1px solid ${T.line}; border-radius:12px;
        transition:transform .2s ease, border-color .2s ease; }
      .pdp-stat:hover { transform:translateY(-2px); border-color:${T.green}55; }

      .pdp-fade-in { animation: pdpFade .35s ease both; }
      @keyframes pdpFade { from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:translateY(0);} }

      .pdp-star { background:none; border:none; cursor:pointer; padding:4px;
        transition: transform .15s ease, color .15s ease; display:inline-flex; }
      .pdp-star:hover { transform:scale(1.15); }

      .pdp-link { color:${T.green}; text-decoration:none; font-weight:600;
        border-bottom:1px solid transparent; transition:border-color .2s; }
      .pdp-link:hover { border-bottom-color:${T.green}; }
    `;
    document.head.appendChild(style);
  }, []);
}

/* ───────────────── Image slider ───────────────── */
function ImageSlider({ images, active, setActive, onZoom, title }) {
  const has = images.length > 0;
  const next = useCallback(() => setActive((i) => (i + 1) % Math.max(images.length, 1)), [images.length, setActive]);
  const prev = useCallback(() => setActive((i) => (i - 1 + images.length) % Math.max(images.length, 1)), [images.length, setActive]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  return (
    <div>
      <div style={{
        position:'relative', height:460, background:'#eef7f1',
        borderRadius:20, overflow:'hidden', border:`1px solid ${T.line}`,
        boxShadow: T.shadow,
      }}>
        {/* Slides track */}
        <div
          className="pdp-slide"
          style={{
            display:'flex', height:'100%', width:`${Math.max(images.length,1)*100}%`,
            transform:`translateX(-${active * (100 / Math.max(images.length,1))}%)`,
          }}
        >
          {has ? images.map((img, i) => (
            <div key={i} onClick={() => onZoom()} style={{
              width:`${100/images.length}%`, height:'100%', cursor:'zoom-in',
              display:'flex', alignItems:'center', justifyContent:'center', background:'#eef7f1',
            }}>
              <img src={img.image} alt={`${title} ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
          )) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color: T.green }}>
              <HiOutlineSparkles size={72} />
            </div>
          )}
        </div>

        {/* Arrows */}
        {images.length > 1 && (
          <>
            <button aria-label="Previous image" onClick={prev}
              className="pdp-icon-btn"
              style={{ position:'absolute', top:'50%', left:14, transform:'translateY(-50%)' }}>
              <FiChevronLeft size={20} />
            </button>
            <button aria-label="Next image" onClick={next}
              className="pdp-icon-btn"
              style={{ position:'absolute', top:'50%', right:14, transform:'translateY(-50%)' }}>
              <FiChevronRight size={20} />
            </button>
          </>
        )}

        {/* Counter / zoom hint */}
        {has && (
          <div style={{
            position:'absolute', bottom:14, right:14, display:'flex', gap:8, alignItems:'center',
            background:'rgba(13,31,23,.72)', color:'#fff', borderRadius:999,
            padding:'6px 12px', fontSize:12, fontFamily:T.fontUI, fontWeight:500,
            backdropFilter:'blur(6px)',
          }}>
            <FiZoomIn size={13} />
            <span>{active + 1} / {images.length}</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display:'flex', gap:10, marginTop:14, overflowX:'auto', paddingBottom:4 }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)} className="pdp-thumb"
              style={{
                width:78, height:64, borderRadius:10, overflow:'hidden', flexShrink:0,
                border:`2px solid ${i === active ? T.green : T.line}`,
                background:'#fff', padding:0, cursor:'pointer',
                boxShadow: i === active ? '0 4px 12px rgba(22,115,74,.25)' : 'none',
              }}>
              <img src={img.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────── Page ───────────────── */
export default function ProductDetailPage() {
  useGlobalStyles();

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { product, loading } = useProduct(id);

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [toast, setToast] = useState(null);
  const [ordering, setOrdering] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  if (loading) return (<><Navbar /><ProductDetailSkeleton /></>);

  if (!product) return (
    <>
      <Navbar />
      <div style={{ padding:80, textAlign:'center', fontFamily:T.fontBody }}>
        <HiOutlineSparkles size={56} color={T.green} />
        <div style={{ fontSize:18, fontWeight:600, color:T.ink, marginTop:12, fontFamily:T.fontHead }}>
          Product not found
        </div>
        <button className="pdp-btn pdp-btn-primary" onClick={() => navigate('/')} style={{ marginTop:20 }}>
          Back to marketplace
        </button>
      </div>
    </>
  );

  const images = product.images || [];
  const badge = STATUS_BADGE[product.status] || STATUS_BADGE.available;

  const handleBuyNow = () => {
    if (!user) return navigate('/signin');
    navigate('/place-order', { state: { productId: product.id, product, quantity: qty } });
  };

  const handleConfirmOrder = async () => {
    setOrdering(true);
    try {
      await ordersAPI.create({ product: Number(id), quantity: qty });
      setShowConfirm(false);
      setToast({ msg: 'Order placed successfully! 🎉', type: 'success' });
      setTimeout(() => navigate('/orders'), 1800);
    } catch (err) {
      setShowConfirm(false);
      setToast({ msg: extractError(err), type: 'error' });
    } finally { setOrdering(false); }
  };

  const handleChat = async () => {
    if (!user) return navigate('/signin');
    try {
      const { data } = await chatAPI.start(product.seller_id);
      navigate('/chat', { state: { convId: data.id } });
    } catch { navigate('/chat'); }
  };

  const handleWishlist = async () => {
    if (!user) return navigate('/signin');
    try {
      const { data } = await wishlistAPI.toggle(id);
      setWishlisted(data.wishlisted);
      setToast({ msg: data.wishlisted ? 'Added to wishlist' : 'Removed from wishlist', type: 'success' });
    } catch { setToast({ msg: 'Failed to update wishlist.', type: 'error' }); }
  };

  const handleRate = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/signin');
    if (product.seller_name === user.username) {
      return setToast({ msg: "You can't rate your own product.", type: 'error' });
    }
    setRatingLoading(true);
    try {
      await productsAPI.rate(id, { rating, review });
      setToast({ msg: 'Review submitted!', type: 'success' });
      setReview('');
    } catch (err) { setToast({ msg: extractError(err), type: 'error' }); }
    finally { setRatingLoading(false); }
  };

  const stats = [
    { icon: <FiUser size={15} />, label: 'Seller', value: product?.seller_name
        ? <Link to={`/profile/${product.seller_name}`} className="pdp-link">{product.seller_name}</Link>
        : 'Unknown' },
    { icon: <FiMapPin size={15} />,   label: 'Location', value: product.location },
    { icon: <FiPackage size={15} />,  label: 'Stock',    value: `${product.stock_qty} kg` },
    { icon: <FiTag size={15} />,      label: 'Type',     value: (product.product_type || '').replace('_',' ') },
    { icon: <FiEye size={15} />,      label: 'Views',    value: `${product.views_count}` },
    { icon: <FiCalendar size={15} />, label: 'Listed',   value: new Date(product.created_at).toLocaleDateString() },
  ];

  return (
    <div style={{ fontFamily: T.fontBody, background: T.bg, minHeight: '100vh', color: T.ink }}>
      <Navbar />

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 22px 100px' }} className="pdp-fade-in">

        {/* Breadcrumb */}
        <nav style={{ display:'flex', gap:8, alignItems:'center', fontSize:13, color:T.muted,
          marginBottom:22, fontFamily:T.fontUI, fontWeight:500 }}>
          <span className="pdp-link" style={{cursor:'pointer'}} onClick={() => navigate('/')}>Home</span>
          <FiCrumb size={13} />
          <span className="pdp-link" style={{cursor:'pointer', textTransform:'capitalize'}}
            onClick={() => navigate(`/?category=${product.category}`)}>{product.category}</span>
          <FiCrumb size={13} />
          <span style={{ color: T.ink, fontWeight:600 }}>{product.title}</span>
        </nav>

        {/* Top: gallery + info */}
        <div className="pdp-grid">

          {/* Gallery */}
          <ImageSlider
            images={images}
            active={activeImg}
            setActive={setActiveImg}
            onZoom={() => setShowZoom(true)}
            title={product.title}
          />

          {/* Info card */}
          <div style={{
            background: T.white, borderRadius: 20, border: `1px solid ${T.line}`,
            padding: 28, boxShadow: T.shadow, alignSelf:'start',
          }}>
            {/* Status row */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px',
                borderRadius:999, fontSize:12, fontWeight:600, fontFamily:T.fontUI,
                background: badge.bg, color: badge.color,
              }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background: badge.dot }} />
                {badge.label}
              </span>
              <span style={{ fontSize:12, color: T.muted, textTransform:'capitalize', fontFamily:T.fontUI }}>
                {product.category} · {product.subcategory}
              </span>
              <button onClick={handleWishlist}
                className="pdp-icon-btn"
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                style={{
                  marginLeft:'auto', width:40, height:40,
                  color: wishlisted ? T.red : T.muted,
                  borderColor: wishlisted ? T.red : T.line,
                }}>
                <FiHeart size={18} fill={wishlisted ? T.red : 'none'} />
              </button>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: T.fontHead, fontSize: 32, fontWeight: 600,
              color: T.ink, lineHeight: 1.2, margin:'0 0 14px',
            }}>{product.title}</h1>

            {/* Price + rating */}
            <div style={{ display:'flex', alignItems:'baseline', gap:18, marginBottom:24, flexWrap:'wrap' }}>
              <div style={{ fontFamily:T.fontUI }}>
                <span style={{ fontSize:34, fontWeight:700, color: T.green, letterSpacing:'-0.02em' }}>
                  {formatPrice(product.price)}
                </span>
                <span style={{ fontSize:14, fontWeight:500, color: T.muted, marginLeft:4 }}>/kg</span>
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, color: T.amber, fontFamily:T.fontUI, fontWeight:600 }}>
                <FiStar size={15} fill={T.amber} />
                <span>{Number(product.rating).toFixed(1)}</span>
                <span style={{ color: T.muted, fontWeight:500 }}>({product.rating_count})</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
              {stats.map((s) => (
                <div key={s.label} className="pdp-stat">
                  <span style={{ color: T.green, display:'inline-flex' }}>{s.icon}</span>
                  <div style={{ display:'flex', flexDirection:'column', minWidth:0 }}>
                    <span style={{ fontSize:11, color: T.muted, fontFamily:T.fontUI, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</span>
                    <span style={{ fontSize:13, color: T.ink, fontWeight:600, fontFamily:T.fontUI,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textTransform:'capitalize' }}>
                      {s.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quantity */}
            {product.status === 'available' && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.muted, marginBottom:10,
                  fontFamily:T.fontUI, textTransform:'uppercase', letterSpacing:'0.08em' }}>Quantity (kg)</div>
                <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${T.line}`,
                    borderRadius:12, overflow:'hidden', background:T.white }}>
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                      style={{ width:42, height:44, border:'none', background:'#f3faf5',
                        cursor:'pointer', fontSize:20, color:T.green, fontWeight:700, transition:'background .15s' }}
                      onMouseEnter={(e)=>e.currentTarget.style.background=T.greenLt}
                      onMouseLeave={(e)=>e.currentTarget.style.background='#f3faf5'}
                    >−</button>
                    <span style={{ width:54, textAlign:'center', fontFamily:T.fontUI, fontWeight:600, fontSize:16 }}>{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(product.stock_qty, q + 1))}
                      style={{ width:42, height:44, border:'none', background:'#f3faf5',
                        cursor:'pointer', fontSize:20, color:T.green, fontWeight:700, transition:'background .15s' }}
                      onMouseEnter={(e)=>e.currentTarget.style.background=T.greenLt}
                      onMouseLeave={(e)=>e.currentTarget.style.background='#f3faf5'}
                    >+</button>
                  </div>
                  <div style={{ fontSize:13, color: T.muted, fontFamily:T.fontUI }}>
                    Total: <strong style={{ color: T.green, fontSize:17, marginLeft:4 }}>
                      {formatPrice(product.price * qty)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', gap:12 }}>
              {product.status === 'available' ? (
                <button className="pdp-btn pdp-btn-primary" onClick={handleBuyNow} style={{ flex:1 }}>
                  <FiShoppingCart size={17} /> Buy Now
                </button>
              ) : (
                <div style={{
                  flex:1, padding:'14px 0', background:'#f1f3f2', color: T.muted,
                  borderRadius:14, fontSize:14, fontWeight:600, textAlign:'center',
                  fontFamily:T.fontUI, userSelect:'none',
                }}>
                  {product.status === 'sold' ? 'Sold Out' : 'Auction Only'}
                </div>
              )}
              <button className="pdp-btn pdp-btn-secondary" onClick={handleChat} style={{ flex:1 }}>
                <FiMessageCircle size={17} /> Chat Seller
              </button>
            </div>
          </div>
        </div>

        {/* ── Description (now below images section) ── */}
        <section style={{
          marginTop: 40, background: T.white, border: `1px solid ${T.line}`,
          borderRadius: 20, padding: 32, boxShadow: T.shadow,
        }}>
          <h2 style={{ fontFamily:T.fontHead, fontSize:22, fontWeight:600, color:T.ink, margin:'0 0 14px' }}>
            About this product
          </h2>
          <p style={{ fontSize:15, color: T.ink2, lineHeight:1.8, margin:0, fontFamily:T.fontBody, whiteSpace:'pre-line' }}>
            {product.description}
          </p>
        </section>

        {/* ── Reviews ── */}
        <section style={{ marginTop: 40 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:20 }}>
            <h2 style={{ fontFamily:T.fontHead, fontSize:22, fontWeight:600, color:T.ink, margin:0 }}>Reviews</h2>
            <span style={{ fontSize:13, color: T.muted, fontFamily:T.fontUI }}>{product.rating_count} total</span>
          </div>

          {user && user.username !== product.seller_name && (
            <div style={{
              background: T.white, border:`1px solid ${T.line}`, borderRadius:18,
              padding:24, marginBottom:24, boxShadow: T.shadow,
            }}>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:14, fontFamily:T.fontUI, color:T.ink }}>
                Leave a review
              </div>
              <form onSubmit={handleRate}>
                <div style={{ display:'flex', alignItems:'center', gap:2, marginBottom:14 }}>
                  {[1,2,3,4,5].map((n) => {
                    const filled = n <= (hoverRating || rating);
                    return (
                      <button key={n} type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="pdp-star"
                        style={{ color: filled ? T.amber : '#d8e2dc' }}>
                        <FiStar size={28} fill={filled ? T.amber : 'none'} />
                      </button>
                    );
                  })}
                  <span style={{ marginLeft:10, fontSize:13, color: T.muted, fontFamily:T.fontUI }}>
                    {['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'][hoverRating || rating]}
                  </span>
                </div>
                <textarea value={review} onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience with this product…"
                  rows={3}
                  onFocus={(e)=>e.target.style.borderColor=T.green}
                  onBlur={(e)=>e.target.style.borderColor=T.line}
                  style={{
                    width:'100%', padding:'12px 16px', border:`1.5px solid ${T.line}`,
                    borderRadius:12, fontSize:14, fontFamily:T.fontBody, outline:'none',
                    resize:'vertical', marginBottom:14, boxSizing:'border-box',
                    transition:'border-color .15s',
                  }} />
                <button type="submit" disabled={ratingLoading} className="pdp-btn pdp-btn-primary">
                  {ratingLoading ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {product.ratings && product.ratings.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {product.ratings.map((r) => (
                <div key={r.id} style={{
                  background: T.white, border: `1px solid ${T.line}`, borderRadius:14, padding:20,
                  transition:'transform .2s, box-shadow .2s',
                }}
                onMouseEnter={(e)=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=T.shadow; }}
                onMouseLeave={(e)=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:36, height:36, borderRadius:'50%', background: T.greenLt, color: T.green,
                        display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:700,
                        fontFamily: T.fontUI, fontSize:14,
                      }}>{(r.user_name || '?').charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14, fontFamily:T.fontUI, color:T.ink }}>{r.user_name}</div>
                        <div style={{ display:'inline-flex', gap:1, color: T.amber }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FiStar key={i} size={13} fill={i < r.rating ? T.amber : 'none'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize:12, color: T.muted, fontFamily:T.fontUI }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.review && (
                    <p style={{ fontSize:14, color: T.ink2, lineHeight:1.7, margin:'8px 0 0', fontFamily:T.fontBody }}>
                      {r.review}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: T.white, border:`1px dashed ${T.line}`, borderRadius:14,
              padding:48, textAlign:'center', color: T.muted, fontSize:14, fontFamily: T.fontUI,
            }}>
              <FiStar size={32} style={{ marginBottom:8, color: T.amber }} />
              <div>No reviews yet. Be the first to review this product!</div>
            </div>
          )}
        </section>
      </div>

      {showConfirm && (
        <OrderConfirmModal product={product} quantity={qty}
          onConfirm={handleConfirmOrder} onCancel={() => setShowConfirm(false)} loading={ordering} />
      )}
      {showZoom && images.length > 0 && (
        <ImageZoomModal images={images} activeIndex={activeImg} onClose={() => setShowZoom(false)} />
      )}

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
