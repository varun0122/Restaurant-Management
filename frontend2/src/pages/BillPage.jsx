import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './BillPage.module.css';

const BillPage = () => {
  const { billId } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [discountCode, setDiscountCode] = useState('');

  const fetchBillDetails = async () => {
    try {
      const token = localStorage.getItem('customer_access_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`http://127.0.0.1:8000/api/billing/customer/${billId}/`, config);
      setBill(response.data);
    } catch (err) {
      setError('Could not fetch your bill details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillDetails();
  }, [billId]);

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    try {
      const token = localStorage.getItem('customer_access_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`http://127.0.0.1:8000/api/billing/customer/${billId}/apply-discount/`, { code: discountCode }, config);
      fetchBillDetails(); // Refresh bill details
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || 'Failed to apply discount.'}`);
    }
  };

  const handleRequestSpecialDiscount = async () => {
    try {
      const token = localStorage.getItem('customer_access_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`http://127.0.0.1:8000/api/billing/customer/${billId}/request-special-discount/`, {}, config);
      alert(response.data.message);
      fetchBillDetails(); // Refresh bill details
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || 'Failed to request discount.'}`);
    }
  };


  if (loading) return <div className={styles.container}><h2>Loading Your Bill...</h2></div>;
  if (error || !bill) return <div className={styles.container}><h2>{error || 'Bill not found.'}</h2></div>;

  // --- FIX: Explicitly convert all values to numbers using parseFloat ---
  const subtotal = parseFloat(bill.total_amount || 0);
  const discount = parseFloat(bill.discount_amount || 0);
  const totalAfterDiscount = subtotal - discount;
  const taxes = totalAfterDiscount * 0.05; // 5% tax on the discounted amount
  const grandTotal = totalAfterDiscount + taxes;

  return (
    <div className={styles.container}>
      <div className={styles.billCard}>
        <h3>Bill for Table {bill.table_number}</h3>
        <p className={styles.billId}>Bill ID: #{bill.id}</p>
        
        <div className={styles.itemsSection}>
          <h4>Itemized List</h4>
          <ul className={styles.itemList}>
            {(bill.orders || []).flatMap(order => order.items || []).map(item => (
              <li key={`${bill.id}-${item.id || Math.random()}`}>
                <span>{item.dish?.name || 'Unknown Item'} x {item.quantity}</span>
                <span>₹{((item.dish?.price || 0) * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.totalsSection}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {bill.applied_discount && (
            <div className={`${styles.totalRow} ${styles.discount}`}>
              <span>Discount ({bill.applied_discount.code})</span>
              <span>- ₹{discount.toFixed(2)}</span>
            </div>
          )}
           <div className={styles.totalRow}>
            <span>Taxes (5%)</span>
            <span>₹{taxes.toFixed(2)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <strong>Grand Total</strong>
            <strong>₹{grandTotal.toFixed(2)}</strong>
          </div>
        </div>

        {!bill.applied_discount && (
          <div className={styles.discountInputSection}>
            <input 
              type="text" 
              placeholder="Enter Discount Code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
            />
            <button onClick={handleApplyDiscount}>Apply</button>
          </div>
        )}

        <div className={styles.footer}>
          {bill.discount_request_pending ? (
            <p className={styles.pendingMessage}>Special discount requested. Waiting for staff approval.</p>
          ) : (
            <button className={styles.specialDiscountButton} onClick={handleRequestSpecialDiscount}>
              Request Student Discount
            </button>
          )}
          <p>Please pay the total amount at the counter.</p>
          <Link to="/history" className={styles.backButton}>Back to Orders</Link>
        </div>
      </div>
    </div>
  );
};

export default BillPage;
