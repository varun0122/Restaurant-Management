import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import styles from '../Pages/CounterPage.module.css';
import { FiPlus, FiMinus, FiSearch, FiX } from 'react-icons/fi';
import PrintableBill from '../components/PrintableBill';

// Re-introduced for UI preview purposes. The backend remains the source of truth for the final bill.
const TAX_RATE = 0.05;

// --- Simplified Modal for adding customer at payment time ---
// --- FIX: Removed the unused 'customers' prop ---
const PaymentPromptModal = ({ isOpen, onClose, onFinalizePayment }) => {
    const [phoneNumber, setPhoneNumber] = useState('');

    if (!isOpen) return null;

    const handleFindAndPay = () => {
        onFinalizePayment(phoneNumber.trim());
    };

    const handlePayAsWalkIn = () => {
        onFinalizePayment(null);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
                <button onClick={onClose} className={styles.modalCloseButton}><FiX /></button>
                <h3>Add Customer to Bill (Optional)</h3>
                <p className={styles.modalSubtitle}>Enter a phone number to link this sale to a customer.</p>

                <div className={styles.paymentPromptForm}>
                    <input
                        type="tel"
                        placeholder="Customer's phone number..."
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={styles.promptInput}
                    />
                    <button onClick={handleFindAndPay} className={styles.promptButton}>
                        Find & Pay
                    </button>
                    <button onClick={handlePayAsWalkIn} className={`${styles.promptButton} ${styles.secondaryButton}`}>
                        Pay as Walk-in / Skip
                    </button>
                </div>
            </div>
        </div>
    );
};


