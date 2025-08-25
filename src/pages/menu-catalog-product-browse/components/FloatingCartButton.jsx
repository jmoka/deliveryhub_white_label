import React from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../../components/ui/Button';

const FloatingCartButton = ({ 
  cartItems = [],
  cartTotal = 0,
  className = '' 
}) => {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(price);
  };

  const totalItems = cartItems?.reduce((sum, item) => sum + item?.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <div className={`fixed bottom-20 md:bottom-6 left-4 right-4 z-50 ${className}`}>
      <Button
        onClick={() => navigate('/shopping-cart-checkout')}
        fullWidth
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg animate-bounce-in spring-bounce"
        iconName="ShoppingCart"
        iconPosition="left"
      >
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center space-x-2">
            <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded-full text-sm font-bold">
              {totalItems}
            </span>
            <span>Ver Carrinho</span>
          </span>
          <span className="font-bold">
            {formatPrice(cartTotal)}
          </span>
        </div>
      </Button>
    </div>
  );
};

export default FloatingCartButton;