import React from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const PlanSelectionForm = ({
  formData,
  onInputChange,
  errors,
  planos,
  loadingPlanos,
  onSelectPlano,
  onConfirmar,
  confirmando,
}) => {
  return (
    <div className="space-y-6">
      <Input
        label="Nome do estabelecimento"
        type="text"
        name="restaurantName"
        placeholder="Ex: Pizzaria do João"
        value={formData?.restaurantName}
        onChange={onInputChange}
        error={errors?.restaurantName}
        required
      />

      <div>
        <p className="text-sm font-medium text-foreground mb-1">
          Escolha o plano da sua loja <span className="text-error">*</span>
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          Você pode trocar de plano depois, a qualquer momento.
        </p>

        {loadingPlanos ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !planos?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum plano disponível no momento. Tente novamente mais tarde.</p>
        ) : (
          <div className="space-y-3">
            {planos.map((p) => {
              const selecionado = String(p.id) === String(formData?.planoId);
              const temTrial = (p.trial_dias ?? 0) > 0;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => onSelectPlano(p.id)}
                  className={`w-full text-left border rounded-xl p-4 transition-colors ${
                    selecionado ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      {p.nome}
                      {selecionado && <Icon name="CheckCircle2" size={16} className="text-primary" />}
                    </h4>
                    <span className="text-sm font-semibold text-foreground">{fmt(p.valor)} / {p.periodicidade}</span>
                  </div>
                  {temTrial && (
                    <p className="text-xs font-medium text-success mb-2">{p.trial_dias} dias grátis pra testar</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {p.inclui_delivery && <span className="text-xs font-medium bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">Delivery</span>}
                    {p.inclui_salao && <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Salão</span>}
                    <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {p.limite_produtos != null ? `Até ${p.limite_produtos} produtos` : 'Produtos ilimitados'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {errors?.planoId && <p className="text-sm text-error mt-2">{errors.planoId}</p>}
      </div>

      <Button onClick={onConfirmar} loading={confirmando} iconName="ArrowRight" iconPosition="right" fullWidth>
        Continuar
      </Button>
    </div>
  );
};

export default PlanSelectionForm;
