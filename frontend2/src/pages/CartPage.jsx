import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './CartPage.module.css'; // Create this CSS file for styling
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

// The component now expects `customer` and `requestLogin` from App.jsx
const CartPage = ({customer, requestLogin, onOrderPlaced }) => {
  const { cart, setCart } = useCart(); 
  const navigate = useNavigate();

  // REMOVED: No more local state for the login modal
  // const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const updateQuantity = (dishId, newQty) => {
    let updatedCart;
    if (newQty < 1) {
      updatedCart = cart.filter(item => item.id !== dishId);
    } else {
      updatedCart = cart.map(item => 
        item.id === dishId ? { ...item, quantity: newQty } : item
      );
    }
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };
  
  const handlePlaceOrderClick = async () => {
    if (!customer) {
    console.log("⚠️ Not logged in, opening login modal...");
    requestLogin();   // opens login modal from App.jsx
    return;           // prevent API call
  }
    // UPDATED: Check the `customer` prop instead of localStorage
    if (customer) {
      // If logged in, execute the order
      const tableNumber = localStorage.getItem('tableNumber');
      if (!tableNumber) {
        toast.error("Table number not found. Please scan a QR code again.");
        return;
      }

      const orderData = {
        items: cart.map(item => ({ dish: item.id, quantity: item.quantity })),
        table_number: parseInt(tableNumber, 10),
      };

      try {
        const response = await apiClient.post('/orders/place/', orderData);
        toast.success("✅ Order placed successfully!");
        setCart([]);
        localStorage.removeItem("cart");
        if(onOrderPlaced) onOrderPlaced();
        navigate(`/order-status/${response.data.id}`);
      } catch (err) {
        console.error("Order placement failed:", err.response?.data || err.message);
        toast.error("❌ Failed to place order. Please try again.");
      }
    } else {
      // If not logged in, call the global login function from App.jsx
      requestLogin();
    }
  };
  
  // REMOVED: handleLoginSuccess is no longer needed here. App.jsx handles it.

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className={styles.container}>
      <h4>Your Cart</h4>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.id} className={styles.cartItem}>
              <div>
                <h6>{item.name}</h6>
                <p className={styles.price}>₹{item.price} × {item.quantity}</p>
              </div>
              <div className={styles.quantityControls}>
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
            </div>
          ))}
          <div className={styles.total}>
            <strong>Total</strong>
            <strong>₹{total.toFixed(2)}</strong>
          </div>
          <button className={styles.placeOrderButton} onClick={handlePlaceOrderClick}>
            {customer ? 'Place Order' : 'Login to Place Order'}
          </button>
        </>
      )}
      {/* REMOVED: The local <LoginModal /> is no longer here. */}
    </div>
  );
};

export default CartPage;