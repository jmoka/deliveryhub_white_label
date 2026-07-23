import React, { useState, useEffect } from 'react';
import { getRelatorio, getMinhaEmpresa } from '../../services/restauranteService';
import RelatorioNav from './RelatorioNav';
import FiltroPeriodo from './FiltroPeriodo';
import { fmt, buildRange, printIframe, reportBaseStyle, printFooterScript, defaultFiltroState } from '../../utils/relatorioPrint';

const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', cash: 'Dinheiro', taxa_cartao: '+ Taxa cartão' };
const ORIGEM_LABELS = { garcom: 'Garçom', estabelecimento: 'Caixa', delivery: 'Delivery' };

const buildPrintHtml = (dados, restauranteNome, label) => {
  const r = dados.resumo;
  const pgto = Object.entries(r.por_pagamento ?? {})
    .map(([k, v]) => `<tr><td>${PAYMENT_LABELS[k] ?? k}</td><td class="right">${v.count}</td><td class="right bold green">${fmt(v.total)}</td></tr>`)
    .join('');
  const fluxoRows = (dados.fluxo_caixa ?? [])
    .map((f) => `<tr><td>${new Date(f.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td><td>#${f.order_id}</td><td>${PAYMENT_LABELS[f.forma_pagamento] ?? f.forma_pagamento}</td><td>${ORIGEM_LABELS[f.origem] ?? f.origem}</td><td class="right bold green">${fmt(f.valor)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Financeiro</title>
<style>${reportBaseStyle}</style></head><body>
<h1>${restauranteNome ?? 'RESTAURANTE'}</h1>
<div class="sub">Relatório Financeiro — ${label}</div>
<div class="kpi-grid">
  <div class="kpi"><span class="val green">${fmt(r.total_vendas)}</span><span class="lbl">Vendas</span></div>
  <div class="kpi"><span class="val">${fmt(r.total_comissao)}</span><span class="lbl">Comissão Paga</span></div>
  <div class="kpi"><span class="val">${fmt(r.total_gorjeta)}</span><span class="lbl">Gorjetas Pagas</span></div>
  <div class="kpi"><span class="val">${fmt(r.total_troco)}</span><span class="lbl">Troco</span></div>
</div>
<h2>Por Forma de Pagamento</h2>
<table><tr><th>Método</th><th class="right">Pedidos</th><th class="right">Total</th></tr>${pgto}</table>
<h2>Fluxo de Caixa Detalhado</h2>
<table><tr><th>Hora</th><th>Pedido</th><th>Forma</th><th>Origem</th><th class="right">Valor</th></tr>${fluxoRows || '<tr><td colspan="5">Sem movimento no período.</td></tr>'}</table>
<footer>Emitido em: ${new Date().toLocaleString('pt-BR')}</footer>
${printFooterScript}
</body></html>`;
};

const RelatorioFinanceiro = () => {
  const [restauranteNome, setRestauranteNome] = useState('');
  const [filtro, setFiltro] = useState(defaultFiltroState());
  const [dados, setDados] = useState(null);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {});
  }, []);

  const buscar = async () => {
    const range = buildRange(filtro.modo, filtro.dia, filtro.mes, filtro.ano, filtro.periodoIni, filtro.periodoFim);
    if (!range) return;
    setLoading(true); setErro(null);
    try {
      const d = await getRelatorio(range.de, range.ate);
      setDados(d);
      setLabel(range.label);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { buscar(); }, []); // eslint-disable-line

  const r = dados?.resumo;
  const fluxo = (dados?.fluxo_caixa ?? []).slice().sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <RelatorioNav titulo="Financeiro" />
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <FiltroPeriodo
          filtro={filtro} setFiltro={setFiltro} onBuscar={buscar} loading={loading}
          podeImprimir={!!dados} onImprimir={() => printIframe(buildPrintHtml(dados, restauranteNome, label))}
        />

        {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{erro}</p>}

        {dados && r && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Vendas</p>
                <p className="text-2xl font-black text-green-700">{fmt(r.total_vendas)}</p>
                <p className="text-xs text-[#71717A] mt-1">{r.entregues} finalizados</p>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] uppercase tracking-widest mb-1">Comissão Paga</p>
                <p className="text-2xl font-black text-[#18181B]">{fmt(r.total_comissao)}</p>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] uppercase tracking-widest mb-1">Gorjetas Pagas</p>
                <p className="text-2xl font-black text-[#18181B]">{fmt(r.total_gorjeta)}</p>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] uppercase tracking-widest mb-1">Troco</p>
                <p className="text-2xl font-black text-[#18181B]">{fmt(r.total_troco)}</p>
              </div>
            </div>

            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4">
              <p className="text-xs font-bold text-[#71717A] mb-3 uppercase tracking-wide">Por Forma de Pagamento</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(r.por_pagamento ?? {}).length === 0 ? (
                  <p className="text-sm text-[#71717A] col-span-4 text-center py-4">Sem dados no período.</p>
                ) : Object.entries(r.por_pagamento ?? {}).map(([k, v]) => (
                  <div key={k} className="border border-[#F4F4F5] rounded-xl p-3">
                    <p className="text-xs text-[#71717A] mb-1">{PAYMENT_LABELS[k] ?? k}</p>
                    <p className="text-lg font-black text-[#18181B]">{fmt(v.total)}</p>
                    <p className="text-[10px] text-[#71717A]">{v.count} pagamento{v.count !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
              <div className="px-5 py-3 bg-[#FAFAFA] border-b border-[#F4F4F5]">
                <p className="text-xs font-bold text-[#71717A] uppercase tracking-widest">Fluxo de Caixa Detalhado ({fluxo.length})</p>
              </div>
              {fluxo.length === 0 ? (
                <p className="text-sm text-[#71717A] text-center py-10">Nenhum pagamento registrado no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-bold text-[#71717A] uppercase tracking-widest">
                        <th className="text-left px-5 py-2">Hora</th>
                        <th className="text-left px-5 py-2">Pedido</th>
                        <th className="text-left px-5 py-2">Forma</th>
                        <th className="text-left px-5 py-2">Origem</th>
                        <th className="text-right px-5 py-2">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F4F5]">
                      {fluxo.map((f, i) => (
                        <tr key={i} className="hover:bg-[#FAFAFA]">
                          <td className="px-5 py-2.5 text-xs text-[#71717A]">{new Date(f.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-5 py-2.5 font-semibold">#{f.order_id}</td>
                          <td className="px-5 py-2.5">{PAYMENT_LABELS[f.forma_pagamento] ?? f.forma_pagamento}</td>
                          <td className="px-5 py-2.5 text-[#71717A]">{ORIGEM_LABELS[f.origem] ?? f.origem}</td>
                          <td className="px-5 py-2.5 text-right font-bold text-green-700">{fmt(f.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default RelatorioFinanceiro;
