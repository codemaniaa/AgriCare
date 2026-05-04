import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ──────────
api.interceptors.request.use(
  (config) => {
    console.log("Sending request with token:", config.headers.Authorization);
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — silent token refresh ────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/signin';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ───────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register/', data),
  verifyOTP:      (data) => api.post('/auth/verify-otp/', data),
  resendOTP:      (data) => api.post('/auth/resend-otp/', data),
  login:          (data) => api.post('/auth/login/', data),
  logout:         (data) => api.post('/auth/logout/', data),
  getProfile:     ()     => api.get('/auth/profile/'),
  updateProfile:  (data) => api.patch('/auth/profile/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data) => api.post('/auth/change-password/', data),
  forgotPassword: (data) => api.post('/auth/forgot-password/', data),
  resetPassword:  (data) => api.post('/auth/reset-password/', data),
  getDashboard:   ()     => api.get('/auth/dashboard/'),
};

// ── Products ───────────────────────────────────────────
export const productsAPI = {
  list:            (params) => api.get('/products/', { params }),
  detail:          (id)     => api.get(`/products/${id}/`),
  create:          (data)   => api.post('/products/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update:          (id, data) => api.patch(`/products/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:          (id)     => api.delete(`/products/${id}/`),
  myProducts:      ()       => api.get('/products/my_products/'),
  featured:        ()       => api.get('/products/featured/'),
  rate:            (id, data) => api.post(`/products/${id}/rate/`, data),
  subcategories:   (cat)    => api.get('/products/subcategories/', { params: { category: cat } }),
};

// ── Orders ─────────────────────────────────────────────
export const ordersAPI = {
  list:         (params) => api.get('/orders/', { params }),
  create:       (data)   => api.post('/orders/', data),
  detail:       (id)     => api.get(`/orders/${id}/`),
  updateStatus: (id, s)  => api.patch(`/orders/${id}/update_status/`, { status: s }),
  asSeller:     ()       => api.get('/orders/as_seller/'),
};

// ── Chat ───────────────────────────────────────────────
export const chatAPI = {
  conversations:  ()          => api.get('/chat/conversations/'),
  start:          (userId)    => api.post('/chat/conversations/start/', { user_id: userId }),
  messages:       (convId)    => api.get(`/chat/conversations/${convId}/messages/`),
  sendMessage: (convId, d) =>  api.post(`/chat/conversations/${convId}/messages/`, d),
};

// ── Notifications ──────────────────────────────────────
export const notificationsAPI = {
  list:         ()    => api.get('/notifications/'),
  unreadCount:  ()    => api.get('/notifications/unread_count/'),
  markRead:     (id)  => api.post(`/notifications/${id}/mark_read/`),
  markAllRead:  ()    => api.post('/notifications/mark_all_read/'),
};

// ── Wishlist (via products endpoints) ─────────────────
export const wishlistAPI = {
  list:   ()   => api.get('/products/wishlist/'),
  toggle: (id) => api.post(`/products/${id}/toggle_wishlist/`),
};

// ── Auctions ───────────────────────────────────────────
export const auctionsAPI = {
  list:     (params) => api.get('/auctions/', { params }),
  active:   ()       => api.get('/auctions/active/'),
  detail:   (id)     => api.get(`/auctions/${id}/`),
  create:   (data)   => api.post('/auctions/', data),
  update:   (id, d)  => api.patch(`/auctions/${id}/`, d),
  placeBid: (id, amt)=> api.post(`/auctions/${id}/place_bid/`, { amount: amt }),
  bids:     (id)     => api.get(`/auctions/${id}/bids/`),
  endNow:   (id)     => api.post(`/auctions/${id}/end_now/`),
};

// ── Payments ───────────────────────────────────────────
export const paymentsAPI = {
  initiate: (data)    => api.post('/payments/initiate/', data),
  status:   (txnId)   => api.get(`/payments/status/${txnId}/`),
  retry:    (txnId)   => api.post(`/payments/retry/${txnId}/`),
};

// ── Extended Orders ────────────────────────────────────
export const placeOrderAPI = {
  create: (data) => api.post('/orders/', data),
};



// ── Admin Panel ───────────────────────────────────────
// ── ADMIN PANEL ───────────────────────────────────────

export const adminAPI = {
  // Dashboard
  stats: () => api.get('/admin/stats/'),

  // Users
  users: (params) => api.get('/admin/users/', { params }),
  userDetail: (id) => api.get(`/admin/users/${id}/`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}/`),
  banUser: (id, action) => api.post(`/admin/users/${id}/ban/`, { action }),

  // Products
  products: (params) => api.get('/admin/products/', { params }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}/`),
  approveProduct: (id, action, reason) =>
    api.post(`/admin/products/${id}/approve/`, { action, reason }),

  // Orders
  orders: (params) => api.get('/admin/orders/', { params }),
  updateOrder: (id, status) =>
    api.patch(`/admin/orders/${id}/`, { status }),
  deleteOrder: (id) => api.delete(`/admin/orders/${id}/`),

  // Auctions
  
  auctions: (params) => api.get('/admin/auctions/', { params }),
  createAuction: (data) => api.post('/admin/auctions/create/', data),
  deleteAuction: (id) => api.delete(`/admin/auctions/${id}/`),
  toggleAuction: (id, action) =>
    api.post(`/admin/auctions/${id}/toggle/`, { action }),
  bids: (id) => api.get(`/admin/auctions/${id}/bids/`),

activity: () =>
  api.get('/admin/activity/'),

pending: () =>
  api.get('/admin/pending/'),

approveItem: (id, type) =>
  api.post(`/admin/approve/${id}/`, { type }),

rejectItem: (id, type) =>
  api.post(`/admin/reject/${id}/`, { type }),

updateOrderStatus: (id, status) =>
  api.patch(`/admin/orders/${id}/`, { status }),
};