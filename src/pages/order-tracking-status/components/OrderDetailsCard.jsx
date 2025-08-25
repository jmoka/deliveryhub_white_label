import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const OrderDetailsCard = ({ 
  order = {},
  primaryColor = '#2563EB',
  className = ''
}) => {
  const mockOrder = {
    id: '#12345',
    items: [
      {
        id: 1,
        name: 'Pizza Margherita Grande',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
        quantity: 1,
        price: 45.90,
        extras: ['Borda recheada', 'Queijo extra']
      },
      {
        id: 2,
        name: 'Refrigerante Coca-Cola 2L',
        image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
        quantity: 2,
        price: 8.50,
        extras: []
      },
      {
        id: 3,
        name: 'Batata Frita Média',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
        quantity: 1,
        price: 12.90,
        extras: ['Molho barbecue']
      }
    ],
    subtotal: 75.80,
    deliveryFee: 5.90,
    discount: 8.00,
    total: 73.70,
    deliveryAddress: {
      street: 'Rua das Flores, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      zipCode: '01234-567',
      complement: 'Apto 45'
    },
    customer: {
      name: 'João Silva',
      phone: '(11) 99999-9999'
    },
    paymentMethod: 'Cartão de Crédito',
    orderTime: '14:30',
    ...order
  };

  return (
    <div className={`bg-card rounded-lg border border-border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Pedido {mockOrder?.id}
            </h3>
            <p className="text-sm text-muted-foreground">
              Realizado às {mockOrder?.orderTime}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-foreground">
              R$ {mockOrder?.total?.toFixed(2)?.replace('.', ',')}
            </p>
          </div>
        </div>
      </div>
      {/* Order Items */}
      <div className="p-6 border-b border-border">
        <h4 className="font-medium text-foreground mb-4">Itens do Pedido</h4>
        <div className="space-y-4">
          {mockOrder?.items?.map((item) => (
            <div key={item?.id} className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={item?.image}
                  alt={item?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-foreground text-sm">
                      {item?.name}
                    </h5>
                    {item?.extras?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        + {item?.extras?.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-foreground">
                      {item?.quantity}x R$ {item?.price?.toFixed(2)?.replace('.', ',')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Order Summary */}
      <div className="p-6 border-b border-border">
        <h4 className="font-medium text-foreground mb-4">Resumo do Pedido</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">
              R$ {mockOrder?.subtotal?.toFixed(2)?.replace('.', ',')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de entrega</span>
            <span className="text-foreground">
              R$ {mockOrder?.deliveryFee?.toFixed(2)?.replace('.', ',')}
            </span>
          </div>
          {mockOrder?.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Desconto</span>
              <span className="text-success">
                -R$ {mockOrder?.discount?.toFixed(2)?.replace('.', ',')}
              </span>
            </div>
          )}
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between font-medium">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">
                R$ {mockOrder?.total?.toFixed(2)?.replace('.', ',')}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Delivery Information */}
      <div className="p-6 border-b border-border">
        <h4 className="font-medium text-foreground mb-4">Informações de Entrega</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Icon name="MapPin" size={20} className="text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Endereço</p>
              <p className="text-sm text-muted-foreground">
                {mockOrder?.deliveryAddress?.street}
              </p>
              <p className="text-sm text-muted-foreground">
                {mockOrder?.deliveryAddress?.neighborhood}, {mockOrder?.deliveryAddress?.city}
              </p>
              <p className="text-sm text-muted-foreground">
                CEP: {mockOrder?.deliveryAddress?.zipCode}
              </p>
              {mockOrder?.deliveryAddress?.complement && (
                <p className="text-sm text-muted-foreground">
                  {mockOrder?.deliveryAddress?.complement}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Icon name="User" size={20} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Cliente</p>
              <p className="text-sm text-muted-foreground">
                {mockOrder?.customer?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Icon name="Phone" size={20} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Telefone</p>
              <p className="text-sm text-muted-foreground">
                {mockOrder?.customer?.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Icon name="CreditCard" size={20} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Pagamento</p>
              <p className="text-sm text-muted-foreground">
                {mockOrder?.paymentMethod}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Actions */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors duration-200"
          >
            <Icon name="Download" size={16} />
            <span className="text-sm font-medium">Baixar Recibo</span>
          </button>
          
          <button
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Icon name="RotateCcw" size={16} className="text-white" />
            <span className="text-sm font-medium">Pedir Novamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsCard;