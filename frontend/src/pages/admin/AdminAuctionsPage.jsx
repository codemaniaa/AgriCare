// src/pages/admin/AdminAuctionsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import {
  PageHeader, TableCard, DataTable, Badge, Btn, FilterRow,
  FilterInput, FilterSelect, Pagination, ConfirmModal, Modal,
  FormGroup, FormInput, FormSelect, useToast, T,
} from '../../components/admin/AdminUI';

const AUCTION_STATUSES = ['scheduled', 'active', 'ended', 'cancelled'];

const MOCK_AUCTIONS = [
  { id: 1, product_name: 'Premium Rice Lot',   starting_price: 5000,  current_price: 8750,  total_bids: 12, end_time: '2024-06-10T18:00:00Z', status: 'active',    created_at: '2024-06-01T09:00:00Z', highest_bidder: { name: 'Muhammad Ali' } },
  { id: 2, product_name: 'Mango Harvest Bulk', starting_price: 2000,  current_price: 3200,  total_bids: 7,  end_time: '2024-06-12T12:00:00Z', status: 'active',    created_at: '2024-06-02T10:00:00Z', highest_bidder: { name: 'Sara Khan' } },
  { id: 3, product_name: 'Wheat 100kg Lot',    starting_price: 10000, current_price: 10000, total_bids: 0,  end_time: '2024-06-15T09:00:00Z', status: 'scheduled', created_at: '2024-06-03T11:00:00Z', highest_bidder: null },
  { id: 4, product_name: 'Fresh Vegetables',   starting_price: 800,   current_price: 1450,  total_bids: 18, end_time: '2024-06-07T20:00:00Z', status: 'ended',     created_at: '2024-06-01T08:00:00Z', highest_bidder: { name: 'Ahmed Siddiq' } },
  { id: 5, product_name: 'Corn Harvest 200kg', starting_price: 3500,  current_price: 5100,  total_bids: 9,  end_time: '2024-06-11T15:00:00Z', status: 'active',    created_at: '2024-06-02T14:00:00Z', highest_bidder: { name: 'Fatima Malik' } },
];

const MOCK_BIDS = [
  { id: 1, bidder: { name: 'Muhammad Ali'  }, amount: 8750, created_at: '2024-06-05T17:55:00Z' },
  { id: 2, bidder: { name: 'Sara Khan'     }, amount: 8500, created_at: '2024-06-05T17:48:00Z' },
  { id: 3, bidder: { name: 'Ahmed Siddiq'  }, amount: 8000, created_at: '2024-06-05T17:35:00Z' },
  { id: 4, bidder: { name: 'Fatima Malik'  }, amount: 7500, created_at: '2024-06-05T17:20:00Z' },
  { id: 5, bidder: { name: 'Bilal Raza'    }, amount: 6800, created_at: '2024-06-05T17:10:00Z' },
];

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Modals
  const [createOpen,  setCreateOpen]  = useState(false);
  const [bidsOpen,    setBidsOpen]    = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetAuction, setTarget]    = useState(null);
  const [bids,          setBids]      = useState([]);
  const [bidsLoading,   setBidsLoading] = useState(false);
  const [busy,          setBusy]      = useState(false);

  // Create form
 const [form, setForm] = useState({
  product_id: '',
  base_price: '',
  auction_start: '',
  auction_end: '',
  min_bid_increment: '5',
});

  const { show, ToastContainer } = useToast();

  const load = useCallback(() => {
    setLoading(true);
adminAPI.auctions({ page, search: search || undefined, status: status || undefined })
  .then((res) => {
    const data = res.data;
    setAuctions(Array.isArray(data?.results) ? data.results : []);
    setTotal(data?.count || 0);
  })
  .catch(() => {
    let filtered = MOCK_AUCTIONS.filter(a =>
      (!search || a.product_name.toLowerCase().includes(search.toLowerCase())) &&
      (!status || a.status === status)
    );
    setAuctions(filtered);
    setTotal(filtered.length);
  })
  .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleToggle = async (auction, action) => {
    setBusy(true);
    try {
      await adminAPI.toggleAuction(auction.id, action);
      const newStatus = action === 'start' ? 'active' : 'ended';
      show(`Auction ${action === 'start' ? 'started' : 'stopped'}`, action === 'start' ? 'success' : 'warning');
      setAuctions(as => as.map(a => a.id === auction.id ? { ...a, status: newStatus } : a));
    } catch (e) {
      show(e.message || 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!targetAuction) return;
    setBusy(true);
    try {
      await adminAPI.deleteAuction(targetAuction.id);
      show('Auction deleted', 'error');
      setAuctions(as => as.filter(a => a.id !== targetAuction.id));
      setTotal(t => t - 1);
      setConfirmOpen(false);
    } catch (e) {
      show(e.message || 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const openBids = async (auction) => {
    setTarget(auction);
    setBidsOpen(true);
    setBidsLoading(true);
    try {
      const res = await adminAPI.bids(auction.id);
const data = res.data;
setBids(Array.isArray(data?.results) ? data.results : []);
    } catch {
      setBids(MOCK_BIDS);
    } finally {
      setBidsLoading(false);
    }
  };

  const handleCreate = async () => {
  setBusy(true);
  try {
    const payload = {
      product_id: Number(form.product_id),
      base_price: Number(form.base_price),
      auction_start: new Date(form.auction_start).toISOString(),
      auction_end: new Date(form.auction_end).toISOString(),
      min_bid_increment: Number(form.min_bid_increment),
    };

    await adminAPI.createAuction(payload);

    show('Auction created successfully', 'success');
    setCreateOpen(false);
    setForm({
      product_id: '',
      base_price: '',
      auction_start: '',
      auction_end: '',
      min_bid_increment: '5',
    });
    load();
  } catch (e) {
    console.error('Create auction failed:', e?.response?.data || e.message);
    show(e.response?.data?.detail || 'Auction create failed', 'error');
  } finally {
    setBusy(false);
  }
};

  const setF = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  // ── Time display ──────────────────────────────────────────────────
  const formatEndTime = (t) => {
    if (!t) return '—';
    const d = new Date(t);
    const now = new Date();
    const diff = d - now;
    if (diff < 0) return 'Ended';
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h remaining`;
    return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ── Columns ───────────────────────────────────────────────────────
  const columns = [
    {
      key: 'product_name', label: 'Product',
      render: (v, row) => (
        <div>
          <div style={{ color: T.text, fontWeight: 500 }}>{v}</div>
          <div style={{ color: T.textDim, fontSize: '0.7rem' }}>ID: {row.id}</div>
        </div>
      ),
    },
    {
      key: 'starting_price', label: 'Start Price',
      render: v => <span style={{ fontFamily: T.mono, color: T.textMid, fontSize: '0.78rem' }}>Rs. {Number(v).toLocaleString()}</span>,
    },
    {
      key: 'current_price', label: 'Current Price',
      render: (v, row) => (
        <div>
          <span style={{ fontFamily: T.mono, color: T.green, fontSize: '0.82rem', fontWeight: 600 }}>Rs. {Number(v).toLocaleString()}</span>
          {row.highest_bidder && (
            <div style={{ color: T.textDim, fontSize: '0.68rem', marginTop: 2 }}>by {row.highest_bidder.name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'total_bids', label: 'Bids',
      render: v => <span style={{ background: T.purpleDim, color: T.purple, border: `1px solid rgba(167,139,250,0.25)`, padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontFamily: T.mono, fontWeight: 600 }}>{v}</span>,
    },
    {
      key: 'end_time', label: 'End Time',
      render: v => (
        <div>
          <div style={{ fontSize: '0.75rem', color: T.textMid }}>{v ? new Date(v).toLocaleDateString() : '—'}</div>
          <div style={{ fontSize: '0.68rem', color: T.amber }}>{formatEndTime(v)}</div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: v => <Badge status={v} />,
    },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {row.status === 'active' && (
            <Btn variant="warning" size="sm" onClick={() => handleToggle(row, 'stop')} loading={busy}>⏹ Stop</Btn>
          )}
          {row.status === 'scheduled' && (
            <Btn variant="success" size="sm" onClick={() => handleToggle(row, 'start')} loading={busy}>▶ Start</Btn>
          )}
          <Btn variant="ghost" size="sm" onClick={() => openBids(row)}>📋 Bids</Btn>
          <Btn variant="danger" size="icon" onClick={() => { setTarget(row); setConfirmOpen(true); }}>🗑</Btn>
        </div>
      ),
    },
  ];

  const toolbar = (
    <FilterRow>
      <FilterInput placeholder="🔍 Search product…" value={search} onChange={v => { setSearch(v); setPage(1); }} width={200} />
      <FilterSelect
        value={status} onChange={v => { setStatus(v); setPage(1); }}
        options={AUCTION_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
        placeholder="All Status"
      />
    </FilterRow>
  );

  return (
    <div>
      <PageHeader
        title="Auction Management"
        subtitle="Create, monitor and control all live and scheduled auctions"
        actions={
          <Btn variant="primary" onClick={() => setCreateOpen(true)}>+ Create Auction</Btn>
        }
      />

      {/* Live auction banner */}
      {auctions.filter(a => a.status === 'active').length > 0 && (
        <div style={{ background: 'rgba(74,222,128,0.05)', border: `1px solid rgba(74,222,128,0.2)`, borderRadius: 12, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, boxShadow: `0 0 8px ${T.green}`, animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.83rem', color: T.text }}>
            <strong style={{ color: T.green }}>{auctions.filter(a => a.status === 'active').length} auctions</strong> are currently live
          </span>
        </div>
      )}

      <TableCard
        title="All Auctions"
        count={total}
        toolbar={toolbar}
        footer={<Pagination current={page} total={total} pageSize={15} onChange={setPage} />}
      >
        <DataTable columns={columns} data={auctions} loading={loading} emptyText="No auctions found." />
      </TableCard>

      {/* ── Create auction modal ── */}
      <Modal
        open={createOpen} onClose={() => setCreateOpen(false)}
        title="🔨 Create New Auction"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleCreate} loading={busy}>Create Auction</Btn>
          </>
        }
      >
       <FormGroup label="Product ID" hint="Enter the product ID">
  <FormInput
    value={form.product_id}
    onChange={setF('product_id')}
    placeholder="e.g. 103"
    type="number"
  />
</FormGroup>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
  <FormGroup label="Base Price (Rs.)">
    <FormInput
      value={form.base_price}
      onChange={setF('base_price')}
      placeholder="5000"
      type="number"
    />
  </FormGroup>

  <FormGroup label="Min Bid Increment (Rs.)">
    <FormInput
      value={form.min_bid_increment}
      onChange={setF('min_bid_increment')}
      placeholder="5"
      type="number"
    />
  </FormGroup>
</div>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
  <FormGroup label="Auction Start">
    <FormInput
      value={form.auction_start}
      onChange={setF('auction_start')}
      type="datetime-local"
    />
  </FormGroup>

  <FormGroup label="Auction End">
    <FormInput
      value={form.auction_end}
      onChange={setF('auction_end')}
      type="datetime-local"
    />
  </FormGroup>
</div>
      </Modal>

      {/* ── Bid history modal ── */}
      <Modal open={bidsOpen} onClose={() => setBidsOpen(false)} title={`📋 Bid History — ${targetAuction?.product_name}`} maxWidth={560}
        footer={<Btn variant="ghost" onClick={() => setBidsOpen(false)}>Close</Btn>}
      >
        {bidsLoading ? (
          <div style={{ textAlign: 'center', padding: 32, color: T.textDim }}>Loading bids…</div>
        ) : bids.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: T.textDim }}>No bids yet for this auction.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                {['#', 'Bidder', 'Amount', 'Time'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textDim, fontSize: '0.67rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', background: T.bg3, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bids.map((bid, i) => (
                <tr key={bid.id || i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 12px', fontFamily: T.mono, color: T.textDim }}>#{i + 1}</td>
                  <td style={{ padding: '10px 12px', color: i === 0 ? T.green : T.text, fontWeight: i === 0 ? 600 : 400 }}>
                    {bid.bidder?.name || '—'} {i === 0 && <span style={{ fontSize: '0.65rem', color: T.green }}>(highest)</span>}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: T.mono, color: i === 0 ? T.green : T.textMid, fontWeight: i === 0 ? 700 : 400 }}>
                    Rs. {Number(bid.amount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', color: T.textDim, fontSize: '0.72rem' }}>
                    {bid.created_at ? new Date(bid.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={confirmOpen} onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete} loading={busy}
        title="Delete Auction" target={targetAuction?.product_name}
        message="Are you sure you want to permanently delete the auction for"
      />

      <ToastContainer />
    </div>
  );
}
