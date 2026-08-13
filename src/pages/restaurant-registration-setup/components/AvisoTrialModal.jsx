import React from 'react';
import Icon from '../../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const PERIODICIDADE_LABEL = { mensal: 'mês', trimestral: 'trimestre', anual: 'ano' };

// Mostrado depois que a loja e a assinatura já foram criadas (sem cobrança
// nenhuma, plano com trial) e antes de avançar pro resto da wizard — o
// usuário precisa saber que, passado o período grátis, a cobrança começa
// automaticamente, sem ficar sabendo só quando a fatura chegar.
const AvisoTrialModal = ({ plano, onClose, onContinuar }) => {
  const periodo = PERIODICIDADE_LABEL[plano.periodicidade] ?? plano.periodicidade;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <Icon name="Gift" size={22} className="text-success" />
        </div>

        <h3 className="text-lg font-bold text-foreground mb-1.5">
          {plano.trial_dias} dias grátis pra testar
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sua loja já está criada com o <span className="font-semibold text-foreground">{plano.nome}</span> e você não paga nada agora.
        </p>

        <div className="bg-muted/50 border border-border rounded-xl p-4 mb-5">
          <p className="text-sm text-foreground">
            Depois dos <span className="font-semibold">{plano.trial_dias} dias</span>, a cobrança de{' '}
            <span className="font-semibold">{fmt(plano.valor)} por {periodo}</span> começa automaticamente,
            sem precisar fazer nada.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Você pode trocar de plano ou cancelar a qualquer momento antes disso, direto no painel da sua loja.
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-xl text-sm text-foreground hover:bg-muted/50">
            Voltar
          </button>
          <button type="button" onClick={onContinuar}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90">
            Entendi, continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvisoTrialModal;
