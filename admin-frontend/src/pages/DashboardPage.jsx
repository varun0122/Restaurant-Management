import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './DashboardPage.module.css';
import SalesChart from '../components/SalesChart';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

// --- "Today's Orders" component is now defined inside the dashboard file ---
const RecentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const response = await apiClient.get('/orders/recent-orders/');
        setOrders(response.data);
      } catch (error) {
        console.error("Failed to fetch recent orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentOrders();
  }, []);

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
  };

  if (loading) {
    return <div className={styles.recentOrdersContainer}>Loading today's orders...</div>;
  }
  
  const getStatusClass = (status) => {
    if (!status) return '';
    return styles[status.toLowerCase()] || '';
  };

  const getPaymentStatusClass = (status) => {
    if (!status) return '';
    return styles[status.toLowerCase()] || '';
  };

  return (
    <div className={styles.recentOrdersContainer}>
      <h3>Today's Orders</h3>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Order Status</th>
              <th>Payment</th>
              <th>Time</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <React.Fragment key={order.id}>
                <tr onClick={() => toggleOrderExpansion(order.id)} className={styles.orderRow}>
                  <td>#{order.id}</td>
                  <td>{order.customer ? `${order.customer.phone_number} (T${order.table_number})` : 'N/A'}</td>
                  <td>₹{order.total_amount.toFixed(2)}</td>
                  <td><span className={`${styles.status} ${getStatusClass(order.status)}`}>{order.status}</span></td>
                  <td>
                    <span className={`${styles.paymentStatus} ${getPaymentStatusClass(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className={styles.chevronCell}>
                    {expandedOrderId === order.id ? <FiChevronUp /> : <FiChevronDown />}
                  </td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr className={styles.itemsRow}>
                    <td colSpan="7">
                      <ul className={styles.itemsList}>
                        {order.items.map(item => (
                          <li key={item.id}>
                            <span>{item.dish.name}</span>
                            <span>x {item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await apiClient.get('/orders/dashboard-summary/');
        setSummary(response.data);
      } catch (err) {
        setError('Failed to fetch data. Are you logged in as an admin?');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return <div className={styles.container}><h2>Loading Dashboard...</h2></div>;
  }
  if (error) {
    return <div className={`${styles.container} ${styles.error}`}><h2>{error}</h2></div>;
  }

  return (
    <div className={styles.container}>
      <h1>Admin Dashboard</h1>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Today's Orders</h3>
          <p>{summary.todays_orders}</p>
        </div>
        <div className={`${styles.card} ${styles.paid}`}>
          <h3>Paid Today</h3>
          <p>₹{summary.paid_revenue_today.toFixed(2)}</p>
        </div>
        <div className={`${styles.card} ${styles.unpaid}`}>
          <h3>Unpaid Bills</h3>
          <p>₹{summary.unpaid_revenue.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <h3>Pending Orders</h3>
          <p>{summary.pending_orders}</p>
        </div>
      </div>
      
      <div className={styles.bottomSection}>
          <SalesChart />
          <RecentOrders />
      </div>
    </div>
  );
};

export default DashboardPage;
