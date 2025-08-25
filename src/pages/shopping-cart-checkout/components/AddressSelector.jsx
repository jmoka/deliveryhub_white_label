import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const AddressSelector = ({ 
  selectedAddress, 
  onAddressChange, 
  addresses = [],
  onAddNewAddress,
  primaryColor = '#2563EB' 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    zipCode: '',
    reference: ''
  });

  const handleAddAddress = () => {
    if (newAddress?.street && newAddress?.number && newAddress?.neighborhood) {
      const addressData = {
        id: Date.now(),
        ...newAddress,
        fullAddress: `${newAddress?.street}, ${newAddress?.number}${newAddress?.complement ? `, ${newAddress?.complement}` : ''}, ${newAddress?.neighborhood}, ${newAddress?.city}`
      };
      
      onAddNewAddress(addressData);
      setShowAddForm(false);
      setNewAddress({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        zipCode: '',
        reference: ''
      });
    }
  };

  const handleInputChange = (field, value) => {
    setNewAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Endereço de Entrega</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          iconName="Plus"
          iconPosition="left"
        >
          Novo Endereço
        </Button>
      </div>
      {/* Saved Addresses */}
      {addresses?.length > 0 && (
        <div className="space-y-3">
          {addresses?.map((address) => (
            <button
              key={address?.id}
              onClick={() => onAddressChange(address)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedAddress?.id === address?.id
                  ? 'border-current bg-current/5' :'border-border hover:border-muted-foreground bg-card'
              }`}
              style={selectedAddress?.id === address?.id ? { 
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}10`
              } : {}}
            >
              <div className="flex items-start space-x-3">
                <div 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                    selectedAddress?.id === address?.id ? 'bg-current text-white' : 'bg-muted'
                  }`}
                  style={selectedAddress?.id === address?.id ? { backgroundColor: primaryColor } : {}}
                >
                  <Icon 
                    name={address?.type === 'home' ? 'Home' : address?.type === 'work' ? 'Building' : 'MapPin'} 
                    size={16} 
                    className={selectedAddress?.id === address?.id ? 'text-white' : 'text-foreground'}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-foreground capitalize">
                      {address?.type || 'Endereço'}
                    </h4>
                    {selectedAddress?.id === address?.id && (
                      <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Icon name="Check" size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {address?.fullAddress}
                  </p>
                  
                  {address?.reference && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Referência: {address?.reference}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {/* Add New Address Form */}
      {showAddForm && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-foreground">Novo Endereço</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CEP"
              type="text"
              placeholder="00000-000"
              value={newAddress?.zipCode}
              onChange={(e) => handleInputChange('zipCode', e?.target?.value)}
              className="md:col-span-1"
            />
            
            <Input
              label="Rua"
              type="text"
              placeholder="Nome da rua"
              value={newAddress?.street}
              onChange={(e) => handleInputChange('street', e?.target?.value)}
              required
            />
            
            <Input
              label="Número"
              type="text"
              placeholder="123"
              value={newAddress?.number}
              onChange={(e) => handleInputChange('number', e?.target?.value)}
              required
            />
            
            <Input
              label="Complemento"
              type="text"
              placeholder="Apto, bloco, etc."
              value={newAddress?.complement}
              onChange={(e) => handleInputChange('complement', e?.target?.value)}
            />
            
            <Input
              label="Bairro"
              type="text"
              placeholder="Nome do bairro"
              value={newAddress?.neighborhood}
              onChange={(e) => handleInputChange('neighborhood', e?.target?.value)}
              required
            />
            
            <Input
              label="Cidade"
              type="text"
              placeholder="Nome da cidade"
              value={newAddress?.city}
              onChange={(e) => handleInputChange('city', e?.target?.value)}
              required
            />
          </div>
          
          <Input
            label="Ponto de Referência"
            type="text"
            placeholder="Ex: Próximo ao mercado, portão azul..."
            value={newAddress?.reference}
            onChange={(e) => handleInputChange('reference', e?.target?.value)}
          />

          {/* Map Preview */}
          <div className="h-48 rounded-lg overflow-hidden bg-muted">
            <iframe
              width="100%"
              height="100%"
              loading="lazy"
              title="Localização do endereço"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=-23.5505,-46.6333&z=14&output=embed"
              className="border-0"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowAddForm(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleAddAddress}
              className="flex-1"
              style={{ backgroundColor: primaryColor }}
              disabled={!newAddress?.street || !newAddress?.number || !newAddress?.neighborhood}
            >
              Adicionar Endereço
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSelector;