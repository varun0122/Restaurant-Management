import React from 'react';
import { Navigate } from 'react-router-dom';

export const CustomerProtectedRoute = ({ children }) => {
  const customer = JSON.parse(localStorage.getItem('customer'));
  return customer ? children : <Navigate to="/login" />;
};

export const StaffProtectedRoute = ({ children }) => {
  const staff = JSON.parse(localStorage.getItem('staff'));
  return staff ? children : <Navigate to="/staff/login" />;
};

export const AdminProtectedRoute = ({ children }) => {
  const staff = JSON.parse(localStorage.getItem('staff'));
  return staff?.role === 'admin' ? children : <Navigate to="/staff/login" />;
};
