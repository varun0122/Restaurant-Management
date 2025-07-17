import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="container text-center mt-5">
      <h2 className="text-success">Payment Successful!</h2>
      <p>Your order has been placed successfully. Thank you!</p>
      <button className="btn btn-outline-primary mt-3" onClick={() => navigate('/menu')}>
        Continue Ordering
      </button>
    </div>
  );
};

export default PaymentSuccess;
