import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productsAPI, chatAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { ProductCard, Spinner, Pagination } from '../components/common';
import { BottomNav } from '../components/layout/SubNavbar';

const G1 = '#2d6a4f';

const SORT_OPTIONS = [
  { label:'Relevance',       value:''           },
  { label:'Price: Low → High', value:'price'    },
  { label:'Price: High → Low', value:'-price'   },
  { label:'Newest',          value:'-created_at' },
  { label:'Top Rated',       value:'-rating'    },
  { label:'Most Popular',    value:'-views_count'},
];

const CATS = ['grains','fruits','vegetables','livestock','tools','fertilizers'];

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [count,    setCount]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);

  // Filters
  const [category,    setCategory]    = useState(searchParams.get('category') || '');
  const [sortBy,      setSortBy]      = useState('');
  const [minPrice,    setMinPrice]    = useState('');
  const [maxPrice,    setMaxPrice]    = useState('');
  const [productType, setProductType] = useState('');
  const [status,      setStatus]      = useState('');

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    const params = {
      search: query,
      page,
      ...(category    && { category }),
      ...(sortBy      && { ordering: sortBy }),
      ...(minPrice    && { min_price: minPrice }),
      ...(maxPrice    && { max_price: maxPrice }),
      ...(productType && { product_type: productType }),
      ...(status      && { status }),
    };
    productsAPI.list(params)
      .then(({ data }) => {
        setProducts(data.results || data);
        setCount(data.count || (data.results || data).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, page, category, sortBy, minPrice, maxPrice, productType, status]);

  const handleChat = async (product) => {
    if (!user) { navigate('/signin'); return; }
    try {
      const { data } = await chatAPI.start(product.seller_id);
      navigate('/chat', { state: { convId: data.id } });
    } catch { navigate('/chat'); }
  };

  const totalPages = Math.ceil(count / 12);

  const clearAll = () => {
    setCategory(''); setSortBy(''); setMinPrice('');
    setMaxPrice(''); setProductType(''); setStatus(''); setPage(1);
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#f8fdf9', minHeight:'100vh' }}>
      <Navbar />

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'20px 20px 80px' }}>
        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:'#1a2e1d', marginBottom:2 }}>
              Results for "{query}"
            </h1>
            <div style={{ fontSize:13, color:'#5a7a5e' }}>
              {loading ? 'Searching…' : `${count} product${count !== 1 ? 's' : ''} found`}
            </div>
          </div>
          {/* Sort */}
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
            style={{ padding:'9px 14px', border:'1.5px solid #d0ebd6', borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', cursor:'pointer', background:'#fff' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ display:'flex', gap:24 }}>
          {/* ── Filter panel ── */}
          <div className="agricare-sidebar" style={{ width:220, minWidth:220, flexShrink:0 }}>
            <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontWeight:600, fontSize:13 }}>Filters</span>
                <button onClick={clearAll} style={{ background:'none', border:'none', color:G1, fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Clear all</button>
              </div>

              {/* Category */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:6, color:'#1a2e1d' }}>Category</div>
                {CATS.map(c => (
                  <label key={c} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer' }}>
                    <input type="radio" name="cat" checked={category === c} onChange={() => { setCategory(c); setPage(1); }} style={{ accentColor:G1 }} />
                    <span style={{ fontSize:13, color:'#5a7a5e', textTransform:'capitalize' }}>{c}</span>
                  </label>
                ))}
                <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer' }}>
                  <input type="radio" name="cat" checked={category === ''} onChange={() => { setCategory(''); setPage(1); }} style={{ accentColor:G1 }} />
                  <span style={{ fontSize:13, color:'#5a7a5e' }}>All</span>
                </label>
              </div>

              {/* Price */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:6, color:'#1a2e1d' }}>Price Range (Rs)</div>
                <div style={{ display:'flex', gap:6 }}>
                  <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min"
                    style={{ width:'50%', padding:'7px 10px', border:'1.5px solid #d0ebd6', borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:'none' }} />
                  <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max"
                    style={{ width:'50%', padding:'7px 10px', border:'1.5px solid #d0ebd6', borderRadius:8, fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:'none' }} />
                </div>
              </div>

              {/* Product type */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:6, color:'#1a2e1d' }}>Product Type</div>
                {[['','All'],['buy_now','Buy Now'],['auction','Auction'],['negotiable','Negotiable']].map(([v,l]) => (
                  <label key={v} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer' }}>
                    <input type="radio" name="ptype" checked={productType === v} onChange={() => { setProductType(v); setPage(1); }} style={{ accentColor:G1 }} />
                    <span style={{ fontSize:13, color:'#5a7a5e' }}>{l}</span>
                  </label>
                ))}
              </div>

              {/* Availability */}
              <div>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:6, color:'#1a2e1d' }}>Availability</div>
                {[['','All'],['available','In Stock'],['sold','Sold']].map(([v,l]) => (
                  <label key={v} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer' }}>
                    <input type="radio" name="avail" checked={status === v} onChange={() => { setStatus(v); setPage(1); }} style={{ accentColor:G1 }} />
                    <span style={{ fontSize:13, color:'#5a7a5e' }}>{l}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          <div style={{ flex:1, minWidth:0 }}>
            {loading ? <Spinner /> : products.length === 0 ? (
              <div style={{ background:'#fff', border:'1px solid #d0ebd6', borderRadius:14, padding:60, textAlign:'center' }}>
                <div style={{ fontSize:52, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:16, fontWeight:600, color:'#1a2e1d', marginBottom:6 }}>No results for "{query}"</div>
                <div style={{ fontSize:13, color:'#5a7a5e', marginBottom:20 }}>Try different keywords or remove some filters.</div>
                <button onClick={() => navigate('/')}
                  style={{ padding:'10px 24px', background:G1, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  Browse All Products
                </button>
              </div>
            ) : (
              <>
                <div className="agricare-product-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
                  {products.map(p => <ProductCard key={p.id} product={p} onChat={handleChat} />)}
                </div>
                {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); window.scrollTo(0,0); }} />}
              </>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
