import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './RecentOrders.module.css';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

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
    return <div className={styles.container}>Loading today's orders...</div>;
  }
  
  const getStatusClass = (status) => {
    if (!status) return '';
    return styles[status.toLowerCase()] || '';
  };

  return (
    <div className={styles.container}>
      <h3>Today's Orders</h3>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Time</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <React.Fragment key={order.id}>
                <tr onClick={() => toggleOrderExpansion(order.id)} className={styles.orderRow}>
                  <td>#{order.id}</td>
                  {/* --- THE FIX IS HERE --- */}
                  {/* We now get table_number directly from the 'order' object */}
                  <td>
                    {order.customer ? 
                      `${order.customer.phone_number} (T${order.table_number})` : 
                      'N/A'
                    }
                  </td>
                  <td>₹{order.total_amount.toFixed(2)}</td>
                  <td><span className={`${styles.status} ${getStatusClass(order.status)}`}>{order.status}</span></td>
                  <td>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className={styles.chevronCell}>
                    {expandedOrderId === order.id ? <FiChevronUp /> : <FiChevronDown />}
                  </td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr className={styles.itemsRow}>
                    <td colSpan="6">
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

export default RecentOrders;
