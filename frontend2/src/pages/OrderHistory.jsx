import React, { useEffect, useState } from 'react'; 
import { useCart } from '../context/CartContext';
import axios from 'axios'; 
import styles from './OrderHistory.module.css'; // We'll create this new CSS file
import toast from 'react-hot-toast';
const OrderHistory = () => { 
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false); 
  const [selectedOrderItems, setSelectedOrderItems] = useState([]); 
  const [checkedItems, setCheckedItems] = useState({}); 

  useEffect(() => { 
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('customer_access_token');
        if (!token) {
          setError('You must be logged in to view your order history.');
          setLoading(false);
          return;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('http://127.0.0.1:8000/api/orders/my-history/', config);
        
        // Filter for only past orders (paid or cancelled)
        const pastOrders = (response.data || []).filter(o => 
            (o.bill && o.bill.is_paid) ||
            !['Pending', 'Preparing', 'Ready', 'Served'].includes(o.status)
        );
        setOrders(pastOrders);

      } catch (err) {
        setError('Failed to load order history.');
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []); 

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
        
        selectedItems.forEach(item => {
            // 4. This now calls the flexible addToCart from the context, which works correctly
            addToCart(item.dish, item.quantity);
        });
        toast.success("Selected dishes added to cart!");
        
        setShowModal(false);
    };

  const calculateOrderTotal = (items) => {
    return items.reduce((total, item) => total + (item.dish.price * item.quantity), 0);
  };

  if (loading) return <div className={styles.container}><h4>Loading History...</h4></div>;
  if (error) return <div className={styles.container}><h4>{error}</h4></div>;

  return ( 
    <div className={styles.container}> 
      <h3>Your Order History</h3> 
      {orders.length === 0 ? (
        <p>You have no past orders.</p>
      ) : (
        orders.map(order => ( 
          <div key={order.id} className="card mb-3"> 
            <div className="card-header d-flex justify-content-between align-items-center"> 
              <strong>Order #{order.id} • {new Date(order.created_at).toLocaleDateString()}</strong> 
               <span 
                className={`badge ${order.status === 'Cancelled' ? 'bg-danger' : 'bg-success'}`}
            >
                {order.status === 'Cancelled' ? 'Cancelled' : 'Paid'}
            </span>
              {order.status !== 'Cancelled' && (
                                <button className="btn btn-primary btn-sm" onClick={() => openRepeatModal(order.items)}>
                                    Repeat Order
                                </button>
                            )}
            </div> 
            <ul className="list-group list-group-flush"> 
              {order.items.map(item => ( 
                <li key={item.id} className="list-group-item"> 
                  {item.dish.name} × {item.quantity} 
                </li> 
              ))} 
            </ul> 
            <div className="card-footer text-end"> 
              <strong>₹{calculateOrderTotal(order.items).toFixed(2)}</strong> 
            </div> 
          </div> 
        ))
      )}

      {/* Modal */} 
      {showModal && ( 
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}> 
          <div className="modal-dialog modal-dialog-centered"> 
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
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button> 
                <button className="btn btn-success" onClick={handleRepeatToCart}>Add to Cart</button> 
              </div> 
            </div> 
          </div> 
        </div> 
      )} 
    </div> 
  ); 
}; 

export default OrderHistory;
