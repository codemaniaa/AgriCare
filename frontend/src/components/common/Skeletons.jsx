import React, { useState } from 'react';

const G1 = '#2d6a4f';

/* ── CSS animation ─────────────────────────────────── */
const SHIMMER_CSS = `
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
.sk {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e8e2 50%, #f0f0f0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}
`;

function injectCss() {
  if (document.getElementById('agricare-skeleton-css')) return;
  const s = document.createElement('style');
  s.id = 'agricare-skeleton-css';
  s.textContent = SHIMMER_CSS;
  document.head.appendChild(s);
}

/* ── ProductCardSkeleton ───────────────────────────── */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      
      <div className="h-40 bg-gray-200" />

      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />

        <div className="flex gap-2 pt-2">
          <div className="h-8 flex-1 bg-gray-200 rounded-xl" />
          <div className="h-8 flex-1 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── ProductGridSkeleton ───────────────────────────── */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="
      grid gap-4
      grid-cols-2
      sm:grid-cols-3
      md:grid-cols-4
      lg:grid-cols-5
    ">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── DashboardSkeleton ─────────────────────────────── */
export function DashboardSkeleton() {
  injectCss();
  return (
    <div>
      <div className="sk" style={{ height:100, borderRadius:14, marginBottom:20 }} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        {[0,1,2,3].map(i => <div key={i} className="sk" style={{ height:72, borderRadius:12 }} />)}
      </div>
      <div className="sk" style={{ height:48, borderRadius:12, marginBottom:20 }} />
      <div className="sk" style={{ height:18, width:140, marginBottom:12 }} />
      {[0,1,2].map(i => <div key={i} className="sk" style={{ height:56, borderRadius:0, marginBottom:1 }} />)}
    </div>
  );
}

/* ── ProductDetailSkeleton ─────────────────────────── */
export function ProductDetailSkeleton() {
  injectCss();
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, margin:'0 auto', padding:'24px 20px' }}>
      <div>
        <div className="sk" style={{ height:340, borderRadius:14, marginBottom:12 }} />
        <div style={{ display:'flex', gap:8 }}>
          {[0,1,2,3].map(i => <div key={i} className="sk" style={{ width:70, height:60, borderRadius:8 }} />)}
        </div>
      </div>
      <div>
        <div className="sk" style={{ height:14, width:'40%', marginBottom:12 }} />
        <div className="sk" style={{ height:28, width:'90%', marginBottom:8 }} />
        <div className="sk" style={{ height:28, width:'70%', marginBottom:16 }} />
        <div className="sk" style={{ height:32, width:'45%', marginBottom:16 }} />
        <div className="sk" style={{ height:90, borderRadius:12, marginBottom:16 }} />
        <div className="sk" style={{ height:14, width:'100%', marginBottom:6 }} />
        <div className="sk" style={{ height:14, width:'85%', marginBottom:6 }} />
        <div className="sk" style={{ height:14, width:'75%', marginBottom:20 }} />
        <div style={{ display:'flex', gap:10 }}>
          <div className="sk" style={{ height:48, flex:1, borderRadius:12 }} />
          <div className="sk" style={{ height:48, flex:1, borderRadius:12 }} />
        </div>
      </div>
    </div>
  );
}

/* ── OrderConfirmModal ─────────────────────────────── */
export function OrderConfirmModal({ product, quantity, onConfirm, onCancel, loading }) {
  const total = product ? product.price * quantity : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">

        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Confirm Order
        </h2>

        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold">{product?.title}</p>
          <p>Price: Rs {product?.price}</p>
          <p>Qty: {quantity} kg</p>
          <p>Seller: {product?.seller_name}</p>
          <p className="font-bold text-green-700">
            Total: Rs {total.toLocaleString()}
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-green-700 text-white hover:bg-green-800"
          >
            {loading ? 'Placing...' : 'Place Order'}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── ImageZoomModal ─────────────────────────────────── */
export function ImageZoomModal({ images, activeIndex, onClose }) {
  const [idx, setIdx] = useState(activeIndex || 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50"
    >
      <img
        src={images[idx]?.image || images[idx]}
        className="max-h-[80vh] rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="flex gap-2 mt-4">
        {images.map((img, i) => (
          <img
            key={i}
            src={img?.image || img}
            onClick={(e) => {
              e.stopPropagation();
              setIdx(i);
            }}
            className={`w-14 h-12 object-cover rounded cursor-pointer border ${
              i === idx ? 'border-white' : 'border-transparent opacity-60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}