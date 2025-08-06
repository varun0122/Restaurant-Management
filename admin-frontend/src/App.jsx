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
        
        {/* Wrap all protected pages in the AppLayout */}
        <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/kitchen" element={<AppLayout><KitchenDashboard /></AppLayout>} />
        <Route path="/orders" element={<AppLayout><AllOrdersPage /></AppLayout>} />
        <Route path="/qr-codes" element={<AppLayout><AdminQRDownload /></AppLayout>} />
        <Route path="/billing" element={<AppLayout><BillingPage /></AppLayout>} />
        
        {/* --- ADD THE ROUTE FOR THE NEW PAGE HERE --- */}
        <Route path="/menu" element={<AppLayout><MenuManagementPage /></AppLayout>} />
        <Route path="/staff" element={<AppLayout><StaffManagementPage /></AppLayout>} />

      </Routes>
    </Router>
  );
}

export default App;
