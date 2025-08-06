import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { jwtDecode } from 'jwt-decode';

const Sidebar = ({ isOpen, setIsOpen}) => {
  const navigate = useNavigate();

  const token = localStorage.getItem('admin_access_token');
  const user = token ? jwtDecode(token) : null;

  const handleLogout = () => {
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

          {/* Superuser-only links */}
          {user && user.is_superuser && (
            <>
              <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ''}>Dashboard</NavLink>
              
              {/* --- NEW LINK ADDED HERE --- */}
              <NavLink to="/menu" className={({ isActive }) => isActive ? styles.active : ''}>Menu Management</NavLink>
              
              <NavLink to="/orders" className={({ isActive }) => isActive ? styles.active : ''}>All Orders</NavLink>
              <NavLink to="/billing" className={({ isActive }) => isActive ? styles.active : ''}>Billing</NavLink>
              <NavLink to="/qr-codes" className={({ isActive }) => isActive ? styles.active : ''}>QR Codes</NavLink>
              <NavLink to="/staff" className={({ isActive }) => isActive ? styles.active : ''}>Staff Management</NavLink>
            </>
          )}
        </nav>
        <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
      </div>
    </>
  );
};

export default Sidebar;
