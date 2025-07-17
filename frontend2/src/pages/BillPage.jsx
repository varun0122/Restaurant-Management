import React from 'react';

const BillPage = ({ cart }) => {
  const customer = JSON.parse(localStorage.getItem('customer'));
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container mt-4">
      <h4>Order Summary</h4>
      <p><strong>Table Number:</strong> {customer.table_number}</p>
      <ul className="list-group mb-3">
        {cart.map((item) => (
          <li key={item.id} className="list-group-item d-flex justify-content-between">
            <span>{item.name} x {item.quantity}</span>
            <span>₹{item.price * item.quantity}</span>
          </li>
        ))}
        <li className="list-group-item d-flex justify-content-between">
          <strong>Total</strong>
          <strong>₹{total}</strong>
        </li>
      </ul>
      <div className="alert alert-info text-center">
        Please proceed to the counter to complete payment.
      </div>
    </div>
  );
};

export default BillPage;
