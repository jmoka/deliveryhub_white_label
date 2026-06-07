import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getMotoboyToken } from '../services/motoboyService';

const MotoboyGuard = ({ children }) => {
  const location = useLocation();

  // Token passed in URL (?token=...) → save it and redirect clean
  const params = new URLSearchParams(location.search);
  const urlToken = params.get('token');
  if (urlToken) {
    localStorage.setItem('motoboy_access_token', urlToken);
    return <Navigate to="/motoboy" replace />;
  }

  const token = getMotoboyToken();
  if (!token) return <Navigate to="/motoboy/login" replace />;

  return children;
};

export default MotoboyGuard;
