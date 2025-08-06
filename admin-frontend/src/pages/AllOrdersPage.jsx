import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './AllOrdersPage.module.css'; // We'll create this new CSS file

const AllOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    // Construct the API URL with query parameters if dates are selected
    let url = '/orders/all/';
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    apiClient.get(url)
      .then(res => setOrders(res.data))
      .catch(() => alert('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  // Fetch orders when the component first loads
  useEffect(() => {
    fetchOrders();
  }, []);

  const handleFilter = () => {
    fetchOrders();
  };

  const calculateOrderTotal = (items) => {
    return items.reduce((total, item) => total + (item.dish.price * item.quantity), 0);
  };

  return (
    <div className={styles.container}>
      <h4>📦 All Orders (History)</h4>

      {/* --- Date Filter Section --- */}
      <div className={styles.filterContainer}>
        <div className={styles.dateInput}>
          <label htmlFor="start-date">Start Date</label>
          <input 
            type="date" 
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className={styles.dateInput}>
          <label htmlFor="end-date">End Date</label>
          <input 
            type="date" 
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button className={styles.filterButton} onClick={handleFilter}>Filter</button>
      </div>

      {/* --- Orders Table --- */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="6">No orders found for the selected criteria.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer ? `${order.customer.phone_number} (T${order.table_number})` : 'N/A'}</td>
                  <td>
                    <ul className={styles.itemsList}>
                      {order.items.map(item => <li key={item.id}>{item.dish.name} x {item.quantity}</li>)}
                    </ul>
                  </td>
                  <td>₹{calculateOrderTotal(order.items).toFixed(2)}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllOrdersPage;
