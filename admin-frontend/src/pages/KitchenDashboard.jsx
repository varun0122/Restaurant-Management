import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosConfig';
import './KitchenDashboard.css'; // Using a regular CSS file for styling

// A component for the Order Details Modal
const OrderDetailModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Order #{order.id} Details</h3>
                <p><strong>Table:</strong> {order.customer?.table_number || 'N/A'}</p>
                <p><strong>Customer:</strong> {order.customer?.phone_number || 'N/A'}</p>
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
    const [selectedOrder, setSelectedOrder] = useState(null); // For the modal

    const fetchOrders = async () => {
        try {
            // This endpoint should show all active orders (Pending, Preparing, Ready)
            const res = await apiClient.get('/orders/kitchen-display/');
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await apiClient.patch(`/orders/${orderId}/update-status/`, { status: newStatus });
            fetchOrders(); 
        } catch (err) {
            console.error('Failed to update status', err);
            alert('Failed to update order status.');
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // This function determines which button to show based on the order's current status
    const renderAction = (order) => {
        switch(order.status) {
            case 'Pending':
                return <button className="btn btn-primary" onClick={() => handleStatusUpdate(order.id, 'Preparing')}>Start Preparing</button>;
            case 'Preparing':
                return <button className="btn btn-success" onClick={() => handleStatusUpdate(order.id, 'Ready')}>Mark as Ready</button>;
            case 'Ready':
                 return <button className="btn btn-info" onClick={() => handleStatusUpdate(order.id, 'Served')}>Mark as Served</button>;
            default:
                // If an order is 'Served', it will be filtered out by the backend on the next fetch,
                // so no button is needed.
                return null;
        }
    };

    return (
        <div className="kitchen-dashboard">
            <h4>🍳 Kitchen & Staff Queue</h4>
            {orders.length === 0 ? (
                <p>No active orders found.</p>
            ) : (
                <div className="order-grid">
                    {orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="card-header" onClick={() => setSelectedOrder(order)}>
                                <strong>Table #{order.table_number || 'N/A'}</strong>
                                <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
                            </div>
                            <ul className="item-list" onClick={() => setSelectedOrder(order)}>
                                {order.items.slice(0, 3).map(item => ( // Show first 3 items for brevity
                                    <li key={item.id} className="item">
                                        <span>{item.dish.name}</span>
                                        <strong>× {item.quantity}</strong>
                                    </li>
                                ))}
                                {order.items.length > 3 && (
                                    <li className="item-more">...and {order.items.length - 3} more</li>
                                )}
                            </ul>
                            <div className="card-footer">
                                {renderAction(order)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        </div>
    );
};

export default KitchenDashboard;
