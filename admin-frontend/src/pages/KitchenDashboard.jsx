import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import './KitchenDashboard.css';

// Modal to display full order details
const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;
  // Support both order.customer?.table_number and order.table_number field
  const tableNumber = order.table_number || order.customer?.table_number || 'N/A';
  const customerPhone = order.customer?.phone_number || 'N/A';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Order #{order.id} Details</h3>
        <p><strong>Table:</strong> {tableNumber}</p>
        <p><strong>Customer Phone:</strong> {customerPhone}</p>
        <ul className="item-list-modal">
          {order.items.map(item => (
            <li key={item.id} className="item-modal">
              <span>{item.dish.name}</span>
              <strong>× {item.quantity}</strong>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="btn btn-secondary mt-3">Close</button>
      </div>
    </div>
  );
};

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [wsConnected, setWsConnected] = useState(true); // For fallback

  const socketUrl = 'ws://127.0.0.1:8000/ws/orders/';
  const { lastMessage, ReadyState } = useWebSocket(socketUrl, {
    onOpen: () => setWsConnected(true),
    onClose: () => setWsConnected(false),
    shouldReconnect: () => true
  });

  // Fallback polling if WebSocket is not connected
  const fetchOrders = useCallback(async () => {
    try {
      const response = await apiClient.get('/orders/kitchen-display/');
      setOrders(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load orders.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    let interval = null;
    if (!wsConnected) {
      interval = setInterval(fetchOrders, 10000); // Poll every 10s if WS disconnected
    }
    return () => interval && clearInterval(interval);
  }, [wsConnected, fetchOrders]);

  // Initial fetch when mounts
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'order_update') {
        const updatedOrder = data.order;
        setOrders(prevOrders => {
          const existingOrderIndex = prevOrders.findIndex(order => order.id === updatedOrder.id);
          let newOrders = [...prevOrders];
          if (['Pending', 'Preparing', 'Ready'].includes(updatedOrder.status)) {
            if (existingOrderIndex !== -1) {
              newOrders[existingOrderIndex] = updatedOrder;
            } else {
              newOrders.push(updatedOrder);
            }
          } else {
            if (existingOrderIndex !== -1) {
              newOrders.splice(existingOrderIndex, 1);
            }
          }
          return newOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        });
      }
    }
  }, [lastMessage]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiClient.patch(`/orders/${orderId}/update-status/`, { status: newStatus });
      // WebSocket will sync state; fallback if not connected
      if (!wsConnected) fetchOrders();
    } catch (err) {
      alert('Failed to update order status.');
      console.error(err);
    }
  };

  // Group orders by status
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const preparingOrders = orders.filter(o => o.status === 'Preparing');
  const readyOrders = orders.filter(o => o.status === 'Ready');

  const renderBadge = status => (
    <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
  );

  const renderOrderCard = (order) => {
    const tableNumber = order.table_number || order.customer?.table_number || 'N/A';
    // "and N more" logic:
    const itemsToShow = order.items.slice(0, 3);
    const moreCount = order.items.length - 3;

    return (
      <div key={order.id} className={`order-card ${order.status === 'Ready' ? 'ready' : ''}`} onClick={() => setSelectedOrder(order)}>
        <div className="card-header">
          <strong>Table #{tableNumber}</strong>
          {renderBadge(order.status)}
        </div>
        <ul className="item-list">
          {itemsToShow.map(item => (
            <li key={item.id} className="item">
              <span>{item.dish.name}</span>
              <strong>× {item.quantity}</strong>
            </li>
          ))}
          {moreCount > 0 && (
            <li className="item-more">...and {moreCount} more</li>
          )}
        </ul>
        <div className="card-footer">
          {order.status === 'Pending' &&
            <button className="btn btn-primary" onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, 'Preparing'); }}>
              Start Preparing
            </button>}
          {order.status === 'Preparing' &&
            <button className="btn btn-success" onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, 'Ready'); }}>
              Mark as Ready
            </button>}
          {order.status === 'Ready' &&
            <button className="btn btn-info" onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, 'Served'); }}>
              Mark as Served
            </button>}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="kitchen-dashboard"><h2>Loading Kitchen Orders...</h2></div>;
  }

  if (error) {
    return <div className="kitchen-dashboard error"><h2>{error}</h2></div>;
  }

  return (
    <div className="kitchen-dashboard">
      <h4>🍳 Kitchen & Staff Queue</h4>
      {!wsConnected && <div className="ws-fallback">WebSocket disconnected. Running in fallback mode.</div>}
      <div className="order-status-grid">
        <div className="status-column">
          <h3>Pending ({pendingOrders.length})</h3>
          {pendingOrders.length === 0 ? <p>No pending orders.</p> : pendingOrders.map(renderOrderCard)}
        </div>
        <div className="status-column">
          <h3>Preparing ({preparingOrders.length})</h3>
          {preparingOrders.length === 0 ? <p>No preparing orders.</p> : preparingOrders.map(renderOrderCard)}
        </div>
        <div className="status-column">
          <h3>Ready ({readyOrders.length})</h3>
          {readyOrders.length === 0 ? <p>No ready orders.</p> : readyOrders.map(renderOrderCard)}
        </div>
      </div>
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
};

export default KitchenDashboard;
