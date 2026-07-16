import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import { buscarCep } from '../../../utils/viaCep';

const ContactDetailsForm = ({
  formData,
  onInputChange,
  errors = {},
  className = ''
}) => {
  const [buscandoCep, setBuscandoCep] = useState(false);
  const formatPhone = (value) => {
    const numbers = value?.replace(/\D/g, '');
    if (numbers?.length <= 11) {
      return numbers?.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const formatCEP = (value) => {
    const numbers = value?.replace(/\D/g, '');
    if (numbers?.length <= 8) {
      return numbers?.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e?.target?.value);
    onInputChange({ target: { name: e?.target?.name, value: formatted } });
  };

  const handleCEPChange = async (e) => {
    const formatted = formatCEP(e?.target?.value);
    onInputChange({ target: { name: e?.target?.name, value: formatted } });

    const digitos = formatted?.replace(/\D/g, '') ?? '';
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    const endereco = await buscarCep(digitos);
    setBuscandoCep(false);
    if (!endereco) return;
    onInputChange({ target: { name: 'address', value: endereco.logradouro } });
    onInputChange({ target: { name: 'neighborhood', value: endereco.bairro } });
    onInputChange({ target: { name: 'city', value: endereco.cidade } });
    onInputChange({ target: { name: 'state', value: endereco.estado } });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Informações de Contato
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure os dados de contato e endereço do seu estabelecimento
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="WhatsApp"
          type="tel"
          name="whatsapp"
          value={formData?.whatsapp || ''}
          onChange={handlePhoneChange}
          placeholder="(11) 99999-9999"
          error={errors?.whatsapp}
          required
          description="Número para receber pedidos e notificações"
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData?.email || ''}
          onChange={onInputChange}
          placeholder="contato@seuestabelecimento.com"
          error={errors?.email}
          required
          description="Email principal do estabelecimento"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          label="CEP"
          type="text"
          name="cep"
          value={formData?.cep || ''}
          onChange={handleCEPChange}
          placeholder="00000-000"
          error={errors?.cep}
          required
          maxLength={9}
          description={buscandoCep ? 'Buscando endereço...' : 'Preenche endereço, bairro, cidade e estado automaticamente'}
        />

        <div className="md:col-span-2">
          <Input
            label="Endereço"
            type="text"
            name="address"
            value={formData?.address || ''}
            onChange={onInputChange}
            placeholder="Rua, Avenida..."
            error={errors?.address}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          label="Número"
          type="text"
          name="number"
          value={formData?.number || ''}
          onChange={onInputChange}
          placeholder="123"
          error={errors?.number}
          required
        />

        <Input
          label="Complemento"
          type="text"
          name="complement"
          value={formData?.complement || ''}
          onChange={onInputChange}
          placeholder="Apto, Sala..."
          error={errors?.complement}
        />

        <Input
          label="Bairro"
          type="text"
          name="neighborhood"
          value={formData?.neighborhood || ''}
          onChange={onInputChange}
          placeholder="Centro"
          error={errors?.neighborhood}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Cidade"
          type="text"
          name="city"
          value={formData?.city || ''}
          onChange={onInputChange}
          placeholder="São Paulo"
          error={errors?.city}
          required
        />

        <Input
          label="Estado"
          type="text"
          name="state"
          value={formData?.state || ''}
          onChange={onInputChange}
          placeholder="SP"
          error={errors?.state}
          required
          maxLength={2}
        />
      </div>
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium text-foreground mb-2 flex items-center">
          <span className="w-2 h-2 bg-success rounded-full mr-2"></span>
          Integração WhatsApp
        </h4>
        <p className="text-sm text-muted-foreground">
          Seu número WhatsApp será usado para receber notificações de pedidos e permitir comunicação direta com os clientes através da plataforma.
        </p>
      </div>
    </div>
  );
};

export default ContactDetailsForm;