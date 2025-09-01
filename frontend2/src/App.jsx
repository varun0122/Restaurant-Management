import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

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
import AddItemModal from './components/AddItemModal'; // Import AddItemModal here
import toast from 'react-hot-toast';

const AppLayout = () => {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
  const [customer, setCustomer] = useState(() => {
    const data = localStorage.getItem('customer');
    return data ? JSON.parse(data) : null;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFoodType, setSelectedFoodType] = useState('all');

  const [showLoginModal, setShowLoginModal] = useState(false);

  // Add modalDish state to handle AddItemModal for specials, most liked, menu
  const [modalDish, setModalDish] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const showSearchAndCategories = ['/menu'].includes(location.pathname);
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tableNumber = searchParams.get('table');
    
    if (tableNumber) {
      // If a table number is found in the URL, save it to localStorage.
      localStorage.setItem('tableNumber', tableNumber);
      console.log(`Table number ${tableNumber} saved to localStorage.`); // Optional: for debugging
    }
  }, [location]);
  // Listen to token expiry logout events globally
  useEffect(() => {
    const logoutHandler = () => {
      setCustomer(null);
      setShowLoginModal(true);
      toast.error('Session expired. Please log in again.');
      navigate('/', { replace: true }); // Redirect to homepage or login route as needed
    };
    emitter.on('logout', logoutHandler);
    return () => {
      emitter.off('logout', logoutHandler);
    };
  }, [navigate]);

  const handleAddToCart = (dish) => {
    const existing = cart.find(item => item.id === dish.id);
    const updatedCart = existing
      ? cart.map(item => item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cart, { ...dish, quantity: 1 }];
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleLogin = (user) => {
  setCustomer(user);
  localStorage.setItem('customer', JSON.stringify(user)); // <-- Add this line
  setShowLoginModal(false);
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
        cart = {cart}
      />
      {showSearchAndCategories && (
        <>
          <Categories 
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
          <FoodTypeFilter
            selectedFoodType={selectedFoodType}
            setSelectedFoodType={setSelectedFoodType}
          />
        </>
      )}
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/menu"
          element={
            <MenuPage
              cart={cart}
              setCart={setCart}
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
              selectedFoodType={selectedFoodType}
              modalDish={modalDish}         // pass modalDish
              setModalDish={setModalDish}   // pass setModalDish
            />
          }
        />
        <Route
          path="/order-status/:orderId"
          element={
            <CustomerProtectedRoute customer={customer}>
              <OrderStatusPage />
            </CustomerProtectedRoute>
          }
        />
         <Route
          path="/order-status"
          element={
            <CustomerProtectedRoute customer={customer}>
              <OrderStatusPage />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <CartPage
              cart={cart}
              setCart={setCart}
              onOrderPlaced={() => setCart([])}
              onLogin={handleLogin}
              customer={customer}
              requestLogin={requestLogin}
            />
          }
        />


        <Route 
          path="/specials"
          element={
            <SpecialsPage
              cart={cart}
              setCart={setCart}
              modalDish={modalDish}
              setModalDish={setModalDish}
            />
          }
        />
        <Route 
          path="/most-liked"
          element={
            <MostLikedPage
              cart={cart}
              setCart={setCart}
              modalDish={modalDish}
              setModalDish={setModalDish}
            />
          }
        />
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route
          path="/account"
          element={
            <CustomerProtectedRoute customer={customer}>
              <Account />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <CustomerProtectedRoute customer={customer}>
              <OrderHistory onAddToCart={handleAddToCart} />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/bill/:billId"
          element={
            <CustomerProtectedRoute customer={customer}>
              <BillPage />
            </CustomerProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/menu" />} />
      </Routes>

      {/* Global Add Item modal */}
      {modalDish && (
        <AddItemModal
          dish={modalDish}
          cart={cart}
          setCart={setCart}
          onClose={() => setModalDish(null)}
        />
      )}

      {/* Global Login Modal */}
      {showLoginModal && (
  <LoginModal
    onLoginSuccess={handleLogin} 
    onClose={() => setShowLoginModal(false)}
    tableNumber={localStorage.getItem('tableNumber')}
  />
)}
    </>
  );
};

const App = () => (
  <Router>
    <AppLayout />
  </Router>
);

export default App;
