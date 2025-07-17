import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OrderHistory = ({ onAddToCart }) => {
  const phoneNumber = JSON.parse(localStorage.getItem('customer'))?.phone_number;
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (phoneNumber) {
      axios.get(`http://127.0.0.1:8000/api/orders/history/${phoneNumber}/`)
        .then(res => setOrders(res.data))
        .catch(err => console.error('Failed to load history', err));
    }
  }, [phoneNumber]);

  const openRepeatModal = (items) => {
    const initialChecks = {};
    items.forEach(item => {
      initialChecks[item.id] = true;
    });
    setCheckedItems(initialChecks);
    setSelectedOrderItems(items);
    setShowModal(true);
  };

  const handleRepeatToCart = () => {
    const selectedItems = selectedOrderItems.filter(item => checkedItems[item.id]);
    if (onAddToCart) {
      selectedItems.forEach(item => {
        onAddToCart({
          ...item.dish,
          quantity: item.quantity
        });
      });
      alert("Selected dishes added to cart!");
    } else {
      alert("Add to Cart function is not available");
    }
    setShowModal(false);
  };

  return (
    <div className="container mt-4">
      <h3>Your Order History</h3>
      {orders.map(order => (
        <div key={order.id} className="card mb-3">
          <div className="card-header d-flex justify-content-between">
            <strong>Order #{order.id} • {new Date(order.timestamp).toLocaleString()}</strong>
            <button className="btn btn-primary btn-sm" onClick={() => openRepeatModal(order.items)}>
              Repeat Order
            </button>
          </div>
          <ul className="list-group list-group-flush">
            {order.items.map(item => (
              <li key={item.id} className="list-group-item">
                {item.dish.name} × {item.quantity}
              </li>
            ))}
          </ul>
          <div className="card-footer text-end">
            <strong>₹{order.total_price}</strong>
          </div>
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select Dishes to Repeat</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {selectedOrderItems.map(item => (
                  <div key={item.id} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={checkedItems[item.id] || false}
                      onChange={() =>
                        setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                    />
                    <label className="form-check-label">
                      {item.dish.name} × {item.quantity}
                    </label>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={handleRepeatToCart}>Add to Cart</button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
