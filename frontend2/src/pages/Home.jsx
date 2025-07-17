import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container text-center mt-5">
      <h2>Welcome to Our Restaurant</h2>
      <p>Scan the QR code or click below to start ordering</p>
      <button className="btn btn-primary mt-3" onClick={() => navigate('/login')}>
        Start Ordering
      </button>
    </div>
  );
};

export default Home;
