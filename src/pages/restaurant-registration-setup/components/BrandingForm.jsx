import React, { useState, useRef } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';

const BrandingForm = ({ 
  formData, 
  onInputChange, 
  errors = {},
  className = '' 
}) => {
  const [logoPreview, setLogoPreview] = useState(formData?.logo || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const predefinedColors = [
    '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED',
    '#DB2777', '#0891B2', '#65A30D', '#DC2626', '#9333EA',
    '#C2410C', '#BE123C', '#0369A1', '#047857', '#A16207'
  ];

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file?.type?.startsWith('image/')) {
      return;
    }

    // Validate file size (max 5MB)
    if (file?.size > 5 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e?.target?.result;
      setLogoPreview(imageUrl);
      onInputChange({ 
        target: { 
          name: 'logo', 
          value: imageUrl 
        } 
      });
    };
    reader?.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragging(false);
    
    const files = e?.dataTransfer?.files;
    if (files?.length > 0) {
      handleFileSelect(files?.[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    onInputChange({ 
      target: { 
        name: 'logo', 
        value: null 
      } 
    });
    if (fileInputRef?.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleColorSelect = (color) => {
    onInputChange({ 
      target: { 
        name: 'primaryColor', 
        value: color 
      } 
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Identidade Visual
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure a marca e cores do seu restaurante
        </p>
      </div>
      {/* Logo Upload */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Logo do Restaurante
        </label>
        
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
            isDragging 
              ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {logoPreview ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute top-2 right-2 p-1 bg-error text-white rounded-full hover:bg-error/80 transition-colors duration-200"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef?.current?.click()}
                iconName="Upload"
                iconPosition="left"
              >
                Alterar Logo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <Icon name="Upload" size={24} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Arraste uma imagem ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG até 5MB • Recomendado: 400x400px
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef?.current?.click()}
                iconName="Upload"
                iconPosition="left"
              >
                Selecionar Arquivo
              </Button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {errors?.logo && (
          <p className="text-sm text-error">{errors?.logo}</p>
        )}
      </div>
      {/* Primary Color Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Cor Principal
        </label>
        <p className="text-xs text-muted-foreground">
          Esta cor será usada em botões, links e elementos de destaque
        </p>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {predefinedColors?.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSelect(color)}
              className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                formData?.primaryColor === color 
                  ? 'border-foreground shadow-lg' 
                  : 'border-border hover:border-muted-foreground'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            >
              {formData?.primaryColor === color && (
                <Icon name="Check" size={20} className="text-white mx-auto" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <Input
            type="color"
            value={formData?.primaryColor || '#2563EB'}
            onChange={(e) => handleColorSelect(e?.target?.value)}
            className="w-16 h-12 p-1 border border-border rounded-lg cursor-pointer"
          />
          <div className="flex-1">
            <Input
              label="Cor Personalizada"
              type="text"
              value={formData?.primaryColor || '#2563EB'}
              onChange={(e) => handleColorSelect(e?.target?.value)}
              placeholder="#2563EB"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>

        {errors?.primaryColor && (
          <p className="text-sm text-error">{errors?.primaryColor}</p>
        )}
      </div>
      {/* Preview */}
      <div className="bg-muted/50 p-6 rounded-lg">
        <h4 className="font-medium text-foreground mb-4">Prévia da Marca</h4>
        <div className="flex items-center space-x-4 p-4 bg-card rounded-lg border border-border">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Logo preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Icon name="Store" size={20} className="text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-foreground">
              {formData?.restaurantName || 'Nome do Restaurante'}
            </h5>
            <p className="text-sm text-muted-foreground">
              {formData?.cuisineType || 'Tipo de Cozinha'}
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            style={{ backgroundColor: formData?.primaryColor || '#2563EB' }}
          >
            Ver Cardápio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BrandingForm;