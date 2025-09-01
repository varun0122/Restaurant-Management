import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './BillingPage.module.css';
import PrintableBill from '../components/PrintableBill';

const BillingPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discountCodes, setDiscountCodes] = useState({});
  const [billToPrint, setBillToPrint] = useState(null);

  const fetchUnpaidBills = async () => {
    // We keep the initial load indicator, but subsequent fetches will be silent.
    try {
      const response = await apiClient.get('/billing/unpaid/');
      setBills(response.data);
    } catch (error) {
      console.error('Failed to fetch unpaid bills:', error);
    } finally {
      // Only set loading to false on the initial fetch
      if (loading) {
        setLoading(false);
      }
    }
  };
  
  // ======================= FIX START =======================
  // This useEffect now handles the initial fetch and sets up polling.
  useEffect(() => {
    fetchUnpaidBills(); // Fetch data immediately on component mount.

    // Set up an interval to poll for changes every 5 seconds.
    const pollInterval = setInterval(fetchUnpaidBills, 5000); // 5000ms = 5 seconds

    // This is a crucial cleanup function.
    // It stops the polling when the component is unmounted to prevent memory leaks.
    return () => {
      clearInterval(pollInterval);
    };
  }, []); // The empty dependency array [] ensures this runs only once on mount.
  // ======================== FIX END ========================

  const handleMarkAsPaid = async (billId) => {
    if (window.confirm(`Are you sure you want to mark bill #${billId} as paid?`)) {
      try {
        await apiClient.patch(`/billing/${billId}/mark-as-paid/`);
        await fetchUnpaidBills(); // Manually trigger a fetch immediately for instant feedback
      } catch (error) {
        alert('Failed to mark bill as paid.', error);
      }
    }
  };

  const handleApplyDiscount = async (billId) => {
    const code = discountCodes[billId];
    if (!code) {
      alert('Please enter a discount code.');
      return;
    }
    try {
      await apiClient.post(`/billing/${billId}/apply-discount/`, { code });
      await fetchUnpaidBills(); // Manually trigger a fetch immediately
    } catch (error) {
      alert(`Failed to apply discount: ${error.response?.data?.error || 'An error occurred.'}`);
    }
  };

  const handleRemoveDiscount = async (billId) => {
    try {
      await apiClient.post(`/billing/${billId}/remove-discount/`);
      await fetchUnpaidBills(); // Manually trigger a fetch immediately
    } catch (error) {
      alert(`Failed to remove discount: ${error.response?.data?.error || 'An error occurred.'}`);
    }
  };

  const handleDiscountCodeChange = (billId, value) => {
    setDiscountCodes(prev => ({ ...prev, [billId]: value.toUpperCase() }));
  };

  if (loading) {
    return <div className={styles.container}><h4>Loading Unpaid Bills...</h4></div>;
  }

  return (
    <>
      <div className={styles.container}>
        <h4>Unpaid Bills</h4>
        {bills.length === 0 ? (
          <p>There are currently no unpaid bills.</p>
        ) : (
          <div className={styles.grid}>
            {bills.map(bill => {
              const rawSubtotal = parseFloat(bill.total_amount || 0);
              const discount = parseFloat(bill.discount_amount || 0);
              const coinDiscount = parseFloat(bill.coin_discount || 0);
              
              const discountedSubtotal = Math.max(0, rawSubtotal - discount - coinDiscount);
              const taxes = discountedSubtotal * 0.05;
              const finalTotal = discountedSubtotal + taxes;

              return (
                <div key={bill.id} className={styles.billCard}>
                  <div className={styles.header}>
                    <h5>Table {bill.table_number}</h5>
                    {bill.discount_request_pending && (
                      <span className={styles.pendingNotification}>Approval Needed</span>
                    )}
                    <span className={styles.total}>₹{finalTotal.toFixed(2)}</span>
                  </div>

                  <div className={styles.body}>
                    <h6>All Items Ordered:</h6>
                    <ul className={styles.itemList}>
                      {(bill.orders || []).flatMap(order => order.items || []).map(item => (
                        <li key={`${bill.id}-${item.id}`}>
                          <span>{item.dish.name}</span>
                          <span>x {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={styles.billDetails}>
                    <div className={styles.detailRow}>
                      <span>Subtotal</span>
                      <span>₹{rawSubtotal.toFixed(2)}</span>
                    </div>

                    {coinDiscount > 0 && (
                      <div className={styles.detailRow}>
                        <span>Coin Discount ({bill.coins_redeemed ?? 0} coins)</span>
                        <span className={styles.discountText}>- ₹{coinDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {bill.applied_discount && (
                       <div className={styles.detailRow}>
                         <span>Discount ({bill.applied_discount.code})</span>
                         <span className={styles.discountText}>- ₹{discount.toFixed(2)}</span>
                       </div>
                    )}
                    
                    <div className={styles.detailRow}>
                        <span>Tax (5%)</span>
                        <span>+ ₹{taxes.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Discount Application Form */}
                  <div className={styles.discountSection}>
                    {bill.applied_discount ? (
                      <div className={styles.appliedDiscount}>
                         <p>Discount applied successfully!</p>
                        <button onClick={() => handleRemoveDiscount(bill.id)}>Remove Discount</button>
                      </div>
                    ) : (
                      <div className={styles.applyDiscountForm}>
                        <input
                          type="text"
                          placeholder="Enter discount code"
                          value={discountCodes[bill.id] || ''}
                          onChange={(e) => handleDiscountCodeChange(bill.id, e.target.value)}
                        />
                        <button onClick={() => handleApplyDiscount(bill.id)}>Apply</button>
                      </div>
                    )}
                  </div>

                  <div className={styles.footer}>
                    <button
                      className={styles.printButton}
                      onClick={() => setBillToPrint(bill)}
                    >
                      Print Bill
                    </button>
                    <button
                      className={styles.payButton}
                      onClick={() => handleMarkAsPaid(bill.id)}
                    >
                      Mark as Paid
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {billToPrint && (
        <PrintableBill
          bill={billToPrint}
          onAfterPrint={() => setBillToPrint(null)}
        />
      )}
    </>
  );
};

export default BillingPage;