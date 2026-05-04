// ── ProfilePage.jsx ────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { extractError } from '../utils';
import Navbar from '../components/layout/Navbar';
import { Toast} from '../components/common';
import {BottomNav} from '../components/layout/SubNavbar';

const G1 = '#2d6a4f';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ full_name: user?.full_name || '', city: user?.city || '' });
  const [pwForm,  setPwForm]  = useState({ old_password: '', new_password: '' });
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [error,   setError]   = useState('');

  const inputSt = { width: '100%', padding: '10px 14px', border: '1.5px solid #d0ebd6', borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' };
  const labelSt = { fontSize: 12, fontWeight: 500, color: '#1a2e1d', marginBottom: 4, display: 'block' };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name);
      fd.append('city', form.city);
      const { data } = await authAPI.updateProfile(fd);
      updateUser(data);
      setToast({ msg: 'Profile updated!', type: 'success' });
    } catch (err) { setError(extractError(err)); }
    finally { setSaving(false); }
  };

  const savePw = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await authAPI.changePassword(pwForm);
      setToast({ msg: 'Password changed!', type: 'success' });
      setPwForm({ old_password: '', new_password: '' });
    } catch (err) { setError(extractError(err)); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8fdf9', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ background: '#fff', borderBottom: '1px solid #d0ebd6', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/dashboard')} style={{ width: 36, height: 36, border: '1.5px solid #d0ebd6', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 18 }}>←</button>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600 }}>Profile Settings</div>
      </div>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 20px 80px' }}>
        {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#40916c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{user?.username}</div>
          <div style={{ fontSize: 12, color: '#5a7a5e', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>

        {/* Profile form */}
        <div style={{ background: '#fff', border: '1px solid #d0ebd6', borderRadius: 14, padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Personal Information</div>
          <form onSubmit={saveProfile}>
            <div style={{ marginBottom: 14 }}><label style={labelSt}>Full Name</label><input style={inputSt} value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelSt}>Username</label><input style={{ ...inputSt, opacity: 0.6 }} value={user?.username || ''} readOnly /></div>
            <div style={{ marginBottom: 14 }}><label style={labelSt}>City</label><input style={inputSt} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelSt}>CNIC</label><input style={{ ...inputSt, opacity: 0.6 }} value={user?.cnic || ''} readOnly /></div>
            <input placeholder="Phone" style={inputSt} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <input placeholder="Address" style={inputSt} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            <button type="submit" style={{ width: '100%', padding: 12, background: G1, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            
          </form>
        </div>

        {/* Change password */}
        <div style={{ background: '#fff', border: '1px solid #d0ebd6', borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Change Password</div>
          <form onSubmit={savePw}>
            <div style={{ marginBottom: 14 }}><label style={labelSt}>Current Password</label><input type="password" style={inputSt} value={pwForm.old_password} onChange={(e) => setPwForm((f) => ({ ...f, old_password: e.target.value }))} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelSt}>New Password (min 8 chars)</label><input type="password" style={inputSt} value={pwForm.new_password} onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))} /></div>
            <button type="submit" style={{ width: '100%', padding: 12, background: '#1b4332', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }} disabled={saving}>
              {saving ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
