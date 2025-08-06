import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { FiShoppingCart, FiUser, FiSearch, FiHome, FiTruck } from 'react-icons/fi'; // Added FiTruck
import { MdStars } from "react-icons/md";
import { GiHotSpices } from "react-icons/gi";

// Base menu items that are always visible
const baseMenuItems = [
  { label: 'Menu', path: '/menu', icon: <FiHome /> },
  { label: "Today's Special", path: '/specials', icon: <GiHotSpices /> },
  { label: 'Most-Liked', path: '/most-liked', icon: <MdStars /> },
  { label: 'History', path: '/history', icon: <FiShoppingCart /> }
];

const Navbar = ({ searchTerm, setSearchTerm, showSearch }) => {
  const location = useLocation();
  const [menuItems, setMenuItems] = useState(baseMenuItems);

  // This effect checks for an active order and updates the nav items
  useEffect(() => {
    const activeOrderId = localStorage.getItem('active_order_id');
    
    if (activeOrderId) {
      const trackOrderItem = {
        label: 'Track Order',
        path: `/order-status/${activeOrderId}`,
        icon: <FiTruck />
      };
      
      // --- THE FIX IS HERE ---
      // Find the position of the 'History' button
      const historyIndex = baseMenuItems.findIndex(item => item.label === 'History');

      if (historyIndex !== -1) {
        // Create a new array and insert 'Track Order' right before 'History'
        const newMenuItems = [
          ...baseMenuItems.slice(0, historyIndex),
          trackOrderItem,
          ...baseMenuItems.slice(historyIndex)
        ];
        setMenuItems(newMenuItems);
      } else {
        // Fallback if 'History' isn't found for some reason
        setMenuItems([trackOrderItem, ...baseMenuItems]);
      }

    } else {
      // If no active order, we use the default list of items
      setMenuItems(baseMenuItems);
    }
  }, [location]); // Re-check whenever the page location changes

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.navbar}>
          <h1 className={styles.title}>Famous Cafe</h1>
          <div className={styles.rightIcons}>
            <Link to="/cart" className={styles.iconButton} aria-label="Cart">
              <FiShoppingCart />
            </Link>
            <Link to="/account" className={styles.iconButton} aria-label="Account">
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
                placeholder="Search food, restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className={styles.searchIcon} />
            </div>
          </div>
        )}
      </header>

      {/* Fixed Bottom Navigation */}
      <nav className={styles.bottomNav}>
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.bottomNavLink} ${location.pathname.startsWith(item.path) && item.path !== '/' ? styles.active : location.pathname === '/' && item.path === '/' ? styles.active : ''}`}
          >
            <span className={styles.iconOnly}>{item.icon}</span>
            <span className={styles.bottomLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

export default Navbar;
