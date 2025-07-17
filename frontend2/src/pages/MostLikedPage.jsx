import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MostLikedPage = ({ onAddToCart }) => {
  const [dishes, setDishes] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/menu/most-liked/')
      .then((res) => setDishes(res.data))
      .catch(() => alert('Failed to load most liked dishes'));
  }, []);

  return (
  <div className="container mt-4">
    <h3>⭐ Most Liked Dishes</h3>
    <div className="d-flex flex-wrap">
      {dishes.map((dish) => (
        <div key={dish.id} className="card m-2" style={{ width: '16rem', height: '100%' }}>
          {/* Image with fixed height and object-fit */}
          <div style={{ height: '160px', overflow: 'hidden' }}>
            {dish.image_url && (
              <img
                src={`http://127.0.0.1:8000${dish.image_url}`}
                className="card-img-top"
                alt={dish.name}
                style={{ objectFit: 'cover', height: '100%', width: '100%' }}
              />
            )}
          </div>

          {/* Body with consistent height and aligned content */}
          <div className="card-body d-flex flex-column justify-content-between" style={{ height: '150px' }}>
            <div>
              <h5 className="card-title text-truncate" title={dish.name}>{dish.name}</h5>
              <p className="card-text">₹{dish.price}</p>
            </div>
            <button className="btn btn-success btn-sm mt-auto" onClick={() => onAddToCart(dish)}>
              Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

};

export default MostLikedPage;