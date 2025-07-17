import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminOrderList = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/orders/kitchen/')
      .then(res => setOrders(res.data))
      .catch(() => alert('Failed to load orders'));
  }, []);

  return (
    <div className="container mt-4">
      <h4>📦 All Orders</h4>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Order #{order.id}</h5>
              <p><strong>Customer:</strong> {order.customer?.name} ({order.customer?.phone})</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</p>
              <ul className="list-group">
                {order.items.map(item => (
                  <li key={item.id} className="list-group-item">
                    {item.dish.name} × {item.quantity} = ₹{item.dish.price * item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminOrderList;
