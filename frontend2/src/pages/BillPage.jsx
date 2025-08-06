import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './BillPage.module.css';

const BillPage = () => {
  const { billId } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBillDetails = async () => {
      try {
        const token = localStorage.getItem('customer_access_token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`http://127.0.0.1:8000/api/billing/${billId}/`, config);
        setBill(response.data);
      } catch (err) {
        setError('Could not fetch your bill details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBillDetails();
  }, [billId]);

  if (loading) {
    return <div className={styles.container}><h2>Loading Your Bill...</h2></div>;
  }

  if (error || !bill) { // Added a check for the bill object itself
    return <div className={styles.container}><h2>{error || 'Bill not found.'}</h2></div>;
  }

  const subtotal = bill.total_amount || 0;
  const taxes = subtotal * 0.05; // Example: 5% tax
  const grandTotal = subtotal + taxes;

  return (
    <div className={styles.container}>
      <div className={styles.billCard}>
        <h3>Bill for Table {bill.table_number}</h3>
        <p className={styles.billId}>Bill ID: #{bill.id}</p>
        
        <div className={styles.itemsSection}>
          <h4>Itemized List</h4>
          <ul className={styles.itemList}>
            {/* --- THE FIX IS HERE --- */}
            {/* We use optional chaining (?.) and default to an empty array ([]) */}
            {/* to prevent the page from crashing if the data is incomplete. */}
            {(bill.orders || []).flatMap(order => order.items || []).map(item => (
              <li key={`${bill.id}-${item.id}`}>
                <span>{item.dish?.name || 'Unknown Item'} x {item.quantity}</span>
                <span>₹{(item.dish?.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.totalsSection}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Taxes (5%)</span>
            <span>₹{taxes.toFixed(2)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <strong>Grand Total</strong>
            <strong>₹{grandTotal.toFixed(2)}</strong>
          </div>
        </div>

        <div className={styles.footer}>
          <p>Please pay this amount at the counter.</p>
          <Link to="/history" className={styles.backButton}>Back to Orders</Link>
        </div>
      </div>
    </div>
  );
};

export default BillPage;
