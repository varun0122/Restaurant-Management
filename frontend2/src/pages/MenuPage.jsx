import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import AddItemModal from '../components/AddItemModal';
import ViewCartBar from '../components/ViewCartBar';
import styles from './MenuPage.module.css';
import toast from 'react-hot-toast';

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
const FeaturedDish = ({ dish, setModalDish }) => {
    const isAvailable = dish.is_available;

    const handleClick = () => {
        if (isAvailable) {
            setModalDish(dish);
        } else {
            toast.error(`${dish.name} is currently unavailable.`);
        }
    };

    return (
        <div className={`${styles.likedCard} ${!isAvailable ? styles.unavailableFeatured : ''}`} onClick={handleClick}>
            <img src={`http://127.0.0.1:8000${dish.image_url}`} alt={dish.name} />
            <p>{dish.name}</p>
            {!isAvailable && <div className={styles.unavailableOverlay}>Unavailable</div>}
        </div>
    );
};
const MenuPage = ({ searchTerm, selectedFoodType }) => {
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
  const filteredMostLiked = filterDishes(mostLiked);

  if (loading) return <div className={styles.loader}>Loading menu...</div>;

  const DishCard = ({ dish, setModalDish }) => {
    const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();
    const itemInCart = cart.find(i => i.id === dish.id);
    const quantity = itemInCart ? itemInCart.quantity : 0;

    return (
        <div className={`${styles.dishCard} ${!dish.is_available ? styles.unavailable : ''}`}>
            <div className={styles.dishContent} onClick={() => setModalDish(dish)}>
                {dish.image_url && (
                    <img src={`http://127.0.0.1:8000${dish.image_url}`} alt={dish.name} />
                )}
                <div className={styles.dishInfo}>
                    <h5>{dish.name}</h5>
                    <p>₹{dish.price}</p>
                </div>
            </div>
            {dish.is_available ? (
                quantity > 0 ? (
                    <div className={styles.quantityControl}>
                        <button onClick={() => decreaseQuantity(dish.id)}>−</button>
                        <span>{quantity}</span>
                        <button onClick={() => increaseQuantity(dish.id)}>+</button>
                    </div>
                ) : (
                    <button className={styles.addButton} onClick={() => addToCart(dish)}>
                        Add
                    </button>
                )
            ) : (
                <button disabled className={styles.unavailableButton}>Unavailable</button>
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
                            <FeaturedDish key={dish.id} dish={dish} setModalDish={setModalDish} />
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
                            <FeaturedDish key={dish.id} dish={dish} setModalDish={setModalDish} />
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
                                // --- FIX IS HERE (passing setModalDish) ---
                                <DishCard key={dish.id} dish={dish} setModalDish={setModalDish} />
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

      {modalDish && (<AddItemModal dish={modalDish} onClose={() => setModalDish(null)} />)}

      {/* View Cart Bar */}
      <ViewCartBar />
    </div>
  );
};

export default MenuPage;