import React, { useState } from 'react';
import styles from './OrdersTable.module.css';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const OrdersTable = ({ orders }) => {
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    const getStatusClass = (status) => styles[status?.toLowerCase()] || '';

    // Updated to calculate all totals
    const pageTotals = orders.reduce((acc, order) => {
        if (order.status !== 'Cancelled') {
            acc.subtotal += parseFloat(order.total_amount || 0);
            acc.totalDiscount += parseFloat(order.total_discount || 0);
            acc.taxes += parseFloat(order.tax_amount || 0);
            acc.finalTotal += parseFloat(order.final_amount || 0);
        }
        return acc;
    }, { subtotal: 0, totalDiscount: 0, taxes: 0, finalTotal: 0 });

    if (orders.length === 0) {
        return (
            <div className={styles.recentOrdersContainer}>
                <h3>Today's Orders</h3>
                <p className={styles.noOrders}>No orders for today yet.</p>
            </div>
        );
    }

    return (
        <div className={styles.recentOrdersContainer}>
            <h3>Today's Orders</h3>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Table</th>
                            <th>Subtotal</th>
                            <th>Discount</th>
                            <th>Taxes</th>
                            <th>Final Amount</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Time</th>
                            <th>Items</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => {
                            const subtotal = parseFloat(order.total_amount || 0);
                            const totalDiscount = parseFloat(order.total_discount || 0);
                            const finalTotal = parseFloat(order.final_amount || 0);
                            const taxes = parseFloat(order.tax_amount || 0);
                            const formattedTime = new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <React.Fragment key={order.id}>
                                    <tr onClick={() => toggleOrderExpansion(order.id)} className={styles.orderRow}>
                                        <td>#{order.id}</td>
                                        <td>{order.customer?.name || 'Walk-in'}</td>
                                        <td>{order.table_number ?? 'N/A'}</td>
                                        <td>₹{subtotal.toFixed(2)}</td>
                                        <td>₹{totalDiscount.toFixed(2)}</td>
                                        <td>₹{taxes.toFixed(2)}</td>
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
                                            <td colSpan="11">
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
                            <td colSpan="3"><strong>Page Totals (Paid & Non-Cancelled)</strong></td>
                            <td><strong>₹{pageTotals.subtotal.toFixed(2)}</strong></td>
                            <td><strong>₹{pageTotals.totalDiscount.toFixed(2)}</strong></td>
                            <td><strong>₹{pageTotals.taxes.toFixed(2)}</strong></td>
                            <td><strong>₹{pageTotals.finalTotal.toFixed(2)}</strong></td>
                            <td colSpan="4"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default OrdersTable;