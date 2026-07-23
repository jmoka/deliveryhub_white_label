import React, { useState } from 'react';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR') : '-';

const PL = { cash: 'Dinheiro', pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', taxa_cartao: '+ Taxa cartão' };

const Row = ({ label, value, bold, accent, muted }) => (
  <div className={`flex justify-between text-sm py-1.5 border-b border-[#F4F4F5] last:border-0 ${bold ? 'font-bold' : ''}`}>
    <span className={muted ? 'text-[#A1A1AA]' : 'text-[#71717A]'}>{label}</span>
    <span className={accent ? 'text-[#FF441F] font-bold' : muted ? 'text-[#A1A1AA]' : 'text-[#18181B]'}>{value}</span>
  </div>
);

// ── Tela 1: pedidos/comandas/mesas em aberto ──────────────────────────────────
const PedidosAbertosView = ({ pedidosAbertos, comandasAbertas, mesasAbertas, onTransferir, onFecharComPendencia, onCancelar, fechando }) => {
  const [novoOperador, setNovoOperador] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [modoTransf, setModoTransf] = useState(false);
  const totalPendencias = pedidosAbertos.length + comandasAbertas.length;

  if (modoTransf) return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">🔄</p>
        <h2 className="text-base font-bold text-[#18181B]">Transferir e Abrir Novo Caixa</h2>
        <p className="text-xs text-[#71717A] mt-0.5">{totalPendencias} pedido(s)/comanda(s) serão transferidos</p>
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
        <h2 className="text-base font-bold text-[#18181B]">Pendências em Aberto</h2>
        <p className="text-xs text-[#71717A] mt-0.5">Caixa não pode fechar com pedidos, comandas ou mesas em andamento</p>
      </div>
      {pedidosAbertos.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">Pedidos delivery</p>
          <div className="bg-orange-50 rounded-xl p-3 max-h-32 overflow-y-auto">
            {pedidosAbertos.map((p) => (
              <div key={p.id} className="flex justify-between text-xs py-1 border-b border-orange-100 last:border-0">
                <span className="font-semibold text-[#18181B]">#{p.id}</span>
                <span className="text-[#71717A]">{fmt(p.total)} · {p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {comandasAbertas.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">Comandas do salão</p>
          <div className="bg-orange-50 rounded-xl p-3 max-h-32 overflow-y-auto">
            {comandasAbertas.map((c) => (
              <div key={c.id} className="flex justify-between text-xs py-1 border-b border-orange-100 last:border-0">
                <span className="font-semibold text-[#18181B]">{c.mesas ? `Mesa ${c.mesas.numero}` : `Comanda #${c.id}`}</span>
                <span className="text-[#71717A]">{c.status === 'aberta' ? 'Em aberto' : 'Aguard. pagamento'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {mesasAbertas.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">Mesas ocupadas</p>
          <div className="bg-orange-50 rounded-xl p-3 max-h-32 overflow-y-auto">
            {mesasAbertas.map((m) => (
              <div key={m.id} className="flex justify-between text-xs py-1 border-b border-orange-100 last:border-0">
                <span className="font-semibold text-[#18181B]">Mesa {m.numero}{m.nome ? ` - ${m.nome}` : ''}</span>
                <span className="text-[#71717A]">{m.status === 'ocupada' ? 'Ocupada' : 'Aguard. pagamento'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-[#71717A] mb-3 text-center">
        {mesasAbertas.length > 0 && totalPendencias === 0
          ? 'Libere a(s) mesa(s) manualmente antes de fechar o caixa.'
          : 'Resolva os pedidos/comandas, transfira para um novo operador, ou feche deixando essas comandas pendentes (fiado).'}
      </p>
      <div className="flex gap-2 mb-2">
        <button onClick={onCancelar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">Cancelar</button>
        {totalPendencias > 0 && (
          <button onClick={() => setModoTransf(true)} className="flex-1 py-2.5 text-sm bg-[#FF441F] text-white rounded-xl font-bold hover:bg-[#E63A19]">Transferir</button>
        )}
      </div>
      {totalPendencias > 0 && (
        <>
          <button onClick={onFecharComPendencia} className="w-full py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">
            Fechar mesmo assim (deixar pendente)
          </button>
          <p className="text-[10px] text-[#A1A1AA] mt-1.5 text-center">
            As comandas/mesas em aberto continuam ativas e serão cobradas no próximo caixa que estiver aberto quando o cliente pagar.
          </p>
        </>
      )}
    </>
  );
};

// ── Tela 2: conferência de fechamento ────────────────────────────────────────
const DestinacaoView = ({ resumo, aberto_em, valorInicial, comPendencias, onFechar, onCancelar, fechando }) => {
  const r = resumo ?? {};
  const [dinheiroContado, setDinheiroContado] = useState('');

  const vendasDinheiro  = r.por_pagamento?.cash ?? 0;
  const saidasEspecie   = r.saidas_especie ?? 0;
  const especieCalc     = r.especie_calculada ?? Math.max(0, (valorInicial ?? 0) + vendasDinheiro - saidasEspecie);
  const digitais        = Object.entries(r.por_pagamento ?? {}).filter(([k]) => k !== 'cash');
  const totalDigital    = digitais.reduce((s, [, v]) => s + v, 0);
  const totalFaturamento = vendasDinheiro + totalDigital;

  const contadoVal = parseFloat(dinheiroContado) || 0;
  const diferenca  = contadoVal - especieCalc;
  const temContagem = dinheiroContado !== '';

  const difCor = diferenca === 0
    ? 'bg-green-50 border-green-200'
    : diferenca > 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200';
  const difTxt = diferenca === 0
    ? 'text-green-700'
    : diferenca > 0 ? 'text-blue-700' : 'text-red-600';

  return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">🏁</p>
        <h2 className="text-base font-bold text-[#18181B]">Fechar Caixa</h2>
        <p className="text-xs text-[#71717A] mt-0.5">Conferência de fechamento · {fmtDate(aberto_em)}</p>
      </div>

      {/* Composição da espécie */}
      <div className="bg-[#FAFAFA] rounded-xl px-4 py-3 mb-3">
        <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Composição do caixa</p>
        <Row label="Fundo inicial (troco)" value={fmt(valorInicial ?? 0)} />
        <Row label="+ Vendas em dinheiro"  value={fmt(vendasDinheiro)} />
        {saidasEspecie > 0 && <Row label="− Sangrias / saídas (dinheiro)" value={`- ${fmt(saidasEspecie)}`} />}
        <div className="pt-1 mt-1 border-t border-[#E4E4E7]">
          <Row label="Espécie esperada no caixa" value={fmt(especieCalc)} bold />
        </div>
      </div>

      {/* Vendas digitais */}
      {digitais.length > 0 && (
        <div className="bg-[#FAFAFA] rounded-xl px-4 py-3 mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Vendas digitais</p>
          {digitais.map(([k, v]) => <Row key={k} label={PL[k] ?? k} value={fmt(v)} accent={k === 'taxa_cartao'} />)}
          <div className="pt-1 mt-1 border-t border-[#E4E4E7]">
            <Row label="Total digital" value={fmt(totalDigital)} bold />
          </div>
        </div>
      )}

      {/* Total geral (dinheiro + digital) */}
      <div className="bg-[#FAFAFA] rounded-xl px-4 py-3 mb-3">
        <Row label="Total faturamento (dinheiro + digital)" value={fmt(totalFaturamento)} bold accent />
      </div>

      {/* Contagem do operador */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
          💵 Quanto de dinheiro você conta no caixa agora? *
        </label>
        <input
          type="number" min="0" step="0.01"
          value={dinheiroContado}
          onChange={(e) => setDinheiroContado(e.target.value)}
          placeholder="0,00"
          className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]"
          autoFocus
        />
      </div>

      {/* Resultado da conferência */}
      {temContagem && (
        <div className={`rounded-xl px-4 py-3 mb-3 border ${difCor}`}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#71717A]">Espécie esperada</span>
            <span className="font-semibold">{fmt(especieCalc)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#71717A]">Dinheiro contado</span>
            <span className="font-semibold">{fmt(contadoVal)}</span>
          </div>
          <div className={`flex justify-between text-sm font-bold pt-1 border-t border-current/10`}>
            <span>Diferença</span>
            <span className={difTxt}>
              {diferenca > 0 ? '+' : ''}{fmt(diferenca)}
              {diferenca === 0 ? ' ✓ ok' : diferenca > 0 ? ' (sobra)' : ' (falta)'}
            </span>
          </div>
        </div>
      )}

      {comPendencias && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-3">
          <p className="text-xs text-amber-700 text-center">
            Fechando com comandas/mesas pendentes — elas continuam ativas e serão cobradas no próximo caixa aberto.
          </p>
        </div>
      )}

      <p className="text-[10px] text-[#71717A] mb-3 text-center">
        Enviado ao financeiro para conferência e aprovação do gerente.
      </p>

      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">Cancelar</button>
        <button
          onClick={() => onFechar({ dinheiro_contado: contadoVal, ...(comPendencias ? { permitir_pendencias: true } : {}) })}
          disabled={fechando || !temContagem}
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
  pedidosAbertos, comandasAbertas, mesasAbertas,
  onConfirmar, onFecharETransferir, onCancelar,
  fechando,
}) => {
  const [forcarFechamento, setForcarFechamento] = useState(false);
  const temPendencias = (pedidosAbertos ?? []).length > 0 || (comandasAbertas ?? []).length > 0 || (mesasAbertas ?? []).length > 0;
  const mostrarPendencias = temPendencias && !forcarFechamento;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
        {mostrarPendencias
          ? <PedidosAbertosView
              pedidosAbertos={pedidosAbertos ?? []}
              comandasAbertas={comandasAbertas ?? []}
              mesasAbertas={mesasAbertas ?? []}
              onTransferir={onFecharETransferir}
              onFecharComPendencia={() => setForcarFechamento(true)}
              onCancelar={onCancelar}
              fechando={fechando}
            />
          : <DestinacaoView
              resumo={resumo} aberto_em={aberto_em} valorInicial={valorInicial}
              comPendencias={temPendencias}
              onFechar={onConfirmar} onCancelar={onCancelar} fechando={fechando}
            />
        }
      </div>
    </div>
  );
};

export default FecharCaixaModal;
