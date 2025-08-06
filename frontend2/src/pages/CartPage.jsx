import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';

const CartPage = ({ cart, setCart, onOrderPlaced, onLogin }) => {
  // --- FIX: useNavigate must be called inside the component function. ---
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const updateQuantity = (dishId, newQty) => {
    let updated = [...cart];
    if (newQty < 1) {
      updated = updated.filter(item => item.id !== dishId);
    } else {
      const index = updated.findIndex(item => item.id === dishId);
      if (index !== -1) {
        updated[index].quantity = newQty;
      }
    }
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const executePlaceOrder = async (loggedInCustomer) => {
    const tableNumber = localStorage.getItem('tableNumber');
    if (!tableNumber) {
        alert("Error: Table number not found. Please scan a QR code again.");
        return;
    }

    const items_data = cart.map(item => ({
      dish_id: item.id,
      quantity: item.quantity,
    }));

    try {
      // --- FIX: Capture the response from the server ---
      const response = await axios.post('http://127.0.0.1:8000/api/orders/place/',{
        customer_id: loggedInCustomer.id,
        items: items_data,
        table_number: parseInt(tableNumber, 10),
      });
      
      alert("✅ Order placed successfully!");
      
      setCart([]);
      localStorage.removeItem("cart");
      onOrderPlaced();

      // --- FIX: Redirect to the specific order status page ---
      navigate(`/order-status/${response.data.id}`);

    } catch (err)      {
      console.error("Order placement failed:", err.response?.data || err.message);
      alert("❌ Failed to place order. Please try again.");
    }
  };

  const handlePlaceOrderClick = () => {
    const customer = JSON.parse(localStorage.getItem('customer'));
    if (customer) {
      executePlaceOrder(customer);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (loggedInCustomer) => {
    localStorage.setItem('customer', JSON.stringify(loggedInCustomer));
    if(onLogin) {
      onLogin(loggedInCustomer);
    }
    setIsLoginModalOpen(false);
    executePlaceOrder(loggedInCustomer);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <div className="container mt-4">
        <h4>Your Cart</h4>
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                  <h6>{item.name}</h6>
                  <p className="mb-0">₹{item.price} × {item.quantity}</p>
                </div>
                <div>
                  <button className="btn btn-sm btn-secondary me-1" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                  <span className="mx-1">{item.quantity}</span>
                  <button className="btn btn-sm btn-secondary" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
              </div>
            ))}

            <div className="mt-3 d-flex justify-content-between">
              <strong>Total</strong>
              <strong>₹{total.toFixed(2)}</strong>
            </div>

            <button className="btn btn-success w-100 mt-3" onClick={handlePlaceOrderClick}>
              Place Order
            </button>
          </>
        )}
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        tableNumber={localStorage.getItem('tableNumber')}
      />
    </>
  );
};

export default CartPage;
