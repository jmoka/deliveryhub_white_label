import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import Input from './Input';

const AuthModal = ({ 
  isOpen = false,
  onClose = () => {},
  onLogin = () => {},
  onRegister = () => {},
  primaryColor = '#2563EB',
  className = ''
}) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'whatsapp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [whatsappCode, setWhatsappCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (mode === 'register') {
      if (!formData?.name?.trim()) {
        newErrors.name = 'Nome é obrigatório';
      }
      if (!formData?.phone?.trim()) {
        newErrors.phone = 'Telefone é obrigatório';
      }
      if (formData?.password !== formData?.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não coincidem';
      }
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData?.password?.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData?.password?.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      if (mode === 'login') {
        await onLogin(formData);
      } else if (mode === 'register') {
        await onRegister(formData);
        setMode('whatsapp');
      }
    } catch (error) {
      setErrors({ submit: error?.message || 'Erro ao processar solicitação' });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppVerification = async () => {
    if (!whatsappCode?.trim()) {
      setErrors({ whatsapp: 'Código é obrigatório' });
      return;
    }

    setLoading(true);
    try {
      // Simulate WhatsApp verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      onClose();
    } catch (error) {
      setErrors({ whatsapp: 'Código inválido' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-200 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in ${className}`}
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-md bg-card rounded-lg shadow-lg animate-slide-up elevation-3"
        style={{ '--brand-primary': primaryColor }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === 'login' && 'Entrar'}
            {mode === 'register' && 'Criar Conta'}
            {mode === 'whatsapp' && 'Verificação WhatsApp'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'whatsapp' ? (
            <div className="space-y-4">
              <div className="text-center">
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Icon name="MessageCircle" size={32} style={{ color: primaryColor }} />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Enviamos um código de verificação para seu WhatsApp. Digite o código abaixo:
                </p>
              </div>

              <Input
                label="Código de Verificação"
                type="text"
                value={whatsappCode}
                onChange={(e) => setWhatsappCode(e?.target?.value)}
                placeholder="Digite o código de 6 dígitos"
                error={errors?.whatsapp}
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono"
              />

              <Button
                onClick={handleWhatsAppVerification}
                loading={loading}
                fullWidth
                style={{ backgroundColor: primaryColor }}
              >
                Verificar Código
              </Button>

              <button
                onClick={() => setMode('register')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Voltar ao cadastro
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <Input
                  label="Nome Completo"
                  type="text"
                  name="name"
                  value={formData?.name}
                  onChange={handleInputChange}
                  placeholder="Digite seu nome completo"
                  error={errors?.name}
                  required
                />
              )}

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData?.email}
                onChange={handleInputChange}
                placeholder="Digite seu email"
                error={errors?.email}
                required
              />

              {mode === 'register' && (
                <Input
                  label="WhatsApp"
                  type="tel"
                  name="phone"
                  value={formData?.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  error={errors?.phone}
                  required
                />
              )}

              <Input
                label="Senha"
                type="password"
                name="password"
                value={formData?.password}
                onChange={handleInputChange}
                placeholder="Digite sua senha"
                error={errors?.password}
                required
              />

              {mode === 'register' && (
                <Input
                  label="Confirmar Senha"
                  type="password"
                  name="confirmPassword"
                  value={formData?.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirme sua senha"
                  error={errors?.confirmPassword}
                  required
                />
              )}

              {errors?.submit && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                  <p className="text-sm text-error">{errors?.submit}</p>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                fullWidth
                style={{ backgroundColor: primaryColor }}
              >
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-sm hover:underline transition-colors duration-200"
                  style={{ color: primaryColor }}
                >
                  {mode === 'login' ?'Não tem conta? Cadastre-se' :'Já tem conta? Faça login'
                  }
                </button>
              </div>

              {mode === 'login' && (
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;