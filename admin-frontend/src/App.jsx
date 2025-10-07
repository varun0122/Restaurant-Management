import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import BillingPage from './pages/BillingPage';
import KitchenDashboard from './pages/KitchenDashboard';
import AllOrdersPage from './pages/AllOrdersPage';
import AdminQRDownload from './pages/AdminQRDownload';
import MenuManagementPage from './pages/MenuManagementPage';
import StaffManagementPage from './pages/StaffManagementPage';
import InventoryPage from './pages/InventoryPage';
import POSPage from './pages/POSPage';
import ProtectedRoute from './components/ProtectedRoute';
import DiscountsPage from './pages/DiscountsPage';
import CounterPage from './pages/CounterPage';

import './App.css';

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="main-content">
        <button className="hamburger-button" onClick={() => setIsSidebarOpen(true)}>
          <FiMenu />
        </button>
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- FIX: The login route is now standalone and NOT inside the layout --- */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* This parent route applies the sidebar layout to all its children */}
        <Route element={<AppLayout />}>
            <Route path="/pos" element={<POSPage />} />
            <Route path="/kitchen" element={<KitchenDashboard />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><AllOrdersPage /></ProtectedRoute>} />
            <Route path="/Counter" element={<ProtectedRoute><CounterPage /></ProtectedRoute>} />
            <Route path="/qr-codes" element={<ProtectedRoute><AdminQRDownload /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute><MenuManagementPage /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute><StaffManagementPage /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
            <Route path="/discounts" element={<ProtectedRoute><DiscountsPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
