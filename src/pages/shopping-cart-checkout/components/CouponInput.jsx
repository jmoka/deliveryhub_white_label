import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const CouponInput = ({ 
  appliedCoupon, 
  onApplyCoupon, 
  onRemoveCoupon,
  primaryColor = '#2563EB' 
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponCode?.trim()) {
      setError('Digite um código de cupom');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock coupon validation
      const validCoupons = {
        'PRIMEIRA10': { discount: 10, type: 'percentage', description: '10% de desconto na primeira compra' },
        'FRETE5': { discount: 5, type: 'fixed', description: 'R$ 5,00 de desconto na entrega' },
        'WELCOME20': { discount: 20, type: 'percentage', description: '20% de desconto de boas-vindas' }
      };

      const coupon = validCoupons?.[couponCode?.toUpperCase()];
      
      if (coupon) {
        onApplyCoupon({
          code: couponCode?.toUpperCase(),
          ...coupon
        });
        setCouponCode('');
      } else {
        setError('Cupom inválido ou expirado');
      }
    } catch (err) {
      setError('Erro ao aplicar cupom. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setError('');
  };

  const formatDiscount = (coupon) => {
    if (coupon?.type === 'percentage') {
      return `${coupon?.discount}%`;
    } else {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })?.format(coupon?.discount);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Cupom de Desconto</h3>
      {appliedCoupon ? (
        <div 
          className="p-4 rounded-lg border-2 bg-current/5"
          style={{ 
            borderColor: primaryColor,
            backgroundColor: `${primaryColor}10`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Icon name="Tag" size={20} className="text-white" />
              </div>
              
              <div>
                <h4 className="font-medium text-foreground">
                  {appliedCoupon?.code}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {appliedCoupon?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                -{formatDiscount(appliedCoupon)}
              </span>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveCoupon}
                className="h-8 w-8 text-muted-foreground hover:text-error"
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Digite o código do cupom"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e?.target?.value?.toUpperCase());
                  setError('');
                }}
                error={error}
                className="uppercase"
              />
            </div>
            
            <Button
              onClick={handleApplyCoupon}
              loading={loading}
              disabled={!couponCode?.trim()}
              style={{ backgroundColor: primaryColor }}
              className="px-6"
            >
              Aplicar
            </Button>
          </div>
          
          {/* Available Coupons Hint */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">
              <Icon name="Info" size={14} className="inline mr-1" />
              Cupons disponíveis para teste:
            </p>
            <div className="flex flex-wrap gap-2">
              {['PRIMEIRA10', 'FRETE5', 'WELCOME20']?.map((code) => (
                <button
                  key={code}
                  onClick={() => setCouponCode(code)}
                  className="px-2 py-1 bg-card border border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors duration-200"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponInput;