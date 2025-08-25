import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const LiveChatButton = ({ 
  restaurantName = 'DeliveryHub',
  restaurantPhone = '5511999999999',
  orderId = '#12345',
  primaryColor = '#2563EB',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleWhatsAppClick = () => {
    const message = `Olá! Gostaria de falar sobre meu pedido ${orderId}. Obrigado!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${restaurantPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallClick = () => {
    window.open(`tel:+${restaurantPhone}`, '_self');
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className={`fixed bottom-20 md:bottom-6 right-6 z-50 ${className}`}>
        {isExpanded && (
          <div className="mb-4 bg-card rounded-lg shadow-lg border border-border p-4 w-64 animate-slide-up">
            <div className="mb-3">
              <h4 className="font-medium text-foreground text-sm">
                Precisa de ajuda?
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Entre em contato conosco sobre seu pedido
              </p>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handleWhatsAppClick}
                className="w-full flex items-center space-x-3 p-3 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
              >
                <Icon name="MessageCircle" size={18} className="text-white" />
                <div className="text-left">
                  <p className="text-sm font-medium">WhatsApp</p>
                  <p className="text-xs opacity-90">Chat em tempo real</p>
                </div>
              </button>
              
              <button
                onClick={handleCallClick}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted text-foreground transition-colors duration-200"
              >
                <Icon name="Phone" size={18} className="text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-xs text-muted-foreground">Ligação direta</p>
                </div>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: primaryColor }}
          aria-label="Chat support"
        >
          <Icon 
            name={isExpanded ? "X" : "MessageCircle"} 
            size={24} 
            className="text-white" 
          />
        </button>
      </div>

      {/* Support Section - Desktop */}
      <div className="hidden md:block bg-card rounded-lg border border-border p-6">
        <div className="text-center mb-4">
          <div 
            className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Icon name="Headphones" size={24} style={{ color: primaryColor }} />
          </div>
          <h3 className="font-medium text-foreground">
            Precisa de Ajuda?
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Nossa equipe está pronta para ajudar
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleWhatsAppClick}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
          >
            <Icon name="MessageCircle" size={18} className="text-white" />
            <span className="font-medium">Chat via WhatsApp</span>
          </button>

          <button
            onClick={handleCallClick}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted text-foreground transition-colors duration-200"
          >
            <Icon name="Phone" size={18} className="text-muted-foreground" />
            <span className="font-medium">Ligar Agora</span>
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Horário de atendimento: 08:00 às 22:00
          </p>
        </div>
      </div>
    </>
  );
};

export default LiveChatButton;