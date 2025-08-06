import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ViewCartBar.module.css';

const ViewCartBar = ({ cart }) => {
  if (cart.length === 0) {
    return null;
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        <span>{totalItems} Item{totalItems > 1 ? 's' : ''} added</span>
        <Link to="/cart" className={styles.link}>
          View Cart &rarr;
        </Link>
      </div>
    </div>
  );
};

export default ViewCartBar;
