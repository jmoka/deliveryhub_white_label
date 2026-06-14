import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RestauranteCaixa = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/restaurante/financeiro', { replace: true }); }, [navigate]);
  return null;
};

export default RestauranteCaixa;
