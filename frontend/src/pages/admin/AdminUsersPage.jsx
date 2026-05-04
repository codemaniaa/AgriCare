// src/pages/admin/AdminUsersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import {
  PageHeader, TableCard, DataTable, Badge, Btn, FilterRow,
  FilterInput, FilterSelect, UserCell, Pagination,
  ConfirmModal, Modal, FormGroup, FormInput, FormSelect,
  useToast, PageLoader, T,
} from '../../components/admin/AdminUI';

const ROLE_OPTIONS = ['buyer', 'farmer'];
const STATUS_OPTIONS = ['active', 'banned'];

export default function AdminUsersPage() {
  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);

  // Filters
  const [search,   setSearch]   = useState('');
  const [role,     setRole]     = useState('');
  const [status,   setStatus]   = useState('');

  // Modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetUser,  setTargetUser]  = useState(null);
  const [actionType,  setActionType]  = useState(''); // 'delete' | 'ban' | 'unban'
  const [editOpen,    setEditOpen]    = useState(false);
  const [editUser,    setEditUser]    = useState(null);
  const [editRole,    setEditRole]    = useState('');
  const [busy,        setBusy]        = useState(false);
 
  const { show, ToastContainer } = useToast();

const load = useCallback(() => {
  setLoading(true);

  adminAPI.users({
    page,
    search: search || undefined,
    role: role || undefined,
    is_active:
      status === 'active'
        ? 'true'
        : status === 'banned'
        ? 'false'
        : undefined,
  })
    .then((res) => {
      const data = res.data;

      setUsers(Array.isArray(data?.results) ? data.results : []);
      setTotal(data?.count || 0);
    })
    .catch((err) => {
      console.error('Users API error:', err);
      setUsers([]);
      setTotal(0);
    })
    .finally(() => setLoading(false));
}, [page, search, role, status]);


  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => { const id = setTimeout(load, 400); return () => clearTimeout(id); }, [search]);

  // ── Actions ──────────────────────────────────────────────────────
  const openBan = (user) => {
    setTargetUser(user);
    setActionType(user.is_active ? 'ban' : 'unban');
    setConfirmOpen(true);
  };

  const openDelete = (user) => {
    setTargetUser(user);
    setActionType('delete');
    setConfirmOpen(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditRole(user.role);
    setEditOpen(true);
  };

  const handleConfirm = async () => {
    if (!targetUser) return;
    setBusy(true);
    try {
      if (actionType === 'delete') {
        await adminAPI.deleteUser(targetUser.id);
        show(`User "${targetUser.full_name}" deleted`, 'error');
        setUsers(u => u.filter(x => x.id !== targetUser.id));
        setTotal(t => t - 1);
      } else {
        await adminAPI.banUser(targetUser.id, actionType);
        show(`User "${targetUser.full_name}" ${actionType}ned`, actionType === 'ban' ? 'warning' : 'success');
        setUsers(u => u.map(x => x.id === targetUser.id ? { ...x, is_active: actionType === 'unban' } : x));
      }
      setConfirmOpen(false);
    } catch (e) {
      show(e.message || 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setBusy(true);
    try {
      await adminAPI.updateUser(editUser.id, { role: editRole });
      show('User updated successfully', 'success');
      setUsers(u => u.map(x => x.id === editUser.id ? { ...x, role: editRole } : x));
      setEditOpen(false);
    } catch (e) {
      show(e.message || 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────
  const columns = [
    {
      key: 'full_name', label: 'User',
      render: (v, row) => <UserCell name={v} email={row.email} />,
    },
    {
      key: 'role', label: 'Role',
      render: v => <Badge status={v} />,
    },
    {
      key: 'is_active', label: 'Status',
      render: v => <Badge status={v ? 'active' : 'banned'} />,
    },
    {
      key: 'products_count', label: 'Listings',
      render: v => (
        <span style={{ fontFamily: T.mono, color: T.textMid, fontSize: '0.78rem' }}>{v ?? 0}</span>
      ),
    },
    {
      key: 'date_joined', label: 'Joined',
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
          <Btn variant="ghost" size="sm" icon="✏" onClick={() => openEdit(row)} title="Edit role">Edit</Btn>
          {row.is_active
            ? <Btn variant="warning" size="sm" onClick={() => openBan(row)} title="Ban user">🚫 Ban</Btn>
            : <Btn variant="success" size="sm" onClick={() => openBan(row)} title="Unban user">✓ Unban</Btn>
          }
          <Btn variant="danger" size="icon" onClick={() => openDelete(row)} title="Delete user">🗑</Btn>
        </div>
      ),
    },
  ];

  const toolbar = (
    <FilterRow>
      <FilterInput
        placeholder="🔍 Search name or email…"
        value={search} onChange={setSearch} width={220}
      />
      <FilterSelect
        value={role} onChange={v => { setRole(v); setPage(1); }}
        options={ROLE_OPTIONS.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
        placeholder="All Roles"
      />
      <FilterSelect
        value={status} onChange={v => { setStatus(v); setPage(1); }}
        options={STATUS_OPTIONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
        placeholder="All Status"
      />
      <Btn variant="ghost" size="sm" onClick={load}>↻ Refresh</Btn>
    </FilterRow>
  );

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage all registered users, roles and access permissions"
        actions={
          <Btn variant="ghost" icon="📥">Export CSV</Btn>
        }
      />

      <TableCard
        title="All Users"
        count={total}
        toolbar={toolbar}
        footer={
          <Pagination current={page} total={total} pageSize={15} onChange={setPage} />
        }
      >
        <DataTable
          columns={columns}
          data={Array.isArray(users) ? users : []}
          loading={loading}
          emptyText="No users found matching your filters."
        />
      </TableCard>

      {/* ── Confirm modal ── */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={busy}
        title={actionType === 'delete' ? 'Delete User' : actionType === 'ban' ? 'Ban User' : 'Unban User'}
        message={
          actionType === 'delete'
            ? `Are you sure you want to permanently delete`
            : actionType === 'ban'
            ? `Are you sure you want to ban`
            : `Are you sure you want to unban`
        }
        target={targetUser?.full_name}
      />

      {/* ── Edit role modal ── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit User"
        maxWidth={380}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleEditSave} loading={busy}>Save Changes</Btn>
          </>
        }
      >
        {editUser && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: T.bg3, borderRadius: 10, marginBottom: 16, border: `1px solid ${T.border}` }}>
              <UserCell name={editUser.full_name} email={editUser.email} />
            </div>
            <FormGroup label="Role">
              <FormSelect
                value={editRole}
                onChange={setEditRole}
                options={ROLE_OPTIONS.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
              />
            </FormGroup>
          </>
        )}
      </Modal>

      <ToastContainer />
    </div>
  );
}
