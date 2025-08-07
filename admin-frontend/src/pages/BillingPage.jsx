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
    setLoading(true);
    try {
      const response = await apiClient.get('/billing/unpaid/');
      setBills(response.data);
    } catch (error) {
      console.error("Failed to fetch unpaid bills:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidBills();
  }, []);

  const handleMarkAsPaid = async (billId) => {
    if (window.confirm(`Are you sure you want to mark bill #${billId} as paid?`)) {
      try {
        await apiClient.patch(`/billing/${billId}/mark-as-paid/`);
        fetchUnpaidBills();
      } catch (error) {
        alert('Failed to mark bill as paid.',error);
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
      // For staff, we use the main apply_discount which also approves special discounts
      await apiClient.post(`/billing/${billId}/apply-discount/`, { code });
      fetchUnpaidBills();
    } catch (error) {
      alert(`Failed to apply discount: ${error.response?.data?.error || 'An error occurred.'}`);
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
              const finalTotal = bill.total_amount - bill.discount_amount;
              return (
                <div key={bill.id} className={styles.billCard}>
                  <div className={styles.header}>
                    <h5>Table {bill.table_number}</h5>
                    {/* --- NEW: Show notification for pending discount --- */}
                    {bill.discount_request_pending && (
                        <span className={styles.pendingNotification}>Approval Needed</span>
                    )}
                    <span className={styles.total}>₹{finalTotal.toFixed(2)}</span>
                  </div>
                  <div className={styles.body}>
                    <h6>All Items Ordered:</h6>
                    <ul className={styles.itemList}>
                      {bill.orders.flatMap(order => order.items).map(item => (
                        <li key={`${bill.id}-${item.id}`}>
                          <span>{item.dish.name}</span>
                          <span>x {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={styles.discountSection}>
                      {bill.applied_discount ? (
                          <div className={styles.appliedDiscount}>
                              <p>Discount Applied: <strong>{bill.applied_discount.code}</strong></p>
                              <p>Saved: ₹{parseFloat(bill.discount_amount).toFixed(2)}</p>
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
              )
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
