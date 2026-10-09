import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import TwoFactorVerification from '../../components/TwoFactorVerification';
import { authService } from '../../services/authService';
import { APP_NAME } from '../../constants/brand';
import { apiPath } from '../../lib/apiUrl';
import { updatePerfil, gerarLinkTelegram, getStatusTelegram } from '../../services/perfilService';
import { TelegramLinkCard } from '../../components/telegram/TelegramLinkCard';

const TAB_LOGIN = 'login';
const TAB_REGISTER = 'register';

const CustomerRegistrationLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(TAB_LOGIN);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  // Preenchido quando signIn devolve requires2fa — credenciais ficam só em
  // memória (nunca persistidas) só pra permitir "reenviar código" sem pedir
  // a senha de novo.
  const [twoFactor, setTwoFactor] = useState(null);
  // Kill-switch de cadastro público, configurado em /admin/configuracoes — true
  // até a config carregar, pra não sumir com o CTA antes da hora.
  const [permitirCadastroMotoboy, setPermitirCadastroMotoboy] = useState(true);
  const [permitirCadastroEstabelecimento, setPermitirCadastroEstabelecimento] = useState(true);
  // Preenchido só depois de um cadastro bem-sucedido — segura a navegação pro
  // catálogo pra oferecer o vínculo do Telegram antes (deep-link opt-in, não dá
  // pra saber se o número tem Telegram sem o cliente abrir o bot e confirmar).
  const [posCadastro, setPosCadastro] = useState(false);

  const { signIn, signUp, verifyTwoFactor, isAuthenticated, isAdmin, isRestaurantOwner, isMotoboy } = useAuth();

  useEffect(() => {
    fetch(apiPath('/api/r/branding'))
      .then((r) => r.json())
      .then((d) => {
        setPermitirCadastroMotoboy(d.permitir_cadastro_motoboy ?? true);
        setPermitirCadastroEstabelecimento(d.permitir_cadastro_estabelecimento ?? true);
      })
      .catch(() => {});
  }, []);

  // Motoboy também compra como qualquer usuário — cai na vitrine normal (com
  // o botão "Painel do motoboy" no topo), não direto no painel de entregas.
  // A única exceção é `from`: se ele tentou acessar /motoboy direto sem estar
  // logado, o MotoboyGuard já manda de volta pra lá depois do login.
  const getRedirectUrl = (from) => {
    if (from && from !== '/customer-registration-login') return from;
    if (isAdmin()) return '/admin';
    if (isRestaurantOwner()) return '/restaurante';
    return '/menu-catalog-product-browse';
  };

  useEffect(() => {
    // posCadastro trava esse redirect automático — sem isso, o login que o
    // signUp já dispara (onAuthStateChange) navegaria embora antes da etapa
    // de vínculo do Telegram aparecer.
    if (isAuthenticated() && !posCadastro) {
      navigate(getRedirectUrl(location?.state?.from));
    }
  }, [isAuthenticated(), posCadastro]);

  const handleLogin = async (formData) => {
    setErro(null);
    setLoading(true);
    try {
      const result = await signIn(formData?.emailOrPhone, formData?.password);
      if (result?.success) {
        navigate(getRedirectUrl(location?.state?.from));
        return;
      }

      if (result?.requires2fa) {
        setTwoFactor({
          challengeId: result.challengeId,
          method: result.method,
          emailOrPhone: formData?.emailOrPhone,
          password: formData?.password,
        });
        return;
      }

      const erro = new Error(result?.error || 'Credenciais inválidas');
      if (result?.bloqueadoAte) erro.bloqueadoAte = result.bloqueadoAte;
      throw erro;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (code) => {
    setLoading(true);
    try {
      const result = await verifyTwoFactor(twoFactor.challengeId, code);
      if (!result?.success) throw new Error(result?.error || 'Código inválido');
      navigate(getRedirectUrl(location?.state?.from));
    } finally {
      setLoading(false);
    }
  };

  // Não existe endpoint de "reenviar" isolado — refaz o login com a mesma
  // senha (guardada só em memória) pra gerar um desafio/código novos.
  const handleResendTwoFactor = async () => {
    const result = await signIn(twoFactor.emailOrPhone, twoFactor.password);
    if (result?.requires2fa) {
      setTwoFactor((prev) => ({ ...prev, challengeId: result.challengeId }));
    }
  };

  const handleRegister = async (formData) => {
    setErro(null);
    setLoading(true);
    try {
      const result = await signUp(formData?.email, formData?.password, {
        name: formData?.name,
        role: 'customer',
      });
      if (!result?.success) throw new Error(result?.error || 'Erro ao criar conta');

      // Best-effort — salva o telefone informado no cadastro no perfil (customers.phone_e164).
      // Não trava o fluxo se falhar (ex: sessão ainda propagando pelo onAuthStateChange).
      if (formData?.phone) {
        updatePerfil({ phone_e164: formData.phone }).catch(() => {});
      }

      // Não navega direto pro catálogo — mostra a etapa de vínculo do Telegram
      // primeiro (ver handleContinuarPosCadastro).
      setPosCadastro(true);
    } catch (error) {
      throw new Error(error?.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinuarPosCadastro = () => {
    navigate(getRedirectUrl(location?.state?.from));
  };

  const handleForgotPassword = async (email) => {
    const result = await authService.resetPassword(email);
    if (!result?.success) {
      throw new Error(result?.error || 'Erro ao enviar email de recuperação. Tente novamente.');
    }
    return { modo: result.modo, resetId: result.resetId };
  };

  const handleConfirmarRecuperacaoComCodigo = async (resetId, codigo, novaSenha) => {
    const result = await authService.confirmarRecuperacaoSenha(resetId, codigo, novaSenha);
    if (!result?.success) {
      throw new Error(result?.error || 'Não foi possível trocar a senha.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-[#27272A] border-b border-[#E4E4E7] dark:border-[#3F3F46] px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]"
          aria-label="Voltar"
        >
          <Icon name="ArrowLeft" size={24} className="text-[#71717A] dark:text-[#A1A1AA]" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            <img src="/assets/images/icon-192.png" alt={APP_NAME} className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">{APP_NAME}</span>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">

          {posCadastro ? (
            <div className="bg-white dark:bg-[#27272A] rounded-2xl shadow-sm border border-[#E4E4E7] dark:border-[#3F3F46] p-6 space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40">
                  <Icon name="CheckCircle2" size={28} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-[#18181B] dark:text-[#F4F4F5]">Conta criada! Bem-vindo(a) 🎉</h2>
                <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">
                  Falta um passo importante antes de pedir: conecte seu Telegram pra receber a confirmação
                  e o status dos seus pedidos.
                </p>
              </div>

              <TelegramLinkCard gerarLink={gerarLinkTelegram} getStatus={getStatusTelegram} />

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-2">
                <Icon name="MapPin" size={16} className="text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Depois disso, cadastre seu endereço e ajuste o pino no mapa exatamente onde fica sua casa —
                  é isso que o motoboy usa pra chegar. Só o endereço escrito não garante a entrega no lugar certo.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate('/customer-profile')}
                  fullWidth
                  className="h-12 font-medium"
                  style={{ backgroundColor: '#2563EB' }}
                >
                  Cadastrar meu endereço agora
                </Button>
                <button
                  onClick={handleContinuarPosCadastro}
                  className="text-sm text-center text-[#71717A] dark:text-[#A1A1AA] hover:underline py-2"
                >
                  Continuar sem fazer agora
                </button>
              </div>
            </div>
          ) : twoFactor ? (
            <div className="bg-white dark:bg-[#27272A] rounded-2xl shadow-sm border border-[#E4E4E7] dark:border-[#3F3F46] p-6">
              <TwoFactorVerification
                method={twoFactor.method}
                onVerify={handleVerifyTwoFactor}
                onResendCode={handleResendTwoFactor}
                onBack={() => setTwoFactor(null)}
                loading={loading}
                primaryColor="#2563EB"
              />
            </div>
          ) : (
          <>
          {/* Card principal */}
          <div className="bg-white dark:bg-[#27272A] rounded-2xl shadow-sm border border-[#E4E4E7] dark:border-[#3F3F46] p-6 space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#18181B] dark:text-[#F4F4F5]">
                {activeTab === TAB_LOGIN ? 'Entrar na sua conta' : 'Criar conta'}
              </h2>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">
                {activeTab === TAB_LOGIN
                  ? 'Acesse para acompanhar seus pedidos'
                  : 'Cadastre-se para fazer pedidos'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab(TAB_LOGIN)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === TAB_LOGIN
                    ? 'bg-blue-600 text-white'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setActiveTab(TAB_REGISTER)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === TAB_REGISTER
                    ? 'bg-blue-600 text-white'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]'
                }`}
              >
                Cadastrar
              </button>
            </div>

            {erro && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
              </div>
            )}

            {activeTab === TAB_LOGIN ? (
              <LoginForm
                onLogin={handleLogin}
                onForgotPassword={() => setShowForgotPassword(true)}
                loading={loading}
                primaryColor="#2563EB"
              />
            ) : (
              <RegisterForm
                onRegister={handleRegister}
                loading={loading}
                primaryColor="#2563EB"
              />
            )}
          </div>

          {permitirCadastroEstabelecimento && (
            <>
              {/* Separador */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E4E4E7] dark:bg-[#3F3F46]" />
                <span className="text-xs text-[#A1A1AA]">Tem um estabelecimento?</span>
                <div className="flex-1 h-px bg-[#E4E4E7] dark:bg-[#3F3F46]" />
              </div>

              {/* CTA Estabelecimento */}
              <button
                onClick={() => navigate('/restaurant-registration-setup')}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Icon name="Store" size={18} className="text-white" />
                Cadastrar meu estabelecimento
              </button>
              <p className="text-center text-xs text-[#A1A1AA]">
                Você precisará estar logado para completar o cadastro do estabelecimento.
              </p>
            </>
          )}

          {permitirCadastroMotoboy && !isMotoboy() && (
            <>
              {/* Separador */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E4E4E7] dark:bg-[#3F3F46]" />
                <span className="text-xs text-[#A1A1AA]">Quer entregar com a gente?</span>
                <div className="flex-1 h-px bg-[#E4E4E7] dark:bg-[#3F3F46]" />
              </div>

              {/* CTA Entregador */}
              <button
                onClick={() => navigate('/motoboy/cadastro')}
                className="w-full py-3 px-4 bg-[#FF441F] hover:bg-[#E63A19] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Icon name="Bike" size={18} className="text-white" />
                Cadastrar como entregador
              </button>
              <button
                onClick={() => setActiveTab(TAB_LOGIN)}
                className="w-full text-center text-xs text-[#71717A] dark:text-[#A1A1AA] hover:underline"
              >
                Já é entregador? Entre por aqui em cima
              </button>
            </>
          )}
          </>
          )}
        </div>
      </main>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onResetPassword={handleForgotPassword}
        onConfirmarComCodigo={handleConfirmarRecuperacaoComCodigo}
        primaryColor="#2563EB"
      />
    </div>
  );
};

export default CustomerRegistrationLogin;
