import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressSidebar = ({ 
  currentStep, 
  onStepClick, 
  completedSteps = [],
  className = '' 
}) => {
  const steps = [
    {
      id: 'business',
      title: 'Informações do Negócio',
      description: 'Nome, tipo de estabelecimento e dados básicos',
      icon: 'Store'
    },
    {
      id: 'contact',
      title: 'Contato e Endereço',
      description: 'WhatsApp, email e localização',
      icon: 'MapPin'
    },
    {
      id: 'hours',
      title: 'Horário de Funcionamento',
      description: 'Configure quando está aberto',
      icon: 'Clock'
    },
    {
      id: 'branding',
      title: 'Identidade Visual',
      description: 'Logo e cores da marca',
      icon: 'Palette'
    }
  ];

  const getStepStatus = (stepId) => {
    if (completedSteps?.includes(stepId)) return 'completed';
    if (currentStep === stepId) return 'current';
    return 'pending';
  };

  const getStepClasses = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-white';
      case 'current':
        return 'bg-primary text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">
          Progresso do Cadastro
        </h3>
        
        <div className="space-y-4">
          {steps?.map((step, index) => {
            const status = getStepStatus(step?.id);
            const isClickable = status === 'completed' || status === 'current';
            
            return (
              <div key={step?.id} className="relative">
                <button
                  onClick={() => isClickable && onStepClick(step?.id)}
                  disabled={!isClickable}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    isClickable 
                      ? 'hover:bg-muted cursor-pointer' :'cursor-not-allowed opacity-60'
                  } ${status === 'current' ? 'bg-primary/5 border border-primary/20' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${getStepClasses(status)}`}>
                      {status === 'completed' ? (
                        <Icon name="Check" size={16} />
                      ) : (
                        <Icon name={step?.icon} size={16} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm ${
                        status === 'current' ? 'text-primary' : 'text-foreground'
                      }`}>
                        {step?.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step?.description}
                      </p>
                    </div>
                  </div>
                </button>
                {index < steps?.length - 1 && (
                  <div className="absolute left-7 top-14 w-0.5 h-4 bg-border"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-foreground">
              {completedSteps?.length + (currentStep ? 1 : 0)}/{steps?.length}
            </span>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((completedSteps?.length + (currentStep ? 1 : 0)) / steps?.length) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-foreground text-sm mb-1">
              Dica
            </h4>
            <p className="text-xs text-muted-foreground">
              Você pode salvar seu progresso a qualquer momento e continuar depois. Todas as informações serão mantidas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressSidebar;