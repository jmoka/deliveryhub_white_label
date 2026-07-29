import React, { useState } from 'react';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR') : '-';

const PL = { cash: 'Dinheiro', pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', taxa_cartao: '+ Taxa cartão' };

const Row = ({ label, value, bold, accent, muted }) => (
  <div className={`flex justify-between text-sm py-1.5 border-b border-[#F4F4F5] dark:border-[#3F3F46] last:border-0 ${bold ? 'font-bold' : ''}`}>
    <span className={muted ? 'text-[#A1A1AA]' : 'text-[#71717A] dark:text-[#A1A1AA]'}>{label}</span>
    <span className={accent ? 'text-[#FF441F] font-bold' : muted ? 'text-[#A1A1AA]' : 'text-[#18181B] dark:text-[#F4F4F5]'}>{value}</span>
  </div>
);

// ── Tela 1: pedidos/comandas/mesas em aberto ──────────────────────────────────
const PedidosAbertosView = ({ pedidosAbertos, comandasAbertas, mesasAbertas, onTransferir, onFecharComPendencia, onCancelar, fechando }) => {
  const [novoOperador, setNovoOperador] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [modoTransf, setModoTransf] = useState(false);
  const totalPendencias = pedidosAbertos.length + comandasAbertas.length + mesasAbertas.length;

  if (modoTransf) return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">🔄</p>
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Transferir e Abrir Novo Caixa</h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{totalPendencias} pedido(s)/comanda(s) serão transferidos</p>
      </div>
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1">Operador do novo caixa *</label>
          <input value={novoOperador} onChange={(e) => setNovoOperador(e.target.value)} placeholder="Ex: João"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-1">Valor inicial do novo caixa (R$)</label>
          <input type="number" min="0" step="0.01" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} placeholder="0,00"
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setModoTransf(false)} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">Voltar</button>
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
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Pendências em Aberto</h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Caixa não pode fechar com pedidos, comandas ou mesas em andamento</p>
      </div>
      {pedidosAbertos.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">Pedidos delivery</p>
          <div className="bg-orange-50 dark:bg-orange-950/40 rounded-xl p-3 max-h-32 overflow-y-auto">
            {pedidosAbertos.map((p) => (
              <div key={p.id} className="flex justify-between text-xs py-1 border-b border-orange-100 dark:border-orange-900/40 last:border-0">
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">#{p.id}</span>
                <span className="text-[#71717A] dark:text-[#A1A1AA]">{fmt(p.total)} · {p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {comandasAbertas.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">Comandas do salão</p>
          <div className="bg-orange-50 dark:bg-orange-950/40 rounded-xl p-3 max-h-32 overflow-y-auto">
            {comandasAbertas.map((c) => (
              <div key={c.id} className="flex justify-between text-xs py-1 border-b border-orange-100 dark:border-orange-900/40 last:border-0">
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{c.mesas ? `Mesa ${c.mesas.numero}` : `Comanda #${c.id}`}</span>
                <span className="text-[#71717A] dark:text-[#A1A1AA]">{c.status === 'aberta' ? 'Em aberto' : 'Aguard. pagamento'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {mesasAbertas.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">Mesas ocupadas</p>
          <div className="bg-orange-50 dark:bg-orange-950/40 rounded-xl p-3 max-h-32 overflow-y-auto">
            {mesasAbertas.map((m) => (
              <div key={m.id} className="flex justify-between text-xs py-1 border-b border-orange-100 dark:border-orange-900/40 last:border-0">
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">Mesa {m.numero}{m.nome ? ` - ${m.nome}` : ''}</span>
                <span className="text-[#71717A] dark:text-[#A1A1AA]">{m.status === 'ocupada' ? 'Ocupada' : 'Aguard. pagamento'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-3 text-center">
        Resolva os pedidos/comandas, transfira para um novo operador, ou feche liberando as mesas e deixando as comandas pendentes (fiado).
      </p>
      <div className="flex gap-2 mb-2">
        <button onClick={onCancelar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">Cancelar</button>
        {totalPendencias > 0 && (
          <button onClick={() => setModoTransf(true)} className="flex-1 py-2.5 text-sm bg-[#FF441F] text-white rounded-xl font-bold hover:bg-[#E63A19]">Transferir</button>
        )}
      </div>
      {totalPendencias > 0 && (
        <>
          <button onClick={onFecharComPendencia} className="w-full py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
            Fechar mesmo assim (liberar mesas, deixar pendente)
          </button>
          <p className="text-[10px] text-[#A1A1AA] mt-1.5 text-center">
            As mesas ocupadas são liberadas pro próximo cliente. As comandas continuam ativas e serão cobradas no próximo caixa que estiver aberto quando o cliente pagar.
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
  const entradasEspecie = r.entradas_especie ?? 0;
  const saidasEspecie   = r.saidas_especie ?? 0;
  const especieCalc     = r.especie_calculada ?? Math.max(0, (valorInicial ?? 0) + entradasEspecie - saidasEspecie);
  // Taxa de cartão some daqui (mostrada junto de cada forma abaixo, não como linha solta).
  const digitais        = Object.entries(r.por_pagamento ?? {}).filter(([k]) => k !== 'cash' && k !== 'taxa_cartao');
  const taxaPorForma     = r.taxa_por_forma ?? {};
  const totalDigital    = digitais.reduce((s, [, v]) => s + v, 0) + Object.values(taxaPorForma).reduce((s, v) => s + v, 0);
  const totalFaturamento = vendasDinheiro + totalDigital;

  const contadoVal = parseFloat(dinheiroContado) || 0;
  const diferenca  = contadoVal - especieCalc;
  const temContagem = dinheiroContado !== '';

  const difCor = diferenca === 0
    ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800'
    : diferenca > 0 ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
  const difTxt = diferenca === 0
    ? 'text-green-700 dark:text-green-400'
    : diferenca > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-600 dark:text-red-400';

  return (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl mb-1">🏁</p>
        <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Fechar Caixa</h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Conferência de fechamento · {fmtDate(aberto_em)}</p>
      </div>

      {/* Composição da espécie */}
      <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl px-4 py-3 mb-3">
        <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Composição do caixa</p>
        <Row label="Fundo inicial (troco)" value={fmt(valorInicial ?? 0)} />
        <Row label="+ Vendas + adições em dinheiro"  value={fmt(entradasEspecie)} />
        {saidasEspecie > 0 && <Row label="− Sangrias / troco (dinheiro)" value={`- ${fmt(saidasEspecie)}`} />}
        <div className="pt-1 mt-1 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
          <Row label="Espécie esperada no caixa" value={fmt(especieCalc)} bold />
        </div>
      </div>

      {/* Vendas digitais */}
      {digitais.length > 0 && (
        <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl px-4 py-3 mb-3">
          <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Vendas digitais</p>
          {digitais.map(([k, v]) => {
            const taxa = taxaPorForma[k] ?? 0;
            if (taxa <= 0) return <Row key={k} label={PL[k] ?? k} value={fmt(v)} />;
            return (
              <div key={k} className="py-1.5 border-b border-[#F4F4F5] dark:border-[#3F3F46] last:border-0">
                <div className="flex justify-between text-sm">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">{PL[k] ?? k}</span>
                  <span className="text-[#18181B] dark:text-[#F4F4F5]">{fmt(v)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#A1A1AA]">+ Taxa cartão</span>
                  <span className="text-[#A1A1AA]">{fmt(taxa)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-[#18181B] dark:text-[#F4F4F5]">= Total {PL[k] ?? k}</span>
                  <span className="text-[#18181B] dark:text-[#F4F4F5]">{fmt(v + taxa)}</span>
                </div>
              </div>
            );
          })}
          <div className="pt-1 mt-1 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
            <Row label="Total digital" value={fmt(totalDigital)} bold />
          </div>
        </div>
      )}

      {/* Total geral (dinheiro + digital) */}
      <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl px-4 py-3 mb-3">
        <Row label="Total faturamento (dinheiro + digital)" value={fmt(totalFaturamento)} bold accent />
      </div>

      {/* Contagem do operador */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-1.5">
          💵 Quanto de dinheiro você conta no caixa agora? *
        </label>
        <input
          type="number" min="0" step="0.01"
          value={dinheiroContado}
          onChange={(e) => setDinheiroContado(e.target.value)}
          placeholder="0,00"
          className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]"
          autoFocus
        />
      </div>

      {/* Resultado da conferência */}
      {temContagem && (
        <div className={`rounded-xl px-4 py-3 mb-3 border ${difCor}`}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#71717A] dark:text-[#A1A1AA]">Espécie esperada</span>
            <span className="font-semibold">{fmt(especieCalc)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#71717A] dark:text-[#A1A1AA]">Dinheiro contado</span>
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
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 mb-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
            Fechando com pendências — mesas ocupadas serão liberadas e as comandas continuam ativas, cobradas no próximo caixa aberto.
          </p>
        </div>
      )}

      <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mb-3 text-center">
        Enviado ao financeiro para conferência e aprovação do gerente.
      </p>

      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">Cancelar</button>
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
      <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
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
