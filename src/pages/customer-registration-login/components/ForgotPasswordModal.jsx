import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

// Fluxo de recuperação de senha em duas variantes, decididas pelo backend
// (ver authService.resetPassword): 'nativo' — link de recuperação do Supabase
// Auth, mandado pro e-mail de LOGIN (comportamento de sempre); 'seguranca' —
// código de 6 dígitos mandado pro e-mail de segurança verificado da conta
// (existe pra quando o e-mail de login é fake e nunca chegaria nada nele).
const ForgotPasswordModal = ({
  isOpen = false,
  onClose = () => {},
  onResetPassword = () => {}, // (email) => Promise<{ modo, resetId }>
  onConfirmarComCodigo = () => {}, // (resetId, codigo, novaSenha) => Promise<void>
  primaryColor = '#2563EB',
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState('email'); // 'email' | 'nativo-enviado' | 'codigo' | 'concluido'
  const [resetId, setResetId] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleSubmitEmail = async (e) => {
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
      const resultado = await onResetPassword(email);
      if (resultado?.modo === 'seguranca') {
        setResetId(resultado.resetId);
        setEtapa('codigo');
      } else {
        setEtapa('nativo-enviado');
      }
    } catch (error) {
      setError(error?.message || 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCodigo = async (e) => {
    e?.preventDefault();
    setError('');

    if (codigo.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }
    if (novaSenha.length < 8) {
      setError('A senha precisa ter no mínimo 8 caracteres');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await onConfirmarComCodigo(resetId, codigo, novaSenha);
      setEtapa('concluido');
    } catch (error) {
      setError(error?.message || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setEtapa('email');
    setResetId(null);
    setCodigo('');
    setNovaSenha('');
    setConfirmarSenha('');
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const titulo = {
    email: 'Recuperar Senha',
    'nativo-enviado': 'Email Enviado',
    codigo: 'Digite o código',
    concluido: 'Senha alterada',
  }[etapa];

  return (
    <div
      className={`fixed inset-0 z-200 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in ${className}`}
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg animate-slide-up elevation-3">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{titulo}</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {etapa === 'nativo-enviado' && (
            <div className="text-center space-y-4">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Icon name="Mail" size={32} style={{ color: primaryColor }} />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Enviamos um link de recuperação para:</p>
                <p className="text-sm font-medium text-foreground">{email}</p>
                <p className="text-xs text-muted-foreground">Verifique sua caixa de entrada e spam</p>
              </div>
              <Button onClick={handleClose} fullWidth style={{ backgroundColor: primaryColor }}>
                Entendi
              </Button>
            </div>
          )}

          {etapa === 'concluido' && (
            <div className="text-center space-y-4">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Icon name="CheckCircle" size={32} style={{ color: primaryColor }} />
              </div>
              <p className="text-sm text-muted-foreground">
                Senha alterada com sucesso. Já pode entrar com a nova senha.
              </p>
              <Button onClick={handleClose} fullWidth style={{ backgroundColor: primaryColor }}>
                Entendi
              </Button>
            </div>
          )}

          {etapa === 'email' && (
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Digite seu email de login pra receber as instruções de recuperação
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

              <Button type="submit" loading={loading} fullWidth style={{ backgroundColor: primaryColor }}>
                Continuar
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

          {etapa === 'codigo' && (
            <form onSubmit={handleSubmitCodigo} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm text-muted-foreground">
                  Enviamos um código de 6 dígitos pro seu e-mail de segurança cadastrado.
                </p>
              </div>

              <Input
                label="Código de verificação"
                type="text"
                value={codigo}
                onChange={(e) => {
                  setCodigo(e?.target?.value?.replace(/\D/g, '')?.slice(0, 6));
                  if (error) setError('');
                }}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono"
                required
              />
              <Input
                label="Nova senha"
                type="password"
                value={novaSenha}
                onChange={(e) => { setNovaSenha(e?.target?.value); if (error) setError(''); }}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
              />
              <Input
                label="Confirmar nova senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => { setConfirmarSenha(e?.target?.value); if (error) setError(''); }}
                placeholder="Confirme a nova senha"
                minLength={8}
                error={error}
                required
              />

              <Button type="submit" loading={loading} fullWidth style={{ backgroundColor: primaryColor }}>
                Trocar senha
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
