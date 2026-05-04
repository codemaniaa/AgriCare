import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Spinner } from './components/common';
import AuctionHistoryPage from './pages/AuctionHistoryPage';
import HomePage             from './pages/HomePage';
import { SignInPage, SignUpPage, OTPPage,
         ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import DashboardPage        from './pages/DashboardPage';
import { ProductManagementPage, AddProductPage } from './pages/ProductPages';
import { ChatPage } from './pages/ChatOrdersPages';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage }      from './pages/ProfilePage';
import ProductDetailPage    from './pages/ProductDetailPage';
import SearchResultsPage    from './pages/SearchResultsPage';
import WishlistPage         from './pages/WishlistPage';
import NotFoundPage         from './pages/NotFoundPage';
import PlaceOrderPage       from './pages/PlaceOrderPage';
import TransactionPage      from './pages/TransactionPage';
import AuctionListPage      from './pages/AuctionListPage';
import AuctionDetailPage    from './pages/AuctionDetailPage';
import AuctionsPage from './pages/AuctionsPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import { RequireAdmin } from "./hooks/useAdminAuth";

import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardHome from "./pages/admin/AdminDashboardHome";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminAuctionsPage from "./pages/admin/AdminAuctionsPage";
import LandingEntry from './pages/landing/index';
import ProductsPage from './pages/ProductsPage';
import PublicProfile from "./pages/PublicProfilePage";
import './index.css';
// import { AuthPages } from './pages/AuthPages';
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/signin" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingEntry />} /> 
      <Route path="/product/:id"  element={<ProductDetailPage />} />
      <Route path="/search"       element={<SearchResultsPage />} />
      <Route path="/auctions"     element={<AuctionListPage />} />
      <Route path="/auctions/:id" element={<AuctionDetailPage />} />
      <Route path="/auctions/history" element={<AuctionHistoryPage />} />
      <Route path="/auctions" element={<AuctionsPage />} />
      <Route path="/allproducts" element={<ProductsPage />} />
      <Route path="/profile/:username" element={<PublicProfile />} />
      {/* Guest only */}
      <Route path="/signin"          element={<GuestRoute><SignInPage /></GuestRoute>} />
      <Route path="/signup"          element={<GuestRoute><SignUpPage /></GuestRoute>} />
      <Route path="/verify-otp"      element={<GuestRoute><OTPPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password"  element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
      <Route path="/create-auction" element={<CreateAuctionPage />} />
      {/* Protected */}
      <Route path="/dashboard"        element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/products"         element={<PrivateRoute><ProductManagementPage /></PrivateRoute>} />
      <Route path="/add-product"      element={<PrivateRoute><AddProductPage /></PrivateRoute>} />
      <Route path="/edit-product/:id" element={<PrivateRoute><AddProductPage /></PrivateRoute>} />
      <Route path="/orders"           element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
      <Route path="/chat"             element={<PrivateRoute><ChatPage /></PrivateRoute>} />
      <Route path="/profile"          element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/wishlist"         element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
      <Route path="/place-order"      element={<PrivateRoute><PlaceOrderPage /></PrivateRoute>} />
      <Route path="/transaction"      element={<PrivateRoute><TransactionPage /></PrivateRoute>} />
       
         <Route
  path="/admin/*"
  element={
    <RequireAdmin>
      <AdminLayout />
    </RequireAdmin>
  }
>
    <Route index element={<AdminDashboardHome />} />
    <Route path="users" element={<AdminUsersPage />} />
    <Route path="products" element={<AdminProductsPage />} />
    <Route path="orders" element={<AdminOrdersPage />} />
    <Route path="auctions" element={<AdminAuctionsPage />} />
  </Route>
  
      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
