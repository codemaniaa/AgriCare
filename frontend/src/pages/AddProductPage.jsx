import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiUploadCloud, FiX, FiTag, FiMapPin, FiDollarSign,
  FiBox, FiFileText, FiLayers, FiCheckCircle, FiImage, FiSave
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

import { productsAPI } from '../api';
import { buildFormData, extractError } from '../utils';
import Navbar from '../components/layout/Navbar';
import { Spinner, Toast } from '../components/common';
import { BottomNav } from '../components/layout/SubNavbar';
import CreateAuctionPage from './CreateAuctionPage';

/* ---------- font loader ---------- */
function useFonts() {
  useEffect(() => {
    const id = 'app-fonts';
    if (document.getElementById(id)) return;
    const l = document.createElement('link');
    l.id = id;
    l.rel = 'stylesheet';
    l.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap';
    document.head.appendChild(l);
    const l2 = document.createElement('link');
    l2.rel = 'stylesheet';
    l2.href = 'https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&display=swap';
    document.head.appendChild(l2);
  }, []);
}

const fontHead = "font-['Clash_Display','Inter',sans-serif]";
const fontUI = "font-['Sora','Inter',sans-serif]";
const fontBody = "font-['Inter',sans-serif]";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-emerald-100 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-600/10 outline-none transition-all placeholder:text-slate-400";
const inputWithIcon = inputCls + " pl-11";
const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

const CATEGORIES = [
  'Electronics', 'Fashion', 'Home', 'Books', 'Vehicles',
  'Sports', 'Beauty', 'Toys', 'Other',
];