const CounterPage = () => {
    const [posDishes, setPosDishes] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastBill, setLastBill] = useState(null);

    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountError, setDiscountError] = useState('');
    const [isDiscountLoading, setIsDiscountLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [customers, setCustomers] = useState([]);
    const [walkInCustomer, setWalkInCustomer] = useState(null);
    const [isPaymentPromptOpen, setIsPaymentPromptOpen] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dishesResponse, categoriesResponse, customersResponse] = await Promise.all([
                    apiClient.get('/menu/pos-dishes/'),
                    apiClient.get('/menu/pos-categories/'),
                    apiClient.get('/customers/')
                ]);

                setPosDishes(dishesResponse.data);
                
                const categoryNames = categoriesResponse.data.map(cat => cat.name);
                setCategories(['All', ...categoryNames]);

                const allCustomers = customersResponse.data;
                setCustomers(allCustomers);
                const defaultCustomer = allCustomers.find(c => c.phone_number === '0000000000');
                if (defaultCustomer) {
                    setWalkInCustomer(defaultCustomer);
                } else {
                    console.warn("Default 'Walk-in' customer with phone '0000000000' not found.");
                }

            } catch (err) {
                setError('Failed to fetch initial data. Ensure you are logged in as an admin.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const addToCart = (dish) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.id === dish.id);
            if (existingItem) {
                return currentCart.map(item =>
                    item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...currentCart, { ...dish, quantity: 1 }];
        });
    };

    const updateQuantity = (dishId, amount) => {
        setCart(currentCart => {
            const itemToUpdate = currentCart.find(item => item.id === dishId);
            if (itemToUpdate.quantity + amount < 1) {
                return currentCart.filter(item => item.id !== dishId);
            }
            return currentCart.map(item =>
                item.id === dishId ? { ...item, quantity: item.quantity + amount } : item
            );
        });
    };

    const clearCart = () => {
        setCart([]);
        setDiscountCode('');
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setDiscountError('');
    };

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0);
    const taxes = (subtotal - discountAmount) * TAX_RATE;
    const finalTotal = subtotal - discountAmount + taxes;


    const handleApplyDiscount = async () => {
        const currentSubtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0);
        if (!discountCode.trim() || cart.length === 0) {
            setDiscountError('Please enter a code and add items to the cart first.');
            return;
        }
        setIsDiscountLoading(true);
        setDiscountError('');
        try {
            const response = await apiClient.post('/billing/preview-discount/', {
                code: discountCode,
                cart_items: cart.map(item => ({ dish_id: item.id, quantity: item.quantity })),
                subtotal: currentSubtotal
            });
            if (response.data.valid) {
                setDiscountAmount(response.data.discount_amount);
                setAppliedDiscount(response.data.discount_metadata);
                setDiscountCode('');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Invalid or expired discount code.';
            setDiscountError(errorMessage);
            setAppliedDiscount(null);
            setDiscountAmount(0);
        } finally {
            setIsDiscountLoading(false);
        }
    };

    const handleRemoveDiscount = () => {
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setDiscountError('');
    };

    const handleConfirmPayment = () => {
        if (cart.length === 0) {
            alert("Cart is empty.");
            return;
        }
        setIsPaymentPromptOpen(true);
    };

    const handleFinalizePayment = async (phoneNumber) => {
        setIsPaymentPromptOpen(false);

        let customerToCharge = walkInCustomer;

        if (phoneNumber) {
            const foundCustomer = customers.find(c => c.phone_number === phoneNumber);
            if (foundCustomer) {
                customerToCharge = foundCustomer;
            } else {
                alert(`Customer with phone "${phoneNumber}" not found. The sale will be recorded as a 'Walk-in'.`);
            }
        }

        if (!customerToCharge) {
            alert("Default walk-in customer is not configured. Cannot proceed with payment.");
            return;
        }

        const orderData = {
            customer: customerToCharge.id,
            table_number: 0,
            status: 'Pending',
            is_pos_order: true,
            items: cart.map(item => ({
                dish: item.id,
                quantity: item.quantity,
            })),
            discount_code: appliedDiscount ? appliedDiscount.code : undefined,
        };

        try {
            const resp = await apiClient.post('/orders/create-and-pay/', orderData);
            const amount = resp.data.total_amount || 0;
            alert(`Payment confirmed for ₹${parseFloat(amount).toFixed(2)}!`);

            setLastBill(resp.data);
            clearCart();
        } catch (err) {
            console.error("Payment failed:", err.response ? err.response.data : err);
            alert('Failed to complete payment. Please check console for details.');
        }
    };

    const filteredDishes = posDishes.filter(dish => {
        // --- FIX: Access the category name from the nested object ---
        const matchesCategory = selectedCategory === 'All' || (dish.category?.name === selectedCategory);
        const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) return <div className={styles.container}><h2>Loading POS Menu...</h2></div>;
    if (error) return <div className={`${styles.container} ${styles.error}`}><h2>{error}</h2></div>;

    return (
        <div className={styles.posContainer}>
            <div className={styles.menuSection}>
                <div className={styles.filtersContainer}>
                    <div className={styles.searchBar}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search for a dish..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={styles.categoryButtons}>
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`${styles.categoryButton} ${selectedCategory === category ? styles.activeCategory : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.menuGrid}>
                    {filteredDishes.length > 0 ? (
                        filteredDishes.map(dish => (
                            <button key={dish.id} className={styles.dishCard} onClick={() => addToCart(dish)}>
                                <img
                                    src={dish.image_url ? `http://127.0.0.1:8000${dish.image_url}` : 'https://placehold.co/150'}
                                    alt={dish.name}
                                />
                                <div className={styles.dishName}>{dish.name}</div>
                                <div className={styles.dishPrice}>₹{parseFloat(dish.price).toFixed(2)}</div>
                            </button>
                        ))
                    ) : (
                        <p className={styles.noResults}>No dishes found matching your criteria.</p>
                    )}
                </div>
            </div>

            <div className={styles.cart}>
                <h2 className={styles.cartTitle}>Current Order</h2>
                <div className={styles.cartItems}>
                    {cart.length === 0 ? (
                        <p className={styles.emptyCart}>Tap an item to start an order.</p>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className={styles.cartItem}>
                                <div className={styles.itemInfo}>
                                    <span className={styles.itemName}>{item.name}</span>
                                    <span className={styles.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</span>
                                </div>
                                <div className={styles.itemControls}>
                                    <button onClick={() => updateQuantity(item.id, -1)}><FiMinus /></button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)}><FiPlus /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.discountSection}>
                    {appliedDiscount ? (
                        <div className={styles.appliedDiscount}>
                            <span>✓ Discount <b>{appliedDiscount.code}</b> applied!</span>
                            <button onClick={handleRemoveDiscount}>Remove</button>
                        </div>
                    ) : (
                        <div className={styles.discountInputGroup}>
                            <input
                                type="text"
                                value={discountCode}
                                placeholder="Enter discount code"
                                onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                                disabled={isDiscountLoading}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                            />
                            <button onClick={handleApplyDiscount} disabled={isDiscountLoading || !discountCode.trim()}>
                                {isDiscountLoading ? 'Applying...' : 'Apply'}
                            </button>
                        </div>
                    )}
                    {discountError && <div className={styles.discountError}>{discountError}</div>}
                </div>

                <div className={styles.cartSummary}>
                    <div className={styles.total}>
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className={`${styles.total} ${styles.discountApplied}`}>
                            <span>Discount ({appliedDiscount?.code})</span>
                            <span>- ₹{discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className={styles.total}>
                        <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                        <span>₹{taxes.toFixed(2)}</span>
                    </div>
                    <div className={styles.grandTotal}>
                        <span><strong>ESTIMATED TOTAL</strong></span>
                        <span><strong>₹{finalTotal.toFixed(2)}</strong></span>
                    </div>
                    <p style={{textAlign: 'center', fontSize: '0.8rem', color: '#aaa', margin: '-8px 0 12px'}}>Final tax calculated on payment</p>
                    <button className={styles.confirmButton} onClick={handleConfirmPayment}>
                        Confirm Payment & Print
                    </button>
                    <button className={styles.clearButton} onClick={clearCart}>
                        Clear Order
                    </button>
                </div>
            </div>

            {lastBill && (
                <PrintableBill
                    bill={lastBill}
                    onAfterPrint={() => setLastBill(null)}
                />
            )}
            
            <PaymentPromptModal
                isOpen={isPaymentPromptOpen}
                onClose={() => setIsPaymentPromptOpen(false)}
                onFinalizePayment={handleFinalizePayment}
                
                // --- FIX: Removed the unused 'customers' prop ---
            />
        </div>
    );
};

export default CounterPage;

