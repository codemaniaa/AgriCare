// src/pages/admin/AdminOrdersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import {
  PageHeader, TableCard, DataTable, Badge, Btn, FilterRow,
  FilterInput, FilterSelect, Pagination, ConfirmModal, Modal,
  FormGroup, FormSelect, useToast, T,
} from '../../components/admin/AdminUI';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const MOCK_ORDERS = [
  { id: 4821, order_number: 'ORD-4821', buyer_name: 'Muhammad Ali',  product_name: 'Organic Wheat',    total_price: 4500,  status: 'delivered',  created_at: '2024-06-05T08:30:00Z' },
];

export default function AdminOrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  // Filters
  const [username, setUsername] = useState('');
  const [product,  setProduct]  = useState('');
  const [status,   setStatus]   = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Modals
  const [statusOpen,   setStatusOpen]   = useState(false);
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [viewOpen,     setViewOpen]     = useState(false);
  const [targetOrder,  setTargetOrder]  = useState(null);
  const [newStatus,    setNewStatus]    = useState('');
  const [busy,         setBusy]         = useState(false);

  const { show, ToastContainer } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.orders({ page, username: username || undefined, product: product || undefined, status: status || undefined, min_price: minPrice || undefined, max_price: maxPrice || undefined })
      .then((res) => {
        const data = res.data;

        setOrders(Array.isArray(data?.results) ? data.results : []);
        setTotal(data?.count || 0);
      })
      .catch(() => {
        let filtered = MOCK_ORDERS.filter(o =>
          (!username || o.buyer_name.toLowerCase().includes(username.toLowerCase())) &&
          (!product  || o.product_name.toLowerCase().includes(product.toLowerCase())) &&
          (!status   || o.status === status) &&
          (!minPrice || o.total_price >= Number(minPrice)) &&
          (!maxPrice || o.total_price <= Number(maxPrice))
        );
        setOrders(filtered);
        setTotal(filtered.length);
      })
      .finally(() => setLoading(false));
  }, [page, username, product, status, minPrice, maxPrice]);

  useEffect(() => { load(); }, [load]);

  const openStatusModal = (order) => {
    setTargetOrder(order);
    setNewStatus(order.status);
    setStatusOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!targetOrder) return;
    setBusy(true);
    try {
      await adminAPI.updateOrderStatus(targetOrder.id, newStatus);
      show(`Order ${targetOrder.order_number} → ${newStatus}`, 'success');
      setOrders(os => os.map(o => o.id === targetOrder.id ? { ...o, status: newStatus } : o));
      setStatusOpen(false);
    } catch (e) {
      show(e.message || 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!targetOrder) return;
    setBusy(true);
    try {
      await adminAPI.deleteOrder(targetOrder.id);
      show(`Order ${targetOrder.order_number} deleted`, 'error');
      setOrders(os => os.filter(o => o.id !== targetOrder.id));
      setTotal(t => t - 1);
      setConfirmOpen(false);
    } catch (e) {
      show(e.message || 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'order_number', label: 'Order #',
      render: v => <span style={{ fontFamily: T.mono, color: T.amber, fontSize: '0.78rem' }}>{v}</span>,
    },
    {
      key: 'buyer_name', label: 'Buyer',
      render: v => <span style={{ color: T.text, fontWeight: 500 }}>{v}</span>,
    },
    {
      key: 'product_name', label: 'Product',
      render: v => <span style={{ color: T.textMid }}>{v}</span>,
    },
    {
      key: 'total_price', label: 'Amount',
      render: v => (
        <span style={{ fontFamily: T.mono, color: T.green, fontSize: '0.78rem' }}>
          Rs. {Number(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: v => <Badge status={v} />,
    },
    {
      key: 'created_at', label: 'Date',
      render: v => (
        <span style={{ color: T.textDim, fontSize: '0.75rem' }}>
          {v ? new Date(v).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 5 }}>
          <Btn variant="ghost" size="sm" icon="👁" onClick={() => { setTargetOrder(row); setViewOpen(true); }}>View</Btn>
          <Btn variant="blue" size="sm" onClick={() => openStatusModal(row)}>✏ Status</Btn>
          <Btn variant="danger" size="icon" onClick={() => { setTargetOrder(row); setConfirmOpen(true); }}>🗑</Btn>
        </div>
      ),
    },
  ];

  const toolbar = (
    <FilterRow>
      <FilterInput placeholder="🔍 Buyer name…" value={username} onChange={v => { setUsername(v); setPage(1); }} width={160} />
      <FilterInput placeholder="Product…" value={product} onChange={v => { setProduct(v); setPage(1); }} width={140} />
      <FilterSelect
        value={status} onChange={v => { setStatus(v); setPage(1); }}
        options={ORDER_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
        placeholder="All Status"
      />
      <FilterInput placeholder="Min Rs." value={minPrice} onChange={setMinPrice} width={80} />
      <FilterInput placeholder="Max Rs." value={maxPrice} onChange={setMaxPrice} width={80} />
    </FilterRow>
  );

  // Revenue summary
  const totalRevenue = orders.filter(o => ['delivered', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  return (
    <div>
      <PageHeader
        title="Order Management"
        subtitle="Track, filter and update all platform orders"
        actions={<Btn variant="ghost" icon="📥">Export CSV</Btn>}
      />

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Orders',   value: total,        color: T.blue },
          { label: 'Revenue (shown)',value: `Rs. ${totalRevenue.toLocaleString()}`, color: T.green },
          { label: 'Pending',        value: orders.filter(o => o.status === 'pending').length,   color: T.amber },
          { label: 'Delivered',      value: orders.filter(o => o.status === 'delivered').length, color: T.green },
          { label: 'Cancelled',      value: orders.filter(o => o.status === 'cancelled').length, color: T.red },
        ].map(item => (
          <div key={item.label} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.65rem', color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: item.color, fontFamily: T.mono }}>{item.value}</div>
          </div>
        ))}
      </div>

      <TableCard
        title="All Orders"
        count={total}
        toolbar={toolbar}
        footer={<Pagination current={page} total={total} pageSize={15} onChange={setPage} />}
      >
        <DataTable columns={columns} data={Array.isArray(orders) ? orders : []} loading={loading} emptyText="No orders found." />
      </TableCard>

      {/* Update status modal */}
      <Modal
        open={statusOpen} onClose={() => setStatusOpen(false)}
        title="Update Order Status" maxWidth={380}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setStatusOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleStatusUpdate} loading={busy}>Update Status</Btn>
          </>
        }
      >
        {targetOrder && (
          <>
            <div style={{ background: T.bg3, borderRadius: 8, padding: 12, marginBottom: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: T.mono, color: T.amber, fontSize: '0.78rem' }}>{targetOrder.order_number}</div>
              <div style={{ color: T.text, fontWeight: 500, marginTop: 4 }}>{targetOrder.product_name}</div>
              <div style={{ color: T.textDim, fontSize: '0.75rem' }}>by {targetOrder.buyer_name}</div>
            </div>
            <FormGroup label="New Status">
              <FormSelect
                value={newStatus} onChange={setNewStatus}
                options={ORDER_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              />
            </FormGroup>
          </>
        )}
      </Modal>

      {/* View order modal */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="🧾 Order Details" maxWidth={460}
        footer={<Btn variant="ghost" onClick={() => setViewOpen(false)}>Close</Btn>}
      >
        {targetOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Order #',   targetOrder.order_number],
              ['Buyer',     targetOrder.buyer_name],
              ['Product',   targetOrder.product_name],
              ['Amount',    `Rs. ${Number(targetOrder.total_price || 0).toLocaleString()}`],
              ['Status',    null],
              ['Date',      targetOrder.created_at ? new Date(targetOrder.created_at).toLocaleString('en-PK') : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}`, fontSize: '0.83rem' }}>
                <span style={{ color: T.textDim }}>{k}</span>
                <span style={{ color: T.text, fontWeight: 500 }}>
                  {k === 'Status' ? <Badge status={targetOrder.status} /> : k === 'Amount' ? <span style={{ color: T.green, fontFamily: T.mono }}>{v}</span> : v}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={confirmOpen} onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete} loading={busy}
        title="Delete Order" target={targetOrder?.order_number}
      />

      <ToastContainer />
    </div>
  );
}
