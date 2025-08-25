import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const CartItemCard = ({ 
  item, 
  onUpdateQuantity, 
  onRemoveItem, 
  onEditItem,
  primaryColor = '#2563EB' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity <= 0) {
      setShowRemoveConfirm(true);
    } else {
      onUpdateQuantity(item?.id, newQuantity);
    }
  };

  const handleRemoveConfirm = () => {
    onRemoveItem(item?.id);
    setShowRemoveConfirm(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(price);
  };

  const totalItemPrice = (item?.price + (item?.extras?.reduce((sum, extra) => sum + extra?.price, 0) || 0)) * item?.quantity;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4 shadow-sm">
      {/* Item Header */}
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <Image
            src={item?.image}
            alt={item?.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-foreground text-sm md:text-base truncate">
                {item?.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {formatPrice(item?.price)} cada
              </p>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                <Icon 
                  name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                  size={16} 
                />
              </Button>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(item?.quantity - 1)}
                className="h-8 w-8"
              >
                <Icon name="Minus" size={14} />
              </Button>
              
              <span className="font-medium text-foreground min-w-[2rem] text-center">
                {item?.quantity}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(item?.quantity + 1)}
                className="h-8 w-8"
              >
                <Icon name="Plus" size={14} />
              </Button>
            </div>

            <div className="text-right">
              <p className="font-semibold text-foreground">
                {formatPrice(totalItemPrice)}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {/* Extras */}
          {item?.extras && item?.extras?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Extras:</h4>
              <div className="space-y-1">
                {item?.extras?.map((extra, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">+ {extra?.name}</span>
                    <span className="text-foreground">{formatPrice(extra?.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          {item?.instructions && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Observações:</h4>
              <p className="text-sm text-muted-foreground">{item?.instructions}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditItem(item)}
              iconName="Edit2"
              iconPosition="left"
              className="flex-1"
            >
              Editar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRemoveConfirm(true)}
              iconName="Trash2"
              iconPosition="left"
              className="flex-1 text-error hover:text-error"
            >
              Remover
            </Button>
          </div>
        </div>
      )}
      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full">
            <div className="text-center">
              <div 
                className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center bg-error/10"
              >
                <Icon name="Trash2" size={24} className="text-error" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Remover item?
              </h3>
              
              <p className="text-sm text-muted-foreground mb-6">
                Tem certeza que deseja remover "{item?.name}" do seu carrinho?
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={handleRemoveConfirm}
                  className="flex-1"
                >
                  Remover
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartItemCard;