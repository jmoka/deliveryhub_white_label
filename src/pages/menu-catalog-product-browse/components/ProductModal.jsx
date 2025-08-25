import React, { useState, useEffect } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const ProductModal = ({ 
  product = null,
  isOpen = false,
  onClose = () => {},
  onAddToCart = () => {},
  className = '' 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setQuantity(1);
      setSelectedExtras([]);
      setSelectedOptions({});
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(price);
  };

  const calculateTotalPrice = () => {
    let total = product?.price || 0;
    
    // Add extras price
    selectedExtras?.forEach(extraId => {
      const extra = product?.extras?.find(e => e?.id === extraId);
      if (extra) total += extra?.price;
    });
    
    // Add option prices
    Object.values(selectedOptions)?.forEach(optionId => {
      product?.options?.forEach(optionGroup => {
        const option = optionGroup?.choices?.find(c => c?.id === optionId);
        if (option && option?.price) total += option?.price;
      });
    });
    
    return total * quantity;
  };

  const handleExtraToggle = (extraId) => {
    setSelectedExtras(prev => 
      prev?.includes(extraId) 
        ? prev?.filter(id => id !== extraId)
        : [...prev, extraId]
    );
  };

  const handleOptionSelect = (groupId, optionId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupId]: optionId
    }));
  };

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      quantity,
      selectedExtras: selectedExtras?.map(id => 
        product?.extras?.find(e => e?.id === id)
      )?.filter(Boolean),
      selectedOptions: Object.entries(selectedOptions)?.map(([groupId, optionId]) => {
        const group = product?.options?.find(g => g?.id === groupId);
        const option = group?.choices?.find(c => c?.id === optionId);
        return { group: group?.name, option };
      })?.filter(item => item?.option),
      totalPrice: calculateTotalPrice()
    };
    
    onAddToCart(cartItem);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div 
      className={`fixed inset-0 z-200 flex items-end md:items-center justify-center bg-black bg-opacity-50 animate-fade-in ${className}`}
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg bg-card rounded-t-lg md:rounded-lg shadow-lg animate-slide-up elevation-3 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative">
          <div className="aspect-[16/9] overflow-hidden">
            <Image
              src={product?.image}
              alt={product?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all duration-200"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground mb-2">
              {product?.name}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {product?.fullDescription || product?.description}
            </p>
          </div>

          {/* Options */}
          {product?.options && product?.options?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">Opções</h3>
              {product?.options?.map((optionGroup) => (
                <div key={optionGroup?.id} className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    {optionGroup?.name}
                    {optionGroup?.required && <span className="text-error ml-1">*</span>}
                  </h4>
                  <div className="space-y-2">
                    {optionGroup?.choices?.map((choice) => (
                      <label
                        key={choice?.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`option-${optionGroup?.id}`}
                            value={choice?.id}
                            checked={selectedOptions?.[optionGroup?.id] === choice?.id}
                            onChange={() => handleOptionSelect(optionGroup?.id, choice?.id)}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-sm text-foreground">{choice?.name}</span>
                        </div>
                        {choice?.price > 0 && (
                          <span className="text-sm font-medium text-foreground">
                            +{formatPrice(choice?.price)}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Extras */}
          {product?.extras && product?.extras?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">Adicionais</h3>
              <div className="space-y-2">
                {product?.extras?.map((extra) => (
                  <label
                    key={extra?.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedExtras?.includes(extra?.id)}
                        onChange={() => handleExtraToggle(extra?.id)}
                      />
                      <span className="text-sm text-foreground">{extra?.name}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      +{formatPrice(extra?.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-3">Quantidade</h3>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                iconName="Minus"
              />
              <span className="text-lg font-semibold text-foreground min-w-[2rem] text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                iconName="Plus"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/30">
          <Button
            onClick={handleAddToCart}
            fullWidth
            size="lg"
            iconName="ShoppingCart"
            iconPosition="left"
          >
            Adicionar ao Carrinho - {formatPrice(calculateTotalPrice())}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;