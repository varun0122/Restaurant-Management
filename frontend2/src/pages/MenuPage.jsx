import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import AddItemModal from '../components/AddItemModal';
import ViewCartBar from '../components/ViewCartBar';
import styles from './MenuPage.module.css';

const MenuPage = ({ cart, setCart, searchTerm, selectedCategory, selectedFoodType }) => {
  const [menu, setMenu] = useState([]);
  const [specials, setSpecials] = useState([]); // State for specials
  const [mostLiked, setMostLiked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalDish, setModalDish] = useState(null);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const categoryFromUrl = queryParams.get('category');
  const currentCategory = categoryFromUrl || selectedCategory;

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // Fetch all data in parallel
        const [menuRes, likedRes, specialsRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/menu/dishes/'),
          axios.get('http://127.0.0.1:8000/api/menu/dishes/most_liked/'),
          axios.get('http://127.0.0.1:8000/api/menu/dishes/specials/')
        ]);
        setMenu(menuRes.data);
        setMostLiked(likedRes.data);
        setSpecials(specialsRes.data); // Set specials data
      } catch (err) {
        console.error('Error loading menu data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const filterDishes = (dishes) => {
    const foodTypeFiltered =
      selectedFoodType === 'all'
        ? dishes
        : dishes.filter((dish) => dish.food_type === selectedFoodType);
    
    const categoryFiltered =
      currentCategory === 'All'
        ? foodTypeFiltered
        : foodTypeFiltered.filter(
            (dish) => dish.category && dish.category.name === currentCategory
          );
          
    if (!searchTerm) return categoryFiltered;
    return categoryFiltered.filter((dish) =>
      dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredMenu = filterDishes(menu);
  const filteredSpecials = filterDishes(specials); // Filter specials as well

  if (loading) return <div className={styles.loader}>Loading menu...</div>;

  const DishCard = ({ dish }) => {
    const itemInCart = cart.find(i => i.id === dish.id);
    const quantity = itemInCart ? itemInCart.quantity : 0;
    
    const handleAddToCart = () => {
        if (!dish.is_available) return;
        setModalDish(dish);
    };

    return (
      <div className={`${styles.dishCard} ${!dish.is_available ? styles.unavailable : ''}`}>
        {dish.image_url && (
          <img src={`http://127.0.0.1:8000${dish.image_url}`} alt={dish.name} />
        )}
        <div className={styles.dishInfo}>
          <h5>{dish.name}</h5>
          <p>₹{dish.price}</p>
        </div>
        <button onClick={handleAddToCart} disabled={!dish.is_available}>
          {dish.is_available ? (quantity > 0 ? quantity : 'ADD') : 'Unavailable'}
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Today's Specials Section (only shows if no filters are active) */}
      {searchTerm === '' && currentCategory === 'All' && filteredSpecials.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🔥 Today's Specials</h3>
          <div className={styles.specialsGrid}>
            {filteredSpecials.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        </div>
      )}

      {/* Most Liked Dishes Section (only shows if no filters are active) */}
      {searchTerm === '' && currentCategory === 'All' && mostLiked.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>⭐ Most Popular</h3>
          <div className={styles.horizontalScroll}>
            {mostLiked.map(dish => (
              <div key={dish.id} className={styles.likedCard}>
                <img src={`http://127.0.0.1:8000${dish.image_url}`} alt={dish.name} />
                <p>{dish.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Menu Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{currentCategory} Menu</h3>
        {filteredMenu.length > 0 ? (
            <div className={styles.menuGrid}>
            {filteredMenu.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
            ))}
            </div>
        ) : (
            <p className={styles.noResults}>No dishes match your filters.</p>
        )}
      </div>

      {modalDish && (
        <AddItemModal
          dish={modalDish}
          cart={cart}
          setCart={setCart}
          onClose={() => setModalDish(null)}
        />
      )}
      <ViewCartBar cart={cart} />
    </div>
  );
};

export default MenuPage;
