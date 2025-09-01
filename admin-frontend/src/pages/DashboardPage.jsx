import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './DashboardPage.module.css';
import SalesChart from '../components/SalesChart';
import { FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';

const DashboardPage = () => {
    const [summary, setSummary] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    const intervalRef = useRef(null);
    const isFetchingRef = useRef(false);

    const fetchDashboardData = useCallback(async () => {
        if (isFetchingRef.current) return;
        setIsRefreshing(true);
        isFetchingRef.current = true;

        try {
            const [summaryResponse, ordersResponse] = await Promise.all([
                apiClient.get('/orders/dashboard-summary/'),
                // ✨ CHANGED: Calling the new, correct API endpoint
                apiClient.get('/orders/dashboard-orders/') 
            ]);
            setSummary(summaryResponse.data);
            setOrders(ordersResponse.data);
            setError('');
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            if (err.response) {
                if (err.response.status === 401 || err.response.status === 403) {
                    setError('Session expired. Please log in again.');
                } else if (err.response.status >= 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError('Failed to fetch data. Please try again.');
                }
            } else if (err.request) {
                setError('Network error. Please check your connection.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
            isFetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchDashboardData();
                intervalRef.current = setInterval(fetchDashboardData, 15000);
            } else {
                clearInterval(intervalRef.current);
            }
        };
        intervalRef.current = setInterval(fetchDashboardData, 15000);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            clearInterval(intervalRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchDashboardData]);

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    const getStatusClass = (status) => styles[status?.toLowerCase()] || '';

    // ✨ CHANGED: Updated to use the new API data structure correctly
    const pageTotals = orders.reduce((acc, order) => {
        acc.subtotal += parseFloat(order.total_amount || 0);
        acc.totalDiscount += parseFloat(order.total_discount || 0);
        acc.finalTotal += parseFloat(order.final_amount || 0);
        acc.taxes += parseFloat(order.tax_amount || 0);
        acc.coins += order.bill?.coins_redeemed || 0;
        return acc;
    }, { subtotal: 0, totalDiscount: 0, taxes: 0, finalTotal: 0, coins: 0 });

    if (loading) return <div className={styles.container}><h2>Loading Dashboard...</h2></div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Admin Dashboard</h1>
                <button 
                    onClick={fetchDashboardData} 
                    className={styles.refreshButton} 
                    disabled={isRefreshing}
                >
                    <FiRefreshCw className={isRefreshing ? styles.spinning : ''} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            {summary && (
                <>
                    <div className={styles.grid}>{/* ... Cards ... */}</div>
                    <div className={styles.bottomSection}>
                        <SalesChart data={summary.weekly_sales || []} />
                        <div className={styles.recentOrdersContainer}>
                            <h3>Today's Orders</h3>
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Table</th>
                                            <th>Subtotal</th>
                                            <th>Discount</th>
                                            <th>Taxes</th>
                                            <th>Coins</th> {/* ✨ ADDED */}
                                            <th>Final Amount</th>
                                            <th>Payment</th>
                                            <th>Status</th>
                                            <th>Time</th>
                                            <th>Items</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => {
                                            // ✨ CHANGED: All values are now read directly from the new API response
                                            const subtotal = parseFloat(order.total_amount || 0);
                                            const totalDiscount = parseFloat(order.total_discount || 0);
                                            const finalTotal = parseFloat(order.final_amount || 0);
                                            const taxes = parseFloat(order.tax_amount || 0);
                                            const coins = order.bill?.coins_redeemed || 0;
                                            
                                            const formattedTime = new Date(order.created_at).toLocaleTimeString('en-IN', {
                                                hour: '2-digit', minute: '2-digit'
                                            });

                                            return (
                                                <React.Fragment key={order.id}>
                                                    <tr onClick={() => toggleOrderExpansion(order.id)} className={styles.orderRow}>
                                                        <td>#{order.id}</td>
                                                        <td>{order.customer?.name || 'Walk-in'}</td>
                                                        <td>{order.table_number ?? 'N/A'}</td>
                                                        <td>₹{subtotal.toFixed(2)}</td>
                                                        <td>₹{totalDiscount.toFixed(2)}</td>
                                                        <td>₹{taxes.toFixed(2)}</td>
                                                        <td>{coins}</td> {/* ✨ ADDED */}
                                                        <td><strong>₹{finalTotal.toFixed(2)}</strong></td>
                                                        <td>
                                                            <span className={`${styles.paymentStatus} ${getStatusClass(order.bill?.payment_status)}`}>
                                                                {order.bill?.payment_status || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td>{formattedTime}</td>
                                                        <td className={styles.chevronCell}>
                                                            {expandedOrderId === order.id ? <FiChevronUp /> : <FiChevronDown />}
                                                        </td>
                                                    </tr>
                                                    {expandedOrderId === order.id && (
                                                        <tr className={styles.itemsRow}>
                                                            <td colSpan="12"> {/* ✨ UPDATED COLSPAN */}
                                                                <ul className={styles.itemsList}>
                                                                    {order.items.map(item => (
                                                                        <li key={item.id}>
                                                                            <span>{item.dish.name}</span>
                                                                            <span>x {item.quantity}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className={styles.footerRow}>
                                            <td colSpan="3"><strong>Page Totals</strong></td>
                                            <td><strong>₹{pageTotals.subtotal.toFixed(2)}</strong></td>
                                            <td><strong>₹{pageTotals.totalDiscount.toFixed(2)}</strong></td>
                                            <td><strong>₹{pageTotals.taxes.toFixed(2)}</strong></td>
                                            <td><strong>{pageTotals.coins}</strong></td> {/* ✨ ADDED */}
                                            <td><strong>₹{pageTotals.finalTotal.toFixed(2)}</strong></td>
                                            <td colSpan="4"></td> {/* ✨ UPDATED COLSPAN */}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardPage;