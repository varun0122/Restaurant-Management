import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './BillingPage.module.css';
import PrintableBill from '../components/PrintableBill';

const BillingPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Only one print at a time
  const [billToPrint, setBillToPrint] = useState(null);

  const fetchUnpaidBills = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/billing/unpaid/');
      setBills(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch unpaid bills:', error);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidBills();
  }, []);

  const handleMarkAsPaid = async (billId) => {
    const isConfirmed = window.confirm(`Are you sure you want to mark bill #${billId} as paid?`);
    if (isConfirmed) {
      try {
        await apiClient.patch(`/billing/${billId}/mark-as-paid/`);
        fetchUnpaidBills();
      } catch (error) {
        alert('Failed to mark bill as paid.');
        console.error('Failed to mark as paid:', error);
      }
    }
  };

  return (
    <>
      <div className={styles.container}>
        <h4>Unpaid Bills</h4>
        {loading ? (
          <h4>Loading Unpaid Bills...</h4>
        ) : bills.length === 0 ? (
          <p>There are currently no unpaid bills.</p>
        ) : (
          <div className={styles.grid}>
            {bills.map((bill) => (
              <div key={bill.id} className={styles.billCard}>
                <div className={styles.header}>
                  <h5>Table {bill.table_number}</h5>
                  <span className={styles.total}>
                    ₹{Number(bill.total_amount ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className={styles.body}>
                  <h6>All Items Ordered:</h6>
                  <ul className={styles.itemList}>
                    {(bill.orders || [])
                      .flatMap((order) => order.items)
                      .map((item, idx) => (
                        <li key={`${bill.id}-${item.id || idx}`}>
                          <span>{item.dish?.name || 'Unknown Item'}</span>
                          <span>x {item.quantity}</span>
                        </li>
                      ))}
                  </ul>
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
            ))}
          </div>
        )}
      </div>
      {/* ONLY render PrintableBill when billToPrint is set */}
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
