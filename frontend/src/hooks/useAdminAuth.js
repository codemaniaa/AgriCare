import { useContext, createContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

const loginAdmin = (userData, access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  localStorage.setItem('admin_user', JSON.stringify(userData));
  setAdmin(userData);
};

  const logoutAdmin = (userData, access, refresh) => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
    setAdmin(null);
  };

  const isAdmin = () =>
    admin && (admin.is_staff || admin.is_superuser || admin.role === 'admin');

  return (
    <AdminAuthContext.Provider value={{ admin, loading, loginAdmin, logoutAdmin, isAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);

// ✅ FIXED RequireAdmin
export function RequireAdmin({ children }) {
  const context = useAdminAuth();

  // 🛑 Prevent crash
  if (!context) return null;

  const { admin, loading, isAdmin } = context;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h3>Checking access...</h3>
      </div>
    );
  }

  if (!admin || !isAdmin()) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

 
