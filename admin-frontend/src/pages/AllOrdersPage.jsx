import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './AllOrdersPage.module.css';

const AllOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State for all filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');

    // Helper function to build the query string from the current state
    const getQueryString = () => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (statusFilter) params.append('status', statusFilter);
        if (paymentFilter) params.append('payment_status', paymentFilter);
        return params.toString();
    };
    
    const fetchOrders = () => {
        setLoading(true);
        const queryString = getQueryString();
        const url = `/orders/all/?${queryString}`;

        apiClient.get(url)
          .then(res => setOrders(res.data))
          .catch(() => alert('Failed to load orders'))
          .finally(() => setLoading(false));
    };

    // Fetch orders only on the initial component mount
    useEffect(() => {
        fetchOrders();
    }, []);

    const handleFilter = () => {
        fetchOrders();
    };

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatusFilter('');
        setPaymentFilter('');
        // Use a timeout to ensure state is cleared before re-fetching
        setTimeout(fetchOrders, 0); 
    };
    
    const handleExport = async () => {
    const queryString = getQueryString();
    const url = `/orders/export-csv/?${queryString}`;

    try {
        // 1. Make the request using your authenticated apiClient
        // We tell it to expect the response as a 'blob' (a file-like object)
        const response = await apiClient.get(url, {
            responseType: 'blob',
        });

        // 2. Create a URL for the blob in the browser's memory
        const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));

        // 3. Create a temporary link element
        const link = document.createElement('a');
        link.href = downloadUrl;

        // 4. Set the filename for the download
        const today = new Date().toISOString().slice(0, 10);
        link.setAttribute('download', `orders_${today}.csv`);

        // 5. Add the link to the page, programmatically click it, and then remove it
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        // 6. Clean up the temporary URL
        window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
        console.error("Failed to download CSV:", error);
        alert("Failed to export orders. The data might be too large or there was a server error.");
    }
};

    return (
        <div className={styles.container}>
            <h4>📦 All Orders (History)</h4>

            <div className={styles.filterContainer}>
                <div className={styles.dateInput}>
                    <label>Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className={styles.dateInput}>
                    <label>End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>

                <div className={styles.selectInput}>
                    <label>Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Served">Served</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div className={styles.selectInput}>
                    <label>Payment</label>
                    <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                    </select>
                </div>

                <div className={styles.actionButtons}>
                    <button className={styles.filterButton} onClick={handleFilter}>Filter</button>
                    <button className={styles.clearButton} onClick={handleClearFilters}>Clear</button>
                    <button className={styles.exportButton} onClick={handleExport}>Export as CSV</button>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer / Table</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Final Amount</th>
                            <th>Date & Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className={styles.statusCell}>Loading...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="6" className={styles.statusCell}>No orders found.</td></tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>{order.customer?.name || 'Walk-in'} (T{order.table_number})</td>
                                    <td>
                                        <span className={`${styles.status} ${styles[order.status?.toLowerCase()]}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.status} ${order.bill?.payment_status?.toLowerCase() === 'paid' ? styles.paid : styles.unpaid}`}>
                                            {order.bill?.payment_status || 'N/A'}
                                        </span>
                                    </td>
                                    <td>₹{parseFloat(order.final_amount || 0).toFixed(2)}</td>
                                    <td>{new Date(order.created_at).toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AllOrdersPage;