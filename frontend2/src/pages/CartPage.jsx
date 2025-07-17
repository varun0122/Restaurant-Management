import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CartPage = ({ cart, setCart, onOrderPlaced }) => {
  const navigate = useNavigate();
  const customer = JSON.parse(localStorage.getItem('customer'));

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

  const placeOrder = async () => {
    if (!customer) {
      alert("⚠️ Please login before placing an order.");
      navigate("/login");
      return;
    }

    const items = cart.map(item => ({
      dish_id: item.id,
      quantity: item.quantity,
    }));

    try {
      await axios.post('http://127.0.0.1:8000/api/orders/place/', {
        customer: customer.id,
        items,
      });
      alert("✅ Order placed successfully!");
      setCart([]);
      localStorage.removeItem("cart");
      onOrderPlaced();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to place order. Please try again.");
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
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
            <strong>₹{total}</strong>
          </div>

          <button className="btn btn-success w-100 mt-3" onClick={placeOrder}>
            Place Order
          </button>
        </>
      )}
    </div>
  );
};

export default CartPage;
