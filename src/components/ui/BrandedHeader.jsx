import React, { useState } from 'react';
import Icon from '../AppIcon';
import Image from '../AppImage';

const BrandedHeader = ({ 
  restaurantLogo = '/assets/images/no_image.png',
  restaurantName = 'DeliveryHub',
  primaryColor = '#2563EB',
  cartItemCount = 0,
  onSearchClick = () => {},
  onCartClick = () => {},
  onMenuClick = () => {},
  className = ''
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    onSearchClick();
  };

  return (
    <header 
      className={`sticky top-0 z-100 bg-card border-b border-border ${className}`}
      style={{ '--brand-primary': primaryColor }}
    >
      <div className="h-20 md:h-24 px-5 md:px-10 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Open menu"
          >
            <Icon name="Menu" size={24} className="text-foreground" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={restaurantLogo}
                alt={`${restaurantName} logo`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-semibold text-foreground">
                {restaurantName}
              </h1>
              <p className="text-xs text-muted-foreground">
                Delivery & Takeout
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Icon 
              name="Search" 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
            <input
              type="text"
              placeholder="Buscar pratos, restaurantes..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              onFocus={onSearchClick}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Search Button - Mobile */}
          <button
            onClick={handleSearchToggle}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Search"
          >
            <Icon name="Search" size={24} className="text-foreground" />
          </button>

          {/* Cart Button */}
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label={`Cart with ${cartItemCount} items`}
          >
            <Icon name="ShoppingCart" size={24} className="text-foreground" />
            {cartItemCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-xs font-medium text-white flex items-center justify-center animate-bounce-in"
                style={{ backgroundColor: primaryColor }}
              >
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="User menu"
          >
            <Icon name="User" size={24} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border p-4 animate-slide-up">
          <div className="relative">
            <Icon 
              name="Search" 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
            <input
              type="text"
              placeholder="Buscar pratos, restaurantes..."
              className="w-full pl-10 pr-10 py-3 bg-muted border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
              aria-label="Close search"
            >
              <Icon name="X" size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default BrandedHeader;