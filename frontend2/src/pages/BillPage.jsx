import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig'; 
import styles from './BillPage.module.css';
import toast from 'react-hot-toast';

const BillPage = () => {
  const { billId } = useParams();
  const [bill, setBill] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coinsToApply, setCoinsToApply] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Fetch bill + customer together
  const fetchData = async () => {
    try {
      const [customerRes, billRes] = await Promise.all([
        apiClient.get('/auth/customer/me/'),
        apiClient.get(`/billing/customer/bill/${billId}/`)
      ]);
      setCustomer(customerRes.data);
      setBill(billRes.data);
    } catch (err) {
      setError('Could not fetch your bill details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [billId]);

  // Apply loyalty coins for discount
  const handleApplyCoins = async () => {
    const coins = parseInt(coinsToApply, 10);
    if (isNaN(coins) || coins <= 0) {
      toast.error("Please enter a valid number of coins.");
      return;
    }
    setIsApplying(true);
    try {
      const response = await apiClient.post(`/billing/bills/${billId}/apply-coins/`, { coins });
      setBill(response.data.bill);

      // Update customer coin balance locally
      setCustomer(prev => ({
        ...prev,
        loyalty_coins: (prev.loyalty_coins || 0) - coins
      }));

      toast.success(response.data.message);
      setCoinsToApply('');
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to apply coins.");
    } finally {
      setIsApplying(false);
    }
  };

  // Mark bill as paid & refresh customer coins
  const handlePayBill = async () => {
    setIsPaying(true);
    try {
      const response = await apiClient.patch(`/billing/bills/${billId}/pay/`);
      toast.success(response.data.message);

      // Refetch bill + updated customer
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to pay bill.");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) return <div className={styles.loader}>Loading Your Bill...</div>;
  if (error || !bill) return <div className={styles.error}>{error || 'Bill not found.'}</div>;

  const redemptionValue = (parseInt(coinsToApply, 10) || 0) / 10; // 10 coins = ₹1

  return (
    <div className={styles.container}>
      <div className={styles.billCard}>
        <h3>Bill for Table {bill.table_number}</h3>
        <p className={styles.billId}>Bill ID: #{bill.id}</p>

        {/* Items */}
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

        {/* Totals */}
        <div className={styles.totalsSection}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>₹{parseFloat(bill.subtotal || bill.total_amount).toFixed(2)}</span>
          </div>
          {bill.coin_discount > 0 && (
            <div className={`${styles.totalRow} ${styles.discount}`}>
              <span>Coin Discount ({bill.coins_redeemed} coins)</span>
              <span>- ₹{parseFloat(bill.coin_discount).toFixed(2)}</span>
            </div>
          )}
          <div className={styles.totalRow}>
            <span>Taxes (5%)</span>
            <span>₹{parseFloat(bill.tax_amount).toFixed(2)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <strong>Grand Total</strong>
            <strong>₹{parseFloat(bill.final_amount).toFixed(2)}</strong>
          </div>
        </div>

        {/* Loyalty Coin Redemption */}
        {bill.coin_discount <= 0 && customer && customer.loyalty_coins > 0 && (
          <div className={styles.loyaltySection}>
            <h4>✨ Redeem Your Coins</h4>
            <p>You have <strong>{customer.loyalty_coins}</strong> coins available.</p>
            <div className={styles.redeemForm}>
              <input
                type="number"
                placeholder="Enter coins to apply"
                value={coinsToApply}
                onChange={(e) => setCoinsToApply(e.target.value)}
                max={customer.loyalty_coins}
                min="0"
              />
              <button onClick={handleApplyCoins} disabled={isApplying}>
                {isApplying ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {redemptionValue > 0 && (
              <p className={styles.infoText}>
                Apply for a ₹{redemptionValue.toFixed(2)} discount
              </p>
            )}
          </div>
        )}

        {/* Payment section */}
        <div className={styles.footer}>
          <button 
            onClick={handlePayBill} 
            disabled={isPaying || bill.is_paid} 
            className={styles.payButton}
          >
            {bill.is_paid ? "✅ Already Paid" : isPaying ? "Paying..." : "Pay & Earn Coins"}
          </button>
          <Link to="/history" className={styles.backButton}>Back to Orders</Link>
        </div>
      </div>
    </div>
  );
};

export default BillPage;
