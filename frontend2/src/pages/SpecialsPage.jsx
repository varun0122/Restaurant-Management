import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SpecialsPage = () => {
  const [specials, setSpecials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecials = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/menu/specials/');
        setSpecials(res.data);
      } catch (error) {
        console.error("Failed to load specials", error);
        alert("Could not load today's specials");
      } finally {
        setLoading(false);
      }
    };

    fetchSpecials();
  }, []);

  if (loading) {
    return <div className="text-center mt-5"><h5>Loading specials...</h5></div>;
  }

  return (
    <div className="container mt-4">
      <h4>🔥 Today's Specials</h4>
      <div className="d-flex flex-wrap">
        {specials.map((dish) => (
          <div className="card m-2" style={{ width: '16rem' }} key={dish.id}>
            {dish.image_url && <img src={`http://127.0.0.1:8000${dish.image_url}`} className="card-img-top" alt={dish.name} />}
            <div className="card-body">
              <h5 className="card-title">{dish.name}</h5>
              <p className="card-text">₹{dish.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecialsPage;
