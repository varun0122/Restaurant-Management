import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './HomePage.module.css';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const HomePage = () => {
  const [specials, setSpecials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSpecial, setCurrentSpecial] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [specialsRes, categoriesRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/menu/dishes/specials/'),
          axios.get('http://127.0.0.1:8000/api/menu/categories/')
        ]);
        setSpecials(specialsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        setError('Could not load restaurant data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Effect for the specials carousel
  useEffect(() => {
    if (specials.length > 1) {
      const timer = setInterval(() => {
        setCurrentSpecial(prev => (prev === specials.length - 1 ? 0 : prev + 1));
      }, 5000); // Change slide every 5 seconds
      return () => clearInterval(timer);
    }
  }, [specials]);

  const nextSpecial = () => {
    setCurrentSpecial(prev => (prev === specials.length - 1 ? 0 : prev + 1));
  };

  const prevSpecial = () => {
    setCurrentSpecial(prev => (prev === 0 ? specials.length - 1 : prev - 1));
  };
  
  const handleCategoryClick = (categoryName) => {
      navigate(`/menu?category=${encodeURIComponent(categoryName)}`);
  };

  if (loading) return <div className={styles.loader}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      {/* Hero Section for Today's Specials */}
      {specials.length > 0 && (
        <div className={styles.heroSection}>
          <div className={styles.carousel}>
            {specials.map((dish, index) => (
              <div 
                key={dish.id} 
                className={`${styles.carouselSlide} ${index === currentSpecial ? styles.active : ''}`}
              >
                <img src={`http://127.0.0.1:8000${dish.image_url}`} alt={dish.name} />
                <div className={styles.carouselCaption}>
                  <h3>Today's Special</h3>
                  <h2>{dish.name}</h2>
                  <p>{dish.description}</p>
                </div>
              </div>
            ))}
            {specials.length > 1 && (
              <>
                <button onClick={prevSpecial} className={`${styles.carouselControl} ${styles.prev}`}>
                  <FiChevronLeft />
                </button>
                <button onClick={nextSpecial} className={`${styles.carouselControl} ${styles.next}`}>
                  <FiChevronRight />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Category Grid Section */}
      <div className={styles.categorySection}>
        <h2 className={styles.sectionTitle}>Browse by Category</h2>
        <div className={styles.categoryGrid}>
          {categories.map(category => (
            <div key={category.id} className={styles.categoryCard} onClick={() => handleCategoryClick(category.name)}>
              {/* We can add category images later if the model supports it */}
              <div className={styles.categoryInfo}>
                <h3>{category.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.viewFullMenu}>
        <Link to="/menu" className={styles.menuButton}>View Full Menu</Link>
      </div>
    </div>
  );
};

export default HomePage;
