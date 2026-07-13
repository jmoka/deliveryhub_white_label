import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import { authService } from '../../services/authService';

const TAB_LOGIN = 'login';
const TAB_REGISTER = 'register';

const CustomerRegistrationLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(TAB_LOGIN);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { signIn, signUp, isAuthenticated, isAdmin, isRestaurantOwner } = useAuth();

  const getRedirectUrl = (from) => {
    if (from && from !== '/customer-registration-login') return from;
    if (isAdmin()) return '/admin';
    if (isRestaurantOwner()) return '/restaurante';
    return '/menu-catalog-product-browse';
  };

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getRedirectUrl(location?.state?.from));
    }
  }, [isAuthenticated()]);

  const handleLogin = async (formData) => {
    setErro(null);
    setLoading(true);
    try {
      const result = await signIn(formData?.emailOrPhone, formData?.password);
      if (!result?.success) throw new Error(result?.error || 'Credenciais inválidas');
      navigate(getRedirectUrl(location?.state?.from));
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
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
      // Após registro, redireciona por role (perfil carregado via AuthContext)
      navigate('/menu-catalog-product-browse');
    } catch (error) {
      throw new Error(error?.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email) => {
    await authService.resetPassword(email);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          aria-label="Voltar"
        >
          <Icon name="ArrowLeft" size={24} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Icon name="Utensils" size={18} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">DeliveryHub</span>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">

          {/* Card principal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {activeTab === TAB_LOGIN ? 'Entrar na sua conta' : 'Criar conta'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === TAB_LOGIN
                  ? 'Acesse para acompanhar seus pedidos'
                  : 'Cadastre-se para fazer pedidos'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border border-gray-200 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab(TAB_LOGIN)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === TAB_LOGIN
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setActiveTab(TAB_REGISTER)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === TAB_REGISTER
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Cadastrar
              </button>
            </div>

            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{erro}</p>
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

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">Tem um estabelecimento?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* CTA Estabelecimento */}
          <button
            onClick={() => navigate('/restaurant-registration-setup')}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Icon name="Store" size={18} className="text-white" />
            Cadastrar meu estabelecimento
          </button>
          <p className="text-center text-xs text-gray-400">
            Você precisará estar logado para completar o cadastro do estabelecimento.
          </p>
        </div>
      </main>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onResetPassword={handleForgotPassword}
        primaryColor="#2563EB"
      />
    </div>
  );
};

export default CustomerRegistrationLogin;
