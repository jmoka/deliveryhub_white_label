import React from 'react';
import Icon from '../../../components/AppIcon';

const DeliveryMethodSelector = ({ 
  selectedMethod, 
  onMethodChange, 
  deliveryFee = 5.99,
  estimatedTimes = { pickup: '15-25 min', delivery: '30-45 min' },
  primaryColor = '#2563EB' 
}) => {
  const methods = [
    {
      id: 'pickup',
      name: 'Retirada',
      description: 'Retire no restaurante',
      icon: 'Store',
      fee: 0,
      time: estimatedTimes?.pickup,
      badge: 'Grátis'
    },
    {
      id: 'delivery',
      name: 'Entrega',
      description: 'Entregamos no seu endereço',
      icon: 'Truck',
      fee: deliveryFee,
      time: estimatedTimes?.delivery,
      badge: null
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })?.format(price);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Método de Entrega</h3>
      <div className="grid gap-3">
        {methods?.map((method) => (
          <button
            key={method?.id}
            onClick={() => onMethodChange(method?.id)}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              selectedMethod === method?.id
                ? 'border-current bg-current/5' :'border-border hover:border-muted-foreground bg-card'
            }`}
            style={selectedMethod === method?.id ? { 
              borderColor: primaryColor,
              backgroundColor: `${primaryColor}10`
            } : {}}
          >
            <div className="flex items-center space-x-3">
              <div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedMethod === method?.id ? 'bg-current text-white' : 'bg-muted'
                }`}
                style={selectedMethod === method?.id ? { backgroundColor: primaryColor } : {}}
              >
                <Icon 
                  name={method?.icon} 
                  size={20} 
                  className={selectedMethod === method?.id ? 'text-white' : 'text-foreground'}
                />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-foreground">{method?.name}</h4>
                  {method?.badge && (
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {method?.badge}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {method?.description}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">
                    <Icon name="Clock" size={14} className="inline mr-1" />
                    {method?.time}
                  </span>
                  
                  <span className="text-sm font-medium text-foreground">
                    {method?.fee > 0 ? formatPrice(method?.fee) : 'Grátis'}
                  </span>
                </div>
              </div>
              
              {selectedMethod === method?.id && (
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Icon name="Check" size={14} className="text-white" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DeliveryMethodSelector;