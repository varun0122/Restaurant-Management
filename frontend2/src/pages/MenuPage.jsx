import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import AddItemModal from '../components/AddItemModal';
import ViewCartBar from '../components/ViewCartBar';

const MenuPage = ({
  cart,
  setCart,
  searchTerm,
  selectedCategory,
  selectedFoodType
}) => {
  const [specials, setSpecials] = useState([]);
  const [liked, setLiked] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalDish, setModalDish] = useState(null);
  const [isMostLikedExpanded, setIsMostLikedExpanded] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tableNumber = params.get('table');
    if (tableNumber) {
      localStorage.setItem('tableNumber', tableNumber);
    }
    const fetchMenu = async () => {
      try {
        const [specialsRes, likedRes, menuRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/menu/dishes/specials/'),
          axios.get('http://127.0.0.1:8000/api/menu/dishes/most_liked/'),
          axios.get('http://127.0.0.1:8000/api/menu/dishes/')
        ]);
        setSpecials(specialsRes.data);
        setLiked(likedRes.data);
        setMenu(menuRes.data);
      } catch (err) {
        console.error('Error loading menu data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [location]);

  const toggleMostLikedExpansion = () => setIsMostLikedExpanded((prev) => !prev);
  const toggleCategoryExpansion = (categoryName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const filterDishes = (dishes) => {
    const foodTypeFiltered =
      selectedFoodType === 'all'
        ? dishes
        : dishes.filter((dish) => dish.food_type === selectedFoodType);
    const categorizedDishes =
      selectedCategory === 'All'
        ? foodTypeFiltered
        : foodTypeFiltered.filter(
            (dish) => dish.category && dish.category.name === selectedCategory
          );
    if (!searchTerm) return categorizedDishes;
    return categorizedDishes.filter((dish) =>
      dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredSpecials = filterDishes(specials);
  const filteredLiked = filterDishes(liked);
  const filteredMenu = filterDishes(menu);
  const initialLikedLimit = 2;
  const likedDishesToShow = isMostLikedExpanded
    ? filteredLiked
    : filteredLiked.slice(0, initialLikedLimit);

  const groupedMenu = filteredMenu.reduce((acc, dish) => {
    const categoryName = dish.category ? dish.category.name : 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(dish);
    return acc;
  }, {});

  const categoryDisplayOrder = [
    'Appetizers', 'Soups & Salads', 'Starters', 'Main Course',
    'Rice Items', 'Noodles', 'Sea Food', 'Desserts', 'Beverages'
  ];
  const sortedCategories = Object.keys(groupedMenu).sort((a, b) => {
    const indexA = categoryDisplayOrder.indexOf(a);
    const indexB = categoryDisplayOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  if (loading) return <div className="text-center mt-5"><h4>Loading menu...</h4></div>;

  const noResults =
    filteredSpecials.length === 0 &&
    filteredLiked.length === 0 &&
    filteredMenu.length === 0;

  // --- UPDATED DishCard Component ---
  const DishCard = ({ dish, cart, setCart, setModalDish }) => {
    const item = cart.find(i => i.id === dish.id);
    const quantity = item ? item.quantity : 0;

    return (
      <div className="col-6 col-md-4 col-lg-3 mb-4">
        <div className="card h-100 shadow-sm position-relative">
          {/* NEW: Overlay for out of stock items */}
          {!dish.is_available && (
            <div className="card-img-overlay d-flex justify-content-center align-items-center"
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', zIndex: 2 }}>
              <h5 className="text-danger font-weight-bold">Out of Stock</h5>
            </div>
          )}
          
          {dish.image_url && (
            <img
              src={`http://127.0.0.1:8000${dish.image_url}`}
              className="card-img-top"
              alt={dish.name}
              style={{ height: '180px', objectFit: 'cover', filter: !dish.is_available ? 'grayscale(100%)' : 'none' }}
            />
          )}
          <div className="card-body d-flex flex-column">
            <div className="d-flex align-items-center mb-2">
              <span
                style={{
                  width: '12px', height: '12px', marginRight: '8px',
                  border: '1px solid #888',
                  backgroundColor: dish.food_type === 'veg' ? '#28a745' : '#dc3545'
                }}
              ></span>
              <h5 className="card-title mb-0">{dish.name}</h5>
            </div>
            <p className="card-text mb-2">₹{dish.price}</p>
            
            {/* NEW: Disable button if out of stock */}
            {quantity === 0 ? (
              <button
                className="btn btn-success mt-auto"
                onClick={() => setModalDish(dish)}
                disabled={!dish.is_available}
              >
                {dish.is_available ? 'Add to Cart' : 'Unavailable'}
              </button>
            ) : (
              <div className="d-flex justify-content-center align-items-center mt-auto">
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => setCart(
                    cart.map(item =>
                      item.id === dish.id
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                    ).filter(item => item.quantity > 0)
                  )}
                >-</button>
                <span className="mx-2">{quantity}</span>
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={() => setCart(
                    cart.map(item =>
                      item.id === dish.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                    )
                  )}
                >+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4" style={{ paddingBottom: 90 }}>
      {filteredSpecials.length > 0 && (
        <>
          <h4 className="mb-3">🔥 Today's Specials</h4>
          <div className="row">
            {filteredSpecials.map((dish) => (
              <DishCard key={dish.id} dish={dish} cart={cart} setCart={setCart} setModalDish={setModalDish} />
            ))}
          </div>
        </>
      )}

      {filteredLiked.length > 0 && (
        <>
          <h4 className="mt-5 mb-3">⭐ Most Liked Dishes</h4>
          <div className="row">
            {likedDishesToShow.map((dish) => (
              <DishCard key={dish.id} dish={dish} cart={cart} setCart={setCart} setModalDish={setModalDish} />
            ))}
          </div>
          {filteredLiked.length > initialLikedLimit && (
            <div className="text-center mt-3">
              <button className="btn btn-outline-primary" onClick={toggleMostLikedExpansion}>
                {isMostLikedExpanded ? 'Show Less' : 'Show More'}
              </button>
            </div>
          )}
        </>
      )}

      {filteredMenu.length > 0 && (
        <>
          <h4 className="mt-5 mb-3">📋 Full Menu</h4>
          {selectedCategory !== 'All' && (
            <div className="row">
              {filteredMenu.map((dish) => (
                <DishCard key={dish.id} dish={dish} cart={cart} setCart={setCart} setModalDish={setModalDish} />
              ))}
            </div>
          )}
          {selectedCategory === 'All' && (
            <div>
              {sortedCategories.map((categoryName) => {
                const dishesInCategory = groupedMenu[categoryName];
                const isExpanded = expandedCategories[categoryName];
                const initialLimit = 2;
                const dishesToShow = isExpanded
                  ? dishesInCategory
                  : dishesInCategory.slice(0, initialLimit);
                return (
                  <div key={categoryName} className="mb-5">
                    <h5 className="mb-3" style={{ borderBottom: '2px solid #eee', paddingBottom: '8px' }}>
                      {categoryName}
                    </h5>
                    <div className="row">
                      {dishesToShow.map((dish) => (
                        <DishCard key={dish.id} dish={dish} cart={cart} setCart={setCart} setModalDish={setModalDish} />
                      ))}
                    </div>
                    {dishesInCategory.length > initialLimit && (
                      <div className="text-center mt-3">
                        <button className="btn btn-outline-primary" onClick={() => toggleCategoryExpansion(categoryName)}>
                          {isExpanded ? 'Show Less' : 'Show More'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {noResults && (
        <div className="text-center mt-5">
          <h4>No dishes found</h4>
          <p>Try changing your filters or search term.</p>
        </div>
      )}

      {modalDish && (
        <AddItemModal dish={modalDish} cart={cart} setCart={setCart} onClose={() => setModalDish(null)} />
      )}

      <ViewCartBar cart={cart} />
    </div>
  );
};

export default MenuPage;
