// src/pages/admin/AdminProductsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import {
  PageHeader, TableCard, DataTable, Badge, Btn, FilterRow,
  FilterInput, FilterSelect, Pagination, ConfirmModal, Modal,
  FormGroup, FormInput, useToast, PageLoader, UserCell, T,
} from '../../components/admin/AdminUI';

const STATUS_OPTIONS   = ['active', 'pending', 'rejected', 'sold', 'inactive'];
const CATEGORY_OPTIONS = ['Grains', 'Vegetables', 'Fruits', 'Fertilizers', 'Seeds', 'Livestock', 'Equipment'];

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);

  // Filters
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Modals
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [viewOpen,     setViewOpen]     = useState(false);
  const [targetProduct, setTarget]      = useState(null);
  const [rejectReason,  setRejectReason]= useState('');
  const [busy,         setBusy]         = useState(false);

  const { show, ToastContainer } = useToast();

  const MOCK_PRODUCTS = [
    { id: 101, title: 'Organic Wheat 50kg', seller_name: 'Ahmad Khan',  category_name: 'Grains',      price_from: 4500,  status: 'pending',  created_at: '2024-06-05', image: null },
    { id: 102, title: 'Fresh Mangoes 1kg',  seller_name: 'Sara Malik',  category_name: 'Fruits',      price_from: 350,   status: 'active',   created_at: '2024-06-04', image: null },
    { id: 103, title: 'Basmati Rice 40kg',  seller_name: 'Bilal Raza',  category_name: 'Grains',      price_from: 8200,  status: 'active',   created_at: '2024-06-01', image: null },
    { id: 104, title: 'DAP Fertilizer 50kg',seller_name: 'Nadia Tariq', category_name: 'Fertilizers', price_from: 12000, status: 'pending',  created_at: '2024-06-03', image: null },
    { id: 105, title: 'Onions 25kg',        seller_name: 'Ali Siddiq',  category_name: 'Vegetables',  price_from: 1800,  status: 'rejected', created_at: '2024-06-02', image: null },
    { id: 106, title: 'Corn Seeds 2kg',     seller_name: 'Fatima M.',   category_name: 'Seeds',       price_from: 650,   status: 'active',   created_at: '2024-06-04', image: null },
    { id: 107, title: 'Sugarcane Bundle',   seller_name: 'Usman Ghani', category_name: 'Crops',       price_from: 2100,  status: 'sold',     created_at: '2024-05-30', image: null },
    { id: 108, title: 'Tomatoes (box)',     seller_name: 'Hina Baig',   category_name: 'Vegetables',  price_from: 900,   status: 'pending',  created_at: '2024-06-05', image: null },
  ];

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.products({ page, search: search || undefined, status: status || undefined, category: category || undefined, min_price: minPrice || undefined, max_price: maxPrice || undefined })
      .then(res => {
        console.log("API RESPONSE:", res.data);

        const data = res.data;

        setProducts(data?.results || data || []);
        setTotal(data?.count || (data?.length ?? 0));
      })
      .catch((err) => {
        console.error("PRODUCT API ERROR:", err);
        show("Failed to load products from backend", "error");
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, search, status, category, minPrice, maxPrice]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const id = setTimeout(load, 400); return () => clearTimeout(id); }, [search]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleApprove = async (product) => {
    setBusy(true);
    try {
      await adminAPI.approveProduct(product.id, 'approve');
      show(`"${product.title}" approved`, 'success');
      setProducts(ps => ps.map(p => p.id === product.id ? { ...p, status: 'active' } : p));
    } catch (e) {
      show(e.message || 'Failed to approve', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!targetProduct) return;
    setBusy(true);
    try {
      await adminAPI.approveProduct(targetProduct.id, 'reject', rejectReason);
      show(`"${targetProduct.title}" rejected`, 'warning');
      setProducts(ps => ps.map(p => p.id === targetProduct.id ? { ...p, status: 'rejected' } : p));
      setRejectOpen(false);
      setRejectReason('');
    } catch (e) {
      show(e.message || 'Failed to reject', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!targetProduct) return;
    setBusy(true);
    try {
      await adminAPI.deleteProduct(targetProduct.id);
      show(`"${targetProduct.title}" deleted`, 'error');
      setProducts(ps => ps.filter(p => p.id !== targetProduct.id));
      setTotal(t => t - 1);
      setConfirmOpen(false);
    } catch (e) {
      show(e.message || 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };
  // ── Columns ───────────────────────────────────────────────────────
  const columns = [
    {
      key: 'title', label: 'Product',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: T.bg3, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: `1px solid ${T.border}` }}>
            {row.image ? <img src={row.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : '📦'}
          </div>
          <div>
            <div style={{ color: T.text, fontWeight: 500, fontSize: '0.83rem' }}>{v}</div>
            <div style={{ color: T.textDim, fontSize: '0.7rem' }}>ID: {row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'seller_name', label: 'Seller',
      render: v => <span style={{ color: T.blue, fontSize: '0.78rem' }}>{v}</span>,
    },
    {
      key: 'category_name', label: 'Category',
      render: v => <span style={{ color: T.textMid, fontSize: '0.78rem' }}>{v || '—'}</span>,
    },
    {
      key: 'price_from', label: 'Price',
      render: v => <span style={{ fontFamily: T.mono, color: T.green, fontSize: '0.78rem' }}>Rs. {Number(v).toLocaleString()}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: v => <Badge status={v} />,
    },
    {
      key: 'created_at', label: 'Listed',
      render: v => <span style={{ color: T.textDim, fontSize: '0.75rem' }}>{v ? new Date(v).toLocaleDateString() : '—'}</span>,
    },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {row.status === 'pending' && (
            <>
              <Btn variant="success" size="sm" onClick={() => handleApprove(row)} loading={busy}>✓ Approve</Btn>
              <Btn variant="danger"  size="sm" onClick={() => { setTarget(row); setRejectOpen(true); }}>✕ Reject</Btn>
            </>
          )}
          <Btn variant="ghost" size="icon" title="View details" onClick={() => { setTarget(row); setViewOpen(true); }}>👁</Btn>
          <Btn variant="danger" size="icon" title="Delete product" onClick={() => { setTarget(row); setConfirmOpen(true); }}>🗑</Btn>
        </div>
      ),
    },
  ];

  const toolbar = (
    <FilterRow>
      <FilterInput placeholder="🔍 Search products or seller…" value={search} onChange={v => { setSearch(v); setPage(1); }} width={210} />
      <FilterSelect value={status} onChange={v => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} placeholder="All Status" />
      <FilterSelect value={category} onChange={v => { setCategory(v); setPage(1); }} options={CATEGORY_OPTIONS.map(c => ({ value: c, label: c }))} placeholder="All Categories" />
      <FilterInput placeholder="Min Rs." value={minPrice} onChange={setMinPrice} width={80} />
      <FilterInput placeholder="Max Rs." value={maxPrice} onChange={setMaxPrice} width={80} />
    </FilterRow>
  );

  return (
    <div>
      <PageHeader
        title="Product Management"
        subtitle="Review, approve and manage all product listings"
      />

      <TableCard
        title="All Products"
        count={total}
        toolbar={toolbar}
        footer={<Pagination current={page} total={total} pageSize={15} onChange={setPage} />}
      >
        <DataTable columns={columns} data={products} loading={loading} emptyText="No products found." />
      </TableCard>

      {/* Delete confirm */}
      <ConfirmModal
        open={confirmOpen} onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete} loading={busy}
        title="Delete Product" target={targetProduct?.title}
      />

      {/* Reject reason */}
      <Modal
        open={rejectOpen} onClose={() => setRejectOpen(false)}
        title="✕ Reject Product" maxWidth={420}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleReject} loading={busy}>Reject Listing</Btn>
          </>
        }
      >
        <div style={{ marginBottom: 14, padding: 12, background: T.bg3, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: '0.82rem', color: T.text, fontWeight: 500 }}>{targetProduct?.title}</div>
          <div style={{ fontSize: '0.72rem', color: T.textDim }}>by {targetProduct?.seller_name}</div>
        </div>
        <FormGroup label="Rejection Reason (optional)">
          <textarea
            value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Explain why this listing is being rejected…"
            rows={4}
            style={{ width: '100%', background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', color: T.text, fontFamily: T.sans, fontSize: '0.83rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = T.green}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </FormGroup>
      </Modal>

      {/* View product */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="📦 Product Details" maxWidth={480}
        footer={<Btn variant="ghost" onClick={() => setViewOpen(false)}>Close</Btn>}
      >
        {targetProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Title', targetProduct.title],
              ['Seller', targetProduct.seller_name],
              ['Category', targetProduct.category_name],
              ['Price', `Rs. ${Number(targetProduct.price_from).toLocaleString()}`],
              ['Status', null],
              ['Listed', targetProduct.created_at ? new Date(targetProduct.created_at).toLocaleDateString() : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: '0.83rem' }}>
                <span style={{ color: T.textDim }}>{k}</span>
                <span style={{ color: T.text, fontWeight: 500 }}>{k === 'Status' ? <Badge status={targetProduct.status} /> : v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ToastContainer />
    </div>
  );
}
