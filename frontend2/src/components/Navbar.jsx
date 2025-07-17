import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const customer = JSON.parse(localStorage.getItem('customer'));

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/menu">🍽️ Resto</Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/menu"><i className="bi bi-list"></i> Menu</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/cart"><i className="bi bi-cart"></i> Cart</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/specials"><i className="bi bi-star-fill"></i> Specials</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/most-liked"><i className="bi bi-heart-fill"></i> Most Liked</Link>
            </li>

            {customer ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/history"><i className="bi bi-clock-history"></i> History</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/account"><i className="bi bi-person-circle"></i></Link>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login"><i className="bi bi-box-arrow-in-right"></i> Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
