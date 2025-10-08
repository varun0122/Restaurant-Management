import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext'; // Import the provider

// Import all your pages and components
import OrderStatusPage from './pages/OrderStatusPage';
import FoodTypeFilter from './components/FoodTypeFilter';
import Navbar from './components/Navbar';
import Categories from './components/Categories';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderHistory from './pages/OrderHistory';
import BillPage from './pages/BillPage';
import PaymentSuccess from './pages/PaymentSuccess';
import Feedback from './pages/Feedback';
import SpecialsPage from './pages/SpecialsPage';
import MostLikedPage from './pages/MostLikedPage';
import Account from './pages/Account';

import { CustomerProtectedRoute } from './utils/ProtectedRoutes';
import { Toaster } from 'react-hot-toast';
import { emitter } from './api/axiosConfig';
import LoginModal from './components/LoginModal';
import AddItemModal from './components/AddItemModal';
import toast from 'react-hot-toast';

const AppLayout = () => {
    // --- CART LOGIC IS REMOVED FROM HERE ---

    // All other global state remains
    const [customer, setCustomer] = useState(() => JSON.parse(localStorage.getItem('customer')) || null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedFoodType, setSelectedFoodType] = useState('all');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [modalDish, setModalDish] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();
    const showSearchAndCategories = ['/menu'].includes(location.pathname);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tableNumber = searchParams.get('table');
        if (tableNumber) {
            localStorage.setItem('tableNumber', tableNumber);
        }
    }, [location]);

    // Updated global logout handler
    useEffect(() => {
        const logoutHandler = () => {
            setCustomer(null);
            localStorage.setItem('redirectAfterLogin', location.pathname); // Save current page
            setShowLoginModal(true);
            toast.error('Session expired. Please log in again.');
            navigate('/', { replace: true });
        };
        emitter.on('logout', logoutHandler);
        return () => emitter.off('logout', logoutHandler);
    }, [navigate, location.pathname]);

    // Updated login handler
    const handleLogin = (user) => {
        setCustomer(user);
        localStorage.setItem('customer', JSON.stringify(user));
        setShowLoginModal(false);

        const redirectPath = localStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            localStorage.removeItem('redirectAfterLogin');
            navigate(redirectPath);
        }
    };

    const requestLogin = () => {
        setShowLoginModal(true);
    };

    return (
        <>
            <Navbar
                customer={customer}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                showSearch={showSearchAndCategories}
                openLoginModal={requestLogin}
            />
            {showSearchAndCategories && (
                <>
                    <Categories selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
                    <FoodTypeFilter selectedFoodType={selectedFoodType} setSelectedFoodType={setSelectedFoodType} />
                </>
            )}
            <Toaster position="top-right" />
            <Routes>
                {/* Components no longer need cart props passed down */}
                <Route path="/" element={<HomePage setModalDish={setModalDish} />} />
                <Route path="/menu" element={<MenuPage searchTerm={searchTerm} selectedCategory={selectedCategory} selectedFoodType={selectedFoodType} setModalDish={setModalDish} />} />
                <Route path="/cart" element={<CartPage onLogin={handleLogin} customer={customer} requestLogin={requestLogin} />} />
                <Route path="/order-status/:orderId" element={<CustomerProtectedRoute customer={customer}><OrderStatusPage /></CustomerProtectedRoute>} />
                <Route path="/order-status" element={<CustomerProtectedRoute customer={customer}><OrderStatusPage /></CustomerProtectedRoute>} />
                <Route path="/specials" element={<SpecialsPage setModalDish={setModalDish} />} />
                <Route path="/most-liked" element={<MostLikedPage setModalDish={setModalDish} />} />
                <Route path="/success" element={<PaymentSuccess />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/account" element={<CustomerProtectedRoute customer={customer}><Account /></CustomerProtectedRoute>} />
                <Route path="/history" element={<CustomerProtectedRoute customer={customer}><OrderHistory /></CustomerProtectedRoute>} />
                <Route path="/bill/:billId" element={<CustomerProtectedRoute customer={customer}><BillPage /></CustomerProtectedRoute>} />
                <Route path="*" element={<Navigate to="/menu" />} />
            </Routes>

            {modalDish && (<AddItemModal dish={modalDish} onClose={() => setModalDish(null)} />)}
            {showLoginModal && (<LoginModal onLoginSuccess={handleLogin} onClose={() => setShowLoginModal(false)} tableNumber={localStorage.getItem('tableNumber')} />)}
        </>
    );
};

const App = () => (
    <Router>
        <CartProvider> {/* The provider now wraps your entire application */}
            <AppLayout />
        </CartProvider>
    </Router>
);

export default App;