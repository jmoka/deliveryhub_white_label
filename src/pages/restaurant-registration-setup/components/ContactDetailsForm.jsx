import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import MapaLocalizacaoPicker from '../../../components/MapaLocalizacaoPicker';
import { buscarCep } from '../../../utils/viaCep';
import { reverseGeocode, geocodeEndereco } from '../../../utils/reverseGeocode';

const ContactDetailsForm = ({
  formData,
  onInputChange,
  onPinChange = () => {},
  errors = {},
  className = ''
}) => {
  const [buscandoCep, setBuscandoCep] = useState(false);
  // Trava em 11 dígitos (DDD + 9 número) — sem o slice, colar um número maior
  // (ou continuar digitando depois do limite) deixava o regex sem match e o
  // valor cru (sem máscara, potencialmente com 1 dígito sobrando) passava reto.
  const formatPhone = (value) => {
    const numbers = value?.replace(/\D/g, '')?.slice(0, 11) ?? '';
    if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
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

  // Pino é a fonte de verdade: ajustá-lo (busca de CEP, GPS ou arrastar no mapa)
  // atualiza o texto do endereço — mesmo padrão já usado em customer-profile e
  // restaurante-config (EnderecoCard).
  const handlePinChange = (lat, lng) => {
    onPinChange(lat, lng);
    reverseGeocode(lat, lng).then((dados) => {
      if (!dados) return;
      onInputChange({ target: { name: 'address', value: dados.logradouro || formData?.address || '' } });
      onInputChange({ target: { name: 'neighborhood', value: dados.bairro || formData?.neighborhood || '' } });
      onInputChange({ target: { name: 'city', value: dados.cidade || formData?.city || '' } });
      onInputChange({ target: { name: 'state', value: dados.estado || formData?.state || '' } });
      if (dados.cep) onInputChange({ target: { name: 'cep', value: formatCEP(dados.cep) } });
    });
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

    // CEP resolveu um endereço — sugere o pino automaticamente (o dono ainda
    // precisa confirmar/ajustar arrastando, mas já não parte do zero no mapa).
    const coords = await geocodeEndereco({
      logradouro: endereco.logradouro, numero: formData?.number,
      bairro: endereco.bairro, cidade: endereco.cidade, estado: endereco.estado, cep: formatted,
    });
    if (coords) onPinChange(coords.lat, coords.lng);
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
          label={
            <span className="inline-flex items-center gap-1.5">
              <Icon name="Send" size={14} />
              Telefone de contato
            </span>
          }
          type="tel"
          name="whatsapp"
          value={formData?.whatsapp || ''}
          onChange={handlePhoneChange}
          placeholder="(11) 99999-9999"
          error={errors?.whatsapp}
          required
          description="Depois do cadastro você vai poder conectar esse número ao Telegram pra receber os pedidos por lá"
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
      <div>
        <h4 className="font-medium text-foreground mb-1 flex items-center gap-2">
          <Icon name="MapPin" size={16} />
          Localização exata no mapa
          {errors?.pino && <span className="text-xs font-normal text-destructive">*</span>}
        </h4>
        <p className="text-sm text-muted-foreground mb-3">
          O endereço acima é convertido em coordenadas automaticamente, mas pode errar algumas
          centenas de metros. Ajuste o pino pra garantir que o motoboy encontre o lugar certo —
          só o endereço escrito não garante a entrega no endereço certo.
        </p>
        <MapaLocalizacaoPicker lat={formData?.lat} lng={formData?.lng} onChange={handlePinChange} />
        {errors?.pino && (
          <p className="text-sm text-destructive mt-2 flex items-center gap-1">
            <Icon name="AlertTriangle" size={14} /> {errors.pino}
          </p>
        )}
      </div>
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium text-foreground mb-2 flex items-center">
          <span className="w-2 h-2 bg-success rounded-full mr-2"></span>
          Integração Telegram
        </h4>
        <p className="text-sm text-muted-foreground">
          Depois de finalizar o cadastro, você vai poder conectar o Telegram do seu
          estabelecimento pra receber notificações de pedidos e se comunicar com os clientes
          através da plataforma.
        </p>
      </div>
    </div>
  );
};

export default ContactDetailsForm;