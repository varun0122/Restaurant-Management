import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { jwtDecode } from 'jwt-decode';

const Sidebar = ({ isOpen, setIsOpen}) => {
  const navigate = useNavigate();

  // 1. Get the token and decode the user info here, at the top level of the component.
  const token = localStorage.getItem('admin_access_token');
  const user = token ? jwtDecode(token) : null;

  const handleLogout = () => {
    // 2. The logout function now only needs to remove the items and navigate.
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    navigate('/login');
  };

  return (
    <>
     <div className={`${styles.overlay} ${isOpen ? styles.show : ''}`} onClick={() => setIsOpen(false)}></div>
    <div className={`${styles.sidebar} ${isOpen ? styles.show : ''}`}>
      <h2 className={styles.title}>Admin Panel</h2>
      <nav className={styles.nav}>
        {/* All staff and admins can see the Kitchen View */}
        <NavLink to="/kitchen" className={({ isActive }) => isActive ? styles.active : ''}>Kitchen View</NavLink>

        {/* 3. This condition now works because 'user' is in the correct scope. */}
        {/* We check if the user exists and is a superuser. */}
        {user && user.is_superuser && (
          <>
            <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ''}>Dashboard</NavLink>
            <NavLink to="/orders" className={({ isActive }) => isActive ? styles.active : ''}>All Orders</NavLink>
            <NavLink to="/billing" className={({ isActive }) => isActive ? styles.active : ''}>Billing</NavLink>
            <NavLink to="/qr-codes" className={({ isActive }) => isActive ? styles.active : ''}>QR Codes</NavLink>
          </>
        )}
      </nav>
      <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>

    </div>
    </>
  );
};

export default Sidebar;