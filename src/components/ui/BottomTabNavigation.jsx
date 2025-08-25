import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const BottomTabNavigation = ({ 
  cartItemCount = 0,
  primaryColor = '#2563EB',
  className = ''
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      label: 'Cardápio',
      path: '/menu-catalog-product-browse',
      icon: 'UtensilsCrossed',
      badge: null
    },
    {
      label: 'Carrinho',
      path: '/shopping-cart-checkout',
      icon: 'ShoppingCart',
      badge: cartItemCount > 0 ? cartItemCount : null
    },
    {
      label: 'Pedidos',
      path: '/order-tracking-status',
      icon: 'Clock',
      badge: null
    },
    {
      label: 'Conta',
      path: '/customer-account-order-history',
      icon: 'User',
      badge: null
    }
  ];

  const handleTabClick = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location?.pathname === path;
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav 
        className={`md:hidden fixed bottom-0 left-0 right-0 z-90 bg-card border-t border-border ${className}`}
        style={{ '--brand-primary': primaryColor }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navigationItems?.map((item) => {
            const active = isActive(item?.path);
            return (
              <button
                key={item?.path}
                onClick={() => handleTabClick(item?.path)}
                className={`relative flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-all duration-200 ${
                  active 
                    ? 'text-white' :'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                style={active ? { 
                  backgroundColor: primaryColor,
                  color: 'white'
                } : {}}
                aria-label={item?.label}
              >
                <div className="relative">
                  <Icon 
                    name={item?.icon} 
                    size={20} 
                    className={active ? 'text-white' : 'text-current'} 
                  />
                  {item?.badge && (
                    <span 
                      className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full text-xs font-medium text-white flex items-center justify-center animate-bounce-in"
                      style={{ 
                        backgroundColor: active ? 'rgba(255,255,255,0.2)' : primaryColor,
                        color: active ? 'white' : 'white'
                      }}
                    >
                      {item?.badge > 99 ? '99+' : item?.badge}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium mt-1 ${active ? 'text-white' : 'text-current'}`}>
                  {item?.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      {/* Desktop Horizontal Navigation */}
      <nav 
        className={`hidden md:block bg-card border-b border-border ${className}`}
        style={{ '--brand-primary': primaryColor }}
      >
        <div className="px-10 py-4">
          <div className="flex items-center space-x-8">
            {navigationItems?.map((item) => {
              const active = isActive(item?.path);
              return (
                <button
                  key={item?.path}
                  onClick={() => handleTabClick(item?.path)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    active 
                      ? 'text-white shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  style={active ? { 
                    backgroundColor: primaryColor,
                    color: 'white'
                  } : {}}
                  aria-label={item?.label}
                >
                  <div className="relative">
                    <Icon 
                      name={item?.icon} 
                      size={20} 
                      className={active ? 'text-white' : 'text-current'} 
                    />
                    {item?.badge && (
                      <span 
                        className="absolute -top-2 -right-2 min-w-[18px] h-4 px-1 rounded-full text-xs font-medium text-white flex items-center justify-center animate-bounce-in"
                        style={{ 
                          backgroundColor: active ? 'rgba(255,255,255,0.2)' : primaryColor,
                          color: active ? 'white' : 'white'
                        }}
                      >
                        {item?.badge > 99 ? '99+' : item?.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${active ? 'text-white' : 'text-current'}`}>
                    {item?.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomTabNavigation;