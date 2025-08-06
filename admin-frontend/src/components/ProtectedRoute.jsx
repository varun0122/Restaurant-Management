// admin-frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('admin_access_token');

  if (!token) {
    // If no token, redirect to login
    return <Navigate to="/login" />;
  }

  try {
    const user = jwtDecode(token);
    // If the user is not a superuser, redirect them to the kitchen view.
    if (!user.is_superuser) {
      return <Navigate to="/kitchen" />;
    }
  } catch (error) {
    // If token is invalid, redirect to login
    console.error("navigated to login",error);
    return <Navigate to="/login" />;
  }

  // If the user is a superuser, render the requested page.
  return children;
};

export default ProtectedRoute;