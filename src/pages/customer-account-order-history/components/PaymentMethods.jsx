import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PaymentMethods = ({ 
  paymentMethods, 
  onAddPaymentMethod, 
  onRemovePaymentMethod, 
  onSetDefault,
  primaryColor = '#2563EB' 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'credit',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: '',
    cpf: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    let formattedValue = value;

    // Format card number
    if (name === 'cardNumber') {
      formattedValue = value?.replace(/\s/g, '')?.replace(/(.{4})/g, '$1 ')?.trim();
    }
    
    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value?.replace(/\D/g, '')?.replace(/(\d{2})(\d)/, '$1/$2');
    }
    
    // Format CPF
    if (name === 'cpf') {
      formattedValue = value?.replace(/\D/g, '')?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    
    try {
      await onAddPaymentMethod(formData);
      setShowAddForm(false);
      setFormData({
        type: 'credit',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        holderName: '',
        cpf: ''
      });
    } catch (error) {
      console.error('Error adding payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCardIcon = (type) => {
    switch (type) {
      case 'visa': return 'CreditCard';
      case 'mastercard': return 'CreditCard';
      case 'amex': return 'CreditCard';
      case 'pix': return 'Smartphone';
      default: return 'CreditCard';
    }
  };

  const getCardBrand = (number) => {
    const firstDigit = number?.charAt(0);
    const firstTwo = number?.substring(0, 2);
    
    if (firstDigit === '4') return 'visa';
    if (firstTwo >= '51' && firstTwo <= '55') return 'mastercard';
    if (firstTwo === '34' || firstTwo === '37') return 'amex';
    return 'credit';
  };

  const maskCardNumber = (number) => {
    return number?.replace(/\d(?=\d{4})/g, '*');
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Métodos de Pagamento</h2>
        {!showAddForm && (
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setShowAddForm(true)}
          >
            Adicionar
          </Button>
        )}
      </div>
      {/* Payment Methods List */}
      <div className="space-y-4 mb-6">
        {paymentMethods?.map((method) => (
          <div
            key={method?.id}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              method?.isDefault 
                ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Icon 
                    name={getCardIcon(method?.type)} 
                    size={20} 
                    style={{ color: primaryColor }} 
                  />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-foreground">
                      {method?.type === 'pix' ? 'PIX' : `**** ${method?.lastFour}`}
                    </h3>
                    {method?.isDefault && (
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded-full text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {method?.type === 'pix' 
                      ? method?.pixKey 
                      : `${method?.brand?.toUpperCase()} • ${method?.holderName}`
                    }
                  </p>
                  {method?.expiryDate && (
                    <p className="text-xs text-muted-foreground">
                      Válido até {method?.expiryDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!method?.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetDefault(method?.id)}
                    className="text-xs"
                  >
                    Definir como padrão
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Trash2"
                  onClick={() => onRemovePaymentMethod(method?.id)}
                  className="text-error hover:text-error"
                />
              </div>
            </div>
          </div>
        ))}

        {paymentMethods?.length === 0 && (
          <div className="text-center py-8">
            <Icon name="CreditCard" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum método de pagamento</h3>
            <p className="text-muted-foreground">Adicione um cartão ou configure o PIX</p>
          </div>
        )}
      </div>
      {/* Add Payment Method Form */}
      {showAddForm && (
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            Adicionar Método de Pagamento
          </h3>
          
          {/* Payment Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">Tipo de Pagamento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'credit' }))}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  formData?.type === 'credit' ?'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                }`}
              >
                <Icon name="CreditCard" size={24} className="mx-auto mb-2" />
                <span className="text-sm font-medium">Cartão de Crédito</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'pix' }))}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  formData?.type === 'pix' ?'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                }`}
              >
                <Icon name="Smartphone" size={24} className="mx-auto mb-2" />
                <span className="text-sm font-medium">PIX</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formData?.type === 'credit' ? (
              <>
                <Input
                  label="Número do Cartão"
                  type="text"
                  name="cardNumber"
                  value={formData?.cardNumber}
                  onChange={handleInputChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Validade"
                    type="text"
                    name="expiryDate"
                    value={formData?.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/AA"
                    maxLength={5}
                    required
                  />
                  <Input
                    label="CVV"
                    type="text"
                    name="cvv"
                    value={formData?.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>

                <Input
                  label="Nome no Cartão"
                  type="text"
                  name="holderName"
                  value={formData?.holderName}
                  onChange={handleInputChange}
                  placeholder="Nome como aparece no cartão"
                  required
                />

                <Input
                  label="CPF do Portador"
                  type="text"
                  name="cpf"
                  value={formData?.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </>
            ) : (
              <div className="text-center py-8">
                <Icon name="Smartphone" size={48} style={{ color: primaryColor }} className="mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">PIX já configurado</h3>
                <p className="text-muted-foreground mb-4">
                  O PIX será disponibilizado automaticamente no checkout usando seu CPF cadastrado.
                </p>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Chave PIX:</strong> Seu CPF será usado como chave PIX para pagamentos instantâneos.
                  </p>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                variant="default"
                loading={loading}
                disabled={formData?.type === 'pix'}
                style={{ backgroundColor: primaryColor }}
              >
                {formData?.type === 'credit' ? 'Adicionar Cartão' : 'PIX Configurado'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;