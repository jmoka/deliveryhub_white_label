import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { formatDuracao } from '../../../utils/formatDuracao';

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
  const [bloqueadoAte, setBloqueadoAte] = useState(null); // timestamp ms
  const [now, setNow] = useState(Date.now());

  // Contagem regressiva enquanto bloqueado por tentativas erradas — some sozinha
  // quando o tempo zera, sem precisar recarregar a página.
  useEffect(() => {
    if (!bloqueadoAte) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [bloqueadoAte]);

  useEffect(() => {
    if (bloqueadoAte && now >= bloqueadoAte) setBloqueadoAte(null);
  }, [now, bloqueadoAte]);

  const bloqueado = bloqueadoAte && now < bloqueadoAte;

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
      if (error?.bloqueadoAte) {
        setBloqueadoAte(new Date(error.bloqueadoAte).getTime());
        setNow(Date.now());
      } else {
        setErrors({ submit: error?.message || 'Erro ao fazer login' });
      }
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
        disabled={bloqueado}
        required
      />
      <Input
        label="Senha"
        type="password"
        name="password"
        autoComplete="current-password"
        value={formData?.password}
        onChange={handleInputChange}
        placeholder="Digite sua senha"
        error={errors?.password}
        disabled={bloqueado}
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
      {bloqueado ? (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-center">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">Muitas tentativas com senha errada.</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 font-mono">{formatDuracao(bloqueadoAte - now)}</p>
          <p className="text-xs text-red-500/80 dark:text-red-400/70 mt-1">Tente de novo depois, ou peça pro administrador liberar.</p>
        </div>
      ) : errors?.submit && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{errors?.submit}</p>
        </div>
      )}
      <Button
        type="submit"
        loading={loading}
        disabled={bloqueado}
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