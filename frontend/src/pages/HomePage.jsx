import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks';
import { productsAPI, chatAPI, auctionsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils';
import { Link } from 'react-router-dom';
import { createHeroScene } from './landing/ThreeScene';
import Navbar from '../components/layout/Navbar';
import { SubNavbar, BottomNav } from '../components/layout/SubNavbar';
import { ProductCard, Sidebar, Spinner, Pagination, Toast } from '../components/common';
import { ProductGridSkeleton } from '../components/common/Skeletons';
import IntroAnimation from './landing/IntroAnimation';

/* ────────────────────────────────────────────────────────────────
   Hooks & helpers (UI-only)
   ──────────────────────────────────────────────────────────────── */

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: '0px 0px -60px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = '', y = 24 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`will-change-transform transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0,0,0)' : `translate3d(0,${y}px,0)`,
      }}
    >
      {children}
    </div>
  );
}

function Counter({ to, suffix = '' }) {
  const [ref, visible] = useReveal(0.5);
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (!visible || ran.current) return;
    ran.current = true;
    const end = to;
    let curr = 0;
    const step = Math.ceil(end / 50);
    const id = setInterval(() => {
      curr = Math.min(curr + step, end);
      setVal(curr);
      if (curr >= end) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [visible, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function AuctionTimer({ seconds: initSecs }) {
  const [secs, setSecs] = useState(initSecs);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  const urgent = secs < 3600;
  return (
    <span className={`font-mono text-xs font-semibold ${urgent ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
      ⏱ {h}:{m}:{s}
    </span>
  );
}

/* Scroll progress bar — premium top indicator */
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      setP(height > 0 ? (scrolled / height) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[80] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-lime-400 shadow-[0_0_18px_rgba(61,220,108,0.7)] transition-[width] duration-150 ease-out"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const heroCanvasRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const scene = createHeroScene(canvas);
    return () => scene.dispose();
  }, []);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('-created_at');
  const [page, setPage] = useState(1);

  const [featured, setFeatured] = useState([]);
  const [featIdx, setFeatIdx] = useState(0);

  const [activeAuctions, setActiveAuctions] = useState([]);
  const [auctIdx, setAuctIdx] = useState(0);

  const [toast, setToast] = useState(null);

  const search = searchParams.get('search') || '';

  const params = {
    category: filters.category || category,
    ...(search && { search }),
    ...(filters.status && { status: filters.status }),
    ...(filters.product_type && { product_type: filters.product_type }),
    ...(filters.maxPrice && { max_price: filters.maxPrice }),
    ordering: sortBy,
    page,
  };

  const { products, count, loading } = useProducts(params);

  useEffect(() => {
    productsAPI.featured().then(({ data }) => setFeatured(data)).catch(() => {});
    auctionsAPI.active().then(({ data }) => setActiveAuctions(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!featured.length) return;
    const t = setInterval(() => {
      setFeatIdx((i) => (i + 1) % Math.ceil(featured.length / 2));
    }, 3500);
    return () => clearInterval(t);
  }, [featured.length]);

  const handleChat = async (product) => {
    if (!user) { navigate('/signin'); return; }
    try {
      const { data } = await chatAPI.start({
        user_id: product.user.id,
        product_id: product.id,
      });
      navigate('/chat', { state: { convId: data.id } });
    } catch (e) {
      console.log(e);
    }
  };

  const SORTS = [
    { label: 'Price Low→High', value: 'price' },
    { label: 'Newest', value: '-created_at' },
    { label: 'Popularity', value: '-views_count' },
  ];

  const totalPages = Math.ceil(count / 12);
  const [introDone, setIntroDone] = useState(false);

  return (
    <div className="min-h-screen font-sans text-[#0a1f0d] bg-[#f5faf6] selection:bg-emerald-300/40 selection:text-emerald-950">
      {/* Premium scroll progress */}
      <ScrollProgress />

      {/* Subtle ambient page texture */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.55]"
        style={{
          background:
            'radial-gradient(1200px 600px at 80% -10%, rgba(61,220,108,0.10), transparent 60%),' +
            'radial-gradient(900px 500px at -10% 30%, rgba(168,240,89,0.08), transparent 60%),' +
            'radial-gradient(700px 500px at 50% 110%, rgba(23,56,42,0.08), transparent 60%)',
        }}
      />

      <Navbar />
      <SubNavbar
        activeCategory={category}
        onCategoryChange={(c) => { setCategory(c); setPage(1); }}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 pb-24 flex flex-col lg:flex-row gap-6">
        <div className="flex-1">

          {/* ───────── HERO ───────── */}
          <section
            id="hero"
            className="relative isolate overflow-hidden rounded-[28px] mt-4
                       bg-gradient-to-br from-[#06140a] via-[#0a1f0d] to-[#0d2a16]
                       text-[#e8f5ec] shadow-[0_30px_80px_-30px_rgba(6,40,18,0.55)]
                       ring-1 ring-white/[0.06]"
          >
            {/* Glow layers */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_80%_at_70%_30%,rgba(61,220,108,0.18)_0%,transparent_60%)]" />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_40%_60%_at_15%_85%,rgba(168,240,89,0.10)_0%,transparent_55%)]" />
            <div
              className="absolute inset-0 pointer-events-none opacity-100"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(61,220,108,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(61,220,108,0.05) 1px,transparent 1px)',
                backgroundSize: '54px 54px',
                maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 70%)',
              }}
            />
            {/* Animated aurora blob */}
            <div
              aria-hidden
              className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-40"
              style={{ background: 'conic-gradient(from 90deg, #3ddc6c, #a8f059, #17382a, #3ddc6c)', animation: 'spin 24s linear infinite' }}
            />

            <div className="relative grid md:grid-cols-2 items-center gap-10 px-6 md:px-14 lg:px-20 py-16 md:py-24">
              {/* Left */}
              <div className="relative z-10">
                 

                <h1 className="font-display text-[clamp(2.6rem,5.8vw,5.4rem)] font-bold leading-[1.04] tracking-tight mb-5 animate-[revealUp_0.8s_ease_0.35s_both]">
                  Pakistan's Best Agriculture<br />
                  {' '}
                  <span className="bg-gradient-to-r from-emerald-200 via-emerald-300 to-lime-300 bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                   MarketPlace
                  </span>
                </h1>

                <p className="text-[#9bc4a9] text-[clamp(0.95rem,2vw,1.15rem)] leading-[1.75] max-w-[480px] mb-9 animate-[revealUp_0.8s_ease_0.5s_both]">
                  Buy and sell crops, tools, and livestock with ease. Connect directly with verified farmers across all four provinces.
                </p>

                <div className="flex items-center gap-3.5 flex-wrap mb-9 animate-[revealUp_0.8s_ease_0.65s_both]">
                  <Link
                    to="/signup"
                    className="group bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 text-[#06140a] px-8 py-3.5 rounded-2xl text-[0.95rem] font-bold flex items-center gap-2 shadow-[0_10px_36px_-8px_rgba(61,220,108,0.55)] hover:-translate-y-0.5 hover:shadow-[0_18px_48px_-10px_rgba(61,220,108,0.7)] transition-all duration-300 no-underline"
                  >
                    Get Started Free
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </Link>
                  <Link
                    to="/allproducts"
                    className="bg-white/[0.06] border border-white/10 text-[#e8f5ec] px-8 py-3.5 rounded-2xl text-[0.95rem] font-medium flex items-center gap-2 backdrop-blur-md hover:border-emerald-400/35 hover:bg-white/[0.10] transition-all duration-300 no-underline"
                  >
                    <span>▶</span> Explore Products
                  </Link>
                </div>

                {/* Trust */}
                <div className="flex items-center gap-3.5 animate-[revealUp_0.8s_ease_0.8s_both]">
                  <div className="flex">
                    {[
                      { letter: 'A', from: '#16a34a', to: '#15803d' },
                      { letter: 'S', from: '#0284c7', to: '#0369a1' },
                      { letter: 'B', from: '#d97706', to: '#b45309' },
                      { letter: 'N', from: '#7c3aed', to: '#6d28d9' },
                    ].map((av, i) => (
                      <div
                        key={i}
                        className={`w-9 h-9 rounded-full border-2 border-[#06140a] flex items-center justify-center text-[12px] font-bold text-white ring-1 ring-white/10 ${i > 0 ? '-ml-2.5' : ''}`}
                        style={{ background: `linear-gradient(135deg, ${av.from}, ${av.to})` }}
                      >
                        {av.letter}
                      </div>
                    ))}
                  </div>
                  <p className="text-[0.8rem] text-[#9bc4a9]">
                    Trusted by{' '}
                    <strong className="text-emerald-300">
                      <Counter to={50000} suffix="+" />
                    </strong>{' '}
                    farmers across Pakistan
                  </p>
                </div>
              </div>

              {/* Right — Three.js */}
              <div className="relative z-10 flex items-center justify-center h-[320px] md:h-[520px] lg:h-[560px] animate-[revealRight_1s_ease_0.4s_both]">
                <div className="absolute inset-[-30px] bg-[radial-gradient(ellipse_at_center,rgba(61,220,108,0.18)_0%,transparent_70%)] pointer-events-none" />
                <canvas ref={heroCanvasRef} className="w-full h-full rounded-3xl" />

                {[
                  { pos: 'top-[20%] left-0 md:-left-10', delay: '0s', icon: '🌾', top: 'New Listing', val: 'Wheat 50kg — Rs. 4,200' },
                  { pos: 'bottom-[25%] right-0 md:-right-10', delay: '1.5s', icon: '🔨', top: 'Live Auction', val: 'Rs. 8,750 current bid', valColor: 'text-emerald-300' },
                  { pos: 'top-[60%] -left-[5%] hidden lg:flex', delay: '0.8s', icon: '✅', top: 'Order Delivered', val: '2 min ago · Lahore', valColor: 'text-emerald-400' },
                ].map((b, i) => (
                  <div
                    key={i}
                    className={`absolute ${b.pos} flex items-center gap-2.5 bg-[#06140a]/75 backdrop-blur-xl border border-emerald-400/25 rounded-2xl px-3.5 py-3 text-sm z-10 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]`}
                    style={{ animation: `float 4s ease-in-out ${b.delay} infinite` }}
                  >
                    <span className="text-xl">{b.icon}</span>
                    <div>
                      <div className="text-[0.68rem] text-[#9bc4a9] leading-none mb-0.5 tracking-wide">{b.top}</div>
                      <div className={`font-semibold text-[0.82rem] ${b.valColor || 'text-white'}`}>{b.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ───────── FEATURED ───────── */}
          {featured.length > 0 && (
            <Reveal className="mt-12 mb-10">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-[10px] font-bold tracking-[2px] uppercase text-emerald-700/80 mb-1">Curated</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0a1f0d] tracking-tight">⭐ Featured Products</h2>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto lg:grid lg:grid-cols-2 snap-x snap-mandatory scrollbar-hide">
                {featured.slice(featIdx * 2, featIdx * 2 + 2).map((p) => (
                  <div
                    key={p.id}
                    className="snap-start min-w-[85%] lg:min-w-0 bg-white/80 backdrop-blur border border-emerald-900/5
                               rounded-2xl p-4 flex gap-4 shadow-[0_10px_30px_-18px_rgba(10,31,13,0.25)]
                               hover:shadow-[0_18px_44px_-18px_rgba(10,31,13,0.35)] hover:-translate-y-0.5
                               transition-all duration-300"
                  >
                    <div className="w-[100px] h-[88px] bg-gradient-to-br from-emerald-50 to-lime-50 rounded-xl overflow-hidden flex items-center justify-center ring-1 ring-emerald-900/5">
                      {p.primary_image ? (
                        <img src={p.primary_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">🌾</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-[#0a1f0d] truncate">{p.title}</h3>
                      <p className="text-xs text-[#5b7a66]">{p.seller_name}</p>
                      <p className="text-emerald-700 font-bold text-sm mt-1">
                        Rs {Number(p.price).toLocaleString()}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/product/${p.id}`)}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full shadow-[0_6px_14px_-6px_rgba(5,80,40,0.6)] hover:shadow-[0_10px_20px_-8px_rgba(5,80,40,0.7)] transition-shadow"
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => handleChat(p)}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200 rounded-full hover:bg-amber-100 transition-colors"
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {/* ───────── AUCTIONS ───────── */}
          {activeAuctions.length > 0 && (
            <Reveal className="mb-10">
              <div className="flex justify-between items-end mb-5">
                <div>
                  <p className="text-[10px] font-bold tracking-[2px] uppercase text-red-600/80 mb-1">Bidding open</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0a1f0d] tracking-tight">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 align-middle animate-pulse" />
                    Live Auctions
                  </h2>
                </div>
                <button
                  onClick={() => navigate('/auctions')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  View All →
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto lg:grid lg:grid-cols-3 snap-x snap-mandatory scrollbar-hide">
                {activeAuctions.slice(auctIdx * 3, auctIdx * 3 + 3).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/auctions/${a.id}`)}
                    className="snap-start min-w-[80%] sm:min-w-[45%] lg:min-w-0 group bg-white/80 backdrop-blur
                               border border-emerald-900/5 rounded-2xl overflow-hidden cursor-pointer
                               shadow-[0_10px_30px_-18px_rgba(10,31,13,0.25)]
                               hover:shadow-[0_22px_50px_-20px_rgba(10,31,13,0.4)] hover:-translate-y-1
                               transition-all duration-300"
                  >
                    <div className="h-[140px] bg-gradient-to-br from-emerald-50 to-lime-50 overflow-hidden">
                      {a.product_image && (
                        <img
                          src={a.product_image}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="p-3.5">
                      <h3 className="text-sm font-semibold truncate text-[#0a1f0d]">{a.product_title}</h3>
                      <p className="text-emerald-700 font-bold mt-1">{formatPrice(a.current_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {/* ───────── SORT ───────── */}
          <Reveal className="flex justify-between items-center mb-5">
            <h2 className="text-sm font-semibold text-[#0a1f0d]/70 tracking-wide uppercase">Sort by</h2>
            <div className="flex gap-2 flex-wrap">
              {SORTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setSortBy(s.value); setPage(1); }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                    sortBy === s.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-[0_6px_18px_-8px_rgba(5,80,40,0.55)]'
                      : 'bg-white/80 text-[#5b7a66] border-emerald-900/10 hover:border-emerald-500/40 hover:text-emerald-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Reveal>

          {/* ───────── FRESH PRODUCTS HEADING ───────── */}
          <Reveal className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold tracking-[2px] uppercase text-emerald-700/80 mb-1">Marketplace</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1f0d] tracking-tight">
                Fresh Products
              </h2>
              <p className="text-sm text-[#5b7a66] mt-1">
                Hand-picked quality items for you 🌿
              </p>
            </div>
            <button
              onClick={() => navigate('/allproducts')}
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1"
            >
              View All →
            </button>
          </Reveal>

          {/* ───────── PRODUCTS ───────── */}
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {products.slice(0, 20).map((p, i) => (
                  <Reveal key={p.id} delay={i * 60} y={16}>
                    <ProductCard product={p} onChat={handleChat} />
                  </Reveal>
                ))}
              </div>

              {products.length > 8 && (
                <div className="text-center">
                  <button
                    onClick={() => navigate('/allproducts')}
                    className="px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold shadow-[0_10px_28px_-12px_rgba(5,80,40,0.55)] hover:shadow-[0_16px_36px_-12px_rgba(5,80,40,0.7)] hover:-translate-y-0.5 transition-all"
                  >
                    View All Products →
                  </button>
                </div>
              )}

              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>

      <BottomNav />
      <Spinner />

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ───────── CTA ───────── */}
      {!user ? (
        <section className="relative overflow-hidden mx-4 sm:mx-6 lg:mx-10 my-10 rounded-[28px]
                            bg-gradient-to-br from-[#06140a] via-[#0d2a16] to-[#17382a]
                            ring-1 ring-white/[0.06] shadow-[0_30px_80px_-30px_rgba(6,40,18,0.6)]
                            py-24 px-6 md:px-16 lg:px-24 text-[#e8f5ec]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(61,220,108,0.18)_0%,transparent_70%)] pointer-events-none" />
          <div
            aria-hidden
            className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
            style={{ background: 'conic-gradient(from 0deg,#a8f059,#3ddc6c,#17382a,#a8f059)', animation: 'spin 28s linear infinite' }}
          />
          <div className="relative z-10 text-center max-w-[680px] mx-auto">
            <Reveal><p className="flex items-center justify-center gap-2 text-xs font-bold tracking-[2.5px] uppercase text-emerald-300 mb-3">Join Today</p></Reveal>
            <Reveal delay={100}>
              <h2 className="font-display text-[clamp(2.4rem,5vw,4.5rem)] font-bold tracking-tight leading-[1.05] mb-5">
                Start Selling<br />
                <span className="bg-gradient-to-r from-emerald-200 via-emerald-300 to-lime-300 bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] italic">
                  Today
                </span>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-[#9bc4a9] text-[1rem] leading-[1.75] mb-9">
                Join 50,000+ farmers already growing their business on AgriCare. Free to register, free forever.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex gap-3.5 justify-center flex-wrap">
                <Link to="/signup" className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 text-[#06140a] px-10 py-4 rounded-2xl text-[1rem] font-bold shadow-[0_10px_36px_-8px_rgba(61,220,108,0.55)] hover:-translate-y-0.5 hover:shadow-[0_20px_56px_-12px_rgba(61,220,108,0.7)] transition-all duration-300 no-underline">
                  Create Free Account →
                </Link>
                <Link to="/products" className="bg-white/[0.06] border border-white/10 text-[#e8f5ec] px-10 py-4 rounded-2xl text-[1rem] font-medium backdrop-blur-md hover:border-emerald-400/35 hover:bg-white/[0.10] transition-all duration-300 no-underline">
                  Browse Marketplace
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden mx-4 sm:mx-6 lg:mx-10 my-10 rounded-[28px]
                            bg-gradient-to-br from-[#06140a] via-[#0d2a16] to-[#17382a]
                            ring-1 ring-white/[0.06] shadow-[0_30px_80px_-30px_rgba(6,40,18,0.6)]
                            py-24 px-6 md:px-16 lg:px-24 text-[#e8f5ec]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(61,220,108,0.18)_0%,transparent_70%)] pointer-events-none" />
          <div className="relative z-10 text-center max-w-[680px] mx-auto">
            <Reveal><p className="flex items-center justify-center gap-2 text-xs font-bold tracking-[2.5px] uppercase text-emerald-300 mb-3">Welcome Back</p></Reveal>
            <Reveal delay={100}>
              <h2 className="font-display text-[clamp(2.4rem,5vw,4.5rem)] font-bold tracking-tight leading-[1.05] mb-5">
                Keep Growing<br />
                <span className="bg-gradient-to-r from-emerald-200 via-emerald-300 to-lime-300 bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] italic">
                  Your Business
                </span>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-[#9bc4a9] text-[1rem] leading-[1.75] mb-9">
                Explore new opportunities, connect with more buyers, and take your farming business to the next level with AgriCare.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex gap-3.5 justify-center flex-wrap">
                <Link to="/allproducts" className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 text-[#06140a] px-10 py-4 rounded-2xl text-[1rem] font-bold shadow-[0_10px_36px_-8px_rgba(61,220,108,0.55)] hover:-translate-y-0.5 hover:shadow-[0_20px_56px_-12px_rgba(61,220,108,0.7)] transition-all duration-300 no-underline">
                  Explore Products →
                </Link>
                <Link to="/auctions" className="bg-white/[0.06] border border-white/10 text-[#e8f5ec] px-10 py-4 rounded-2xl text-[1rem] font-medium backdrop-blur-md hover:border-emerald-400/35 hover:bg-white/[0.10] transition-all duration-300 no-underline">
                  View Auctions
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ───────── FOOTER ───────── */}
      <footer className="bg-gradient-to-b from-[#06140a] to-[#020806] border-t border-white/[0.06] px-6 md:px-16 lg:px-24 pt-14 pb-8 text-[#9bc4a9]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-300 to-emerald-600 rounded-xl flex items-center justify-center text-base shadow-[0_8px_22px_-8px_rgba(61,220,108,0.6)]">🌿</div>
              <span className="font-display text-[1.15rem] font-bold text-white tracking-tight">
                Agri<span className="text-emerald-400">Care</span>
              </span>
            </div>
            <p className="text-[0.85rem] leading-[1.75] max-w-[280px]">
              Pakistan's leading digital marketplace connecting farmers, dealers and buyers on one trusted platform.
            </p>
          </div>
          {[
            { title: 'Platform', links: ['Marketplace', 'Auctions', 'AI Tools', 'Mobile App'] },
            { title: 'Company',  links: ['About Us',    'Blog',     'Careers',  'Contact']    },
            { title: 'Legal',    links: ['Privacy Policy', 'Terms of Service', 'Security']    },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-[0.72rem] font-bold tracking-[1.5px] uppercase text-emerald-300/80 mb-4">
                {col.title}
              </div>
              <ul className="list-none flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-emerald-300 text-[0.88rem] transition-colors no-underline">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-between items-center pt-6 border-t border-white/[0.06] gap-4">
          <p className="text-[0.78rem]">© 2025 AgriCare. All rights reserved. Made with 🌿 for Pakistan.</p>
          <div className="flex gap-2.5">
            {['𝕏', 'f', '📷', '▶'].map((icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center hover:border-emerald-400/35 hover:text-emerald-300 hover:bg-white/[0.08] transition-all no-underline text-sm"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
