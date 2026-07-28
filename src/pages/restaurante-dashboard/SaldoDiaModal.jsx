import React from 'react';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PL = { cash: 'Dinheiro', pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', taxa_cartao: '+ Taxa cartão' };

const Row = ({ label, value, bold, accent, sinal }) => (
  <div className={`flex justify-between text-sm py-1.5 border-b border-[#F4F4F5] last:border-0 ${bold ? 'font-bold' : ''}`}>
    <span className="text-[#71717A]">{label}</span>
    <span className={accent ? 'text-[#FF441F] font-bold' : 'text-[#18181B]'}>{sinal}{value}</span>
  </div>
);

// Detalhamento do "Saldo geral do dia" — mostra de onde vem cada centavo do valor
// exibido no KPI (todas as formas de pagamento + adições − sangrias), pra tirar
// a dúvida de "por que esse número é diferente da Espécie no caixa".
const SaldoDiaModal = ({ resumo, valorInicial, onFechar }) => {
  const r = resumo ?? {};
  const porPagamento = Object.entries(r.por_pagamento ?? {});

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onFechar}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#18181B]">Saldo Geral do Dia</h2>
            <p className="text-xs text-[#71717A] mt-0.5">Todas as vendas + adições − sangrias</p>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-[#F4F4F5] text-[#71717A]">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="bg-[#FAFAFA] rounded-xl px-4 py-3 mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Vendas por forma de pagamento</p>
          {porPagamento.length === 0
            ? <p className="text-xs text-[#71717A] text-center py-2">Nenhuma venda ainda.</p>
            : porPagamento.map(([k, v]) => <Row key={k} label={PL[k] ?? k} value={fmt(v)} />)}
          <div className="pt-1 mt-1 border-t border-[#E4E4E7]">
            <Row label="Total vendas" value={fmt(r.total_vendas)} bold />
          </div>
        </div>

        <div className="bg-[#FAFAFA] rounded-xl px-4 py-3 mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Composição do saldo</p>
          <Row label="Fundo inicial" value={fmt(valorInicial)} />
          <Row label="Total vendas" value={fmt(r.total_vendas)} sinal="+ " />
          <Row label="Adições" value={fmt(r.total_entradas)} sinal="+ " />
          <Row label="Sangrias / saídas" value={fmt(r.total_saidas)} sinal="− " />
          <div className="pt-1 mt-1 border-t border-[#E4E4E7]">
            <Row label="Saldo geral do dia" value={fmt(r.saldo)} bold accent />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-800">
            <Icon name="Info" size={13} className="inline mr-1 -mt-0.5" />
            Diferente da <strong>Espécie no caixa</strong>: esse saldo inclui vendas digitais (PIX/cartão), que nunca passam pela gaveta física.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SaldoDiaModal;
