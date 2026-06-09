import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import BusinessInformationForm from './components/BusinessInformationForm';
import ContactDetailsForm from './components/ContactDetailsForm';
import OperatingHoursForm from './components/OperatingHoursForm';
import BrandingForm from './components/BrandingForm';
import ProgressSidebar from './components/ProgressSidebar';
import { registrarRestaurante } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';

const RestaurantRegistrationSetup = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState('business');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Business Information
    restaurantName: '',
    cuisineType: '',
    description: '',
    cnpj: '',
    deliveryFee: '',
    deliveryTime: '',
    minimumOrder: '',
    deliveryRadius: '',
    
    // Contact Details
    whatsapp: '',
    email: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    
    // Operating Hours
    operatingHours: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      sunday: { isOpen: false, openTime: '', closeTime: '' }
    },
    
    // Branding
    logo: null,
    primaryColor: '#2563EB'
  });

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('restaurantSetupData');
    const savedStep = localStorage.getItem('restaurantSetupStep');
    const savedCompleted = localStorage.getItem('restaurantSetupCompleted');
    
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
    if (savedStep) {
      setCurrentStep(savedStep);
    }
    if (savedCompleted) {
      setCompletedSteps(JSON.parse(savedCompleted));
    }
  }, []);

  // Save data to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem('restaurantSetupData', JSON.stringify(formData));
  }, [formData]);

  // Save current step and completed steps
  useEffect(() => {
    localStorage.setItem('restaurantSetupStep', currentStep);
    localStorage.setItem('restaurantSetupCompleted', JSON.stringify(completedSteps));
  }, [currentStep, completedSteps]);

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

  const validateCurrentStep = () => {
    const newErrors = {};

    switch (currentStep) {
      case 'business':
        if (!formData?.restaurantName?.trim()) {
          newErrors.restaurantName = 'Nome do restaurante é obrigatório';
        }
        if (!formData?.cuisineType) {
          newErrors.cuisineType = 'Tipo de cozinha é obrigatório';
        }
        if (!formData?.deliveryFee || parseFloat(formData?.deliveryFee) < 0) {
          newErrors.deliveryFee = 'Taxa de entrega deve ser um valor válido';
        }
        if (!formData?.deliveryTime || parseInt(formData?.deliveryTime) < 10) {
          newErrors.deliveryTime = 'Tempo de entrega deve ser pelo menos 10 minutos';
        }
        break;

      case 'contact':
        if (!formData?.whatsapp?.trim()) {
          newErrors.whatsapp = 'WhatsApp é obrigatório';
        }
        if (!formData?.email?.trim()) {
          newErrors.email = 'Email é obrigatório';
        } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
          newErrors.email = 'Email inválido';
        }
        if (!formData?.cep?.trim()) {
          newErrors.cep = 'CEP é obrigatório';
        }
        if (!formData?.address?.trim()) {
          newErrors.address = 'Endereço é obrigatório';
        }
        if (!formData?.number?.trim()) {
          newErrors.number = 'Número é obrigatório';
        }
        if (!formData?.neighborhood?.trim()) {
          newErrors.neighborhood = 'Bairro é obrigatório';
        }
        if (!formData?.city?.trim()) {
          newErrors.city = 'Cidade é obrigatória';
        }
        if (!formData?.state?.trim()) {
          newErrors.state = 'Estado é obrigatório';
        }
        break;

      case 'hours':
        const hasOpenDay = Object.values(formData?.operatingHours || {})?.some(day => day?.isOpen);
        if (!hasOpenDay) {
          newErrors.operatingHours = 'Pelo menos um dia deve estar aberto';
        }
        break;

      case 'branding':
        if (!formData?.primaryColor) {
          newErrors.primaryColor = 'Cor principal é obrigatória';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    // Mark current step as completed
    if (!completedSteps?.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    // Move to next step
    const steps = ['business', 'contact', 'hours', 'branding'];
    const currentIndex = steps?.indexOf(currentStep);
    if (currentIndex < steps?.length - 1) {
      setCurrentStep(steps?.[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps = ['business', 'contact', 'hours', 'branding'];
    const currentIndex = steps?.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps?.[currentIndex - 1]);
    }
  };

  const handleStepClick = (stepId) => {
    setCurrentStep(stepId);
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      // Simulate API call to save draft
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message (you can implement a toast notification here)
      console.log('Rascunho salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!validateCurrentStep()) return;

    if (!isAuthenticated()) {
      navigate('/customer-registration-login', { state: { from: '/restaurant-registration-setup' } });
      return;
    }

    setLoading(true);
    try {
      if (!completedSteps?.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }

      const address = [
        formData.address, formData.number, formData.neighborhood,
        formData.city, formData.state,
      ].filter(Boolean).join(', ');

      await registrarRestaurante({
        name: formData.restaurantName,
        address: address || undefined,
        business_hours: formData.operatingHours,
      });

      localStorage.removeItem('restaurantSetupData');
      localStorage.removeItem('restaurantSetupStep');
      localStorage.removeItem('restaurantSetupCompleted');

      navigate('/restaurante');
    } catch (error) {
      console.error('Erro ao finalizar cadastro:', error);
      setErrors({ submit: error?.message || 'Erro ao finalizar cadastro. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentForm = () => {
    switch (currentStep) {
      case 'business':
        return (
          <BusinessInformationForm
            formData={formData}
            onInputChange={handleInputChange}
            errors={errors}
          />
        );
      case 'contact':
        return (
          <ContactDetailsForm
            formData={formData}
            onInputChange={handleInputChange}
            errors={errors}
          />
        );
      case 'hours':
        return (
          <OperatingHoursForm
            formData={formData}
            onInputChange={handleInputChange}
            errors={errors}
          />
        );
      case 'branding':
        return (
          <BrandingForm
            formData={formData}
            onInputChange={handleInputChange}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'business':
        return 'Informações do Negócio';
      case 'contact':
        return 'Contato e Endereço';
      case 'hours':
        return 'Horário de Funcionamento';
      case 'branding':
        return 'Identidade Visual';
      default:
        return '';
    }
  };

  const isLastStep = currentStep === 'branding';
  const isFirstStep = currentStep === 'business';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Store" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  DeliveryHub
                </h1>
                <p className="text-xs text-muted-foreground">
                  Configuração do Restaurante
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/customer-registration-login')}
                iconName="ArrowLeft"
                iconPosition="left"
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Progress Sidebar - Desktop */}
          <div className="hidden lg:block">
            <ProgressSidebar
              currentStep={currentStep}
              onStepClick={handleStepClick}
              completedSteps={completedSteps}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-lg border border-border">
              {/* Mobile Progress Header */}
              <div className="lg:hidden border-b border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    {getStepTitle()}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {completedSteps?.length + 1}/4
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((completedSteps?.length + 1) / 4) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 lg:p-8">
                {/* Desktop Header */}
                <div className="hidden lg:block mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    {getStepTitle()}
                  </h2>
                  <p className="text-muted-foreground">
                    Preencha as informações abaixo para configurar seu restaurante
                  </p>
                </div>

                {/* Form */}
                <div className="max-w-2xl">
                  {renderCurrentForm()}
                </div>

                {/* Error Message */}
                {errors?.submit && (
                  <div className="mt-6 p-4 bg-error/10 border border-error/20 rounded-lg">
                    <p className="text-sm text-error">{errors?.submit}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-border space-y-4 sm:space-y-0">
                  <div className="flex space-x-3">
                    {!isFirstStep && (
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        iconName="ArrowLeft"
                        iconPosition="left"
                      >
                        Anterior
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      onClick={handleSaveDraft}
                      loading={loading}
                      iconName="Save"
                      iconPosition="left"
                    >
                      Salvar Rascunho
                    </Button>
                  </div>

                  <div className="flex space-x-3">
                    {!isLastStep ? (
                      <Button
                        onClick={handleNext}
                        iconName="ArrowRight"
                        iconPosition="right"
                      >
                        Próximo
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCompleteSetup}
                        loading={loading}
                        iconName="Check"
                        iconPosition="left"
                        className="bg-success hover:bg-success/90"
                      >
                        Finalizar Cadastro
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantRegistrationSetup;