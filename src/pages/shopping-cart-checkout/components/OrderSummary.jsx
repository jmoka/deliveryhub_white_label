import React from 'react';
import Icon from '../../../components/AppIcon';

const OrderSummary = ({ 
  items = [],
  deliveryMethod = 'delivery',
  deliveryFee = 5.99,
  appliedCoupon = null,
  primaryColor = '#2563EB' 
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(price);
  };

  const calculateSubtotal = () => {
    return items?.reduce((total, item) => {
      const itemPrice = item?.price + (item?.extras?.reduce((sum, extra) => sum + extra?.price, 0) || 0);
      return total + (itemPrice * item?.quantity);
    }, 0);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = calculateSubtotal();
    const deliveryAmount = deliveryMethod === 'delivery' ? deliveryFee : 0;
    
    if (appliedCoupon?.type === 'percentage') {
      return (subtotal * appliedCoupon?.discount) / 100;
    } else {
      // Fixed discount can apply to delivery fee or subtotal
      if (appliedCoupon?.code === 'FRETE5') {
        return Math.min(appliedCoupon?.discount, deliveryAmount);
      }
      return appliedCoupon?.discount;
    }
  };

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount();
  const delivery = deliveryMethod === 'delivery' ? deliveryFee : 0;
  const total = subtotal + delivery - discount;

  const summaryItems = [
    {
      label: 'Subtotal',
      value: formatPrice(subtotal),
      description: `${items?.length} ${items?.length === 1 ? 'item' : 'itens'}`
    },
    {
      label: deliveryMethod === 'delivery' ? 'Taxa de entrega' : 'Retirada',
      value: delivery > 0 ? formatPrice(delivery) : 'Grátis',
      description: deliveryMethod === 'delivery' ? 'Entrega no endereço' : 'Retire no local'
    }
  ];

  if (appliedCoupon && discount > 0) {
    summaryItems?.push({
      label: `Desconto (${appliedCoupon?.code})`,
      value: `-${formatPrice(discount)}`,
      description: appliedCoupon?.description,
      isDiscount: true
    });
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4 sticky top-4">
      <h3 className="text-lg font-semibold text-foreground">Resumo do Pedido</h3>
      {/* Order Items Summary */}
      <div className="space-y-3">
        {items?.map((item) => {
          const itemTotal = (item?.price + (item?.extras?.reduce((sum, extra) => sum + extra?.price, 0) || 0)) * item?.quantity;
          
          return (
            <div key={item?.id} className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item?.quantity}x {item?.name}
                </p>
                {item?.extras && item?.extras?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    + {item?.extras?.map(extra => extra?.name)?.join(', ')}
                  </p>
                )}
              </div>
              <span className="text-sm font-medium text-foreground ml-2">
                {formatPrice(itemTotal)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border pt-4 space-y-3">
        {summaryItems?.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <div>
              <span className={`text-sm ${item?.isDiscount ? 'text-success' : 'text-foreground'}`}>
                {item?.label}
              </span>
              {item?.description && (
                <p className="text-xs text-muted-foreground">
                  {item?.description}
                </p>
              )}
            </div>
            <span className={`text-sm font-medium ${item?.isDiscount ? 'text-success' : 'text-foreground'}`}>
              {item?.value}
            </span>
          </div>
        ))}
      </div>
      {/* Total */}
      <div className="border-t border-border pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">
            {formatPrice(total)}
          </span>
        </div>
        
        {appliedCoupon && (
          <div className="flex items-center space-x-1 mt-2">
            <Icon name="Tag" size={14} style={{ color: primaryColor }} />
            <span className="text-xs" style={{ color: primaryColor }}>
              Você economizou {formatPrice(discount)}!
            </span>
          </div>
        )}
      </div>
      {/* Estimated Time */}
      <div 
        className="p-3 rounded-lg bg-current/5 border border-current/20"
        style={{ 
          backgroundColor: `${primaryColor}10`,
          borderColor: `${primaryColor}30`
        }}
      >
        <div className="flex items-center space-x-2">
          <Icon name="Clock" size={16} style={{ color: primaryColor }} />
          <div>
            <p className="text-sm font-medium text-foreground">
              Tempo estimado: {deliveryMethod === 'delivery' ? '30-45 min' : '15-25 min'}
            </p>
            <p className="text-xs text-muted-foreground">
              {deliveryMethod === 'delivery' ? 'Entrega no seu endereço' : 'Pronto para retirada'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;