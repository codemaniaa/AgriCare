import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsAPI } from '../api';
import { useMyProducts } from '../hooks';
import { formatPrice, buildFormData, extractError } from '../utils';
import Navbar from '../components/layout/Navbar';
import { Spinner, Toast } from '../components/common';
import { BottomNav } from '../components/layout/SubNavbar';
import CreateAuctionPage from './CreateAuctionPage';
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiImage, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
const G1 = '#2d6a4f';

const CATS = ['grains','fruits','vegetables','livestock','tools','fertilizers'];
const SUBCATS = {
  grains:      ['Wheat','Rice','Barley','Maize','Millet'],
  fruits:      ['Mango','Citrus','Grapes','Apple','Banana','Guava'],
  vegetables:  ['Tomato','Potato','Okra','Onion','Garlic','Chilli'],
  livestock:   ['Cattle','Goats','Poultry','Sheep','Camel'],
  tools:       ['Tractors','Plows','Irrigation','Sprayers','Harvesters'],
  fertilizers: ['Urea','DAP','Potash','Organic','Compost'],
};

// ── Product Management ─────────────────────────────────
// ── Product Management ─────────────────────────────────
export function ProductManagementPage() {
  const navigate = useNavigate();
  const { products, loading, remove } = useMyProducts();
  const [search, setSearch] = useState('');
  const [toast,  setToast]  = useState(null);

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await productsAPI.delete(id);
      remove(id);
      setToast({ msg: 'Product deleted.', type: 'success' });
    } catch {
      setToast({ msg: 'Delete failed.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pb-24">

        {/* HEADER */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg border hover:bg-white transition shadow-sm"
            >
              <FiArrowLeft />
            </button>
            <h2 className="text-xl font-semibold">Products</h2>
          </div>

          <button
            onClick={() => navigate("/add-product")}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 transition shadow-md hover:scale-105"
          >
            <FiPlus />
            Add Product
          </button>
        </div>

        {/* SEARCH */}
        <div className="mt-6 relative">
          <FiSearch className="absolute left-4 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white shadow-sm focus:ring-2 focus:ring-green-600 outline-none"
          />
        </div>

        {/* GRID */}
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mt-6">
            {filtered.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -6, scale: 1.02 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition overflow-hidden"
              >
                <div className="h-32 bg-gray-100">
                  {p.primary_image ? (
                    <img
                      src={p.primary_image}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <FiImage size={24} />
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-green-700 font-semibold text-sm">
                    {formatPrice(p.price)}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/edit-product/${p.id}`)}
                      className="flex-1 py-1.5 text-xs bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
                    >
                      <FiEdit className="inline mr-1" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* ADD CARD */}
            <motion.div
              whileHover={{ scale: 1.08 }}
              onClick={() => navigate("/add-product")}
              className="flex flex-col items-center justify-center border-2 border-dashed border-green-400 rounded-2xl cursor-pointer text-green-700 bg-white hover:bg-green-50 transition"
            >
              <FiPlus size={24} />
              <span className="text-xs mt-1">Add Product</span>
            </motion.div>
          </div>
        )}
      </div>

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Add / Edit Product Form ────────────────────────────
export function AddProductPage() {
  const navigate      = useNavigate();
  const { id }        = useParams(); // present on edit
  const isEdit        = !!id;

  const [form, setForm] = useState({
    title: '', description: '', price: '', category: '',
    subcategory: '', location: '', product_type: 'buy_now', stock_qty: '',
  });
  const [images,   setImages]   = useState([]);    // File objects
  const [previews, setPreviews] = useState([]);    // existing image URLs (edit mode)
  const [loading,  setLoading]  = useState(isEdit);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [toast,    setToast]    = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    productsAPI.detail(id).then(({ data }) => {
      setForm({
        title: data.title, description: data.description,
        price: data.price, category: data.category,
        subcategory: data.subcategory, location: data.location,
        product_type: data.product_type, stock_qty: data.stock_qty,
      });
      setPreviews(data.images?.map((i) => i.image) || []);
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files].slice(0, 8));
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target.result].slice(0, 8));
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!isEdit && images.length < 4) { setError('Please upload at least 4 product images.'); return; }
    setSaving(true); setError('');
    try {
      const payload = buildFormData({ ...form, uploaded_images: images });
      if (isEdit) {
        await productsAPI.update(id, payload);
        setToast({ msg: 'Product updated!', type: 'success' });
      } else {
        await productsAPI.create(payload);
        setToast({ msg: 'Product published!', type: 'success' });
      }
      setTimeout(() => navigate('/products'), 1500);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const inputSt = { width: '100%', padding: '10px 14px', border: '1.5px solid #d0ebd6', borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' };
  const labelSt = { fontSize: 12, fontWeight: 500, color: '#1a2e1d', marginBottom: 4, display: 'block' };
  const rowSt   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 };

  if (loading) return <><Navbar /><Spinner /></>;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8fdf9', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ background: '#fff', borderBottom: '1px solid #d0ebd6', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/products')} style={{ width: 36, height: 36, border: '1.5px solid #d0ebd6', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 18 }}>←</button>
        
        <button onClick={() => navigate('/create-auction')}>Start Auction</button>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600 }}>{isEdit ? 'Edit Product' : 'Add New Product'}</div>
      </div>
      
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 80px' }}>
        <div style={{ background: '#fff', border: '1px solid #d0ebd6', borderRadius: 14, padding: 24 }}>
          {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={submit}>
            {/* Image Upload */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelSt}>Product Images (Minimum 4 required) *</label>
              <label style={{ display: 'block', border: '2px dashed #d0ebd6', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer' }}>
                <input type="file" accept="image/*" multiple onChange={handleImages} style={{ display: 'none' }} />
                <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: 13, color: '#5a7a5e' }}>Click to upload images</div>
                <div style={{ fontSize: 11, color: '#74c69d', marginTop: 4 }}>Upload at least 4 product images</div>
              </label>
              {previews.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={src} alt="" style={{ width: 80, height: 70, borderRadius: 8, objectFit: 'cover', border: '1px solid #d0ebd6' }} />
                      <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#5a7a5e', marginTop: 4 }}>{previews.length}/4 minimum images uploaded</div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Product Title *</label>
              <input style={inputSt} value={form.title} onChange={set('title')} placeholder="e.g., Fresh Organic Wheat 500kg Bag" required />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Description * (min 50 chars)</label>
              <textarea style={{ ...inputSt, resize: 'vertical' }} rows={3} value={form.description} onChange={set('description')} placeholder="Describe your product in detail…" required />
            </div>

            {/* Category + Subcategory */}
            <div style={rowSt}>
              <div>
                <label style={labelSt}>Category *</label>
                <select style={inputSt} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: '' }))} required>
                  <option value="">Select category</option>
                  {CATS.map((c) => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Subcategory *</label>
                <select style={inputSt} value={form.subcategory} onChange={set('subcategory')} required>
                  <option value="">Select subcategory</option>
                  {(SUBCATS[form.category] || []).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Price + Location */}
            <div style={rowSt}>
              <div>
                <label style={labelSt}>Price (Rs/kg) *</label>
                <input style={inputSt} type="number" value={form.price} onChange={set('price')} placeholder="0" min="1" required />
              </div>
              <div>
                <label style={labelSt}>Location (City) *</label>
                <input style={inputSt} value={form.location} onChange={set('location')} placeholder="e.g., Okara, Punjab" required />
              </div>
            </div>

            {/* Stock + Product Type */}
            <div style={rowSt}>
              <div>
                <label style={labelSt}>Stock Quantity (kg) *</label>
                <input style={inputSt} type="number" value={form.stock_qty} onChange={set('stock_qty')} placeholder="e.g., 500" min="1" required />
              </div>
              <div>
                <label style={labelSt}>Product Type *</label>
                <select style={inputSt} value={form.product_type} onChange={set('product_type')} required>
                  <option value="buy_now">Buy Now</option>
                  <option value="auction">Auction</option>
                  <option value="negotiable">Negotiable</option>
                </select>
              </div>
            </div>

            <button type="submit" style={{ width: '100%', padding: 13, background: G1, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: 8 }} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? '✏️ Update Product' : '📦 Publish Product'}
            </button>
          </form>
        </div>
      </div>

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
