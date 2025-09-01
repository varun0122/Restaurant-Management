import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './OrderStatusPage.module.css';
import BillModal from '../components/BillModal';

// This is a helper component to show the visual status tracker. No changes needed here.
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
  // State management for orders, bills, loading, and errors
  const [inKitchenOrders, setInKitchenOrders] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBillId, setSelectedBillId] = useState(null);

  // Main function to fetch all customer-related data from the API
  const fetchCustomerData = async () => {
    try {
      const token = localStorage.getItem('customer_access_token');
      if (!token) {
        setError('You must be logged in to view your orders.');
        setLoading(false);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch order history and unpaid bills concurrently for better performance
      const [historyResponse, billsResponse] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/orders/my-history/', config),
        axios.get('http://127.0.0.1:8000/api/billing/myunpaid/', config),
      ]);

      const allOrders = historyResponse.data || [];
      
      // Update state with the fetched data
      setUnpaidBills(billsResponse.data || []);
      setInKitchenOrders(allOrders.filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.status)));
      setPastOrders(allOrders.filter(o =>
        (o.bill && o.bill.is_paid) ||
        !['Pending', 'Preparing', 'Ready', 'Served'].includes(o.status)
      ));
      setError(''); // Clear any previous errors
    } catch (err) {
      setError('Could not load your order data. Please try again.');
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false); // Stop loading indicator regardless of outcome
    }
  };

  // useEffect hook to fetch data on component mount and set up polling
  useEffect(() => {
    fetchCustomerData(); // Fetch data initially
    const interval = setInterval(fetchCustomerData, 15000); // Refresh every 15 seconds
    
    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);


  // Conditional rendering for loading and error states
  if (loading) return <div className={styles.container}><h4>Loading Your Orders...</h4></div>;
  if (error) return <div className={styles.container}><h4>{error}</h4></div>;

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
                  <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
            unpaidBills.map(bill => {
              // --- THIS IS THE CORRECTED CALCULATION ---
              // It's safer to use the backend-calculated final amount if available.
              // If not, we manually calculate, ensuring we subtract BOTH types of discounts.
              const totalAmount = bill.final_amount ?? (() => {
                  const subtotalAfterDiscounts = (bill.total_amount || 0) - (bill.discount_amount || 0) - (bill.coin_discount || 0);
                  const taxes = subtotalAfterDiscounts > 0 ? subtotalAfterDiscounts * 0.05 : 0;
                  return subtotalAfterDiscounts + taxes;
              })();

              return (
                <div key={bill.id} className={styles.orderCard}>
                  <div className={styles.cardHeader}>
                    <span>Bill for Table {bill.table_number}</span>
                    <span>Total: ₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className={styles.pastOrderBody}>
                    <p>Your order is served. Please pay at the counter.</p>
                    <button onClick={() => setSelectedBillId(bill.id)} className={styles.viewBillButton}>
                      View Bill
                    </button>
                  </div>
                </div>
              );
            })
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

      {/* BillModal component with the correct `onUpdate` prop */}
      <BillModal
        billId={selectedBillId}
        onClose={() => setSelectedBillId(null)}
        onUpdate={fetchCustomerData}
      />
    </>
  );
};

export default OrderStatusPage;