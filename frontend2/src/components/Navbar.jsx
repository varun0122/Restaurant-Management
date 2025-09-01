import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { FiShoppingCart, FiUser, FiTruck, FiList, FiHome, FiSearch } from 'react-icons/fi';

const baseMenuItems = [
    { label: 'Menu', path: '/menu', icon: <FiHome />, requiresAuth: false },
    { label: 'Track Order', path: '/order-status', icon: <FiTruck />, requiresAuth: true },
    { label: 'History', path: '/history', icon: <FiList />, requiresAuth: true }
];

// The Navbar now also accepts the `cart` prop
const Navbar = ({ customer, cart, searchTerm, setSearchTerm, showSearch, openLoginModal }) => {
    const location = useLocation();
    const isAuthenticated = !!customer;

    // Calculate the total number of items in the cart by summing their quantities
    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

    const handleProtectedLinkClick = (e, requiresAuth) => {
        if (requiresAuth && !isAuthenticated) {
            e.preventDefault(); 
            openLoginModal();   
        }
    };

    return (
        <>
            <header className={styles.header}>
                <nav className={styles.navbar}>
                    <h1 className={styles.title}>Famous Cafe</h1>
                    <div className={styles.rightIcons}>
                        
                        {/* --- NEW JSX for Cart Icon with Badge --- */}
                        <Link 
                            to="/cart" 
                            className={styles.iconButton} 
                            aria-label="Cart"
                            onClick={(e) => handleProtectedLinkClick(e, false)}
                        >
                            <div className={styles.cartIconWrapper}>
                                <FiShoppingCart />
                                {cartItemCount > 0 && (
                                    <span className={styles.cartBadge}>{cartItemCount}</span>
                                )}
                            </div>
                        </Link>
                        {/* ------------------------------------ */}

                        <Link 
                            to="/account" 
                            className={styles.iconButton} 
                            aria-label="Account"
                            onClick={(e) => handleProtectedLinkClick(e, true)}
                        >
                            <FiUser />
                        </Link>
                    </div>
                </nav>
                {showSearch && (
                    <div className={styles.searchContainer}>
                        <div className={styles.searchInputWrapper}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search food..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <FiSearch className={styles.searchIcon} />
                        </div>
                    </div>
                )}
            </header>

            {/* Bottom Nav remains the same */}
            <nav className={styles.bottomNav}>
                {baseMenuItems.map(item => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`${styles.bottomNavLink} ${isActive ? styles.active : ''}`}
                            onClick={(e) => handleProtectedLinkClick(e, item.requiresAuth)}
                        >
                            <span className={styles.iconOnly}>{item.icon}</span>
                            <span className={styles.bottomLabel}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
};

export default Navbar;