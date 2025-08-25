import React from 'react';
import Icon from '../AppIcon';

const CartBadge = ({ 
  itemCount = 0,
  primaryColor = '#2563EB',
  size = 'default',
  onClick = () => {},
  className = ''
}) => {
  const sizeClasses = {
    sm: 'p-1.5',
    default: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 18,
    default: 24,
    lg: 28
  };

  const badgeSizes = {
    sm: 'min-w-[16px] h-4 text-xs',
    default: 'min-w-[20px] h-5 text-xs',
    lg: 'min-w-[24px] h-6 text-sm'
  };

  return (
    <button
      onClick={onClick}
      className={`relative ${sizeClasses?.[size]} rounded-lg hover:bg-muted transition-colors duration-200 ${className}`}
      aria-label={`Cart with ${itemCount} items`}
    >
      <Icon 
        name="ShoppingCart" 
        size={iconSizes?.[size]} 
        className="text-foreground" 
      />
      {itemCount > 0 && (
        <span 
          className={`absolute -top-1 -right-1 ${badgeSizes?.[size]} px-1 rounded-full font-medium text-white flex items-center justify-center animate-bounce-in spring-bounce`}
          style={{ backgroundColor: primaryColor }}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};

export default CartBadge;