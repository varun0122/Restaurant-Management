import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Categories.module.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current category from URL or default to 'All'
  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get('category') || 'All';

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/menu/categories/')
      .then(response => setCategories(response.data))
      .catch(error => console.error("Error fetching categories:", error));
  }, []);

  const handleCategoryClick = (categoryName) => {
    navigate(`/menu?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.scrollWrapper}>
        <button
          className={`${styles.categoryButton} ${selectedCategory === 'All' ? styles.active : ''}`}
          onClick={() => handleCategoryClick('All')}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={`${styles.categoryButton} ${selectedCategory === category.name ? styles.active : ''}`}
            onClick={() => handleCategoryClick(category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Categories;
