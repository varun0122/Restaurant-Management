import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const StaffDashboard = () => {
  const [orders, setOrders] = useState([]);
  const lastOrderId = useRef(null);
  const audioRef = useRef(new Audio('/order-bell.mp3'));
  const staff = JSON.parse(localStorage.getItem('staff'));

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`/api/staff/orders/${staff.role}/`);
      const latestOrders = res.data;

      // Check for new orders (only for kitchen staff)
      if (staff.role === 'kitchen') {
        const latestIds = latestOrders.map(o => o.id);
        const newest = Math.max(...latestIds);

        if (lastOrderId.current && newest > lastOrderId.current) {
          audioRef.current.play();
        }
        lastOrderId.current = newest;
      }

      setOrders(latestOrders);
    } catch (err) {
  console.error('Failed to fetch orders', err);
}
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mt-4">
      <h4>{staff.role === 'kitchen' ? 'Kitchen Orders' : 'Ready to Serve Orders'}</h4>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className="card mb-3">
            <div className="card-header">
              Table #{order.table_number} • {order.status}
            </div>
            <ul className="list-group list-group-flush">
              {order.items.map(item => (
                <li key={item.id} className="list-group-item d-flex justify-content-between">
                  <span>{item.dish.name}</span>
                  <span>× {item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default StaffDashboard;
