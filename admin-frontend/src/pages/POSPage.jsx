import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './POSPage.module.css';
import { FiXCircle } from 'react-icons/fi';

const POSPage = () => {
    const [tables, setTables] = useState([]);
    const [menu, setMenu] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedTable, setSelectedTable] = useState(null);
    const [currentOrder, setCurrentOrder] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tablesRes, menuRes, categoriesRes] = await Promise.all([
                    apiClient.get('/tables/'),
                    apiClient.get('/menu/dishes/'),
                    apiClient.get('/menu/categories/')
                ]);
                setTables(tablesRes.data);
                setMenu(menuRes.data.filter(dish => dish.is_available)); // Only show available dishes
                setCategories([{ id: 'All', name: 'All' }, ...categoriesRes.data]);
            } catch (err) {
                setError('Failed to load required data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const addToOrder = (dish) => {
        setCurrentOrder(prevOrder => {
            const existingItem = prevOrder.find(item => item.id === dish.id);
            if (existingItem) {
                return prevOrder.map(item =>
                    item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevOrder, { ...dish, quantity: 1 }];
        });
    };

    const removeFromOrder = (dishId) => {
        setCurrentOrder(prevOrder => {
            const existingItem = prevOrder.find(item => item.id === dishId);
            if (existingItem && existingItem.quantity > 1) {
                return prevOrder.map(item =>
                    item.id === dishId ? { ...item, quantity: item.quantity - 1 } : item
                );
            }
            return prevOrder.filter(item => item.id !== dishId);
        });
    };

    const calculateTotal = () => {
        return currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
    };

    const handlePlaceOrder = async () => {
        if (currentOrder.length === 0) {
            alert('Cannot place an empty order.');
            return;
        }

        const orderData = {
            table_number: selectedTable.table_number,
            items: currentOrder.map(item => ({ dish: item.id, quantity: item.quantity })),
        };

        try {
            // --- FIX: Use the correct URL for staff-placed POS orders ---
            await apiClient.post('/orders/pos-place/', orderData);
            alert(`Order placed successfully for Table ${selectedTable.table_number}!`);
            setCurrentOrder([]);
            setSelectedTable(null);
        } catch (err) {
            alert(`Failed to place order: ${err.response?.data?.error || 'An error occurred.'}`);
            console.error(err);
        }
    };

    if (loading) return <div className={styles.container}><h2>Loading POS...</h2></div>;
    if (error) return <div className={styles.container}><h2>{error}</h2></div>;

    if (!selectedTable) {
        return (
            <div className={styles.container}>
                <h1>Select a Table</h1>
                <div className={styles.tableGrid}>
                    {tables.map(table => (
                        <div key={table.id} className={styles.tableCard} onClick={() => setSelectedTable(table)}>
                            Table {table.table_number}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const filteredMenu = selectedCategory === 'All' 
        ? menu 
        : menu.filter(dish => dish.category?.name === selectedCategory);

    return (
        <div className={styles.posLayout}>
            <div className={styles.menuSection}>
                <div className={styles.menuHeader}>
                    <h3>Menu (Table {selectedTable.table_number})</h3>
                    <select onChange={(e) => setSelectedCategory(e.target.value)} value={selectedCategory}>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.menuGrid}>
                    {filteredMenu.map(dish => (
                        <div key={dish.id} className={styles.dishCard} onClick={() => addToOrder(dish)}>
                            <img src={dish.image_url ? `http://127.0.0.1:8000${dish.image_url}` : 'https://placehold.co/100x100/EFEFEF/AAAAAA&text=No+Image'} alt={dish.name} />
                            <p>{dish.name}</p>
                            <span>₹{dish.price}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.orderSection}>
                <h3>Current Order</h3>
                <ul className={styles.orderList}>
                    {currentOrder.map(item => (
                        <li key={item.id}>
                            <div className={styles.itemInfo}>
                                <span>{item.name}</span>
                                <span className={styles.itemPrice}>₹{item.price}</span>
                            </div>
                            <div className={styles.itemControls}>
                                <button onClick={() => removeFromOrder(item.id)}>-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => addToOrder(item)}>+</button>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className={styles.orderTotal}>
                    <strong>Total: ₹{calculateTotal()}</strong>
                </div>
                <div className={styles.orderActions}>
                    <button className={styles.cancelButton} onClick={() => { setCurrentOrder([]); setSelectedTable(null); }}>Cancel</button>
                    <button className={styles.placeOrderButton} onClick={handlePlaceOrder}>Place Order</button>
                </div>
            </div>
        </div>
    );
};

export default POSPage;
