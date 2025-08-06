import React from 'react';
import styles from './FoodTypeFilter.module.css';

const FoodTypeFilter = ({ selectedFoodType, setSelectedFoodType }) => {
  return (
    <div className={styles.container}>
      <div className={styles.toggleWrapper}>
        <button
          className={`${styles.toggleButton} ${selectedFoodType === 'all' ? styles.active : ''}`}
          onClick={() => setSelectedFoodType('all')}
        >
          All
        </button>
        <button
          className={`${styles.toggleButton} ${styles.veg} ${selectedFoodType === 'veg' ? styles.active : ''}`}
          onClick={() => setSelectedFoodType('veg')}
        >
          Veg
        </button>
        <button
          className={`${styles.toggleButton} ${styles.nonVeg} ${selectedFoodType === 'non-veg' ? styles.active : ''}`}
          onClick={() => setSelectedFoodType('non-veg')}
        >
          Non-Veg
        </button>
      </div>
    </div>
  );
};

export default FoodTypeFilter;