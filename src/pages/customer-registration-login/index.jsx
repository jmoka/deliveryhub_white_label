import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Image from '../../components/AppImage';
import SocialLoginButtons from './components/SocialLoginButtons';
import AuthTabs from './components/AuthTabs';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import WhatsAppVerification from './components/WhatsAppVerification';
import ForgotPasswordModal from './components/ForgotPasswordModal';

const CustomerRegistrationLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mock restaurant data
  const restaurantData = {
    name: "Sabor Brasileiro",
    logo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&crop=center",
    primaryColor: "#D97706",
    description: "Comida caseira com sabor de casa"
  };

  // State management
  const [activeTab, setActiveTab] = useState('login');
  const [currentStep, setCurrentStep] = useState('auth'); // 'auth', 'verification'
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);

  // Mock credentials for testing
  const mockCredentials = {
    email: "cliente@exemplo.com",
    password: "123456",
    phone: "(11) 99999-9999"
  };

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem('customerAuth');
    if (isAuthenticated) {
      const returnUrl = location?.state?.from || '/menu-catalog-product-browse';
      navigate(returnUrl);
    }
  }, [navigate, location]);

  const handleLogin = async (formData) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock validation
      const isValidEmail = formData?.emailOrPhone === mockCredentials?.email;
      const isValidPhone = formData?.emailOrPhone === mockCredentials?.phone;
      const isValidPassword = formData?.password === mockCredentials?.password;
      
      if (!(isValidEmail || isValidPhone) || !isValidPassword) {
        throw new Error(`Credenciais inválidas. Use: ${mockCredentials.email} / ${mockCredentials.phone} e senha: ${mockCredentials.password}`);
      }

      // Store authentication
      localStorage.setItem('customerAuth', JSON.stringify({
        id: 1,
        name: "João Silva",
        email: mockCredentials?.email,
        phone: mockCredentials?.phone,
        loginTime: new Date()?.toISOString()
      }));

      // Redirect to intended page or menu
      const returnUrl = location?.state?.from || '/menu-catalog-product-browse';
      navigate(returnUrl);
      
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (formData) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store pending registration for WhatsApp verification
      setPendingRegistration(formData);
      setCurrentStep('verification');
      
    } catch (error) {
      throw new Error('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppVerification = async (code) => {
    setLoading(true);
    
    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (code !== '123456') {
        throw new Error('Código inválido');
      }

      // Complete registration
      localStorage.setItem('customerAuth', JSON.stringify({
        id: 2,
        name: pendingRegistration?.name,
        email: pendingRegistration?.email,
        phone: pendingRegistration?.phone,
        loginTime: new Date()?.toISOString()
      }));

      // Redirect to menu
      navigate('/menu-catalog-product-browse');
      
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    // Simulate resend
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    
    try {
      // Simulate social login
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      localStorage.setItem('customerAuth', JSON.stringify({
        id: 3,
        name: `Usuário ${provider}`,
        email: `usuario@${provider?.toLowerCase()}.com`,
        phone: "(11) 98888-8888",
        provider: provider,
        loginTime: new Date()?.toISOString()
      }));

      const returnUrl = location?.state?.from || '/menu-catalog-product-browse';
      navigate(returnUrl);
      
    } catch (error) {
      console.error(`Erro no login com ${provider}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email) => {
    // Simulate password reset
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleBackToAuth = () => {
    setCurrentStep('auth');
    setPendingRegistration(null);
  };

  const handleGoBack = () => {
    if (location?.state?.from) {
      navigate(location?.state?.from);
    } else {
      navigate('/menu-catalog-product-browse');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="h-16 px-4 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Voltar"
          >
            <Icon name="ArrowLeft" size={24} className="text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={restaurantData?.logo}
                alt={`${restaurantData?.name} logo`}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                {restaurantData?.name}
              </h1>
            </div>
          </div>
          
          <div className="w-10"></div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-md mx-auto">
          {currentStep === 'auth' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              {/* Welcome Section */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={restaurantData?.logo}
                    alt={`${restaurantData?.name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Bem-vindo ao {restaurantData?.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {restaurantData?.description}
                </p>
              </div>

              {/* Social Login */}
              <SocialLoginButtons
                onGoogleLogin={() => handleSocialLogin('Google')}
                onFacebookLogin={() => handleSocialLogin('Facebook')}
                loading={loading}
              />

              {/* Auth Tabs */}
              <AuthTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                primaryColor={restaurantData?.primaryColor}
              />

              {/* Forms */}
              {activeTab === 'login' ? (
                <LoginForm
                  onLogin={handleLogin}
                  onForgotPassword={() => setShowForgotPassword(true)}
                  loading={loading}
                  primaryColor={restaurantData?.primaryColor}
                />
              ) : (
                <RegisterForm
                  onRegister={handleRegister}
                  loading={loading}
                  primaryColor={restaurantData?.primaryColor}
                />
              )}

              {/* Mock Credentials Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-1">Credenciais para teste:</p>
                <p className="text-xs text-blue-700">Email: {mockCredentials?.email}</p>
                <p className="text-xs text-blue-700">Telefone: {mockCredentials?.phone}</p>
                <p className="text-xs text-blue-700">Senha: {mockCredentials?.password}</p>
                <p className="text-xs text-blue-700">Código WhatsApp: 123456</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <WhatsAppVerification
                phoneNumber={pendingRegistration?.phone || ''}
                onVerify={handleWhatsAppVerification}
                onResendCode={handleResendCode}
                onBack={handleBackToAuth}
                loading={loading}
                primaryColor={restaurantData?.primaryColor}
              />
            </div>
          )}
        </div>
      </main>
      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onResetPassword={handleForgotPassword}
        primaryColor={restaurantData?.primaryColor}
      />
    </div>
  );
};

export default CustomerRegistrationLogin;