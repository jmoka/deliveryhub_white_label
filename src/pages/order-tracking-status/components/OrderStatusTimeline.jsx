import React from 'react';
import Icon from '../../../components/AppIcon';

const OrderStatusTimeline = ({ 
  currentStatus = 'confirmed',
  estimatedTime = '25-30 min',
  orderTime = '14:30',
  primaryColor = '#2563EB',
  className = ''
}) => {
  const statusSteps = [
    {
      id: 'confirmed',
      label: 'Pedido Confirmado',
      icon: 'CheckCircle',
      time: orderTime,
      description: 'Seu pedido foi recebido'
    },
    {
      id: 'preparing',
      label: 'Preparando',
      icon: 'ChefHat',
      time: '',
      description: 'Preparando seus pratos'
    },
    {
      id: 'out_for_delivery',
      label: 'Saiu para Entrega',
      icon: 'Truck',
      time: '',
      description: 'A caminho do seu endereço'
    },
    {
      id: 'delivered',
      label: 'Entregue',
      icon: 'Package',
      time: '',
      description: 'Pedido entregue com sucesso'
    }
  ];

  const getStatusIndex = (status) => {
    return statusSteps?.findIndex(step => step?.id === status);
  };

  const currentIndex = getStatusIndex(currentStatus);

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className={`bg-card rounded-lg p-6 border border-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Status do Pedido</h3>
        {currentStatus !== 'delivered' && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tempo estimado</p>
            <p className="font-medium" style={{ color: primaryColor }}>
              {estimatedTime}
            </p>
          </div>
        )}
      </div>
      {/* Timeline */}
      <div className="relative">
        {statusSteps?.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const isLast = index === statusSteps?.length - 1;

          return (
            <div key={step?.id} className="relative flex items-start">
              {/* Timeline Line */}
              {!isLast && (
                <div 
                  className={`absolute left-6 top-12 w-0.5 h-16 transition-colors duration-500 ${
                    stepStatus === 'completed' 
                      ? 'bg-current' :'bg-border'
                  }`}
                  style={stepStatus === 'completed' ? { color: primaryColor } : {}}
                />
              )}
              {/* Step Content */}
              <div className="flex items-start space-x-4 pb-8">
                {/* Icon */}
                <div 
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    stepStatus === 'completed' 
                      ? 'border-current bg-current text-white' 
                      : stepStatus === 'current' ?'border-current bg-current/10 text-current animate-pulse' :'border-border bg-muted text-muted-foreground'
                  }`}
                  style={
                    stepStatus === 'completed' || stepStatus === 'current' 
                      ? { borderColor: primaryColor, color: stepStatus === 'completed' ? 'white' : primaryColor }
                      : {}
                  }
                >
                  <Icon 
                    name={step?.icon} 
                    size={20} 
                    className={stepStatus === 'completed' ? 'text-white' : 'text-current'}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 
                      className={`font-medium transition-colors duration-300 ${
                        stepStatus === 'completed' || stepStatus === 'current'
                          ? 'text-foreground' :'text-muted-foreground'
                      }`}
                    >
                      {step?.label}
                    </h4>
                    {step?.time && (
                      <span className="text-sm text-muted-foreground">
                        {step?.time}
                      </span>
                    )}
                  </div>
                  <p 
                    className={`text-sm mt-1 transition-colors duration-300 ${
                      stepStatus === 'completed' || stepStatus === 'current'
                        ? 'text-muted-foreground' :'text-muted-foreground/60'
                    }`}
                  >
                    {step?.description}
                  </p>
                  
                  {stepStatus === 'current' && currentStatus !== 'delivered' && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ backgroundColor: primaryColor, animationDelay: '0ms' }}
                          />
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ backgroundColor: primaryColor, animationDelay: '150ms' }}
                          />
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ backgroundColor: primaryColor, animationDelay: '300ms' }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Em andamento...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Completion Message */}
      {currentStatus === 'delivered' && (
        <div 
          className="mt-4 p-4 rounded-lg border"
          style={{ 
            backgroundColor: `${primaryColor}10`,
            borderColor: `${primaryColor}30`
          }}
        >
          <div className="flex items-center space-x-3">
            <Icon name="PartyPopper" size={24} style={{ color: primaryColor }} />
            <div>
              <p className="font-medium text-foreground">
                Pedido entregue com sucesso!
              </p>
              <p className="text-sm text-muted-foreground">
                Obrigado por escolher nosso restaurante
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusTimeline;