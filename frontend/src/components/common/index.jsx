import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice, statusColour } from '../../utils';
import { useState } from 'react'; 
// ── ProductCard ────────────────────────────────────────
import { FaMapMarkerAlt, FaStar } from 'react-icons/fa';

export function ProductCard({ product, onChat }) {
  const navigate = useNavigate();
  const badge = statusColour[product.status] || statusColour.available;

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="
        group cursor-pointer
        bg-white rounded-2xl overflow-hidden
        border border-gray-200
        shadow-sm hover:shadow-xl
        transition-all duration-300
        hover:-translate-y-1
      "
    >
      {/* IMAGE */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-50 to-green-100 text-4xl">
            🌾
          </div>
        )}

        {/* BADGE */}
        <span
          className="absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-semibold shadow"
          style={{ background: badge.bg, color: badge.color }}
        >
          {product.status === 'available'
            ? 'Available'
            : product.status === 'auction'
            ? 'Auction'
            : 'Sold'}
        </span>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {/* TITLE */}
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">
          {product.title}
        </h3>

        {/* SELLER */}
        <p className="text-xs text-gray-500 mt-1">
          by {product.seller_name}
        </p>

        {/* PRICE */}
        <div className="mt-2 text-lg font-bold text-green-700">
          {formatPrice(product.price)}
          <span className="text-xs text-gray-500 font-normal"> /kg</span>
        </div>

        {/* LOCATION + RATING */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <FaMapMarkerAlt className="text-green-600" />
            {product.location}
          </div>

          <div className="flex items-center gap-1 text-yellow-500 font-semibold">
            <FaStar />
            {Number(product.rating).toFixed(1)}
          </div>
        </div>

        {/* ACTIONS */}
        <div
          className="flex gap-2 mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          {product.status === 'auction' ? (
            <>
              <button className="flex-1 py-2 rounded-xl bg-yellow-100 text-yellow-700 text-xs font-semibold hover:bg-yellow-200 transition">
                Auction
              </button>
              <button className="flex-1 py-2 rounded-xl bg-yellow-500 text-white text-xs font-semibold hover:bg-yellow-600 transition">
                Bid Now
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(`/product/${product.id}`)}
                className="
                  flex-1 py-2 rounded-xl
                  bg-gradient-to-r from-green-600 to-green-700
                  text-white text-xs font-semibold
                  hover:scale-105 transition
                "
              >
                Buy Now
              </button>

              <button
                onClick={() => onChat && onChat(product)}
                className="
                  flex-1 py-2 rounded-xl
                  bg-gray-100 text-gray-700
                  text-xs font-semibold
                  hover:bg-gray-200 transition
                "
              >
                Chat
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const G1 = '#2d6a4f';
 

// ── Spinner ────────────────────────────────────────────
export function Spinner({ size = 40 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: size, height: size,
        border: `3px solid #d0ebd6`,
        borderTopColor: G1,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? '#d1e7dd' : type === 'error' ? '#f8d7da' : '#fff3cd';
  const color = type === 'success' ? '#0f5132' : type === 'error' ? '#721c24' : '#856404';

  return (
    <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: bg, color, padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
      {type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'} {message}
    </div>
  );
}

// ── Sidebar Filters
export function Sidebar({ filters={}, onChange }) {
  const [open, setOpen] = useState(false);

  const set = (key, val) => {
    onChange({ ...filters, [key]: val });
  };

  const categories = ['grains','fruits','vegetables','livestock','tools','fertilizers'];

  return (
    <>
      {/* 🔥 Mobile Filter Button (TOP instead of bottom) */}
     <button
  onClick={() => setOpen(true)}
  className="lg:hidden fixed top-20 right-4 z-[9999] bg-green-700 text-white px-4 py-2 rounded-full shadow-lg"
>
  Filters
</button>

     

      {/* Sidebar */}
     <div
  className={`
    fixed top-0 left-0 h-full w-[260px]
    bg-white p-5 overflow-y-auto
    transform transition-transform duration-300
    z-[9999]

    ${open ? 'translate-x-0' : '-translate-x-full'}

    lg:static lg:translate-x-0 lg:h-auto lg:z-auto
  `}
>
  

        {/* Close Button (Mobile) */}
        <div className="flex justify-between items-center mb-4 lg:hidden">
          <h2 className="font-semibold text-gray-800">Filters</h2>
          <button onClick={() => setOpen(false)}>✖</button>
        </div>
{/* Categories */}
<div className="mb-6">
  <h3 className="text-sm font-semibold mb-3 text-gray-800">Category</h3>

  {categories?.map((c) => (
    <label
      key={c}
      className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer"
    >
      <input
        type="radio"
        name="category"
        checked={filters?.category === c}
        onChange={() => set('category', c)}
        className="accent-green-700"
      />
      <span className="capitalize">{c}</span>
    </label>
  ))}

  <button
    onClick={() => set('category', '')}
    className="text-xs text-red-500 mt-1"
  >
    Clear
  </button>
</div>

        {/* Price */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-800">Max Price</h3>

          <input
            type="range"
            min={100}
            max={50000}
            step={100}
            value={filters.maxPrice || 10000}
            onChange={(e) => set('maxPrice', e.target.value)}
            className="w-full accent-green-700"
          />

          <p className="text-xs text-gray-500 mt-1">
            Rs {Number(filters.maxPrice || 10000).toLocaleString()}
          </p>
        </div>

        {/* Product Type */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-800">Product Type</h3>

          {[
            ['buy_now','Buy Now'],
            ['auction','Auction'],
            ['negotiable','Negotiable']
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="radio"
                name="ptype"
                checked={filters.product_type === v}
                onChange={() => set('product_type', v)}
                className="accent-green-700"
              />
              {l}
            </label>
          ))}

          <button
            onClick={() => set('product_type', '')}
            className="text-xs text-red-500"
          >
            Clear
          </button>
        </div>

        {/* Availability */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-800">Availability</h3>

          {[
            ['available','In Stock'],
            ['sold','Sold']
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="radio"
                name="status"
                checked={filters.status === v}
                onChange={() => set('status', v)}
                className="accent-green-700"
              />
              {l}
            </label>
          ))}

          <button
            onClick={() => set('status', '')}
            className="text-xs text-red-500"
          >
            Clear
          </button>
        </div>

      </div>
       {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
        />
      )}
    </>
  );
}



const sb = {
  wrap:     { width: 220, minWidth: 220 },
  section:  { background: '#fff', border: '1px solid #d0ebd6', borderRadius: 12, padding: 16, marginBottom: 16 },
  title:    { fontSize: 13, fontWeight: 600, color: '#1a2e1d', marginBottom: 12 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' },
};

// ── Pagination ─────────────────────────────────────────
export function Pagination({ page, totalPages, onChange }) {
  const pages = [];
  for (let i = 1; i <= Math.min(totalPages, 10); i++) pages.push(i);

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 24 }}>
      <button style={pg.btn} onClick={() => onChange(Math.max(1, page - 1))}>‹</button>
      {pages.map((p) => (
        <button key={p} style={{ ...pg.btn, ...(p === page ? pg.active : {}) }} onClick={() => onChange(p)}>{p}</button>
      ))}
      <button style={pg.btn} onClick={() => onChange(Math.min(totalPages, page + 1))}>›</button>
    </div>
  );
}

const pg = {
  btn:    { width: 34, height: 34, border: '1.5px solid #d0ebd6', borderRadius: 8, background: '#fff', color: '#5a7a5e', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  active: { background: G1, color: '#fff', borderColor: G1 },
};

// ── PrivateRoute ───────────────────────────────────────
export function PrivateRoute({ children }) {
  const { user, loading } = require('../../context/AuthContext').useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/signin');
  }, [user, loading, navigate]);

  if (loading) return <Spinner />;
  return user ? children : null;
}
