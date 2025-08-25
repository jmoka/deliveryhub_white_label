import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const DeliveryMap = ({ 
  orderStatus = 'out_for_delivery',
  deliveryAddress = {},
  driverLocation = {},
  primaryColor = '#2563EB',
  className = ''
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  const mockDeliveryAddress = {
    lat: -23.5505,
    lng: -46.6333,
    address: 'Rua das Flores, 123 - Centro, São Paulo',
    ...deliveryAddress
  };

  const mockDriverLocation = {
    lat: -23.5485,
    lng: -46.6310,
    driverName: 'Carlos Silva',
    phone: '(11) 98888-7777',
    vehicle: 'Moto Honda CG 160',
    plate: 'ABC-1234',
    ...driverLocation
  };

  const shouldShowMap = orderStatus === 'out_for_delivery' || orderStatus === 'delivered';

  if (!shouldShowMap) {
    return (
      <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
        <div className="text-center">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Icon name="MapPin" size={32} style={{ color: primaryColor }} />
          </div>
          <h3 className="font-medium text-foreground mb-2">
            Mapa de Entrega
          </h3>
          <p className="text-sm text-muted-foreground">
            O mapa será exibido quando seu pedido sair para entrega
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">
            {orderStatus === 'delivered' ? 'Local de Entrega' : 'Rastreamento em Tempo Real'}
          </h3>
          {orderStatus === 'out_for_delivery' && (
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-xs text-muted-foreground">Ao vivo</span>
            </div>
          )}
        </div>
      </div>
      {/* Map Container */}
      <div className="relative h-64 md:h-80">
        <iframe
          width="100%"
          height="100%"
          loading="lazy"
          title="Localização da Entrega"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${mockDeliveryAddress?.lat},${mockDeliveryAddress?.lng}&z=15&output=embed`}
          onLoad={() => setMapLoaded(true)}
          className="w-full h-full"
        />
        
        {!mapLoaded && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-border border-t-primary rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando mapa...</p>
            </div>
          </div>
        )}
      </div>
      {/* Driver Info */}
      {orderStatus === 'out_for_delivery' && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Icon name="Bike" size={20} style={{ color: primaryColor }} />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {mockDriverLocation?.driverName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mockDriverLocation?.vehicle} • {mockDriverLocation?.plate}
                </p>
              </div>
            </div>
            
            <button
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors duration-200"
            >
              <Icon name="Phone" size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Ligar</span>
            </button>
          </div>
        </div>
      )}
      {/* Address Info */}
      <div className="p-4 bg-muted/50">
        <div className="flex items-start space-x-3">
          <Icon name="MapPin" size={16} className="text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-medium text-foreground">Endereço de Entrega</p>
            <p className="text-sm text-muted-foreground">
              {mockDeliveryAddress?.address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMap;