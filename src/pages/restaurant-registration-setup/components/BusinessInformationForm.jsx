import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const BusinessInformationForm = ({
  formData,
  onInputChange,
  errors = {},
  tiposEstabelecimento = [],
  className = ''
}) => {
  const tipoOptions = tiposEstabelecimento.map((t) => ({ value: String(t.id), label: t.name }));
  const tipoSelecionado = tiposEstabelecimento.find((t) => String(t.id) === String(formData?.establishmentTypeId));
  const isRestaurante = !tipoSelecionado || tipoSelecionado.name === 'Restaurante';

  const cuisineOptions = [
    { value: 'brasileira', label: 'Brasileira' },
    { value: 'italiana', label: 'Italiana' },
    { value: 'japonesa', label: 'Japonesa' },
    { value: 'chinesa', label: 'Chinesa' },
    { value: 'mexicana', label: 'Mexicana' },
    { value: 'arabe', label: 'Árabe' },
    { value: 'pizza', label: 'Pizza' },
    { value: 'hamburguer', label: 'Hambúrguer' },
    { value: 'lanches', label: 'Lanches' },
    { value: 'saudavel', label: 'Saudável' },
    { value: 'vegetariana', label: 'Vegetariana' },
    { value: 'vegana', label: 'Vegana' },
    { value: 'doces', label: 'Doces & Sobremesas' },
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'acai', label: 'Açaí' },
    { value: 'marmitex', label: 'Marmitex' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Informações do Negócio
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure as informações básicas do seu estabelecimento
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Select
            label="Tipo de Estabelecimento"
            name="establishmentTypeId"
            options={tipoOptions}
            value={formData?.establishmentTypeId || ''}
            onChange={(value) => onInputChange({ target: { name: 'establishmentTypeId', value } })}
            placeholder="Selecione o tipo de estabelecimento"
            error={errors?.establishmentTypeId}
            required
            description="Restaurante, farmácia, material de construção..."
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Nome do Estabelecimento"
            type="text"
            name="restaurantName"
            value={formData?.restaurantName || ''}
            onChange={onInputChange}
            placeholder="Ex: Pizzaria do João"
            error={errors?.restaurantName}
            required
            description="Este será o nome exibido para seus clientes"
          />
        </div>

        {isRestaurante && (
          <Select
            label="Tipo de Cozinha"
            name="cuisineType"
            options={cuisineOptions}
            value={formData?.cuisineType || ''}
            onChange={(value) => onInputChange({ target: { name: 'cuisineType', value } })}
            placeholder="Selecione o tipo de cozinha"
            error={errors?.cuisineType}
            required
            searchable
            description="Categoria principal do seu restaurante"
          />
        )}

        <Input
          label="CNPJ"
          type="text"
          name="cnpj"
          value={formData?.cnpj || ''}
          onChange={onInputChange}
          placeholder="00.000.000/0000-00"
          error={errors?.cnpj}
          description="Opcional - para emissão de notas fiscais"
        />
      </div>
      <div>
        <Input
          label="Descrição do Estabelecimento"
          type="textarea"
          name="description"
          value={formData?.description || ''}
          onChange={onInputChange}
          placeholder="Descreva seu estabelecimento, especialidades e diferenciais..."
          error={errors?.description}
          rows={4}
          description="Uma boa descrição ajuda a atrair mais clientes"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Taxa de Entrega (R$)"
          type="number"
          name="deliveryFee"
          value={formData?.deliveryFee || ''}
          onChange={onInputChange}
          placeholder="5.00"
          error={errors?.deliveryFee}
          min="0"
          step="0.01"
          description="Taxa padrão de entrega"
        />

        <Input
          label="Tempo de Entrega (minutos)"
          type="number"
          name="deliveryTime"
          value={formData?.deliveryTime || ''}
          onChange={onInputChange}
          placeholder="30"
          error={errors?.deliveryTime}
          min="10"
          max="120"
          description="Tempo médio de entrega"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Pedido Mínimo (R$)"
          type="number"
          name="minimumOrder"
          value={formData?.minimumOrder || ''}
          onChange={onInputChange}
          placeholder="20.00"
          error={errors?.minimumOrder}
          min="0"
          step="0.01"
          description="Valor mínimo para pedidos"
        />

        <Input
          label="Raio de Entrega (km)"
          type="number"
          name="deliveryRadius"
          value={formData?.deliveryRadius || ''}
          onChange={onInputChange}
          placeholder="5"
          error={errors?.deliveryRadius}
          min="1"
          max="50"
          description="Área de cobertura das entregas"
        />
      </div>
    </div>
  );
};

export default BusinessInformationForm;