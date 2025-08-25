import React, { useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const AddressBook = ({ 
  addresses, 
  onAddAddress, 
  onEditAddress, 
  onDeleteAddress, 
  onSetPrimary,
  primaryColor = '#2563EB' 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    reference: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      if (editingId) {
        await onEditAddress(editingId, formData);
        setEditingId(null);
      } else {
        await onAddAddress(formData);
        setShowAddForm(false);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      reference: ''
    });
  };

  const handleEdit = (address) => {
    setFormData(address);
    setEditingId(address?.id);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    resetForm();
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Endereços Salvos</h2>
        {!showAddForm && (
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setShowAddForm(true)}
          >
            Adicionar
          </Button>
        )}
      </div>
      {/* Address List */}
      <div className="space-y-4 mb-6">
        {addresses?.map((address) => (
          <div
            key={address?.id}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              address?.isPrimary 
                ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-medium text-foreground">{address?.label}</h3>
                  {address?.isPrimary && (
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {address?.street}, {address?.number}
                  {address?.complement && `, ${address?.complement}`}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {address?.neighborhood}, {address?.city} - {address?.state}
                </p>
                <p className="text-sm text-muted-foreground">
                  CEP: {address?.zipCode}
                </p>
                {address?.reference && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Referência: {address?.reference}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {!address?.isPrimary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetPrimary(address?.id)}
                    className="text-xs"
                  >
                    Definir como principal
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Edit"
                  onClick={() => handleEdit(address)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Trash2"
                  onClick={() => onDeleteAddress(address?.id)}
                  className="text-error hover:text-error"
                />
              </div>
            </div>

            {/* Map Preview */}
            <div className="mt-3 h-32 rounded-lg overflow-hidden bg-muted">
              <iframe
                width="100%"
                height="100%"
                loading="lazy"
                title={address?.label}
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${address?.lat},${address?.lng}&z=16&output=embed`}
                className="border-0"
              />
            </div>
          </div>
        ))}
      </div>
      {/* Add/Edit Address Form */}
      {showAddForm && (
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {editingId ? 'Editar Endereço' : 'Adicionar Novo Endereço'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome do Endereço"
              type="text"
              name="label"
              value={formData?.label}
              onChange={handleInputChange}
              placeholder="Ex: Casa, Trabalho, Apartamento"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Rua/Avenida"
                  type="text"
                  name="street"
                  value={formData?.street}
                  onChange={handleInputChange}
                  placeholder="Nome da rua"
                  required
                />
              </div>
              <Input
                label="Número"
                type="text"
                name="number"
                value={formData?.number}
                onChange={handleInputChange}
                placeholder="123"
                required
              />
            </div>

            <Input
              label="Complemento"
              type="text"
              name="complement"
              value={formData?.complement}
              onChange={handleInputChange}
              placeholder="Apto, Bloco, etc. (opcional)"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Bairro"
                type="text"
                name="neighborhood"
                value={formData?.neighborhood}
                onChange={handleInputChange}
                placeholder="Nome do bairro"
                required
              />
              <Input
                label="CEP"
                type="text"
                name="zipCode"
                value={formData?.zipCode}
                onChange={handleInputChange}
                placeholder="00000-000"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Cidade"
                type="text"
                name="city"
                value={formData?.city}
                onChange={handleInputChange}
                placeholder="Nome da cidade"
                required
              />
              <Input
                label="Estado"
                type="text"
                name="state"
                value={formData?.state}
                onChange={handleInputChange}
                placeholder="SP"
                required
              />
            </div>

            <Input
              label="Ponto de Referência"
              type="text"
              name="reference"
              value={formData?.reference}
              onChange={handleInputChange}
              placeholder="Próximo ao mercado, em frente à escola... (opcional)"
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                variant="default"
                style={{ backgroundColor: primaryColor }}
              >
                {editingId ? 'Salvar Alterações' : 'Adicionar Endereço'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddressBook;