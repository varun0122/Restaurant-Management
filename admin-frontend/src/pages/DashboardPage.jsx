import React, { useState, useEffect, useCallback, useRef } from 'react'; // <-- Add useRef
import useWebSocket from 'react-use-websocket';
import apiClient from '../api/axiosConfig';
import styles from './DashboardPage.module.css';
import SummaryCards from '../components/SummaryCards';
import SalesChart from '../components/SalesChart';
import OrdersTable from '../components/OrdersTable';
import { FiRefreshCw } from 'react-icons/fi';

const DashboardPage = () => {
    const [summary, setSummary] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    
    // Use a ref to prevent multiple simultaneous fetches
    const isFetchingRef = useRef(false);

    const socketUrl = 'ws://127.0.0.1:8000/ws/orders/';
    const { lastMessage } = useWebSocket(socketUrl);

    const fetchDashboardData = useCallback(async () => {
        // Prevent re-fetching if a fetch is already in progress
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        
        setIsRefreshing(true);

        try {
            const [summaryResponse, ordersResponse] = await Promise.all([
                apiClient.get('/orders/dashboard-summary/'),
                apiClient.get('/orders/dashboard-orders/')
            ]);
            setSummary(summaryResponse.data);
            setOrders(ordersResponse.data);
            setError('');
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setError('Failed to fetch dashboard data. Please check your connection.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
            // Allow fetching again
            isFetchingRef.current = false;
        }
    }, []); // <-- The dependency array for useCallback is empty

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (lastMessage !== null) {
            fetchDashboardData();
        }
    }, [lastMessage]); // <-- THE FIX: Removed fetchDashboardData from this dependency array

    if (loading) {
        return <div className={styles.container}><h2>Loading Dashboard...</h2></div>;
    }

    return (
        // ... your JSX remains the same
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

            <SummaryCards summary={summary} />

            <div className={styles.bottomSection}>
                <SalesChart data={summary?.weekly_sales || []} />
                <OrdersTable orders={orders} />
            </div>
        </div>
    );
};

export default DashboardPage;