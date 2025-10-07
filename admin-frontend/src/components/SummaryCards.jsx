import React from 'react';
import styles from './SummaryCards.module.css';

const SummaryCard = ({ title, value }) => (
    <div className={styles.card}>
        <div className={styles.value}>{value}</div>
        <div className={styles.title}>{title}</div>
    </div>
);

const SummaryCards = ({ summary }) => {
    if (!summary) return null;

    const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toFixed(2)}`;

    return (
        <div className={styles.grid}>
            <SummaryCard title="Revenue Today" value={formatCurrency(summary.paid_revenue_today)} />
            <SummaryCard title="Pending Orders" value={summary.pending_orders} />
            <SummaryCard title="Total Orders Today" value={summary.todays_orders} />
            <SummaryCard title="Unpaid Revenue" value={formatCurrency(summary.unpaid_revenue)} />
        </div>
    );
};

export default SummaryCards;