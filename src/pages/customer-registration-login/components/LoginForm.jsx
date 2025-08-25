import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const LoginForm = ({ 
  onLogin = () => {},
  onForgotPassword = () => {},
  loading = false,
  primaryColor = '#2563EB',
  className = ''
}) => {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});

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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.emailOrPhone?.trim()) {
      newErrors.emailOrPhone = 'Email ou telefone é obrigatório';
    }

    if (!formData?.password?.trim()) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onLogin(formData);
    } catch (error) {
      setErrors({ submit: error?.message || 'Erro ao fazer login' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <Input
        label="Email ou Telefone"
        type="text"
        name="emailOrPhone"
        value={formData?.emailOrPhone}
        onChange={handleInputChange}
        placeholder="Digite seu email ou telefone"
        error={errors?.emailOrPhone}
        required
      />
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
      <div className="flex items-center justify-between">
        <Checkbox
          label="Lembrar de mim"
          name="rememberMe"
          checked={formData?.rememberMe}
          onChange={handleInputChange}
          size="sm"
        />

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm font-medium transition-colors duration-200 hover:underline"
          style={{ color: primaryColor }}
        >
          Esqueceu a senha?
        </button>
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
        Entrar
      </Button>
    </form>
  );
};

export default LoginForm;