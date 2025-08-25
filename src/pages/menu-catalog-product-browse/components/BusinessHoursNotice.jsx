import React from 'react';
import Icon from '../../../components/AppIcon';


const BusinessHoursNotice = ({ 
  isOpen = true,
  nextOpenTime = "08:00",
  nextOpenDate = "amanhã",
  className = '' 
}) => {
  if (isOpen) return null;

  return (
    <div className={`bg-warning/10 border border-warning/20 rounded-lg p-6 m-4 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
            <Icon name="Clock" size={24} className="text-warning" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Restaurante Fechado
          </h3>
          <p className="text-muted-foreground mb-4">
            Estamos fechados no momento. Você pode navegar pelo cardápio, mas não é possível fazer pedidos agora.
          </p>
          <div className="flex items-center space-x-2 text-sm">
            <Icon name="Calendar" size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground">
              Próxima abertura: <span className="font-medium text-foreground">{nextOpenDate} às {nextOpenTime}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHoursNotice;