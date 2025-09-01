import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Account.module.css';
import { FiLogOut, FiShoppingBag, FiStar } from 'react-icons/fi';

const Account = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({});

  // Reusable fetch function
  const fetchCustomer = useCallback(async () => {
    try {
      const token = localStorage.getItem('customer_access_token');
      if (!token) return; // no login

      const response = await axios.get(
        'http://127.0.0.1:8000/api/customers/me/',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem('customer', JSON.stringify(response.data));
      setCustomer(response.data);
    } catch (error) {
      console.error("⚠️ Failed to fetch customer:", error.message);
      const storedCustomer = JSON.parse(localStorage.getItem('customer')) || {};
      setCustomer(storedCustomer);
    }
  }, []);

  // On component mount -> fetch latest
  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  // Function to mark bill as paid and refresh coins
  const handlePayBill = async (billId) => {
    try {
      const token = localStorage.getItem('customer_access_token');
      await axios.patch(
        `http://127.0.0.1:8000/api/bills/${billId}/pay/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Refresh customer coins after payment
      fetchCustomer();
      alert("✅ Bill paid successfully, coins updated!");
    } catch (error) {
      console.error("❌ Error paying bill:", error.message);
      alert("Error paying bill!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer');
    localStorage.removeItem('customer_access_token');
    localStorage.removeItem('customer_refresh_token');
    localStorage.removeItem('active_order_id');
    navigate('/menu');
  };

  const coins = customer.loyalty_coins || 0;
  const coinValue = (coins / 10).toFixed(2);

  return (
    <div className={styles.container}>
      <h4>Your Account</h4>
      <div className={styles.accountCard}>
        <p><strong>Mobile:</strong> {customer.phone_number || 'N/A'}</p>

        <div className={styles.loyaltySection}>
          <h5><FiStar className={styles.icon} /> Loyalty Coins</h5>
          <div className={styles.coinBalance}>{coins} 🪙</div>
          <p className={styles.coinValue}>
            You have {coins} coins, worth <strong>₹{coinValue}</strong> on your next order.
          </p>
        </div>

        <div className={styles.buttonGroup}>
          <button className={styles.historyButton} onClick={() => navigate('/history')}>
            <FiShoppingBag /> Order History
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>

        
      </div>
    </div>
  );
};

export default Account;
