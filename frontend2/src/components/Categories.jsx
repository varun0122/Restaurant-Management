import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Make sure axios is imported
import styles from './Categories.module.css';

const Categories = ({ selectedCategory, setSelectedCategory }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // This is the real code that fetches from your backend API
    axios.get('http://127.0.0.1:8000/api/menu/categories/')
      .then(response => {
        setCategories(response.data);
      })
      .catch(error => {
        console.error("Error fetching categories:", error);
      });
  }, []); // The empty array [] means this runs only once when the component loads

  return (
    <div className={styles.container}>
      <div className={styles.scrollWrapper}>
        <button
          className={`${styles.categoryButton} ${selectedCategory === 'All' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          All
        </button>

        {categories.map(category => (
          <button
            key={category.id}
            className={`${styles.categoryButton} ${selectedCategory === category.name ? styles.active : ''}`}
            onClick={() => setSelectedCategory(category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Categories;