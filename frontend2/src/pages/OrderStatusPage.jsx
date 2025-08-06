import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './OrderStatusPage.module.css';
import BillModal from '../components/BillModal'; // Import the BillModal

// A reusable component for the status progress bar
const StatusTracker = ({ status }) => {
  const statuses = ['Pending', 'Preparing', 'Ready'];
  const statusIndex = statuses.indexOf(status);

  return (
    <div className={styles.progressBar}>
      {statuses.map((s, index) => (
        <div key={s} className={`${styles.step} ${index <= statusIndex ? styles.active : ''}`}>
          <div className={styles.dot}></div>
          <div className={styles.label}>{s}</div>
        </div>
      ))}
    </div>
  );
};

const OrderStatusPage = () => {
  const [inKitchenOrders, setInKitchenOrders] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBillId, setSelectedBillId] = useState(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const token = localStorage.getItem('customer_access_token');
        if (!token) {
          setError('You must be logged in to view your orders.');
          setLoading(false);
          return;
        }
        
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // --- 1. Fetch ALL orders ---
        const historyResponse = await axios.get('http://127.0.0.1:8000/api/orders/my-history/', config);
        const allOrders = historyResponse.data || [];
        
        // --- 2. Fetch all UNPAID bills ---
        const billsResponse = await axios.get('http://127.0.0.1:8000/api/billing/my-unpaid/', config);
        setUnpaidBills(billsResponse.data || []);

        // --- 3. This is the new, correct filtering logic ---
        
        // "In the Kitchen" are orders that are not yet served
        setInKitchenOrders(allOrders.filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.status)));

        // "Past Orders" are orders that are part of a PAID bill, or are cancelled.
        setPastOrders(allOrders.filter(o => 
            (o.bill && o.bill.is_paid) ||
            !['Pending', 'Preparing', 'Ready', 'Served'].includes(o.status)
        ));

      } catch (err) {
        setError('Could not load your order data.');
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerData();
    const interval = setInterval(fetchCustomerData, 15000); 
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className={styles.container}><h4>Loading Your Orders...</h4></div>;
  }

  if (error) {
    return <div className={styles.container}><h4>{error}</h4></div>;
  }

  return (
    <>
      <div className={styles.container}>
        {/* "In the Kitchen" Section */}
        <div className={styles.section}>
          <h3>In the Kitchen</h3>
          {inKitchenOrders.length > 0 ? (
            inKitchenOrders.map(order => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.cardHeader}>
                  <span>Order #{order.id} (Table {order.table_number})</span>
                  <span>{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <StatusTracker status={order.status} />
              </div>
            ))
          ) : (
            <p>You have no orders currently in the kitchen.</p>
          )}
        </div>

        {/* "Ready to Pay" Section */}
        <div className={styles.section}>
          <h3>Ready to Pay</h3>
          {unpaidBills.length > 0 ? (
            unpaidBills.map(bill => (
              <div key={bill.id} className={styles.orderCard}>
                <div className={styles.cardHeader}>
                  <span>Bill for Table {bill.table_number}</span>
                  <span>Total: ₹{bill.total_amount.toFixed(2)}</span>
                </div>
                <div className={styles.pastOrderBody}>
                  <p>Your order is served. Please pay at the counter.</p>
                  <button onClick={() => setSelectedBillId(bill.id)} className={styles.viewBillButton}>
                    View Bill
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>You have no unpaid bills.</p>
          )}
        </div>

        {/* Past Orders Section */}
        <div className={styles.section}>
          <h3>Past Orders</h3>
          {pastOrders.length > 0 ? (
            pastOrders.map(order => (
              <div key={order.id} className={`${styles.orderCard} ${styles.pastOrder}`}>
                 <div className={styles.cardHeader}>
                  <span>Order #{order.id} (Table {order.table_number})</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className={styles.pastOrderBody}>
                  <p>Status: <strong>{order.bill?.is_paid ? 'Paid' : order.status}</strong></p>
                  {order.bill && (
                     <button onClick={() => setSelectedBillId(order.bill.id)} className={styles.viewBillButton}>
                      View Bill
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>You have no past orders.</p>
          )}
        </div>
        
        <Link to="/menu" className={styles.menuButton}>Back to Menu</Link>
      </div>

      <BillModal billId={selectedBillId} onClose={() => setSelectedBillId(null)} />
    </>
  );
};

export default OrderStatusPage;
