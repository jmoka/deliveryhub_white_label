import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const ForgotPasswordModal = ({ 
  isOpen = false,
  onClose = () => {},
  onResetPassword = () => {},
  primaryColor = '#2563EB',
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!email?.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!/\S+@\S+\.\S+/?.test(email)) {
      setError('Email inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onResetPassword(email);
      setSent(true);
    } catch (error) {
      setError('Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSent(false);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-200 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in ${className}`}
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg animate-slide-up elevation-3">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {sent ? 'Email Enviado' : 'Recuperar Senha'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Icon name="Mail" size={32} style={{ color: primaryColor }} />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de recuperação para:
                </p>
                <p className="text-sm font-medium text-foreground">
                  {email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Verifique sua caixa de entrada e spam
                </p>
              </div>

              <Button
                onClick={handleClose}
                fullWidth
                style={{ backgroundColor: primaryColor }}
              >
                Entendi
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Digite seu email para receber um link de recuperação de senha
                </p>
              </div>

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e?.target?.value);
                  if (error) setError('');
                }}
                placeholder="Digite seu email"
                error={error}
                required
              />

              <Button
                type="submit"
                loading={loading}
                fullWidth
                style={{ backgroundColor: primaryColor }}
              >
                Enviar Link de Recuperação
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;