import React from 'react';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR') : '-';

const Row = ({ label, value, bold, accent }) => (
  <div className={`flex justify-between text-sm py-1.5 border-b border-[#F4F4F5] last:border-0 ${bold ? 'font-bold' : ''}`}>
    <span className="text-[#71717A]">{label}</span>
    <span className={accent ? 'text-[#FF441F] font-bold' : 'text-[#18181B]'}>{value}</span>
  </div>
);

const FecharCaixaModal = ({ resumo, aberto_em, onConfirmar, onCancelar, fechando }) => {
  const r = resumo ?? {};
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-4">
          <p className="text-2xl mb-1">🏁</p>
          <h2 className="text-base font-bold text-[#18181B]">Fechar Caixa</h2>
          <p className="text-xs text-[#71717A] mt-0.5">Resumo da sessão</p>
        </div>

        <div className="bg-[#FAFAFA] rounded-xl p-4 mb-4">
          <Row label="Aberto em" value={fmtDate(aberto_em)} />
          <Row label="Fechado em" value={fmtDate(new Date().toISOString())} />
          <div className="my-1" />
          <Row label="Total de pedidos" value={r.total_pedidos ?? 0} />
          <Row label="Entregues" value={r.entregues ?? 0} />
          <Row label="Em andamento" value={r.em_andamento ?? 0} />
          <Row label="Cancelados" value={r.cancelados ?? 0} />
          <div className="my-1" />
          <Row label="Valor inicial" value={fmt(r.valor_inicial)} />
          <Row label="Vendas (entregues)" value={fmt(r.total_vendas)} />
          <Row label="Saídas" value={`- ${fmt(r.total_saidas)}`} />
          <div className="my-1 border-t border-[#E4E4E7]" />
          <Row label="Saldo final" value={fmt(r.saldo)} bold accent />
        </div>

        <p className="text-xs text-[#71717A] mb-4 text-center">
          Pedidos em andamento continuarão. Histórico salvo automaticamente.
        </p>

        <div className="flex gap-2">
          <button onClick={onCancelar}
            className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={fechando}
            className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50">
            {fechando ? 'Fechando...' : 'Fechar caixa'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FecharCaixaModal;
