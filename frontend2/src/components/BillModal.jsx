import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './BillModal.module.css';

const BillModal = ({ billId, onClose, onBillUpdate }) => {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [availableOffers, setAvailableOffers] = useState([]);
  const [isOffersExpanded, setIsOffersExpanded] = useState(false);

  const fetchBillDetails = async () => {
    if (!billId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('customer_access_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [billResponse, offersResponse] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/api/billing/customer/${billId}/`, config),
        axios.get('http://127.0.0.1:8000/api/discounts/public/')
      ]);
      
      setBill(billResponse.data);
      setAvailableOffers(offersResponse.data);
    } catch (err) {
      setError('Could not fetch your bill details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset state when a new bill is selected
    setBill(null);
    setError('');
    setDiscountCode('');
    setIsOffersExpanded(false);
    fetchBillDetails();
  }, [billId]);

  const handleApplyDiscount = async (codeToApply) => {
    const code = codeToApply || discountCode;
    if (!code) return;

    try {
      const token = localStorage.getItem('customer_access_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`http://127.0.0.1:8000/api/billing/customer/${billId}/apply-discount/`, { code }, config);
      
      if (response.data.message) {
        alert(response.data.message);
      }
      
      if (onBillUpdate) {
        onBillUpdate();
      }
      fetchBillDetails();
      setDiscountCode('');
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || 'Failed to apply discount.'}`);
    }
  };
  
  const handleRemoveDiscount = async () => {
    try {
      const token = localStorage.getItem('customer_access_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`http://127.0.0.1:8000/api/billing/customer/${billId}/remove-discount/`, {}, config);
      
      if (onBillUpdate) {
        onBillUpdate();
      }
      fetchBillDetails();
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || 'Failed to remove discount.'}`);
    }
  };

  if (!billId) return null;

  const handleClose = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const subtotal = parseFloat(bill?.total_amount || 0);
  const taxes = subtotal * 0.05;
  const totalWithTaxes = subtotal + taxes;
  const discount = parseFloat(bill?.discount_amount || 0);
  const grandTotal = totalWithTaxes - discount;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        {loading && <h2>Loading Your Bill...</h2>}
        {error && <h2>{error}</h2>}
        {bill && (
          <>
            <h3>Bill for Table {bill.table_number}</h3>
            <p className={styles.billId}>Bill ID: #{bill.id}</p>
            
            <div className={styles.itemsSection}>
              <h4>Itemized List</h4>
              <ul className={styles.itemList}>
                {(bill.orders || []).flatMap(order => order.items || []).map(item => (
                  <li key={`${bill.id}-${item.id || Math.random()}`}>
                    <span>{item.dish?.name || 'Unknown Item'} x {item.quantity}</span>
                    <span>₹{((item.dish?.price || 0) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.totalsSection}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Taxes (5%)</span>
                <span>₹{taxes.toFixed(2)}</span>
              </div>
              {bill.applied_discount && (
                <div className={`${styles.totalRow} ${styles.discount}`}>
                  <span>Discount ({bill.applied_discount.code})</span>
                  <span>- ₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <strong>Grand Total</strong>
                <strong>₹{grandTotal.toFixed(2)}</strong>
              </div>
            </div>

            <div className={styles.discountContainer}>
                {availableOffers.length > 0 && !bill.applied_discount && !bill.discount_request_pending && (
                    <>
                        <button className={styles.offersHeader} onClick={() => setIsOffersExpanded(!isOffersExpanded)}>
                            <span>View Available Offers</span>
                            <span>{isOffersExpanded ? '−' : '+'}</span>
                        </button>
                        <div className={`${styles.offersList} ${isOffersExpanded ? styles.expanded : ''}`}>
                            <ul>
                                {availableOffers.map(offer => (
                                    <li key={offer.id}>
                                        <div>
                                            <strong>{offer.code}</strong>: {offer.discount_type === 'PERCENTAGE' ? `${parseFloat(offer.value).toFixed(0)}% off` : `₹${parseFloat(offer.value).toFixed(2)} off`}
                                            {offer.requires_staff_approval && <span> (Staff approval required)</span>}
                                        </div>
                                        <button className={styles.offerApplyButton} onClick={() => handleApplyDiscount(offer.code)}>
                                            Apply
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}

                {bill.applied_discount ? (
                    <div className={styles.discountApplied}>
                        <span>Discount <strong>{bill.applied_discount.code}</strong> applied!</span>
                        <button onClick={handleRemoveDiscount} className={styles.removeDiscountButton}>Remove</button>
                    </div>
                ) : bill.discount_request_pending ? (
                    <p className={styles.pendingMessage}>Discount requested. Waiting for staff approval.</p>
                ) : (
                    <div className={styles.discountInputSection}>
                        <input 
                            type="text" 
                            placeholder="Enter Discount Code"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        />
                        <button onClick={() => handleApplyDiscount()}>Apply</button>
                    </div>
                )}
            </div>

            <div className={styles.footer}>
              <p>Please pay the total amount at the counter.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BillModal;
