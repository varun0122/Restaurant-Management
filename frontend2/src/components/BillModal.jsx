import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './BillModal.module.css';

const BillModal = ({ billId, onClose }) => {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!billId) return;

    const fetchBillDetails = async () => {
      setLoading(true);
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

  if (!billId) return null;

  const renderContent = () => {
    if (loading) {
      return <p>Loading Bill...</p>;
    }
    if (error) {
      return <p className={styles.error}>{error}</p>;
    }
    if (!bill) {
      return <p>Bill details not found.</p>;
    }

    const subtotal = bill.total_amount || 0;
    const taxes = subtotal * 0.05; // Example: 5% tax
    const grandTotal = subtotal + taxes;

    return (
      <>
        <h3>Bill for Table {bill.table_number}</h3>
        <p className={styles.billId}>Bill ID: #{bill.id}</p>
        
        <div className={styles.itemsSection}>
          <h4>Itemized List</h4>
          <ul className={styles.itemList}>
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
        </div>
      </>
    );
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        {renderContent()}
      </div>
    </div>
  );
};

export default BillModal;
