import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ProfileSection = ({ 
  user, 
  onUpdateProfile, 
  primaryColor = '#2563EB' 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name,
    email: user?.email,
    phone: user?.phone
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name,
      email: user?.email,
      phone: user?.phone
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Informações Pessoais</h2>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            iconName="Edit"
            iconPosition="left"
            onClick={() => setIsEditing(true)}
          >
            Editar
          </Button>
        )}
      </div>
      <div className="flex items-start space-x-6">
        {/* Profile Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
            <Image
              src={user?.avatar}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs"
            iconName="Camera"
            iconPosition="left"
          >
            Alterar foto
          </Button>
        </div>

        {/* Profile Information */}
        <div className="flex-1 space-y-4">
          {isEditing ? (
            <>
              <Input
                label="Nome Completo"
                type="text"
                name="name"
                value={formData?.name}
                onChange={handleInputChange}
                placeholder="Digite seu nome completo"
                required
              />
              
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData?.email}
                onChange={handleInputChange}
                placeholder="Digite seu email"
                required
              />
              
              <Input
                label="WhatsApp"
                type="tel"
                name="phone"
                value={formData?.phone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                description="Usado para notificações de pedidos"
                required
              />

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="default"
                  loading={loading}
                  onClick={handleSave}
                  style={{ backgroundColor: primaryColor }}
                >
                  Salvar Alterações
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-foreground font-medium">{user?.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground">{user?.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                <div className="flex items-center space-x-2">
                  <p className="text-foreground">{user?.phone}</p>
                  {user?.whatsappVerified ? (
                    <div className="flex items-center space-x-1 text-success">
                      <Icon name="CheckCircle" size={16} />
                      <span className="text-xs">Verificado</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-warning">
                      <Icon name="AlertCircle" size={16} />
                      <span className="text-xs">Não verificado</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Membro desde</label>
                <p className="text-foreground">{user?.memberSince}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;