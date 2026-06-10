import React, { useState } from 'react';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR') : '-';

const Row = ({ label, value, bold, accent, muted }) => (
  <div className={`flex justify-between text-sm py-1.5 border-b border-[#F4F4F5] last:border-0 ${bold ? 'font-bold' : ''}`}>
    <span className={muted ? 'text-[#A1A1AA]' : 'text-[#71717A]'}>{label}</span>
    <span className={accent ? 'text-[#FF441F] font-bold' : muted ? 'text-[#A1A1AA]' : 'text-[#18181B]'}>{value}</span>
  </div>
);

// ── Tela 1: pedidos abertos ──────────────────────────────────────────────────
const PedidosAbertosView = ({ pedidosAbertos, onTransferir, onCancelar, fechando }) => {
  const [novoOperador, setNovoOperador] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [modoTransf, setModoTransf] = useState(false);

  if (modoTransf) return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">🔄</p>
        <h2 className="text-base font-bold text-[#18181B]">Transferir e Abrir Novo Caixa</h2>
        <p className="text-xs text-[#71717A] mt-0.5">{pedidosAbertos.length} pedido(s) serão transferidos</p>
      </div>
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-[#71717A] mb-1">Operador do novo caixa *</label>
          <input value={novoOperador} onChange={(e) => setNovoOperador(e.target.value)} placeholder="Ex: João"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#71717A] mb-1">Valor inicial do novo caixa (R$)</label>
          <input type="number" min="0" step="0.01" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} placeholder="0,00"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setModoTransf(false)} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">Voltar</button>
        <button onClick={() => onTransferir({ nome_operador: novoOperador.trim(), valor_inicial: parseFloat(novoValor) || 0 })}
          disabled={fechando || !novoOperador.trim()}
          className="flex-1 py-2.5 text-sm bg-[#FF441F] text-white rounded-xl font-bold hover:bg-[#E63A19] disabled:opacity-50">
          {fechando ? 'Transferindo...' : 'Confirmar'}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">⚠️</p>
        <h2 className="text-base font-bold text-[#18181B]">Pedidos em Aberto</h2>
        <p className="text-xs text-[#71717A] mt-0.5">Caixa não pode fechar com pedidos em andamento</p>
      </div>
      <div className="bg-orange-50 rounded-xl p-3 mb-4 max-h-40 overflow-y-auto">
        {pedidosAbertos.map((p) => (
          <div key={p.id} className="flex justify-between text-xs py-1 border-b border-orange-100 last:border-0">
            <span className="font-semibold text-[#18181B]">#{p.id}</span>
            <span className="text-[#71717A]">{fmt(p.total)} · {p.status}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#71717A] mb-4 text-center">Resolva os pedidos ou transfira para um novo operador.</p>
      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">Cancelar</button>
        <button onClick={() => setModoTransf(true)} className="flex-1 py-2.5 text-sm bg-[#FF441F] text-white rounded-xl font-bold hover:bg-[#E63A19]">Transferir</button>
      </div>
    </>
  );
};

// ── Tela 2: destinação do saldo ──────────────────────────────────────────────
const DestinacaoView = ({ resumo, aberto_em, valorInicial, semMovimento, onFechar, onCancelar, fechando }) => {
  const r = resumo ?? {};
  const saldo = r.saldo ?? (valorInicial ?? 0);

  const [banco, setBanco]       = useState('');
  const [retirada, setRetirada] = useState('');

  const bancoVal    = parseFloat(banco)    || 0;
  const retiradaVal = parseFloat(retirada) || 0;
  const permanece   = saldo - bancoVal - retiradaVal;
  const invalido    = permanece < -0.001;

  const handleConfirmar = () => {
    if (invalido) return;
    onFechar({ banco: bancoVal, retirada: retiradaVal, permanece: Math.max(0, permanece) });
  };

  return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">🏁</p>
        <h2 className="text-base font-bold text-[#18181B]">Fechar Caixa</h2>
        <p className="text-xs text-[#71717A] mt-0.5">Defina o destino do saldo</p>
      </div>

      {semMovimento && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 flex items-start gap-2">
          <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-700">Caixa sem vendas — o fundo de R$&nbsp;<strong>{fmt(valorInicial ?? 0)}</strong> precisa ser destinado.</p>
        </div>
      )}

      {/* Resumo compacto */}
      <div className="bg-[#FAFAFA] rounded-xl px-4 py-3 mb-4 space-y-0.5">
        <Row label="Aberto em"      value={fmtDate(aberto_em)} muted />
        <Row label="Valor inicial"  value={fmt(valorInicial ?? 0)} />
        <Row label="Vendas"         value={fmt(r.total_vendas)} />
        <Row label="Saídas"         value={`- ${fmt(r.total_saidas)}`} />
        <div className="pt-1 mt-1 border-t border-[#E4E4E7]">
          <Row label="Saldo a destinar" value={fmt(saldo)} bold accent />
        </div>
      </div>

      {/* Campos de destinação */}
      <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Destinar saldo</p>
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-sm">🏦</div>
          <div className="flex-1">
            <label className="block text-xs text-[#71717A] mb-0.5">Transferir para o banco (R$)</label>
            <input type="number" min="0" max={saldo} step="0.01" value={banco}
              onChange={(e) => setBanco(e.target.value)} placeholder="0,00"
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-sm">💵</div>
          <div className="flex-1">
            <label className="block text-xs text-[#71717A] mb-0.5">Retirar em dinheiro (R$)</label>
            <input type="number" min="0" max={saldo} step="0.01" value={retirada}
              onChange={(e) => setRetirada(e.target.value)} placeholder="0,00"
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
          </div>
        </div>
        <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${invalido ? 'bg-red-50 border border-red-200' : permanece > 0 ? 'bg-[#FF441F]/5 border border-[#FF441F]/20' : 'bg-[#F4F4F5]'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${invalido ? 'bg-red-200' : 'bg-[#FF441F]/10'}`}>🗃️</div>
          <div className="flex-1 flex justify-between items-center">
            <span className="text-xs text-[#71717A]">Permanece no caixa</span>
            <span className={`text-sm font-black ${invalido ? 'text-red-600' : permanece > 0 ? 'text-[#FF441F]' : 'text-[#71717A]'}`}>
              {invalido ? 'Excede saldo!' : fmt(Math.max(0, permanece))}
            </span>
          </div>
        </div>
      </div>

      {permanece > 0 && !invalido && (
        <p className="text-[10px] text-[#71717A] mb-3 text-center">
          {fmt(permanece)} ficará no cofre → vira fundo do próximo caixa.
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">Cancelar</button>
        <button onClick={handleConfirmar} disabled={fechando || invalido}
          className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50">
          {fechando ? 'Fechando...' : 'Fechar caixa'}
        </button>
      </div>
    </>
  );
};

// ── Modal principal ───────────────────────────────────────────────────────────
const FecharCaixaModal = ({
  resumo, aberto_em, valorInicial,
  pedidosAbertos,
  onConfirmar, onFecharETransferir, onCancelar,
  fechando,
}) => {
  const r = resumo ?? {};
  const temPedidosAbertos = (pedidosAbertos ?? []).length > 0;
  const semMovimento = !temPedidosAbertos && (r.entregues ?? 0) === 0 && (valorInicial ?? 0) > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
        {temPedidosAbertos
          ? <PedidosAbertosView pedidosAbertos={pedidosAbertos} onTransferir={onFecharETransferir} onCancelar={onCancelar} fechando={fechando} />
          : <DestinacaoView resumo={resumo} aberto_em={aberto_em} valorInicial={valorInicial} semMovimento={semMovimento} onFechar={onConfirmar} onCancelar={onCancelar} fechando={fechando} />
        }
      </div>
    </div>
  );
};

export default FecharCaixaModal;
