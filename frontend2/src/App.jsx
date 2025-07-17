import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import CustomerLogin from './pages/CustomerLogin';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderHistory from './pages/OrderHistory';
import BillPage from './pages/BillPage';
import Navbar from './components/Navbar';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';
import AdminSummary from './pages/AdminSummary';
import AdminQRDownload from './pages/AdminQRDownload';
import Home from './pages/Home';
import PaymentSuccess from './pages/PaymentSuccess';
import Feedback from './pages/Feedback';
import SpecialsPage from './pages/SpecialsPage';
import MostLikedPage from './pages/MostLikedPage';
import Account from './pages/Account';

// Route protection
import {
  CustomerProtectedRoute,
  StaffProtectedRoute,
  AdminProtectedRoute,
} from './utils/ProtectedRoutes';

function App() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
  const [customer, setCustomer] = useState(() => {
    const data = localStorage.getItem('customer');
    return data ? JSON.parse(data) : null;
  });

  const handleAddToCart = (dish) => {
    const existing = cart.find(item => item.id === dish.id);
    let updatedCart;
    if (existing) {
      updatedCart = cart.map(item =>
        item.id === dish.id ? { ...item, quantity: item.quantity + dish.quantity } : item
      );
    } else {
      updatedCart = [...cart, { ...dish }];
    }
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleLogin = (user) => {
    setCustomer(user);
  };

  return (
    <Router>
      <Navbar customer={customer} />
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<CustomerLogin onLogin={handleLogin} />} />
        <Route path="/menu" element={<MenuPage cart={cart} setCart={setCart} />} />
        <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} onOrderPlaced={() => setCart([])} customer={customer} />} />
        <Route path="/specials" element={<SpecialsPage />} />
        <Route path="/most-liked" element={<MostLikedPage />} />
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/feedback" element={<Feedback />} />

        {/* Customer Protected Routes */}
        <Route path="/account" element={
          <CustomerProtectedRoute><Account /></CustomerProtectedRoute>
        } />
        <Route path="/history" element={
          <CustomerProtectedRoute><OrderHistory onAddToCart={handleAddToCart} /></CustomerProtectedRoute>
        } />
        <Route path="/bill" element={
          <CustomerProtectedRoute><BillPage cart={cart} /></CustomerProtectedRoute>
        } />

        {/* Staff Login */}
        <Route path="/staff/login" element={
          <StaffLogin onLogin={(user) => {
            localStorage.setItem('staff', JSON.stringify(user));
            window.location.href = "/staff/dashboard";
          }} />
        } />

        {/* Staff Protected Routes */}
        <Route path="/staff/dashboard" element={
          <StaffProtectedRoute><StaffDashboard /></StaffProtectedRoute>
        } />

        {/* Admin Protected Routes */}
        <Route path="/staff/summary" element={
          <AdminProtectedRoute><AdminSummary /></AdminProtectedRoute>
        } />
        <Route path="/admin/qr-codes" element={
          <AdminProtectedRoute><AdminQRDownload /></AdminProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/menu" />} />
      </Routes>
    </Router>
  );
}

export default App;
