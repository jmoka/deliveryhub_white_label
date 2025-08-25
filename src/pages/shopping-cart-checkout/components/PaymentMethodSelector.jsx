import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PaymentMethodSelector = ({ 
  selectedMethod, 
  onMethodChange,
  primaryColor = '#2563EB' 
}) => {
  const [showPixInstructions, setShowPixInstructions] = useState(false);

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      description: 'Visa, Mastercard, Elo',
      icon: 'CreditCard',
      badge: 'Seguro',
      available: true
    },
    {
      id: 'debit_card',
      name: 'Cartão de Débito',
      description: 'Débito online',
      icon: 'CreditCard',
      badge: null,
      available: true
    },
    {
      id: 'pix',
      name: 'PIX',
      description: 'Pagamento instantâneo',
      icon: 'Smartphone',
      badge: 'Instantâneo',
      available: true
    },
    {
      id: 'mercado_pago',
      name: 'Mercado Pago',
      description: 'Saldo ou cartão salvo',
      icon: 'Wallet',
      badge: null,
      available: true
    }
  ];

  const savedCards = [
    {
      id: 'card_1',
      type: 'visa',
      last4: '4532',
      expiry: '12/26'
    },
    {
      id: 'card_2',
      type: 'mastercard',
      last4: '8901',
      expiry: '08/25'
    }
  ];

  const getCardIcon = (type) => {
    switch (type) {
      case 'visa': return 'CreditCard';
      case 'mastercard': return 'CreditCard';
      default: return 'CreditCard';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Forma de Pagamento</h3>
      {/* Payment Methods */}
      <div className="space-y-3">
        {paymentMethods?.map((method) => (
          <button
            key={method?.id}
            onClick={() => {
              onMethodChange(method?.id);
              if (method?.id === 'pix') {
                setShowPixInstructions(true);
              } else {
                setShowPixInstructions(false);
              }
            }}
            disabled={!method?.available}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              selectedMethod === method?.id
                ? 'border-current bg-current/5' :'border-border hover:border-muted-foreground bg-card'
            } ${!method?.available ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      {/* Saved Cards */}
      {(selectedMethod === 'credit_card' || selectedMethod === 'debit_card') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Cartões Salvos</h4>
            <Button
              variant="outline"
              size="sm"
              iconName="Plus"
              iconPosition="left"
            >
              Novo Cartão
            </Button>
          </div>
          
          <div className="space-y-2">
            {savedCards?.map((card) => (
              <button
                key={card?.id}
                className="w-full p-3 rounded-lg border border-border hover:border-muted-foreground bg-card text-left transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <Icon name={getCardIcon(card?.type)} size={20} className="text-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      •••• •••• •••• {card?.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expira em {card?.expiry}
                    </p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* PIX Instructions */}
      {selectedMethod === 'pix' && showPixInstructions && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <Icon name="Info" size={16} className="text-foreground" />
            <h4 className="font-medium text-foreground">Como pagar com PIX</h4>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Após confirmar o pedido, você receberá o código PIX</p>
            <p>2. Abra o app do seu banco e escaneie o QR Code</p>
            <p>3. Confirme o pagamento no seu banco</p>
            <p>4. Seu pedido será confirmado automaticamente</p>
          </div>
          
          <div 
            className="p-3 rounded-lg border-l-4 bg-current/5"
            style={{ borderLeftColor: primaryColor }}
          >
            <p className="text-sm text-foreground">
              <Icon name="Clock" size={14} className="inline mr-1" />
              O pagamento PIX é processado instantaneamente
            </p>
          </div>
        </div>
      )}
      {/* Security Badge */}
      <div className="flex items-center justify-center space-x-2 p-3 bg-muted/30 rounded-lg">
        <Icon name="Shield" size={16} className="text-success" />
        <span className="text-sm text-muted-foreground">
          Pagamento 100% seguro e criptografado
        </span>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;