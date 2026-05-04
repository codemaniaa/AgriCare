// src/components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationsPanel from '../common/NotificationsPanel';
import {
  FaHome, FaBox, FaComments, FaUser, FaHeart, FaFileInvoice,
  FaMapMarkerAlt, FaSearch, FaChevronDown, FaSignOutAlt, FaBars, FaTimes,
  FaSeedling, FaAppleAlt, FaCarrot, FaHorse, FaTools, FaFlask, FaLeaf,
} from 'react-icons/fa';

const CATS = [
  { name: 'Grains',      icon: <FaSeedling /> },
  { name: 'Fruits',      icon: <FaAppleAlt /> },
  { name: 'Vegetables',  icon: <FaCarrot /> },
  { name: 'Livestock',   icon: <FaHorse /> },
  { name: 'Tools',       icon: <FaTools /> },
  { name: 'Fertilizers', icon: <FaFlask /> },
];

    const cities = [
      // A
      "Abbottabad", "Ahmedpur East", "Arifwala", "Attock",

      // B
      "Badin", "Bagh", "Bahawalnagar", "Bahawalpur", "Bannu", "Batkhela", "Bhakkar", "Bhalwal", "Bhimber",

      // C
      "Chakwal", "Charsadda", "Chaman", "Chichawatni", "Chiniot",

      // D
      "Dadu", "Daska", "Dera Ghazi Khan", "Dera Ismail Khan",

      // F
      "Faisalabad",

      // G
      "Ghotki", "Gilgit", "Gojra", "Gujranwala", "Gujrat",

      // H
      "Hafizabad", "Hangu", "Haripur", "Hyderabad",

      // I
      "Islamabad",

      // J
      "Jacobabad", "Jaranwala", "Jhang", "Jhelum",

      // K
      "Kalat", "Kamoke", "Kandhkot", "Karachi", "Kasur", "Khairpur", "Khanewal", "Khanpur", "Kharian", "Khuzdar", "Kohat",

      // L
      "Lahore", "Larkana", "Layyah", "Lodhran",

      // M
      "Mandi Bahauddin", "Mansehra", "Mardan", "Mastung", "Mianwali", "Mingora", "Mirpur", "Mirpur Khas", "Multan", "Muzaffarabad", "Muzaffargarh",

      // N
      "Nankana Sahib", "Narowal", "Nawabshah", "Nowshera",

      // O
      "Okara",

      // P
      "Pakpattan", "Peshawar",

      // Q
      "Quetta",

      // R
      "Rahim Yar Khan", "Rawalpindi",

      // S
      "Sadiqabad", "Sahiwal", "Sargodha", "Shahdadkot", "Sheikhupura", "Shikarpur", "Sialkot", "Sukkur", "Swabi",

      // T
      "Tando Adam", "Tando Allahyar", "Taxila", "Toba Tek Singh",

      // U
      "Umerkot",

      // V
      "Vehari",

      // W
      "Wah Cantt",

      // Z
      "Zhob"
    ];

/* ── Reusable dropdown panel (animated, glassy) ───────── */
const Panel = ({ open, children, className = '' }) => (
  <div
    className={`absolute right-0 mt-3 origin-top-right z-50
      bg-white/95 backdrop-blur-xl border border-emerald-900/10
      rounded-2xl shadow-[0_20px_60px_-15px_rgba(16,84,52,0.25)]
      ring-1 ring-black/5 overflow-hidden
      transition-all duration-200 ease-out
      ${open ? 'opacity-100 scale-100 translate-y-0'
             : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
      ${className}`}
  >
    {children}
  </div>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch]             = useState('');
  const [showDrop, setShowDrop]         = useState(false);
  const [showCatDrop, setShowCatDrop]   = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Okara');
  const [citySearch, setCitySearch]     = useState('');
  const [scrolled, setScrolled]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);

  const dropRef = useRef(null);
  const catRef  = useRef(null);
  const locRef  = useRef(null);

  useEffect(() => {
    const click = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
      if (catRef.current  && !catRef.current.contains(e.target))  setShowCatDrop(false);
      if (locRef.current  && !locRef.current.contains(e.target))  setShowLocation(false);
    };
    const scroll = () => setScrolled(window.scrollY > 8);
    document.addEventListener('mousedown', click);
    window.addEventListener('scroll', scroll);
    return () => {
      document.removeEventListener('mousedown', click);
      window.removeEventListener('scroll', scroll);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  const selectCity = (city) => { setSelectedCity(city); setShowLocation(false); };

  const initials =
    user?.full_name?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300
        ${scrolled
          ? 'bg-white/85 backdrop-blur-xl shadow-[0_4px_30px_rgba(16,84,52,0.08)] border-b border-emerald-900/10'
          : 'bg-white/70 backdrop-blur-md border-b border-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 lg:h-18 flex items-center gap-3 lg:gap-5">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="relative w-10 h-10 flex items-center justify-center rounded-xl
                           bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700
                           text-white shadow-lg shadow-emerald-600/30
                           group-hover:shadow-emerald-600/50 group-hover:scale-105 transition">
            <FaLeaf className="text-lg" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-lime-400 ring-2 ring-white animate-pulse" />
          </span>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
            AgriCare
          </span>
        </Link>

        {/* SEARCH (desktop) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-2xl items-stretch h-11
                     bg-white border border-emerald-900/10 rounded-full
                     shadow-sm hover:shadow-md
                     focus-within:border-emerald-500/40
                     focus-within:ring-4 focus-within:ring-emerald-500/15
                     transition"
        >
          <div className="flex items-center pl-4 text-emerald-700/60">
            <FaSearch className="text-sm" />
          </div>
          <input
            className="flex-1 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            placeholder="Search crops, tools, livestock…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* CATEGORY */}
          <div ref={catRef} className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowCatDrop(v => !v)}
              className="h-full px-3 sm:px-4 text-sm font-medium text-gray-700
                         border-l border-emerald-900/10 hover:text-emerald-700
                         flex items-center gap-1.5 transition"
            >
              Category
              <FaChevronDown className={`text-[10px] transition-transform duration-300 ${showCatDrop ? 'rotate-180 text-emerald-600' : ''}`} />
            </button>

            <Panel open={showCatDrop} className="w-64 p-2">
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700/70">
                Browse Categories
              </div>
              <div className="grid grid-cols-2 gap-1">
                {CATS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => { navigate(`/?category=${c.name.toLowerCase()}`); setShowCatDrop(false); }}
                    className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700
                               hover:bg-gradient-to-br hover:from-emerald-50 hover:to-lime-50
                               hover:text-emerald-800 transition"
                  >
                    <span className="w-8 h-8 grid place-items-center rounded-lg
                                     bg-emerald-50 text-emerald-600
                                     group-hover:bg-emerald-600 group-hover:text-white
                                     transition shadow-sm">
                      {c.icon}
                    </span>
                    <span className="font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          <button
            type="submit"
            className="my-1 mr-1 px-5 rounded-full text-sm font-semibold text-white
                       bg-gradient-to-br from-emerald-600 to-green-700
                       hover:from-emerald-500 hover:to-green-600
                       shadow-md shadow-emerald-600/25
                       active:scale-[0.97] transition"
          >
            Search
          </button>
        </form>

        {/* LOCATION */}
        <div ref={locRef} className="relative hidden sm:block">
          <button
            onClick={() => setShowLocation(v => !v)}
            className="flex items-center gap-2 px-3.5 h-11 text-sm font-medium text-gray-700
                       bg-white border border-emerald-900/10 rounded-full
                       hover:border-emerald-500/40 hover:text-emerald-700
                       hover:shadow-sm transition"
          >
            <FaMapMarkerAlt className="text-emerald-600" />
            <span className="hidden md:inline max-w-[100px] truncate">{selectedCity}</span>
            <FaChevronDown className={`text-[10px] text-gray-400 transition-transform ${showLocation ? 'rotate-180' : ''}`} />
          </button>

          <Panel open={showLocation} className="w-80 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/70 mb-2">
              Choose your city
            </div>
            <div className="relative mb-3">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input type="text" placeholder="Search city…" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-emerald-50/40 border border-emerald-900/10            rounded-xl text-sm outline-none
                           focus:bg-white focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/15 transition"/>
            </div>
            <div className="max-h-60 overflow-y-auto pr-1 space-y-0.5  [&::-webkit-scrollbar]:w-1.5  [&::-webkit-scrollbar-thumb]:bg-emerald-200  [&::-webkit-scrollbar-thumb]:rounded-full">
              {cities
                .filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
                .map(city => {
                  const active = city === selectedCity;
                  return (
                    <button
                      key={city}
                      onClick={() => selectCity(city)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition
                        ${active
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'}`}
                    >
                      <FaMapMarkerAlt className={active ? 'text-white' : 'text-emerald-500'} />
                      {city}
                    </button>
                  );
                })}
            </div>
          </Panel>
        </div>

        {/* AUTH */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {user ? (
            <>
              <NotificationsPanel />

              <div ref={dropRef} className="relative">
                <button
                  onClick={() => setShowDrop(v => !v)}
                  className="relative w-10 h-10 rounded-full grid place-items-center
                             bg-gradient-to-br from-emerald-500 to-green-700 text-white font-semibold
                             shadow-md shadow-emerald-600/30 ring-2 ring-white
                             hover:scale-105 transition"
                >
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-lime-400 rounded-full ring-2 ring-white" />
                </button>

                <Panel open={showDrop} className="w-64">
                  <div className="px-4 py-4 bg-gradient-to-br from-emerald-600 to-green-700 text-white">
                    <div className="text-sm font-semibold truncate">{user.full_name}</div>
                    <div className="text-xs text-emerald-50/80 flex items-center gap-1 mt-0.5">
                      <FaMapMarkerAlt className="text-[10px]" /> {user.city}
                    </div>
                  </div>
                  <div className="py-2">
                    {[
                      { to:'/dashboard', icon:<FaHome />,        label:'Dashboard' },
                      { to:'/profile',   icon:<FaUser />,        label:'Profile' },
                      { to:'/products',  icon:<FaBox />,         label:'My Products' },
                      { to:'/wishlist',  icon:<FaHeart />,       label:'Wishlist' },
                      { to:'/orders',    icon:<FaFileInvoice />, label:'Orders' },
                      { to:'/chat',      icon:<FaComments />,    label:'Messages' },
                    ].map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setShowDrop(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                                   hover:bg-emerald-50 hover:text-emerald-800
                                   border-l-2 border-transparent hover:border-emerald-500
                                   transition"
                      >
                        <span className="text-emerald-600">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium
                               text-red-600 bg-red-50/40 hover:bg-red-50 border-t border-red-100 transition"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </Panel>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-emerald-700
                           hover:text-emerald-900 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-white
                           rounded-full bg-gradient-to-br from-emerald-600 to-green-700
                           shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/40
                           hover:-translate-y-0.5 active:translate-y-0 transition"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden w-10 h-10 grid place-items-center rounded-full
                       bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
            aria-label="Menu"
          >
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* MOBILE PANEL */}
      <div className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out
                       ${mobileOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-1 space-y-3 bg-white/95 backdrop-blur-xl border-t border-emerald-900/10">
          <form
            onSubmit={handleSearch}
            className="flex items-center h-11 bg-white border border-emerald-900/10 rounded-full
                       focus-within:ring-4 focus-within:ring-emerald-500/15 focus-within:border-emerald-500/40 transition"
          >
            <FaSearch className="ml-4 text-emerald-700/60 text-sm" />
            <input
              className="flex-1 bg-transparent px-3 text-sm outline-none"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="my-1 mr-1 px-4 h-9 rounded-full text-sm font-semibold text-white
                               bg-gradient-to-br from-emerald-600 to-green-700">
              Go
            </button>
          </form>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/70 mb-2 px-1">
              Categories
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CATS.map(c => (
                <button
                  key={c.name}
                  onClick={() => { navigate(`/?category=${c.name.toLowerCase()}`); setMobileOpen(false); }}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl
                             bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition"
                >
                  <span className="text-emerald-600 text-base">{c.icon}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50/60 text-sm text-emerald-800">
            <FaMapMarkerAlt className="text-emerald-600" />
            Delivering to <span className="font-semibold">{selectedCity}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
