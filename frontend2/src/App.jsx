import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import OrderStatusPage from './pages/OrderStatusPage';
import FoodTypeFilter from './components/FoodTypeFilter';
import Navbar from './components/Navbar';
import Categories from './components/Categories';

import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderHistory from './pages/OrderHistory';
import BillPage from './pages/BillPage'; 
import Home from './pages/Home';
import PaymentSuccess from './pages/PaymentSuccess';
import Feedback from './pages/Feedback';
import SpecialsPage from './pages/SpecialsPage';
import MostLikedPage from './pages/MostLikedPage';
import Account from './pages/Account';

import { CustomerProtectedRoute } from './utils/ProtectedRoutes';
import { Toaster } from 'react-hot-toast';

// =====================================================================================
// APP LAYOUT: Main component with logic and shared layout
// =====================================================================================
const AppLayout = () => {
  // State
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
  const [customer, setCustomer] = useState(() => {
    const data = localStorage.getItem('customer');
    return data ? JSON.parse(data) : null;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFoodType, setSelectedFoodType] = useState('all');

  const location = useLocation();
  const showSearchAndCategories = ['/', '/menu'].includes(location.pathname);

  // Add to cart logic
  const handleAddToCart = (dish) => {
    const existing = cart.find(item => item.id === dish.id);
    const updatedCart = existing
      ? cart.map(item => item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cart, { ...dish, quantity: 1 }];

    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // Login handler
  const handleLogin = (user) => {
    setCustomer(user);
  };

  return (
    <>
      <Navbar
        customer={customer}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showSearch={showSearchAndCategories}
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
        <Route path="/" element={<Home />} />

        <Route
          path="/menu"
          element={
            <MenuPage
              cart={cart}
              setCart={setCart}
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
              selectedFoodType={selectedFoodType}
            />
          }
        />
        <Route path="/order-status/:orderId" element={<CustomerProtectedRoute><OrderStatusPage /></CustomerProtectedRoute>} />
        <Route
          path="/cart"
          element={
            <CartPage
              cart={cart}
              setCart={setCart}
              onOrderPlaced={() => setCart([])}
              onLogin={handleLogin}
            />
          }
        />

        <Route path="/specials" element={<SpecialsPage />} />
        <Route path="/most-liked" element={<MostLikedPage />} />
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/feedback" element={<Feedback />} />

        <Route
          path="/account"
          element={
            <CustomerProtectedRoute>
              <Account />
            </CustomerProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <CustomerProtectedRoute>
              <OrderHistory onAddToCart={handleAddToCart} />
            </CustomerProtectedRoute>
          }
        />

       <Route path="/bill/:billId" element={<CustomerProtectedRoute><BillPage /></CustomerProtectedRoute>} />

        <Route path="*" element={<Navigate to="/menu" />} />
      </Routes>
    </>
  );
};

// =====================================================================================
// MAIN APP COMPONENT
// =====================================================================================
const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;
