import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './BillModal.module.css';
import toast from 'react-hot-toast';

// Changed props: Removed `onBillUpdate` to standardize on `onUpdate`
const BillModal = ({ billId, onClose, onUpdate }) => {
  // Removed the `notifyUpdate` alias for clarity. We will use `onUpdate` directly.

  const [bill, setBill] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [availableOffers, setAvailableOffers] = useState([]);

  const [discountCode, setDiscountCode] = useState('');
  const [coinsToApply, setCoinsToApply] = useState('');
  const [useCoins, setUseCoins] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isApplyingCoins, setIsApplyingCoins] = useState(false);
  const [isOffersExpanded, setIsOffersExpanded] = useState(false);

  // Auth header
  const getAuthConfig = () => {
    const token = localStorage.getItem('customer_access_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // Fetch bill, offers, and customer info
  const fetchBillDetails = async () => {
    if (!billId) return;
    try {
      const config = getAuthConfig();
      const [billRes, offersRes, customerRes] = await Promise.all([
        apiClient.get(`/billing/customer/${billId}/`, config),
        apiClient.get('/discounts/public/', config),
        apiClient.get('/customers/me/', config),
      ]);
      setBill(billRes.data);
      setAvailableOffers(offersRes.data);
      setCustomer(customerRes.data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch your bill details.');
    }
  };

  useEffect(() => {
    if (!billId) return;
    setBill(null);
    setError('');
    setDiscountCode('');
    setIsOffersExpanded(false);
    setCoinsToApply('');
    setUseCoins(false);
    setLoading(true);
    fetchBillDetails().finally(() => setLoading(false));
  }, [billId]);

  // Apply coins
  const handleApplyCoins = async () => {
    const coins = parseInt(coinsToApply, 10);
    if (isNaN(coins) || coins <= 0) {
      return toast.error('Please enter a valid number of coins.');
    }
    if (coins > (customer?.loyalty_coins || 0)) {
      return toast.error('Insufficient coins');
    }

    setIsApplyingCoins(true);
    try {
      const config = getAuthConfig();
      await apiClient.post(`/billing/bills/${billId}/apply-coins/`, { coins }, config);
      await fetchBillDetails(); // Refresh modal data

      toast.success('Coins applied successfully');
      setCoinsToApply('');
      setUseCoins(false);
      if (onUpdate) onUpdate(); // Call parent to update
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to apply coins.');
    } finally {
      setIsApplyingCoins(false);
    }
  };

  // Remove coins
  const handleRemoveCoins = async () => {
    setIsApplyingCoins(true);
    try {
      const config = getAuthConfig();
      await apiClient.post(`/billing/bills/${billId}/remove-coins/`, {}, config);
      await fetchBillDetails(); // Refresh modal data
      toast.success('Coins removed successfully');
      if (onUpdate) onUpdate(); // Call parent to update
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to remove coins.');
    } finally {
      setIsApplyingCoins(false);
    }
  };

  // Apply discount
  const handleApplyDiscount = async (code) => {
    const discountCodeToUse = code ?? discountCode;
    if (!discountCodeToUse) return;

    try {
      const config = getAuthConfig();
      const response = await apiClient.post(`/billing/customer/${billId}/apply-discount/`, { code: discountCodeToUse }, config);
      
      toast.success(response.data.message || 'Discount applied');
      setDiscountCode('');
      await fetchBillDetails(); // Refresh modal data
      if (onUpdate) onUpdate(); // Call parent to update
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to apply discount.');
    }
  };

  // Remove discount
  const handleRemoveDiscount = async () => {
    try {
      const config = getAuthConfig();
      await apiClient.post(`/billing/customer/${billId}/remove-discount/`, {}, config);
      toast.success('Discount removed');
      await fetchBillDetails(); // Refresh modal data
      if (onUpdate) onUpdate(); // Call parent to update
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to remove discount.');
    }
  };

  if (!billId) return null;

  // Calculations
  const subtotal = parseFloat(bill?.subtotal ?? bill?.total_amount ?? 0);
  const discount = parseFloat(bill?.discount_amount || 0);
  const coinDiscount = parseFloat(bill?.coin_discount || 0);
  const taxes = parseFloat(
    bill?.tax ?? (subtotal - discount - coinDiscount > 0 ? (subtotal - discount - coinDiscount) * 0.05 : 0)
  );
  const grandTotal = parseFloat(bill?.final_amount ?? (Math.max(0, subtotal - discount - coinDiscount) + taxes));

  const maxCoins = Math.max(0, customer?.loyalty_coins || 0);
  const redemptionValue = (parseInt(coinsToApply, 10) || 0) / 10;

  const handleClose = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
        {/* The rest of your JSX remains the same... */}
        {/* I've omitted the JSX for brevity as it had no issues */}
         <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>

        {loading && <h2>Loading...</h2>}
        {!loading && error && <h2>{error}</h2>}

        {!loading && !error && bill && customer && (
          <>
            <h3>Bill for Table {bill.table_number}</h3>
            <p className={styles.billId}>Bill ID: #{bill.id}</p>

            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <span>
                <strong>Loyalty Coins:</strong> {maxCoins} (₹{(maxCoins / 10).toFixed(2)} available)
              </span>
            </div>

            {/* Bill totals */}
            <div className={styles.totalsSection}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className={`${styles.totalRow} ${styles.discount}`}>
                  <span>Discount ({bill.applied_discount?.code})</span>
                  <span>- ₹{discount.toFixed(2)}</span>
                </div>
              )}
              {coinDiscount > 0 && (
                <div className={`${styles.totalRow} ${styles.discount}`}>
                  <span>Coin Discount ({bill.coins_redeemed} coins)</span>
                  <span>- ₹{coinDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>Taxes (5%)</span>
                <span>₹{taxes.toFixed(2)}</span>
              </div>
              <hr />
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <strong>Grand Total</strong>
                <strong>₹{grandTotal.toFixed(2)}</strong>
              </div>
            </div>

            {/* Loyalty coin section */}
            <div style={{ marginTop: '1rem', textAlign: 'center' }} className={styles.loyaltySection}>
              <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <input 
                  type="checkbox"
                  checked={useCoins}
                  onChange={e => {
                    const checked = e.target.checked;
                    setUseCoins(checked);
                    setCoinsToApply(checked ? String(maxCoins) : '');
                  }}
                />
                <span>Use my coins</span>
              </label>

              {useCoins && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="number"
                    value={coinsToApply}
                    onChange={e => {
                      let val = e.target.value === '' ? '' : parseInt(e.target.value,10);
                      if(val === '' || val < 1) val = '';
                      else if (val > maxCoins) val = maxCoins;
                      setCoinsToApply(String(val));
                    }}
                    min="1"
                    max={maxCoins}
                    placeholder={`Max: ${maxCoins}`}
                    className={styles.coinInput}
                    style={{ marginRight: 8, width: 100, background: '#222', color: '#ffd700' }}
                    disabled={isApplyingCoins}
                  />
                  <button
                    onClick={handleApplyCoins}
                    disabled={isApplyingCoins || !(parseInt(coinsToApply, 10) > 0)}
                    style={{ padding: '0.3rem 1rem', backgroundColor: '#D4AF37', cursor:'pointer', fontWeight: '600' }}
                  >
                    {isApplyingCoins ? 'Applying...' : 'Apply Coins'}
                  </button>
                  {(parseInt(coinsToApply, 10) || 0) > 0 && (
                    <div style={{ marginTop: 6, color: '#D4AF37' }}>
                      Will reduce bill by ₹{redemptionValue.toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {!useCoins && coinDiscount > 0 && (
                <>
                  <div style={{ marginTop: 6, color: '#D4AF37' }}>
                    You saved ₹{coinDiscount.toFixed(2)} using {bill.coins_redeemed} coins!
                  </div>
                  <button 
                    onClick={handleRemoveCoins} 
                    disabled={isApplyingCoins}
                    style={{
                      marginTop: 8,
                      padding: '0.3rem 1rem',
                      backgroundColor: '#cc0000',
                      color: 'white',
                      cursor: 'pointer',
                      border:'none',
                      borderRadius: 4,
                      fontWeight: '600',
                    }}
                  >
                    Remove Coins
                  </button>
                </>
              )}
            </div>

            {/* Discount offers and code input */}
            <div className={styles.discountContainer}>
              {availableOffers.length > 0 && !bill.discount_request_pending && (
                <>
                  {!bill.applied_discount && (
                    <>
                      <button
                        className={styles.offersHeader}
                        onClick={() => setIsOffersExpanded(!isOffersExpanded)}
                      >
                        <span>View Available Offers</span>
                        <span>{isOffersExpanded ? '−' : '+'}</span>
                      </button>
                      <div className={`${styles.offersList} ${isOffersExpanded ? styles.expanded : ''}`}>
                        <ul>
                          {availableOffers.map(offer => (
                            <li key={offer.id}>
                              <div>
                                <strong>{offer.code}</strong>: {offer.discount_type === 'PERCENTAGE' ? `${parseFloat(offer.value).toFixed(0)}% off` : `₹${parseFloat(offer.value).toFixed(2)} off`}
                                {offer.requires_staff_approval && ' (Staff approval required)'}
                              </div>
                              <button className={styles.offerButton} onClick={() => handleApplyDiscount(offer.code)}>Apply</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                  {bill.applied_discount && (
                    <div className={styles.discountApplied}>
                      <span>Discount <strong>{bill.applied_discount?.code}</strong> applied!</span>
                      <button className={styles.removeDiscountButton} onClick={handleRemoveDiscount}>Remove</button>
                    </div>
                  )}
                </>
              )}
              {bill.discount_request_pending && <p className={styles.pendingMessage}>Discount pending approval</p>}

              {!bill.applied_discount && !bill.discount_request_pending && availableOffers.length === 0 && (
                <div className={styles.discountInput}>
                  <input
                    type="text"
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={e => setDiscountCode(e.target.value.toUpperCase())}
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