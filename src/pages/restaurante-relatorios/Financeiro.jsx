import React, { useState, useEffect, useMemo } from 'react';
import { getRelatorio, getMinhaEmpresa } from '../../services/restauranteService';
import RelatorioNav from './RelatorioNav';
import FiltroPeriodo from './FiltroPeriodo';
import { fmt, buildRange, printIframe, reportBaseStyle, printFooterScript, defaultFiltroState } from '../../utils/relatorioPrint';

const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', cash: 'Dinheiro', taxa_cartao: '+ Taxa cartão' };
const ORIGEM_LABELS = { garcom: 'Garçom', estabelecimento: 'Caixa', delivery: 'Delivery' };
const STATUS_LABELS = { pending: 'Pendente', confirmed: 'Confirmado', preparing: 'Preparando', out_for_delivery: 'Em Entrega', delivered: 'Entregue', paga: 'Paga', canceled: 'Cancelado' };
const CANAL_LABELS = { delivery: 'Delivery', presencial: 'Salão', balcao: 'Balcão', marketplace: 'Marketplace' };

const buildPrintHtml = (dados, restauranteNome, label) => {
  const r = dados.resumo;
  const pedidos = dados.pedidos ?? [];
  const naoCancelados = pedidos.filter((p) => p.status !== 'canceled');

  const pgto = Object.entries(r.por_pagamento ?? {})
    .map(([k, v]) => `<tr><td>${PAYMENT_LABELS[k] ?? k}</td><td class="right">${v.count}</td><td class="right bold green">${fmt(v.total)}</td></tr>`)
    .join('');

  const porCanal = naoCancelados.reduce((acc, p) => {
    const c = p.canal ?? 'outro';
    if (!acc[c]) acc[c] = { count: 0, total: 0 };
    acc[c].count++;
    acc[c].total += p.total ?? 0;
    return acc;
  }, {});
  const canalRows = Object.entries(porCanal)
    .map(([k, v]) => `<tr><td>${CANAL_LABELS[k] ?? k}</td><td class="right">${v.count}</td><td class="right bold green">${fmt(v.total)}</td></tr>`)
    .join('');

  const saidas = dados.saidas ?? [];
  const saidasRows = saidas
    .map((s) => `<tr><td>${new Date(s.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td><td>${s.descricao ?? '—'}</td><td class="right bold red">${fmt(s.valor)}</td></tr>`)
    .join('');

  const fluxoRows = (dados.fluxo_caixa ?? [])
    .map((f) => `<tr><td>${new Date(f.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td><td>#${f.order_id}</td><td>${PAYMENT_LABELS[f.forma_pagamento] ?? f.forma_pagamento}</td><td>${ORIGEM_LABELS[f.origem] ?? f.origem}</td><td class="right bold green">${fmt(f.valor)}</td>${f.troco > 0 ? `<td class="right">${fmt(f.troco)}</td>` : '<td class="right">—</td>'}</tr>`)
    .join('');

  const pedidosRows = pedidos
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((p) => {
      const itens = (p.itens ?? []).map((i) => `${i.quantity}x ${i.product_name}`).join(', ') || '—';
      const statusClass = p.status === 'canceled' ? 'red' : 'green';
      return `<tr><td>#${p.id}</td><td>${new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td><td>${p.customers?.name ?? '—'}</td><td>${CANAL_LABELS[p.canal] ?? p.canal ?? '—'}</td><td class="${statusClass}">${STATUS_LABELS[p.status] ?? p.status}</td><td>${itens}</td><td class="right bold">${fmt(p.total)}</td></tr>`;
    })
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Financeiro</title>
<style>${reportBaseStyle}</style></head><body>
<h1>${restauranteNome ?? 'RESTAURANTE'}</h1>
<div class="sub">Relatório Financeiro Analítico — ${label}</div>

<h2>Resumo Geral</h2>
<div class="kpi-grid">
  <div class="kpi"><span class="val green">${fmt(r.total_vendas)}</span><span class="lbl">Total Vendas</span></div>
  <div class="kpi"><span class="val">${fmt(r.ticket_medio)}</span><span class="lbl">Ticket Médio</span></div>
  <div class="kpi"><span class="val red">${fmt(r.total_saidas)}</span><span class="lbl">Total Saídas</span></div>
  <div class="kpi"><span class="val ${r.saldo_liquido >= 0 ? 'green' : 'red'}">${fmt(r.saldo_liquido)}</span><span class="lbl">Saldo Líquido</span></div>
</div>
<div class="kpi-grid">
  <div class="kpi"><span class="val">${r.total_pedidos}</span><span class="lbl">Total Pedidos</span></div>
  <div class="kpi"><span class="val green">${r.entregues}</span><span class="lbl">Finalizados</span></div>
  <div class="kpi"><span class="val">${r.em_andamento}</span><span class="lbl">Em Andamento</span></div>
  <div class="kpi"><span class="val red">${r.cancelados}</span><span class="lbl">Cancelados</span></div>
</div>
<h2>Comissões e Gorjetas</h2>
<table><tr><th></th><th class="right">Gerado no Período</th><th class="right">Pago no Período</th></tr>
<tr><td>Comissão Garçom</td><td class="right">${fmt(r.total_comissao)}</td><td class="right bold">${fmt(r.total_comissoes_pagas)}</td></tr>
<tr><td>Gorjeta</td><td class="right">${fmt(r.total_gorjeta)}</td><td class="right bold">${fmt(r.total_gorjetas_pagas)}</td></tr>
<tr><td>Troco</td><td class="right" colspan="2">${fmt(r.total_troco)}</td></tr>
</table>

<h2>Por Forma de Pagamento</h2>
<table><tr><th>Método</th><th class="right">Pedidos</th><th class="right">Total</th></tr>${pgto || '<tr><td colspan="3">Sem dados no período.</td></tr>'}</table>

<h2>Por Canal de Venda</h2>
<table><tr><th>Canal</th><th class="right">Pedidos</th><th class="right">Total</th></tr>${canalRows || '<tr><td colspan="3">Sem dados no período.</td></tr>'}</table>

<h2>Saídas do Caixa (${saidas.length})</h2>
<table><tr><th>Hora</th><th>Descrição</th><th class="right">Valor</th></tr>${saidasRows || '<tr><td colspan="3">Nenhuma saída no período.</td></tr>'}</table>

<h2>Fluxo de Caixa Detalhado (${(dados.fluxo_caixa ?? []).length})</h2>
<table><tr><th>Hora</th><th>Pedido</th><th>Forma</th><th>Origem</th><th class="right">Valor</th><th class="right">Troco</th></tr>${fluxoRows || '<tr><td colspan="6">Sem movimento no período.</td></tr>'}</table>

<h2>Todos os Pedidos (${pedidos.length})</h2>
<table><tr><th>Pedido</th><th>Data/Hora</th><th>Cliente</th><th>Canal</th><th>Status</th><th>Itens</th><th class="right">Total</th></tr>${pedidosRows || '<tr><td colspan="7">Nenhum pedido no período.</td></tr>'}</table>

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
  const maioresVendas = useMemo(() =>
    (dados?.pedidos ?? [])
      .filter((p) => p.status !== 'canceled')
      .slice()
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .slice(0, 10),
  [dados]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RelatorioNav titulo="Financeiro" />
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <FiltroPeriodo
          filtro={filtro} setFiltro={setFiltro} onBuscar={buscar} loading={loading}
          podeImprimir={!!dados} onImprimir={() => printIframe(buildPrintHtml(dados, restauranteNome, label))}
        />

        {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-xl">{erro}</p>}

        {dados && r && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-[#27272A] border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Vendas</p>
                <p className="text-2xl font-black text-green-700 dark:text-green-400">{fmt(r.total_vendas)}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">{r.entregues} finalizados</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest mb-1">Comissão Paga</p>
                <p className="text-2xl font-black text-[#18181B] dark:text-[#F4F4F5]">{fmt(r.total_comissoes_pagas)}</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest mb-1">Gorjetas Pagas</p>
                <p className="text-2xl font-black text-[#18181B] dark:text-[#F4F4F5]">{fmt(r.total_gorjetas_pagas)}</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest mb-1">Troco</p>
                <p className="text-2xl font-black text-[#18181B] dark:text-[#F4F4F5]">{fmt(r.total_troco)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
              <div className="px-5 py-3 bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46]">
                <p className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Maiores Vendas do Período</p>
              </div>
              {maioresVendas.length === 0 ? (
                <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhuma venda no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
                        <th className="text-left px-5 py-2">#</th>
                        <th className="text-left px-5 py-2">Pedido</th>
                        <th className="text-left px-5 py-2">Cliente</th>
                        <th className="text-left px-5 py-2">Canal</th>
                        <th className="text-left px-5 py-2">Data/Hora</th>
                        <th className="text-right px-5 py-2">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
                      {maioresVendas.map((p, i) => (
                        <tr key={p.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                          <td className="px-5 py-2.5 font-black text-[#A1A1AA]">{i + 1}º</td>
                          <td className="px-5 py-2.5 font-semibold text-[#18181B] dark:text-[#F4F4F5]">#{p.id}</td>
                          <td className="px-5 py-2.5 text-[#71717A] dark:text-[#A1A1AA]">{p.customers?.name ?? '—'}</td>
                          <td className="px-5 py-2.5 text-[#71717A] dark:text-[#A1A1AA] capitalize">{p.canal ?? '—'}</td>
                          <td className="px-5 py-2.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">{new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-5 py-2.5 text-right font-bold text-green-700 dark:text-green-400">{fmt(p.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4">
              <p className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] mb-3 uppercase tracking-wide">Por Forma de Pagamento</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(r.por_pagamento ?? {}).length === 0 ? (
                  <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] col-span-4 text-center py-4">Sem dados no período.</p>
                ) : Object.entries(r.por_pagamento ?? {}).map(([k, v]) => (
                  <div key={k} className="border border-[#F4F4F5] dark:border-[#3F3F46] rounded-xl p-3">
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-1">{PAYMENT_LABELS[k] ?? k}</p>
                    <p className="text-lg font-black text-[#18181B] dark:text-[#F4F4F5]">{fmt(v.total)}</p>
                    <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{v.count} pagamento{v.count !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
              <div className="px-5 py-3 bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46]">
                <p className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Fluxo de Caixa Detalhado ({fluxo.length})</p>
              </div>
              {fluxo.length === 0 ? (
                <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhum pagamento registrado no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
                        <th className="text-left px-5 py-2">Hora</th>
                        <th className="text-left px-5 py-2">Pedido</th>
                        <th className="text-left px-5 py-2">Forma</th>
                        <th className="text-left px-5 py-2">Origem</th>
                        <th className="text-right px-5 py-2">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
                      {fluxo.map((f, i) => (
                        <tr key={i} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                          <td className="px-5 py-2.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">{new Date(f.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-5 py-2.5 font-semibold">#{f.order_id}</td>
                          <td className="px-5 py-2.5">{PAYMENT_LABELS[f.forma_pagamento] ?? f.forma_pagamento}</td>
                          <td className="px-5 py-2.5 text-[#71717A] dark:text-[#A1A1AA]">{ORIGEM_LABELS[f.origem] ?? f.origem}</td>
                          <td className="px-5 py-2.5 text-right font-bold text-green-700 dark:text-green-400">{fmt(f.valor)}</td>
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
