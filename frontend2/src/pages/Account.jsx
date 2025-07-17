import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccountPage = () => {
  const navigate = useNavigate();
  const customer = JSON.parse(localStorage.getItem('customer'));

  const handleLogout = () => {
    localStorage.removeItem('customer');
    window.location.href = '/menu';
    navigate('/login');
  };

  return (
    <div className="container mt-4">
      <h4>Your Account</h4>
      <p><strong>Mobile:</strong> {customer?.phone_number}</p>
      <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default AccountPage;
