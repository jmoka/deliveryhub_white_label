import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const AccountSettings = ({ 
  onDeleteAccount, 
  onExportData, 
  onLogout,
  primaryColor = '#2563EB' 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'EXCLUIR') {
      return;
    }

    setLoading(true);
    try {
      await onDeleteAccount();
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      await onExportData();
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const settingsOptions = [
    {
      icon: 'Download',
      title: 'Exportar Dados',
      description: 'Baixe uma cópia de todos os seus dados pessoais e histórico de pedidos',
      action: 'export',
      variant: 'outline'
    },
    {
      icon: 'Shield',
      title: 'Privacidade e Segurança',
      description: 'Gerencie suas configurações de privacidade e segurança da conta',
      action: 'privacy',
      variant: 'outline'
    },
    {
      icon: 'HelpCircle',
      title: 'Central de Ajuda',
      description: 'Encontre respostas para perguntas frequentes e entre em contato conosco',
      action: 'help',
      variant: 'outline'
    },
    {
      icon: 'MessageCircle',
      title: 'Suporte via WhatsApp',
      description: 'Fale diretamente com nossa equipe de suporte pelo WhatsApp',
      action: 'whatsapp',
      variant: 'outline'
    },
    {
      icon: 'LogOut',
      title: 'Sair da Conta',
      description: 'Fazer logout e retornar à tela de login',
      action: 'logout',
      variant: 'outline'
    },
    {
      icon: 'Trash2',
      title: 'Excluir Conta',
      description: 'Remover permanentemente sua conta e todos os dados associados',
      action: 'delete',
      variant: 'destructive'
    }
  ];

  const handleAction = (action) => {
    switch (action) {
      case 'export':
        handleExportData();
        break;
      case 'privacy':
        // Navigate to privacy settings
        break;
      case 'help':
        // Navigate to help center
        break;
      case 'whatsapp':
        window.open('https://wa.me/5511999999999', '_blank');
        break;
      case 'logout':
        onLogout();
        break;
      case 'delete':
        setShowDeleteConfirm(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Settings */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Settings" size={20} style={{ color: primaryColor }} />
          <h2 className="text-xl font-semibold text-foreground">Configurações da Conta</h2>
        </div>

        <div className="space-y-4">
          {settingsOptions?.map((option, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-all duration-200 hover:border-primary/50 ${
                option?.variant === 'destructive' ?'border-error/20 hover:border-error/50' :'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      option?.variant === 'destructive' ?'bg-error/10' :'bg-primary/10'
                    }`}
                  >
                    <Icon 
                      name={option?.icon} 
                      size={20} 
                      className={option?.variant === 'destructive' ? 'text-error' : ''}
                      style={option?.variant !== 'destructive' ? { color: primaryColor } : {}}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      option?.variant === 'destructive' ? 'text-error' : 'text-foreground'
                    }`}>
                      {option?.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option?.description}
                    </p>
                  </div>
                </div>

                <Button
                  variant={option?.variant}
                  size="sm"
                  onClick={() => handleAction(option?.action)}
                  loading={loading && (option?.action === 'export')}
                  iconName="ChevronRight"
                  iconPosition="right"
                  style={option?.variant === 'outline' && option?.action !== 'delete' ? { 
                    borderColor: primaryColor, 
                    color: primaryColor 
                  } : {}}
                >
                  {option?.action === 'export' && loading ? 'Exportando...' : 'Acessar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* App Information */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Info" size={20} style={{ color: primaryColor }} />
          <h2 className="text-xl font-semibold text-foreground">Informações do App</h2>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Versão do App:</span>
            <span className="font-medium">2.1.0</span>
          </div>
          <div className="flex justify-between">
            <span>Última atualização:</span>
            <span className="font-medium">15/08/2025</span>
          </div>
          <div className="flex justify-between">
            <span>Termos de Uso:</span>
            <button className="font-medium hover:underline" style={{ color: primaryColor }}>
              Ver termos
            </button>
          </div>
          <div className="flex justify-between">
            <span>Política de Privacidade:</span>
            <button className="font-medium hover:underline" style={{ color: primaryColor }}>
              Ver política
            </button>
          </div>
        </div>
      </div>
      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
          <div className="w-full max-w-md bg-card rounded-lg shadow-lg animate-slide-up elevation-3">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                  <Icon name="AlertTriangle" size={24} className="text-error" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Excluir Conta</h3>
                  <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Ao excluir sua conta, todos os seus dados serão permanentemente removidos, incluindo:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• Histórico de pedidos</li>
                  <li>• Endereços salvos</li>
                  <li>• Métodos de pagamento</li>
                  <li>• Preferências e configurações</li>
                </ul>
                <p className="text-sm text-muted-foreground mb-4">
                  Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo:
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e?.target?.value)}
                  placeholder="Digite EXCLUIR"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  loading={loading}
                  disabled={deleteConfirmation !== 'EXCLUIR'}
                  className="flex-1"
                >
                  Excluir Conta
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;