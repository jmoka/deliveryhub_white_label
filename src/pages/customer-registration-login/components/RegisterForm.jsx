import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';


const RegisterForm = ({ 
  onRegister = () => {},
  loading = false,
  primaryColor = '#2563EB',
  className = ''
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Calculate password strength
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password?.length >= 6) strength += 1;
    if (password?.length >= 8) strength += 1;
    if (/[A-Z]/?.test(password)) strength += 1;
    if (/[0-9]/?.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/?.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return { text: 'Muito fraca', color: '#DC2626' };
      case 2: return { text: 'Fraca', color: '#F59E0B' };
      case 3: return { text: 'Média', color: '#10B981' };
      case 4:
      case 5: return { text: 'Forte', color: '#059669' };
      default: return { text: '', color: '' };
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData?.phone?.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/?.test(formData?.phone)) {
      newErrors.phone = 'Formato: (11) 99999-9999';
    }

    if (!formData?.password?.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData?.password?.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData?.password !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    if (!formData?.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onRegister(formData);
    } catch (error) {
      setErrors({ submit: error?.message || 'Erro ao criar conta' });
    }
  };

  const formatPhoneNumber = (value) => {
    const numbers = value?.replace(/\D/g, '');
    if (numbers?.length <= 2) return `(${numbers}`;
    if (numbers?.length <= 6) return `(${numbers?.slice(0, 2)}) ${numbers?.slice(2)}`;
    if (numbers?.length <= 10) return `(${numbers?.slice(0, 2)}) ${numbers?.slice(2, 6)}-${numbers?.slice(6)}`;
    return `(${numbers?.slice(0, 2)}) ${numbers?.slice(2, 7)}-${numbers?.slice(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e?.target?.value);
    handleInputChange({ target: { name: 'phone', value: formatted } });
  };

  const strengthInfo = getPasswordStrengthText();

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
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
      <Input
        label="WhatsApp"
        type="tel"
        name="phone"
        value={formData?.phone}
        onChange={handlePhoneChange}
        placeholder="(11) 99999-9999"
        error={errors?.phone}
        required
        description="Usaremos para confirmar seu cadastro"
      />
      <div className="space-y-2">
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
        
        {formData?.password && (
          <div className="space-y-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5]?.map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                    level <= passwordStrength ? 'bg-current' : 'bg-gray-200'
                  }`}
                  style={{ color: level <= passwordStrength ? strengthInfo?.color : '#E5E7EB' }}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: strengthInfo?.color }}>
              Força da senha: {strengthInfo?.text}
            </p>
          </div>
        )}
      </div>
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
      <div className="space-y-3">
        <Checkbox
          label="Aceito os Termos de Uso e Política de Privacidade"
          name="acceptTerms"
          checked={formData?.acceptTerms}
          onChange={handleInputChange}
          error={errors?.acceptTerms}
          required
        />

        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
          <span>Ao criar uma conta, você concorda com nossos</span>
          <button
            type="button"
            className="underline hover:no-underline transition-all duration-200"
            style={{ color: primaryColor }}
          >
            Termos de Uso
          </button>
          <span>e</span>
          <button
            type="button"
            className="underline hover:no-underline transition-all duration-200"
            style={{ color: primaryColor }}
          >
            Política de Privacidade
          </button>
        </div>
      </div>
      {errors?.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors?.submit}</p>
        </div>
      )}
      <Button
        type="submit"
        loading={loading}
        fullWidth
        className="h-12 font-medium"
        style={{ backgroundColor: primaryColor }}
      >
        Criar Conta
      </Button>
    </form>
  );
};

export default RegisterForm;