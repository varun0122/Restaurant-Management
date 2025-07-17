import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MenuPage = ({ cart, setCart }) => {
  const [specials, setSpecials] = useState([]);
  const [liked, setLiked] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [specialsRes, likedRes, menuRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/menu/specials/'),
          axios.get('http://127.0.0.1:8000/api/menu/most-liked/'),
          axios.get('http://127.0.0.1:8000/api/menu/')
        ]);

        setSpecials(specialsRes.data);
        setLiked(likedRes.data);
        setMenu(menuRes.data);
      } catch (err) {
        console.error("Error loading menu data:", err);
        alert("Failed to load menu data.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const showToast = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 1500);
  };

  const DishCard = ({ dish }) => {
    const item = cart.find(i => i.id === dish.id);
    const quantity = item ? item.quantity : 0;

    const updateCart = (newQty) => {
      let updated = [...cart];
      const index = updated.findIndex(i => i.id === dish.id);

      if (newQty <= 0) {
        updated = updated.filter(i => i.id !== dish.id);
      } else if (index > -1) {
        updated[index].quantity = newQty;
      } else {
        updated.push({ ...dish, quantity: newQty });
        showToast(`✅ Added ${dish.name} to cart`);
      }

      setCart(updated);
      localStorage.setItem("cart", JSON.stringify(updated));
    };

    const [showFull, setShowFull] = useState(false);
    const toggleDescription = () => setShowFull(!showFull);

    const getTrimmedDescription = (desc) => {
      if (!desc) return "";
      return desc.length > 100 ? desc.slice(0, 100) + "..." : desc;
    };

    return (
      <div className="col-6 col-md-4 col-lg-3 mb-4">
        <div className="card h-100 shadow-sm">
          {dish.image_url && (
            <img
              src={`http://127.0.0.1:8000${dish.image_url}`}
              className="card-img-top"
              alt={dish.name}
              style={{ height: '180px', objectFit: 'cover' }}
            />
          )}
          <div className="card-body d-flex flex-column">
            <h5 className="card-title">{dish.name}</h5>
            <p className="card-text mb-2" style={{ fontSize: '0.9rem' }}>
              {showFull ? dish.description : getTrimmedDescription(dish.description)}
              {dish.description?.length > 100 && (
                <span
                  onClick={toggleDescription}
                  style={{ color: 'blue', cursor: 'pointer', marginLeft: 5 }}
                >
                  {showFull ? "Read less" : "Read more"}
                </span>
              )}
            </p>
            <p className="card-text mb-2">₹{dish.price}</p>

            {quantity === 0 ? (
              <button className="btn btn-success mt-auto" onClick={() => updateCart(1)}>
                Add to Cart
              </button>
            ) : (
              <div className="d-flex justify-content-center align-items-center mt-auto">
                <button className="btn btn-outline-danger btn-sm" onClick={() => updateCart(quantity - 1)}>-</button>
                <span className="mx-2">{quantity}</span>
                <button className="btn btn-outline-success btn-sm" onClick={() => updateCart(quantity + 1)}>+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center mt-5"><h4>Loading menu...</h4></div>;

  return (
    <div className="container mt-4">
      {message && (
        <div className="alert alert-success text-center" role="alert">
          {message}
        </div>
      )}

      {specials.length > 0 && (
        <>
          <h4 className="mb-3">🔥 Today's Specials</h4>
          <div className="row">
            {specials.map(dish => <DishCard key={dish.id} dish={dish} />)}
          </div>
        </>
      )}

      {liked.length > 0 && (
        <>
          <h4 className="mt-5 mb-3">⭐ Most Liked Dishes</h4>
          <div className="row">
            {liked.map(dish => <DishCard key={dish.id} dish={dish} />)}
          </div>
        </>
      )}

      <h4 className="mt-5 mb-3">📋 Full Menu</h4>
      <div className="row">
        {menu.map(dish => <DishCard key={dish.id} dish={dish} />)}
      </div>
    </div>
  );
};

export default MenuPage;
