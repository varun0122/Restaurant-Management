import React, { useState, useEffect } from 'react';
import { useBillDetails } from '../hooks/useBillDetails';
import apiClient from '../api/axiosConfig';
import styles from './BillModal.module.css';
import toast from 'react-hot-toast';

const BillModal = ({ billId, onClose, onUpdate }) => {
    const { bill, customer, loading, error, applyCoins, removeCoins, applyDiscount, removeDiscount } = useBillDetails(billId, onUpdate);

    const [availableOffers, setAvailableOffers] = useState([]);
    const [isApplying, setIsApplying] = useState(false);
    const [isOffersExpanded, setIsOffersExpanded] = useState(false);

    useEffect(() => {
        if (billId) {
            setIsOffersExpanded(false);
            apiClient.get('/discounts/public/').then(res => setAvailableOffers(res.data));
        }
    }, [billId]);

    const handleApiCall = async (apiFunction) => {
        setIsApplying(true);
        try {
            await apiFunction();
        } finally {
            setIsApplying(false);
        }
    };

    const handleApplyMaxCoins = () => {
        const currentSubtotal = parseFloat(bill?.subtotal || 0) - parseFloat(bill?.discount_amount || 0);
        const currentGrandTotal = Math.max(0, currentSubtotal) * 1.05;
        const maxCoinsValue = (customer?.loyalty_coins || 0) / 10.0;
        const valueToRedeem = Math.min(currentGrandTotal, maxCoinsValue);
        const coinsToApply = Math.floor(valueToRedeem * 10);

        if (coinsToApply <= 0) {
            return toast.error("No coins can be applied to this bill.");
        }
        handleApiCall(() => applyCoins(coinsToApply));
    };

    if (!billId) return null;

    // --- THIS IS THE CORRECTED CALCULATION LOGIC (from your original code) ---
    const subtotal = parseFloat(bill?.subtotal ?? 0);
    const discount = parseFloat(bill?.discount_amount || 0);
    const coinDiscount = parseFloat(bill?.coin_discount || 0);
    const discountedSubtotal = Math.max(0, subtotal - discount - coinDiscount);
    const taxes = discountedSubtotal * 0.05;
    const grandTotal = discountedSubtotal + taxes;
    // --- END OF CORRECTION ---

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div className={styles.modalContent}>
                <button className={styles.closeButton} onClick={onClose}>&times;</button>

                {loading && <h2 className={styles.loadingText}>Loading Bill...</h2>}
                {!loading && error && <h2 className={styles.error}>{error}</h2>}

                {!loading && !error && bill && customer && (
                    <>
                        <h3>Bill for Table {bill.table_number}</h3>
                        <p className={styles.billId}>Bill ID: #{bill.id}</p>
                        
                        <div className={styles.totalsSection}>
                            <div className={styles.totalRow}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                            {discount > 0 && (<div className={`${styles.totalRow} ${styles.discount}`}><span>Discount ({bill.applied_discount?.code})</span><span>- ₹{discount.toFixed(2)}</span></div>)}
                            {coinDiscount > 0 && (<div className={`${styles.totalRow} ${styles.discount}`}><span>Coin Discount ({bill.coins_redeemed} coins)</span><span>- ₹{coinDiscount.toFixed(2)}</span></div>)}
                            <div className={styles.totalRow}><span>Taxes (5%)</span><span>₹{taxes.toFixed(2)}</span></div>
                            <hr className={styles.divider} />
                            <div className={`${styles.totalRow} ${styles.grandTotal}`}><strong>Grand Total</strong><strong>₹{grandTotal.toFixed(2)}</strong></div>
                        </div>

                        <div className={styles.loyaltySection}>
                            <p>You have <strong>{customer.loyalty_coins}</strong> coins (worth ₹{(customer.loyalty_coins / 10).toFixed(2)})</p>
                            {coinDiscount > 0 ? (
                                <button onClick={() => handleApiCall(removeCoins)} disabled={isApplying} className={styles.removeButton}>{isApplying ? 'Removing...' : 'Remove Coins'}</button>
                            ) : (
                                <button onClick={handleApplyMaxCoins} disabled={isApplying || customer.loyalty_coins <= 0} className={styles.applyButton}>{isApplying ? 'Applying...' : 'Apply Max Coins'}</button>
                            )}
                        </div>

                        <div className={styles.discountContainer}>
                            {bill.applied_discount ? (
                                <div className={styles.discountApplied}>
                                    <span>Discount <strong>{bill.applied_discount.code}</strong> applied!</span>
                                    <button onClick={() => handleApiCall(removeDiscount)} disabled={isApplying} className={styles.removeButton}>Remove</button>
                                </div>
                            ) : (
                                <>
                                    <button className={styles.offersHeader} onClick={() => setIsOffersExpanded(!isOffersExpanded)}>
                                        <span>View Available Offers</span>
                                        <span className={styles.expanderIcon}>{isOffersExpanded ? '−' : '+'}</span>
                                    </button>
                                    <div className={`${styles.offersList} ${isOffersExpanded ? styles.expanded : ''}`}>
                                        <ul>
                                            {availableOffers.map(offer => {
                                                const isEligible = subtotal >= parseFloat(offer.minimum_bill_amount);
                                                return (
                                                    <li key={offer.id}>
                                                        <div className={styles.offerInfo}>
                                                            <strong>{offer.code}</strong>: {offer.discount_type === 'PERCENTAGE' ? `${parseFloat(offer.value).toFixed(0)}% off` : `₹${parseFloat(offer.value).toFixed(2)} off`}
                                                            {!isEligible && <small className={styles.eligibilityError}>* Requires min. spend of ₹{offer.minimum_bill_amount}</small>}
                                                        </div>
                                                        <button className={styles.offerButton} onClick={() => handleApiCall(() => applyDiscount(offer.code))} disabled={!isEligible || isApplying}>Apply</button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BillModal;