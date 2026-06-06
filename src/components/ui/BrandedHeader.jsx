import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Image from '../AppImage';
import { useAuth } from '../../contexts/AuthContext';

const BrandedHeader = ({
  restaurantLogo = '/assets/images/no_image.png',
  restaurantName = 'DeliveryHub',
  primaryColor = '#2563EB',
  cartItemCount = 0,
  onSearchClick = () => {},
  onCartClick = () => {},
  onMenuClick = () => {},
  className = '',
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, userProfile, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    navigate('/customer-registration-login');
  };

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
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Abrir menu"
          >
            <Icon name="Menu" size={24} className="text-foreground" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <Image src={restaurantLogo} alt={`${restaurantName} logo`} className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-semibold text-foreground">{restaurantName}</h1>
              <p className="text-xs text-muted-foreground">Delivery & Takeout</p>
            </div>
          </div>
        </div>

        {/* Search — desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar pratos..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              onFocus={onSearchClick}
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center space-x-2">
          {/* Search — mobile */}
          <button
            onClick={handleSearchToggle}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Buscar"
          >
            <Icon name="Search" size={24} className="text-foreground" />
          </button>

          {/* Carrinho */}
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label={`Carrinho: ${cartItemCount} itens`}
          >
            <Icon name="ShoppingCart" size={24} className="text-foreground" />
            {cartItemCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-xs font-medium text-white flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>

          {/* Perfil / Login */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors duration-200 flex items-center gap-1"
              aria-label="Menu do usuário"
            >
              <Icon name="User" size={24} className="text-foreground" />
              {isAuthenticated() && (
                <Icon name="ChevronDown" size={14} className="text-muted-foreground hidden sm:block" />
              )}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                {isAuthenticated() ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userProfile?.name || user?.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {userProfile?.role === 'admin' && 'Administrador'}
                        {userProfile?.role === 'restaurant_owner' && 'Restaurante'}
                        {userProfile?.role === 'customer' && 'Cliente'}
                      </p>
                    </div>
                    <button
                      onClick={() => { navigate('/customer-account-order-history'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Icon name="Package" size={16} className="text-gray-400" />
                      Meus pedidos
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Icon name="LogOut" size={16} className="text-red-400" />
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { navigate('/customer-registration-login'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Icon name="LogIn" size={16} className="text-gray-400" />
                      Entrar
                    </button>
                    <button
                      onClick={() => { navigate('/restaurant-registration-setup'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Icon name="Store" size={16} className="text-gray-400" />
                      Cadastrar restaurante
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Busca mobile overlay */}
      {isSearchOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border p-4">
          <div className="relative">
            <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar pratos..."
              className="w-full pl-10 pr-10 py-3 bg-muted border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              aria-label="Fechar busca"
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
