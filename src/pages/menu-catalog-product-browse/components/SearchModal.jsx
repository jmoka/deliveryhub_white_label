import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import ProductCard from './ProductCard';

const SearchModal = ({ 
  isOpen = false,
  onClose = () => {},
  products = [],
  onProductClick = () => {},
  onAddToCart = () => {},
  className = '' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setSearchQuery('');
      setFilteredProducts([]);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery?.trim()) {
      const filtered = products?.filter(product =>
        product?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        product?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        product?.category?.toLowerCase()?.includes(searchQuery?.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [searchQuery, products]);

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-200 bg-background animate-fade-in ${className}`}
      onClick={handleBackdropClick}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center space-x-4 p-4 border-b border-border">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Close search"
          >
            <Icon name="ArrowLeft" size={24} className="text-foreground" />
          </button>
          
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Buscar pratos, categorias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e?.target?.value)}
              className="border-0 bg-muted"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {searchQuery?.trim() === '' ? (
            <div className="text-center py-12">
              <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Buscar Produtos
              </h3>
              <p className="text-muted-foreground">
                Digite o nome do prato ou categoria que você está procurando
              </p>
            </div>
          ) : filteredProducts?.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="SearchX" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-muted-foreground">
                Tente buscar por outro termo ou categoria
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredProducts?.length} resultado{filteredProducts?.length !== 1 ? 's' : ''} encontrado{filteredProducts?.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts?.map((product) => (
                  <ProductCard
                    key={product?.id}
                    product={product}
                    onProductClick={onProductClick}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;