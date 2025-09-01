import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import AddItemModal from '../components/AddItemModal';
import ViewCartBar from '../components/ViewCartBar';
import styles from './MenuPage.module.css';

const groupDishesByCategory = (dishes) => {
  const grouped = {};
  dishes.forEach(dish => {
    const category = dish.category?.name || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(dish);
  });
  return grouped;
};

const MenuPage = ({ cart, setCart, searchTerm, selectedFoodType }) => {
  const [menu, setMenu] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [mostLiked, setMostLiked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalDish, setModalDish] = useState(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const currentCategory = queryParams.get('category') || 'All';

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [menuRes, likedRes, specialsRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/menu/dishes/'),
          axios.get('http://127.0.0.1:8000/api/menu/dishes/most_liked/'),
          axios.get('http://127.0.0.1:8000/api/menu/dishes/specials/')
        ]);
        setMenu(menuRes.data);
        setMostLiked(likedRes.data);
        setSpecials(specialsRes.data);
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
  const filteredSpecials = filterDishes(specials);

  if (loading) return <div className={styles.loader}>Loading menu...</div>;

  const DishCard = ({ dish }) => {
    const itemInCart = cart.find(i => i.id === dish.id);
    const quantity = itemInCart ? itemInCart.quantity : 0;

    const handleAddClick = () => {
      const updatedCart = cart.find(i => i.id === dish.id)
        ? cart.map(i => i.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...cart, { ...dish, quantity: 1 }];
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    const handleRemoveClick = () => {
        const updatedCart = cart
            .map(i => i.id === dish.id ? { ...i, quantity: i.quantity - 1 } : i)
            .filter(i => i.quantity > 0);
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
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
        {dish.is_available ? (
          quantity > 0 ? (
            <div className="d-flex align-items-center justify-content-between mt-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleRemoveClick}
              >
                −
              </button>
              <span style={{ fontWeight: 'bold', margin: '0 8px' }}>{quantity}</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleAddClick}
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="btn btn-success btn-sm mt-2"
              onClick={() => setModalDish(dish)} // Open modal on first add
            >
              Add to Cart
            </button>
          )
        ) : (
          <button disabled className="btn btn-danger btn-sm mt-2">
            Unavailable
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Specials Section */}
      {searchTerm === '' && currentCategory === 'All' && filteredSpecials.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🔥 Today's Specials</h3>
          <div className={styles.horizontalScroll}>
            {filteredSpecials.map(dish => (
              <div
                key={dish.id}
                className={styles.likedCard}
                onClick={() => setModalDish(dish)}
              >
                <img src={`http://127.0.0.1:8000${dish.image_url}`} alt={dish.name} />
                <p>{dish.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Popular Section */}
      {/* The typo '<strong>' was corrected to '>' in the line below */}
      {searchTerm === '' && currentCategory === 'All' && mostLiked.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>⭐ Most Popular</h3>
          <div className={styles.horizontalScroll}>
            {mostLiked.map(dish => (
              <div 
                key={dish.id} 
                className={styles.likedCard}
                onClick={() => setModalDish(dish)}
              >
                <img src={`http://127.0.0.1:8000${dish.image_url}`} alt={dish.name} />
                <p>{dish.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Menu Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{currentCategory === 'All' ? 'All Menu' : currentCategory}</h3>
        {currentCategory === 'All' ? (
          Object.entries(groupDishesByCategory(filteredMenu)).map(([categoryName, dishes]) => (
            <div key={categoryName}>
              <h4 className={styles.categoryHeader}>{categoryName}</h4>
              <div className={styles.menuGrid}>
                {dishes.map(dish => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            </div>
          ))
        ) : (
          filteredMenu.length > 0 ? (
            <div className={styles.menuGrid}>
              {filteredMenu.map(dish => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          ) : (
            <p className={styles.noResults}>No dishes match your filters.</p>
          )
        )}
      </div>

      {/* Add Item Modal */}
      {modalDish && (
        <AddItemModal
          dish={modalDish}
          cart={cart}
          setCart={setCart}
          onClose={() => setModalDish(null)}
        />
      )}

      {/* View Cart Bar */}
      <ViewCartBar cart={cart} />
    </div>
  );
};

export default MenuPage;