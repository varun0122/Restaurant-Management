import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import BillingPage from './pages/BillingPage';
// Import the pages you moved
import KitchenDashboard from './pages/KitchenDashboard';
import AllOrdersPage from './pages/AllOrdersPage';
import AdminQRDownload from './pages/AdminQRDownload';
// --- IMPORT THE NEW PAGE ---
import MenuManagementPage from './pages/MenuManagementPage';
import StaffManagementPage from './pages/StaffManagementPage';
import StaffFormModal from './components/StaffFormModal';
import InventoryPage from './pages/InventoryPage';
import POSPage from './pages/POSPage';
import ProtectedRoute from './components/ProtectedRoute';
import DiscountsPage from './pages/DiscountsPage';
import './App.css';
// This component wraps our pages with the sidebar
const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="main-content">
        <button className="hamburger-button" onClick={() => setIsSidebarOpen(true)}>
          <FiMenu />
        </button>
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* --- Public routes for all staff --- */}
        <Route path="/pos" element={<AppLayout><POSPage /></AppLayout>} />
        <Route path="/kitchen" element={<AppLayout><KitchenDashboard /></AppLayout>} />

        {/* --- Protected routes for superusers only --- */}
        <Route path="/" element={<AppLayout><ProtectedRoute><DashboardPage /></ProtectedRoute></AppLayout>} />
        <Route path="/orders" element={<AppLayout><ProtectedRoute><AllOrdersPage /></ProtectedRoute></AppLayout>} />
        <Route path="/qr-codes" element={<AppLayout><ProtectedRoute><AdminQRDownload /></ProtectedRoute></AppLayout>} />
        <Route path="/billing" element={<AppLayout><ProtectedRoute><BillingPage /></ProtectedRoute></AppLayout>} />
        <Route path="/menu" element={<AppLayout><ProtectedRoute><MenuManagementPage /></ProtectedRoute></AppLayout>} />
        <Route path="/staff" element={<AppLayout><ProtectedRoute><StaffManagementPage /></ProtectedRoute></AppLayout>} />
        <Route path="/inventory" element={<AppLayout><ProtectedRoute><InventoryPage /></ProtectedRoute></AppLayout>} />
        <Route path="/discounts" element={<AppLayout><ProtectedRoute><DiscountsPage /></ProtectedRoute></AppLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
