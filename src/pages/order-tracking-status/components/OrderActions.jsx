import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const OrderActions = ({ 
  orderStatus = 'confirmed',
  orderId = '#12345',
  onCancelOrder = () => {},
  onReorder = () => {},
  primaryColor = '#2563EB',
  className = ''
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);

  const canCancel = ['confirmed', 'preparing']?.includes(orderStatus);
  const canReorder = orderStatus === 'delivered';

  const cancelReasons = [
    'Mudei de ideia',
    'Demora na entrega',
    'Erro no pedido',
    'Problema com pagamento',
    'Outro motivo'
  ];

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onCancelOrder({ orderId, reason: cancelReason });
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error canceling order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReorderClick = () => {
    onReorder(orderId);
  };

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      setShowCancelModal(false);
    }
  };

  return (
    <>
      <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
        <h3 className="font-medium text-foreground mb-4">Ações do Pedido</h3>
        
        <div className="space-y-3">
          {canReorder && (
            <Button
              onClick={handleReorderClick}
              variant="default"
              fullWidth
              iconName="RotateCcw"
              iconPosition="left"
              style={{ backgroundColor: primaryColor }}
            >
              Pedir Novamente
            </Button>
          )}

          {canCancel && (
            <Button
              onClick={handleCancelClick}
              variant="outline"
              fullWidth
              iconName="X"
              iconPosition="left"
            >
              Cancelar Pedido
            </Button>
          )}

          <Button
            variant="ghost"
            fullWidth
            iconName="Download"
            iconPosition="left"
          >
            Baixar Recibo
          </Button>

          <Button
            variant="ghost"
            fullWidth
            iconName="Share2"
            iconPosition="left"
          >
            Compartilhar Pedido
          </Button>
        </div>

        {orderStatus === 'delivered' && (
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground mb-3">Avalie seu pedido</h4>
            <div className="flex items-center space-x-2 mb-3">
              {[1, 2, 3, 4, 5]?.map((star) => (
                <button
                  key={star}
                  className="p-1 hover:scale-110 transition-transform duration-200"
                >
                  <Icon 
                    name="Star" 
                    size={20} 
                    className="text-muted-foreground hover:text-yellow-400 transition-colors duration-200" 
                  />
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              fullWidth
              iconName="MessageSquare"
              iconPosition="left"
            >
              Deixar Comentário
            </Button>
          </div>
        )}
      </div>
      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in"
          onClick={handleBackdropClick}
        >
          <div className="w-full max-w-md bg-card rounded-lg shadow-lg animate-slide-up elevation-3">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Cancelar Pedido
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors duration-200"
              >
                <Icon name="X" size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Tem certeza que deseja cancelar o pedido {orderId}? 
                  Por favor, selecione o motivo do cancelamento:
                </p>
                
                <div className="space-y-2">
                  {cancelReasons?.map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors duration-200"
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={cancelReason === reason}
                        onChange={(e) => setCancelReason(e?.target?.value)}
                        className="w-4 h-4"
                        style={{ accentColor: primaryColor }}
                      />
                      <span className="text-sm text-foreground">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                  fullWidth
                >
                  Manter Pedido
                </Button>
                <Button
                  onClick={handleConfirmCancel}
                  variant="destructive"
                  fullWidth
                  loading={loading}
                  disabled={!cancelReason}
                >
                  Confirmar Cancelamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderActions;