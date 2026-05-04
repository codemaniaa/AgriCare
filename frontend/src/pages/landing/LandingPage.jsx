// src/pages/landing/LandingPage.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createHeroScene } from './ThreeScene';

// ── Scroll-reveal hook ────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref      = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el  = ref.current;
    if (!el)  return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

// ── Reveal wrapper component ──────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── Animated counter ──────────────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [ref, visible] = useReveal(0.5);
  const [val, setVal]  = useState(0);
  const ran            = useRef(false);

  useEffect(() => {
    if (!visible || ran.current) return;
    ran.current = true;
    const end  = to;
    let   curr = 0;
    const step = Math.ceil(end / 50);
    const id   = setInterval(() => {
      curr = Math.min(curr + step, end);
      setVal(curr);
      if (curr >= end) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [visible, to]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Auction timer ─────────────────────────────────────────────────
function AuctionTimer({ seconds: initSecs }) {
  const [secs, setSecs] = useState(initSecs);
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(s - 1, 0)), 1000);
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

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroCanvasRef = useRef(null);
  const [scrolled,    setScrolled]   = useState(false);
  const [mobileOpen,  setMobileOpen] = useState(false);

  // Navbar scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hero Three.js scene
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const scene = createHeroScene(canvas);
    return () => scene.dispose();
  }, []);

  return (
    <div className="bg-[#0a1f0d] text-[#e8f5ec] font-sans overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center px-6 md:px-16 lg:px-24 transition-all duration-300 ${scrolled ? 'bg-[#0a1f0d]/85 backdrop-blur-xl border-b border-white/[0.07]' : 'bg-transparent'}`}>

        <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
          <div className="w-[34px] h-[34px] bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[9px] flex items-center justify-center text-lg shadow-[0_4px_14px_rgba(61,220,108,0.35)]">🌿</div>
          <span className="font-display text-[1.1rem] font-bold text-white">Agri<span className="text-emerald-400">Care</span></span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1 mx-auto list-none">
          {['Features', 'How it Works', 'Auctions', 'About'].map(item => (
            <li key={item}>
              <a href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-[#8ab498] hover:text-[#e8f5ec] hover:bg-white/5 text-[0.83rem] font-medium px-3.5 py-2 rounded-lg transition-all duration-200 no-underline">
                {item}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link to="/login" className="text-[#e8f5ec] border border-white/10 hover:border-emerald-400/50 hover:text-emerald-300 px-5 py-2 rounded-full text-[0.82rem] font-medium transition-all duration-200 no-underline">
            Sign In
          </Link>
          <Link to="/register" className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-[#0a1f0d] px-5 py-2 rounded-full text-[0.82rem] font-bold shadow-[0_4px_20px_rgba(61,220,108,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(61,220,108,0.5)] transition-all duration-200 no-underline">
            Get Started
          </Link>
        </div>

        {/* Hamburger */}
        <button onClick={() => setMobileOpen(o => !o)}
          className="md:hidden ml-auto flex flex-col gap-1 p-2 bg-transparent border-0 cursor-pointer">
          <span className={`block w-5 h-0.5 bg-white rounded-sm transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`}/>
          <span className={`block w-5 h-0.5 bg-white rounded-sm transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}/>
          <span className={`block w-5 h-0.5 bg-white rounded-sm transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`}/>
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`fixed top-[68px] left-0 right-0 z-40 bg-[#0a1f0d]/95 backdrop-blur-xl border-b border-white/[0.07] transition-all duration-300 md:hidden ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none -translate-y-2'}`}>
        <div className="flex flex-col p-4 gap-1">
          {['Features', 'How it Works', 'Auctions', 'About'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setMobileOpen(false)}
              className="text-[#8ab498] hover:text-white px-4 py-3 rounded-lg text-sm font-medium transition-all no-underline">
              {item}
            </a>
          ))}
          <div className="border-t border-white/[0.07] mt-2 pt-3 flex gap-2">
            <Link to="/login"    onClick={() => setMobileOpen(false)} className="flex-1 text-center border border-white/10 text-[#e8f5ec] py-2.5 rounded-full text-sm font-medium no-underline">Sign In</Link>
            <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center bg-gradient-to-r from-emerald-400 to-emerald-600 text-[#0a1f0d] py-2.5 rounded-full text-sm font-bold no-underline">Get Started</Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* HERO */}
      {/* ══════════════════════════════════════════════════════════ */}
      

      {/* ══════════════════════════════════════════════════════════ */}
      {/* FEATURES */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 md:px-16 lg:px-24 bg-[#0d2e14]">
        <Reveal>
          <p className="flex items-center gap-2 text-xs font-bold tracking-[2.5px] uppercase text-emerald-300 mb-3">
            <span className="w-5 h-px bg-emerald-400 inline-block" />Everything You Need
          </p>
        </Reveal>
        <div className="md:grid md:grid-cols-2 md:gap-5 md:items-end mb-12">
          <Reveal delay={100}>
            <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] font-bold tracking-tight leading-[1.1]">
              Built for the modern farmer
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-[#8ab498] text-[clamp(0.9rem,1.8vw,1.05rem)] leading-[1.75] mt-3 md:mt-0">
              From listing to final sale — AgriCare handles every step of your agricultural business.
            </p>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { icon: '🛒', title: 'Easy Buying & Selling', desc: 'List crops and goods in minutes. Browse thousands of verified products from farmers across Pakistan.', color: 'emerald', accent: 'rgba(61,220,108,' },
            { icon: '🔨', title: 'Live Auctions',          desc: 'Bid in real-time on premium agricultural lots. Get the best price through competitive fair auctions.', color: 'blue',    accent: 'rgba(96,165,250,' },
            { icon: '💳', title: 'Secure Payments',        desc: 'Pay and receive via JazzCash and EasyPaisa. Every transaction is protected and verified by platform.', color: 'amber',   accent: 'rgba(251,191,36,' },
            { icon: '💬', title: 'Direct Farmer Chat',     desc: 'Negotiate directly with farmers and buyers. Real-time messaging with image and file sharing.', color: 'lime',    accent: 'rgba(168,240,89,' },
          ].map((card, i) => (
            <Reveal key={card.title} delay={i * 80}>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-7 group transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/25 hover:bg-white/[0.07] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] cursor-default h-full relative overflow-hidden">
                {/* Hover glow blob */}
                <div className="absolute bottom-[-40px] right-[-40px] w-24 h-24 rounded-full opacity-0 group-hover:opacity-[0.18] transition-all duration-300 scale-90 group-hover:scale-100"
                  style={{ background: `radial-gradient(circle, ${card.accent}1) 0%, transparent 70%)` }} />

                <div className={`w-13 h-13 rounded-[14px] flex items-center justify-center text-2xl mb-5 w-[52px] h-[52px]`}
                  style={{ background: `${card.accent}0.15)` }}>
                  {card.icon}
                </div>
                <h3 className="font-display text-[1.08rem] font-semibold mb-2.5">{card.title}</h3>
                <p className="text-[#8ab498] text-[0.85rem] leading-[1.7] mb-4">{card.desc}</p>
                <span className="text-[0.78rem] font-semibold transition-all duration-200 inline-flex items-center gap-1 group-hover:gap-2"
                  style={{ color: `hsl(${card.color === 'emerald' ? '145,65%,55%' : card.color === 'blue' ? '210,80%,65%' : card.color === 'amber' ? '43,95%,55%' : '90,80%,58%'})` }}>
                  Learn more <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 md:px-16 lg:px-24 bg-gradient-to-b from-[#0a1f0d] to-[#0d2e14] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(61,220,108,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="text-center mb-14 relative z-10">
          <Reveal><p className="flex items-center justify-center gap-2 text-xs font-bold tracking-[2.5px] uppercase text-emerald-300 mb-3">Simple Process</p></Reveal>
          <Reveal delay={100}><h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] font-bold tracking-tight">How AgriCare Works</h2></Reveal>
          <Reveal delay={200}><p className="text-[#8ab498] mt-3 max-w-[480px] mx-auto text-[0.95rem] leading-[1.75]">Three simple steps to start trading on Pakistan's leading agri-marketplace</p></Reveal>
        </div>

        {/* Steps */}
        <div className="relative max-w-[860px] mx-auto">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-[28px] left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-emerald-400 via-emerald-400/30 to-emerald-400 z-0" />

          <div className="grid md:grid-cols-3 gap-10 md:gap-6 relative z-10">
            {[
              { num: '01', icon: '📝', title: 'Create Account',    desc: 'Register with CNIC, phone, or Gmail. Verify your identity to unlock all features and protections.' },
              { num: '02', icon: '📦', title: 'List or Browse',    desc: 'Post products with photos and descriptions. Explore thousands of verified agricultural listings.' },
              { num: '03', icon: '🤝', title: 'Buy · Bid · Chat',  desc: 'Transact safely, bid in live auctions, or chat directly with sellers to negotiate the best deal.' },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 120}>
                <div className="flex flex-col items-center text-center group">
                  <div className="w-14 h-14 rounded-full bg-[#0a1f0d] border-2 border-emerald-400 flex items-center justify-center font-display text-[1.2rem] font-bold text-emerald-400 mb-5 shadow-[0_0_30px_rgba(61,220,108,0.2)] group-hover:bg-emerald-400 group-hover:text-[#0a1f0d] group-hover:shadow-[0_0_40px_rgba(61,220,108,0.5)] transition-all duration-300">
                    {step.num}
                  </div>
                  <div className="text-3xl mb-3.5">{step.icon}</div>
                  <h3 className="font-display text-[1.05rem] font-semibold mb-2">{step.title}</h3>
                  <p className="text-[#8ab498] text-[0.82rem] leading-[1.65]">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* LIVE AUCTIONS */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section id="auctions" className="py-24 px-6 md:px-16 lg:px-24 bg-[#0d2e14]">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-9">
          <div>
            <Reveal><p className="flex items-center gap-2 text-xs font-bold tracking-[2.5px] uppercase text-emerald-300 mb-3"><span className="w-5 h-px bg-emerald-400 inline-block" />Live Now</p></Reveal>
            <Reveal delay={100}><h2 className="font-display text-[clamp(1.8rem,3.5vw,3rem)] font-bold tracking-tight">Active Auctions</h2></Reveal>
          </div>
          <Reveal delay={200}>
            <Link to="/auctions" className="border border-white/10 hover:border-emerald-400/40 text-[#e8f5ec] px-5 py-2.5 rounded-full text-sm font-medium transition-all no-underline whitespace-nowrap">
              View All Auctions →
            </Link>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[
            { emoji: '🌾', name: 'Premium Basmati Rice — 100kg', seller: 'Ahmad Khan · Punjab',  bid: 8750,  bids: 12, secs: 7778  },
            { emoji: '🥭', name: 'Sindhri Mango Harvest — 50 boxes', seller: 'Sara Malik · Sindh', bid: 3200, bids: 7,  secs: 20531 },
            { emoji: '🌽', name: 'Yellow Corn — 200kg Bulk Lot',  seller: 'Bilal Raza · KPK',   bid: 5100,  bids: 9,  secs: 3502  },
          ].map((item, i) => (
            <Reveal key={item.name} delay={i * 100}>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] overflow-hidden group hover:-translate-y-1 hover:border-emerald-400/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all duration-300">
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-[#0f3d1c] to-[#0d2e14] flex items-center justify-center text-6xl relative">
                  {item.emoji}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-400/15 border border-emerald-400/25 rounded-md px-2.5 py-1 text-emerald-300 text-[0.68rem] font-bold tracking-wide uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />LIVE
                  </div>
                  <div className="absolute top-3 right-3 bg-[#0a1f0d]/80 backdrop-blur-sm border border-white/[0.07] rounded-lg px-2.5 py-1.5">
                    <AuctionTimer seconds={item.secs} />
                  </div>
                </div>

                {/* Body */}
                <div className="p-[18px]">
                  <h4 className="font-display text-[1rem] font-semibold mb-1.5">{item.name}</h4>
                  <p className="text-[#8ab498] text-[0.75rem] mb-4">By {item.seller}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[0.68rem] text-[#8ab498] uppercase tracking-wide mb-0.5">Current Bid</div>
                      <div className="font-display text-[1.3rem] font-bold text-emerald-300">Rs. {item.bid.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[0.68rem] text-[#8ab498] uppercase tracking-wide mb-0.5">Bids</div>
                      <div className="text-[1.1rem] font-bold">{item.bids}</div>
                    </div>
                  </div>
                  <button className="w-full mt-3.5 bg-gradient-to-r from-emerald-400 to-emerald-600 text-[#0a1f0d] py-2.5 rounded-xl text-[0.85rem] font-bold hover:shadow-[0_8px_24px_rgba(61,220,108,0.4)] hover:-translate-y-0.5 transition-all duration-200">
                    Place Bid →
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TRUST */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section id="about" className="py-24 px-6 md:px-16 lg:px-24 bg-[#0a1f0d] text-center">
        <Reveal><p className="flex items-center justify-center gap-2 text-xs font-bold tracking-[2.5px] uppercase text-emerald-300 mb-3">Why Farmers Choose Us</p></Reveal>
        <Reveal delay={100}><h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-bold tracking-tight mb-14">Trusted across Pakistan</h2></Reveal>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-14">
          {[
            { to: 50000,   suffix: '+', label: 'Active Farmers' },
            { to: 120000,  suffix: '+', label: 'Products Listed' },
            { to: 4,       suffix: '',  label: 'Provinces Covered' },
            { to: 2000000000, suffix: '+', label: 'Transactions (Rs.)' },
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 80}>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-[18px] p-7 hover:border-emerald-400/25 hover:bg-white/[0.07] hover:-translate-y-1 transition-all duration-300">
                <div className="font-display text-[2.4rem] font-bold text-emerald-300 leading-none mb-1.5">
                  <Counter to={stat.to} suffix={stat.suffix} />
                </div>
                <div className="text-[#8ab498] text-[0.82rem]">{stat.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Trust icons */}
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { icon: '🛡️', label: 'CNIC Verified' },
            { icon: '🔐', label: 'Secure Payments' },
            { icon: '⭐', label: 'Rated Sellers' },
            { icon: '🤝', label: 'Broker Support' },
            { icon: '📱', label: 'Mobile Ready' },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 60}>
              <div className="flex flex-col items-center gap-2.5 px-6 py-5 bg-white/[0.04] border border-white/[0.08] rounded-[16px] hover:border-emerald-400/25 hover:-translate-y-1 transition-all duration-300">
                <span className="text-3xl">{item.icon}</span>
                <span className="text-[0.78rem] font-semibold">{item.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* CTA */}
      {/* ══════════════════════════════════════════════════════════ */}
      
      {/* ══════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ══════════════════════════════════════════════════════════ */}
      <footer className="bg-[#0a1f0d] border-t border-white/[0.07] px-6 md:px-16 lg:px-24 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-base">🌿</div>
              <span className="font-display text-[1.1rem] font-bold text-white">Agri<span className="text-emerald-400">Care</span></span>
            </div>
            <p className="text-[#8ab498] text-[0.85rem] leading-[1.75] max-w-[280px]">
              Pakistan's leading digital marketplace connecting farmers, dealers and buyers on one trusted platform.
            </p>
          </div>
          {[
            { title: 'Platform', links: ['Marketplace', 'Auctions', 'AI Tools', 'Mobile App'] },
            { title: 'Company',  links: ['About Us',    'Blog',     'Careers',  'Contact']    },
            { title: 'Legal',    links: ['Privacy Policy', 'Terms of Service', 'Security']    },
          ].map(col => (
            <div key={col.title}>
              <div className="text-[0.72rem] font-bold tracking-[1.5px] uppercase text-[#8ab498] mb-4">{col.title}</div>
              <ul className="list-none flex flex-col gap-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-[#8ab498] hover:text-emerald-300 text-[0.85rem] transition-colors no-underline">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-between items-center pt-6 border-t border-white/[0.07] gap-4">
          <p className="text-[#8ab498] text-[0.78rem]">© 2025 AgriCare. All rights reserved. Made with 🌿 for Pakistan.</p>
          <div className="flex gap-2.5">
            {['𝕏', 'f', '📷', '▶'].map((icon, i) => (
              <a key={i} href="#" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-[#8ab498] hover:border-emerald-400/25 hover:text-emerald-300 hover:bg-white/[0.08] transition-all no-underline text-sm">
                {icon}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
