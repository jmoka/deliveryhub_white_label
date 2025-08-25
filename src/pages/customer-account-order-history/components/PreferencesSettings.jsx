import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';


const PreferencesSettings = ({ 
  preferences, 
  onUpdatePreferences,
  primaryColor = '#2563EB' 
}) => {
  const [formData, setFormData] = useState({
    notifications: {
      whatsapp: preferences?.notifications?.whatsapp || true,
      email: preferences?.notifications?.email || true,
      promotional: preferences?.notifications?.promotional || false,
      orderUpdates: preferences?.notifications?.orderUpdates || true
    },
    dietary: {
      vegetarian: preferences?.dietary?.vegetarian || false,
      vegan: preferences?.dietary?.vegan || false,
      glutenFree: preferences?.dietary?.glutenFree || false,
      lactoseFree: preferences?.dietary?.lactoseFree || false,
      diabetic: preferences?.dietary?.diabetic || false
    },
    favorites: preferences?.favorites || [],
    language: preferences?.language || 'pt-BR',
    currency: preferences?.currency || 'BRL'
  });
  const [loading, setLoading] = useState(false);

  const handleNotificationChange = (key, checked) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev?.notifications,
        [key]: checked
      }
    }));
  };

  const handleDietaryChange = (key, checked) => {
    setFormData(prev => ({
      ...prev,
      dietary: {
        ...prev?.dietary,
        [key]: checked
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdatePreferences(formData);
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const favoriteRestaurants = [
    {
      id: 1,
      name: "Pizzaria Bella Vista",
      logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop&crop=center",
      cuisine: "Italiana"
    },
    {
      id: 2,
      name: "Burger House",
      logo: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop&crop=center",
      cuisine: "Hambúrgueres"
    },
    {
      id: 3,
      name: "Sushi Zen",
      logo: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=100&h=100&fit=crop&crop=center",
      cuisine: "Japonesa"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Bell" size={20} style={{ color: primaryColor }} />
          <h2 className="text-xl font-semibold text-foreground">Notificações</h2>
        </div>

        <div className="space-y-4">
          <Checkbox
            label="Notificações via WhatsApp"
            description="Receber atualizações de pedidos pelo WhatsApp"
            checked={formData?.notifications?.whatsapp}
            onChange={(e) => handleNotificationChange('whatsapp', e?.target?.checked)}
          />
          
          <Checkbox
            label="Notificações por Email"
            description="Receber confirmações e atualizações por email"
            checked={formData?.notifications?.email}
            onChange={(e) => handleNotificationChange('email', e?.target?.checked)}
          />
          
          <Checkbox
            label="Atualizações de Pedidos"
            description="Notificações sobre status do pedido (preparando, saiu para entrega, etc.)"
            checked={formData?.notifications?.orderUpdates}
            onChange={(e) => handleNotificationChange('orderUpdates', e?.target?.checked)}
          />
          
          <Checkbox
            label="Ofertas Promocionais"
            description="Receber cupons de desconto e ofertas especiais"
            checked={formData?.notifications?.promotional}
            onChange={(e) => handleNotificationChange('promotional', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Dietary Restrictions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Utensils" size={20} style={{ color: primaryColor }} />
          <h2 className="text-xl font-semibold text-foreground">Restrições Alimentares</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label="Vegetariano"
            description="Não consome carne"
            checked={formData?.dietary?.vegetarian}
            onChange={(e) => handleDietaryChange('vegetarian', e?.target?.checked)}
          />
          
          <Checkbox
            label="Vegano"
            description="Não consome produtos de origem animal"
            checked={formData?.dietary?.vegan}
            onChange={(e) => handleDietaryChange('vegan', e?.target?.checked)}
          />
          
          <Checkbox
            label="Sem Glúten"
            description="Intolerância ao glúten"
            checked={formData?.dietary?.glutenFree}
            onChange={(e) => handleDietaryChange('glutenFree', e?.target?.checked)}
          />
          
          <Checkbox
            label="Sem Lactose"
            description="Intolerância à lactose"
            checked={formData?.dietary?.lactoseFree}
            onChange={(e) => handleDietaryChange('lactoseFree', e?.target?.checked)}
          />
          
          <Checkbox
            label="Diabético"
            description="Restrições para diabetes"
            checked={formData?.dietary?.diabetic}
            onChange={(e) => handleDietaryChange('diabetic', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Favorite Restaurants */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Heart" size={20} style={{ color: primaryColor }} />
          <h2 className="text-xl font-semibold text-foreground">Restaurantes Favoritos</h2>
        </div>

        <div className="space-y-3">
          {favoriteRestaurants?.map((restaurant) => (
            <div
              key={restaurant?.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={restaurant?.logo}
                    alt={restaurant?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/assets/images/no_image.png';
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{restaurant?.name}</h3>
                  <p className="text-sm text-muted-foreground">{restaurant?.cuisine}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                iconName="Heart"
                className="text-error hover:text-error"
              />
            </div>
          ))}
        </div>
      </div>
      {/* Language & Region */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Globe" size={20} style={{ color: primaryColor }} />
          <h2 className="text-xl font-semibold text-foreground">Idioma e Região</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Idioma</label>
            <select
              value={formData?.language}
              onChange={(e) => setFormData(prev => ({ ...prev, language: e?.target?.value }))}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Moeda</label>
            <select
              value={formData?.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e?.target?.value }))}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="BRL">Real Brasileiro (R$)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>
      </div>
      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="default"
          loading={loading}
          onClick={handleSave}
          iconName="Save"
          iconPosition="left"
          style={{ backgroundColor: primaryColor }}
        >
          Salvar Preferências
        </Button>
      </div>
    </div>
  );
};

export default PreferencesSettings;