export default function AddProductPage() {
  useFonts();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [mode, setMode] = useState('product'); // 'product' | 'auction'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', price: '', stock: '',
    category: '', location: '', condition: 'new',
  });
  const [images, setImages] = useState([]); // File[] or {url}
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const data = await productsAPI.get(id);
        setForm({
          title: data.title || '', description: data.description || '',
          price: data.price || '', stock: data.stock || '',
          category: data.category || '', location: data.location || '',
          condition: data.condition || 'new',
        });
        setExistingImages(data.images || []);
      } catch (e) {
        setToast({ msg: extractError(e), type: 'error' });
      } finally { setLoading(false); }
    })();
  }, [id, isEdit]);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onPickImages = (e) => {
    const files = Array.from(e.target.files || []);
    setImages((p) => [...p, ...files]);
  };

  const removeImage = (i) =>
    setImages((p) => p.filter((_, idx) => idx !== i));

  const removeExisting = (imgId) =>
    setExistingImages((p) => p.filter((x) => x.id !== imgId));

  const totalImages = images.length + existingImages.length;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      setToast({ msg: 'Title and price are required', type: 'error' });
      return;
    }
    if (totalImages < 1) {
      setToast({ msg: 'Please add at least one image', type: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      const fd = buildFormData({ ...form });
      images.forEach((f) => fd.append('images', f));
      if (isEdit) {
        await productsAPI.update(id, fd);
        setToast({ msg: 'Product updated', type: 'success' });
      } else {
        await productsAPI.create(fd);
        setToast({ msg: 'Product created', type: 'success' });
      }
      setTimeout(() => navigate('/products/manage'), 700);
    } catch (err) {
      setToast({ msg: extractError(err), type: 'error' });
    } finally { setSubmitting(false); }
  };

  if (mode === 'auction') return <CreateAuctionPage onBack={() => setMode('product')} />;

  return (
    <div className={`min-h-screen bg-[#f7faf8] ${fontBody} pb-28`}>
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-emerald-300/40 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/85 hover:text-white text-sm mb-6 transition-colors"
          >
            <FiArrowLeft /> Back
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs uppercase tracking-wider mb-3">
            <HiOutlineSparkles /> {isEdit ? 'Edit listing' : 'New listing'}
          </div>
          <h1 className={`${fontHead} text-3xl sm:text-4xl font-semibold leading-tight`}>
            {isEdit ? 'Update your product' : 'List a new product'}
          </h1>
          <p className={`${fontUI} mt-2 text-white/85 text-sm sm:text-base max-w-xl`}>
            Provide great photos and clear details — listings sell faster.
          </p>

          {!isEdit && (
            <div className="mt-6 inline-flex p-1 rounded-2xl bg-white/15 backdrop-blur border border-white/20">
              <ToggleBtn active={mode === 'product'} onClick={() => setMode('product')}>
                Fixed price
              </ToggleBtn>
              <ToggleBtn active={mode === 'auction'} onClick={() => setMode('auction')}>
                Auction
              </ToggleBtn>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-10">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={onSubmit}
            className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(16,64,38,0.08)] border border-emerald-50 p-5 sm:p-8 space-y-7"
          >
            {/* Image upload */}
            <section>
              <h2 className={`${fontHead} text-lg font-semibold text-slate-800 flex items-center gap-2`}>
                <FiImage className="text-emerald-600" /> Photos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Add at least 1 image. First image is the cover.</p>

              <label
                htmlFor="img-input"
                className="mt-4 group flex flex-col items-center justify-center gap-2 w-full py-10 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FiUploadCloud className="text-2xl" />
                </div>
                <div className={`${fontUI} text-sm font-medium text-slate-700`}>
                  Drag & drop or click to upload
                </div>
                <div className="text-xs text-slate-500">PNG, JPG up to 5MB each</div>
                <input id="img-input" type="file" accept="image/*" multiple className="hidden" onChange={onPickImages} />
              </label>

              {(existingImages.length > 0 || images.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                  <AnimatePresence>
                    {existingImages.map((img) => (
                      <Thumb key={`e-${img.id}`} src={img.image} onRemove={() => removeExisting(img.id)} />
                    ))}
                    {images.map((f, i) => (
                      <Thumb key={`n-${i}`} src={URL.createObjectURL(f)} onRemove={() => removeImage(i)} isNew />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* Details */}
            <section className="space-y-5">
              <h2 className={`${fontHead} text-lg font-semibold text-slate-800 flex items-center gap-2`}>
                <FiFileText className="text-emerald-600" /> Details
              </h2>

              <div>
                <label className={labelCls}>Title</label>
                <div className="relative">
                  <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/60" />
                  <input value={form.title} onChange={onChange('title')} placeholder="e.g. iPhone 13 Pro - Excellent condition"
                    className={inputWithIcon} required />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={form.description}
                  onChange={onChange('description')}
                  rows={5}
                  placeholder="Describe condition, features, what's included…"
                  className={inputCls + ' resize-none'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Price</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/60" />
                    <input type="number" min="0" value={form.price} onChange={onChange('price')}
                      placeholder="0.00" className={inputWithIcon} required />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Stock</label>
                  <div className="relative">
                    <FiBox className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/60" />
                    <input type="number" min="0" value={form.stock} onChange={onChange('stock')}
                      placeholder="1" className={inputWithIcon} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <div className="relative">
                    <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/60" />
                    <select value={form.category} onChange={onChange('category')} className={inputWithIcon + ' appearance-none'}>
                      <option value="">Select a category</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/60" />
                    <input value={form.location} onChange={onChange('location')}
                      placeholder="City, Country" className={inputWithIcon} />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Condition</label>
                <div className="grid grid-cols-3 gap-2">
                  {['new', 'like-new', 'used'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, condition: c }))}
                      className={`${fontUI} px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        form.condition === c
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-white text-slate-700 border-emerald-100 hover:border-emerald-300'
                      }`}
                    >
                      {form.condition === c && <FiCheckCircle className="inline mr-1" />}
                      {c.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-emerald-50">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`${fontUI} sm:w-auto w-full px-6 py-3 rounded-xl border border-emerald-100 text-slate-700 hover:bg-emerald-50 transition-all`}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className={`${fontUI} flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-900/20 hover:shadow-xl disabled:opacity-60 transition-all`}
              >
                {submitting ? <Spinner size="sm" /> : <><FiSave /> {isEdit ? 'Save changes' : 'Publish listing'}</>}
              </motion.button>
            </div>
          </motion.form>
        )}
      </div>

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function ToggleBtn({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${fontUI} px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active ? 'bg-white text-emerald-700 shadow' : 'text-white/85 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function Thumb({ src, onRemove, isNew }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative aspect-square rounded-xl overflow-hidden border border-emerald-100 group"
    >
      <img src={src} alt="" className="w-full h-full object-cover" />
      {isNew && (
        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-semibold">
          New
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 text-rose-600 opacity-0 group-hover:opacity-100 hover:bg-white shadow transition-all"
      >
        <FiX />
      </button>
    </motion.div>
  );
}
