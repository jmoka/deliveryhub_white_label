import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Icon from './AppIcon';

// Tela de "digite o código" do segundo fator (2FA) no login — reaproveita a
// mesma state machine do WhatsAppVerification (código de 6 dígitos, reenvio
// com contador), generalizada pros dois métodos: app autenticador (TOTP,
// sem reenvio — o código já troca sozinho a cada 30s no app) e código por
// email (com reenvio, igual WhatsApp).
const TwoFactorVerification = ({
  method = 'email', // 'totp' | 'email'
  onVerify = () => {},
  onResendCode = () => {},
  onBack = () => {},
  loading = false,
  primaryColor = '#2563EB',
  className = '',
}) => {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const isEmail = method === 'email';

  useEffect(() => {
    if (!isEmail) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    setCanResend(true);
  }, [countdown, isEmail]);

  const handleCodeChange = (e) => {
    const value = e?.target?.value?.replace(/\D/g, '')?.slice(0, 6);
    setCodigo(value);
    if (error) setError('');
  };

  const handleVerify = async () => {
    if (codigo?.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }
    try {
      await onVerify(codigo);
    } catch {
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
    } catch {
      setError('Erro ao reenviar código');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Icon name={isEmail ? 'Mail' : 'ShieldCheck'} size={32} style={{ color: primaryColor }} />
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">Verificação em duas etapas</h3>

        <p className="text-sm text-muted-foreground">
          {isEmail ? 'Enviamos um código de 6 dígitos para o seu email cadastrado.' : 'Digite o código do seu app autenticador.'}
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Código de verificação"
          type="text"
          value={codigo}
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
          disabled={codigo?.length !== 6}
          className="h-12 font-medium"
          style={{ backgroundColor: primaryColor }}
        >
          Verificar código
        </Button>
      </div>

      {isEmail && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Não recebeu o código?</p>
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-sm font-medium transition-colors duration-200 hover:underline"
              style={{ color: primaryColor }}
            >
              Reenviar código
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">Reenviar em {countdown}s</p>
          )}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center justify-center space-x-1 mx-auto"
        >
          <Icon name="ArrowLeft" size={16} />
          <span>Voltar ao login</span>
        </button>
      </div>
    </div>
  );
};

export default TwoFactorVerification;
