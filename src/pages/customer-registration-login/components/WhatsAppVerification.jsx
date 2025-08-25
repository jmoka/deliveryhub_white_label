import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const WhatsAppVerification = ({ 
  phoneNumber = '',
  onVerify = () => {},
  onResendCode = () => {},
  onBack = () => {},
  loading = false,
  primaryColor = '#2563EB',
  className = ''
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleCodeChange = (e) => {
    const value = e?.target?.value?.replace(/\D/g, '')?.slice(0, 6);
    setVerificationCode(value);
    
    if (error) {
      setError('');
    }
  };

  const handleVerify = async () => {
    if (verificationCode?.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }

    try {
      await onVerify(verificationCode);
    } catch (error) {
      setError('Código inválido. Tente novamente.');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      await onResendCode();
      setCountdown(60);
      setCanResend(false);
      setError('');
    } catch (error) {
      setError('Erro ao reenviar código');
    }
  };

  const formatPhoneDisplay = (phone) => {
    const numbers = phone?.replace(/\D/g, '');
    if (numbers?.length === 11) {
      return `(${numbers?.slice(0, 2)}) ${numbers?.slice(2, 7)}-${numbers?.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div 
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Icon name="MessageCircle" size={32} style={{ color: primaryColor }} />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Verificação WhatsApp
        </h3>
        
        <p className="text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para
        </p>
        <p className="text-sm font-medium text-foreground">
          {formatPhoneDisplay(phoneNumber)}
        </p>
      </div>
      {/* Verification Code Input */}
      <div className="space-y-4">
        <Input
          label="Código de Verificação"
          type="text"
          value={verificationCode}
          onChange={handleCodeChange}
          placeholder="000000"
          error={error}
          maxLength={6}
          className="text-center text-lg tracking-widest font-mono"
        />

        <Button
          onClick={handleVerify}
          loading={loading}
          fullWidth
          disabled={verificationCode?.length !== 6}
          className="h-12 font-medium"
          style={{ backgroundColor: primaryColor }}
        >
          Verificar Código
        </Button>
      </div>
      {/* Resend Code */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Não recebeu o código?
        </p>
        
        {canResend ? (
          <button
            onClick={handleResend}
            className="text-sm font-medium transition-colors duration-200 hover:underline"
            style={{ color: primaryColor }}
          >
            Reenviar código
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Reenviar em {countdown}s
          </p>
        )}
      </div>
      {/* Back Button */}
      <div className="text-center">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center justify-center space-x-1 mx-auto"
        >
          <Icon name="ArrowLeft" size={16} />
          <span>Voltar ao cadastro</span>
        </button>
      </div>
    </div>
  );
};

export default WhatsAppVerification;