import React from 'react';
import Image from '../../../components/AppImage';

import Button from '../../../components/ui/Button';

const ProductCard = ({ 
  product = {}, 
  onProductClick = () => {},
  onAddToCart = () => {},
  className = '' 
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(price);
  };

  return (
    <div 
      className={`bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
      onClick={() => onProductClick(product)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={product?.image}
          alt={product?.name}
          className="w-full h-full object-cover"
        />
        {product?.isNew && (
          <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
            Novo
          </div>
        )}
        {product?.discount && (
          <div className="absolute top-2 right-2 bg-error text-error-foreground px-2 py-1 rounded-full text-xs font-medium">
            -{product?.discount}%
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
          {product?.name}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product?.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {product?.originalPrice && product?.originalPrice > product?.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product?.originalPrice)}
              </span>
            )}
            <span className="text-lg font-bold text-foreground">
              {formatPrice(product?.price)}
            </span>
          </div>
          
          <Button
            variant="default"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={(e) => {
              e?.stopPropagation();
              onAddToCart(product);
            }}
            className="flex-shrink-0"
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;