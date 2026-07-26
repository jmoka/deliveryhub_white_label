import React, { useState, useEffect } from 'react';
import { getRelatorioGarcom, getMinhaEmpresa } from '../../services/restauranteService';
import RelatorioNav from './RelatorioNav';
import FiltroPeriodo from './FiltroPeriodo';
import { fmt, buildRange, printIframe, reportBaseStyle, printFooterScript, defaultFiltroState } from '../../utils/relatorioPrint';

const dataHora = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—';
const agora = () => new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

const buildPrintHtml = (garcons, vendas, restauranteNome, label, garcomNome) => {
  const rows = garcons.map((g) => `<tr>
    <td>${g.nome}</td>
    <td class="right bold green">${fmt(g.total_vendido)}</td>
    <td class="right">${fmt(g.total_comissao)}</td>
    <td class="right">${fmt(g.total_gorjeta)}</td>
    <td class="right bold">${fmt(g.total_comissao + g.total_gorjeta)}</td>
    <td class="right">${g.comandas_abertas}</td>
    <td class="right">${g.comandas_pendentes}</td>
  </tr>`).join('');

  const vendaRows = (vendas ?? []).map((v) => `<tr>
    <td>${dataHora(v.data)}</td>
    <td>${v.garcom_nome}</td>
    <td>${v.numero_comanda ?? '—'}${v.mesa_numero ? ` (Mesa ${v.mesa_numero})` : ''}</td>
    <td>${v.cliente_nome ?? '—'}</td>
    <td class="right">${fmt(v.total)}</td>
    <td class="right">${fmt(v.gorjeta)}</td>
    <td class="right">${fmt(v.taxa_cartao)}</td>
    <td>${v.formas_pagamento ?? '—'}</td>
    <td class="right bold">${fmt(v.total_geral)}</td>
  </tr>`).join('');

  const vTotal = (vendas ?? []).reduce((s, v) => s + v.total, 0);
  const vGorjeta = (vendas ?? []).reduce((s, v) => s + v.gorjeta, 0);
  const vTaxaCartao = (vendas ?? []).reduce((s, v) => s + v.taxa_cartao, 0);
  const vTotalGeral = (vendas ?? []).reduce((s, v) => s + v.total_geral, 0);
  const vendaTotalRow = (vendas ?? []).length ? `<tr>
    <td colspan="4" class="bold">Total (${vendas.length})</td>
    <td class="right bold">${fmt(vTotal)}</td>
    <td class="right bold">${fmt(vGorjeta)}</td>
    <td class="right bold">${fmt(vTaxaCartao)}</td>
    <td></td>
    <td class="right bold">${fmt(vTotalGeral)}</td>
  </tr>` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Garçom</title>
<style>${reportBaseStyle}</style></head><body>
<h1>${restauranteNome ?? 'RESTAURANTE'}</h1>
<div class="sub">Relatório por Garçom${garcomNome ? ` — ${garcomNome}` : ''} — ${label}</div>
<table>
  <tr><th>Garçom</th><th class="right">Total Vendido</th><th class="right">Comissão</th><th class="right">Gorjeta</th><th class="right">Total a Receber</th><th class="right">Comandas Abertas</th><th class="right">Pendentes</th></tr>
  ${rows || '<tr><td colspan="7">Nenhum garçom com movimento no período.</td></tr>'}
</table>
<div class="sub" style="margin-top:16px">Detalhamento das vendas</div>
<table>
  <tr><th>Data/Hora</th><th>Garçom</th><th>Comanda/Mesa</th><th>Cliente</th><th class="right">Total</th><th class="right">Gorjeta</th><th class="right">Taxa Cartão</th><th>Pagamento</th><th class="right">Total Geral</th></tr>
  ${vendaRows || '<tr><td colspan="9">Nenhuma venda no período.</td></tr>'}
  ${vendaTotalRow}
</table>
<footer>Emitido em: ${agora()}</footer>
${printFooterScript}
</body></html>`;
};

const RelatorioGarcom = () => {
  const [restauranteNome, setRestauranteNome] = useState('');
  const [filtro, setFiltro] = useState(defaultFiltroState());
  const [garcons, setGarcons] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [label, setLabel] = useState('');
  const [garcomId, setGarcomId] = useState('');
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
      const d = await getRelatorioGarcom(range.de, range.ate);
      setGarcons(d.garcons ?? []);
      setVendas(d.vendas ?? []);
      setLabel(range.label);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { buscar(); }, []); // eslint-disable-line

  const garconsFiltrados = garcomId ? (garcons ?? []).filter((g) => String(g.garcom_id) === garcomId) : (garcons ?? []);
  const vendasFiltradas = garcomId ? vendas.filter((v) => String(v.garcom_id) === garcomId) : vendas;
  const garcomSelecionadoNome = garcomId ? (garcons ?? []).find((g) => String(g.garcom_id) === garcomId)?.nome : null;

  const totalVendido = garconsFiltrados.reduce((s, g) => s + g.total_vendido, 0);
  const totalComissao = garconsFiltrados.reduce((s, g) => s + g.total_comissao, 0);
  const totalGorjeta = garconsFiltrados.reduce((s, g) => s + g.total_gorjeta, 0);
  const totalAReceber = totalComissao + totalGorjeta;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <RelatorioNav titulo="Garçom" />
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <FiltroPeriodo
          filtro={filtro} setFiltro={setFiltro} onBuscar={buscar} loading={loading}
          podeImprimir={!!garcons} onImprimir={() => printIframe(buildPrintHtml(garconsFiltrados, vendasFiltradas, restauranteNome, label, garcomSelecionadoNome))}
        />

        {garcons && garcons.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#71717A] uppercase tracking-widest">Garçom</label>
              <select value={garcomId} onChange={(e) => setGarcomId(e.target.value)}
                className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F] min-w-[200px]">
                <option value="">Todos os garçons</option>
                {garcons.map((g) => <option key={g.garcom_id} value={g.garcom_id}>{g.nome}</option>)}
              </select>
            </div>
            {garcomId && (
              <button onClick={() => printIframe(buildPrintHtml(garconsFiltrados, vendasFiltradas, restauranteNome, label, garcomSelecionadoNome))}
                className="flex items-center gap-2 px-4 py-2 bg-[#18181B] text-white text-sm font-bold rounded-xl hover:bg-[#27272A] transition-colors">
                Imprimir só {garcomSelecionadoNome}
              </button>
            )}
          </div>
        )}

        {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{erro}</p>}

        {garcons && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Total Vendido</p>
                <p className="text-2xl font-black text-green-700">{fmt(totalVendido)}</p>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] uppercase tracking-widest mb-1">Comissão Total</p>
                <p className="text-2xl font-black text-[#18181B]">{fmt(totalComissao)}</p>
              </div>
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] uppercase tracking-widest mb-1">Gorjeta Total</p>
                <p className="text-2xl font-black text-[#18181B]">{fmt(totalGorjeta)}</p>
              </div>
              <div className="bg-white border border-[#FF441F]/30 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#FF441F] uppercase tracking-widest mb-1">Total a Receber</p>
                <p className="text-2xl font-black text-[#FF441F]">{fmt(totalAReceber)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
              {garconsFiltrados.length === 0 ? (
                <p className="text-sm text-[#71717A] text-center py-10">Nenhum garçom cadastrado ou sem movimento no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FAFAFA] border-b border-[#F4F4F5] text-xs font-bold text-[#71717A] uppercase tracking-widest">
                        <th className="text-left px-5 py-3">Garçom</th>
                        <th className="text-right px-5 py-3">Total Vendido</th>
                        <th className="text-right px-5 py-3">Comissão</th>
                        <th className="text-right px-5 py-3">Gorjeta</th>
                        <th className="text-right px-5 py-3">Total a Receber</th>
                        <th className="text-right px-5 py-3">Comandas Abertas</th>
                        <th className="text-right px-5 py-3">Pendentes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F4F5]">
                      {garconsFiltrados.map((g) => (
                        <tr key={g.garcom_id} className="hover:bg-[#FAFAFA]">
                          <td className="px-5 py-3 font-semibold text-[#18181B]">{g.nome}</td>
                          <td className="px-5 py-3 text-right font-bold text-green-700">{fmt(g.total_vendido)}</td>
                          <td className="px-5 py-3 text-right">{fmt(g.total_comissao)}</td>
                          <td className="px-5 py-3 text-right">{fmt(g.total_gorjeta)}</td>
                          <td className="px-5 py-3 text-right font-bold text-[#FF441F]">{fmt(g.total_comissao + g.total_gorjeta)}</td>
                          <td className="px-5 py-3 text-right">
                            {g.comandas_abertas > 0
                              ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">{g.comandas_abertas}</span>
                              : <span className="text-[#A1A1AA]">0</span>}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {g.comandas_pendentes > 0
                              ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{g.comandas_pendentes}</span>
                              : <span className="text-[#A1A1AA]">0</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F4F4F5]">
                <h2 className="text-sm font-black text-[#18181B]">Detalhamento das Vendas</h2>
                <p className="text-xs text-[#71717A]">Comanda a comanda, para conferência</p>
              </div>
              {vendasFiltradas.length === 0 ? (
                <p className="text-sm text-[#71717A] text-center py-10">Nenhuma venda no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FAFAFA] border-b border-[#F4F4F5] text-xs font-bold text-[#71717A] uppercase tracking-widest">
                        <th className="text-left px-5 py-3">Data/Hora</th>
                        <th className="text-left px-5 py-3">Garçom</th>
                        <th className="text-left px-5 py-3">Comanda/Mesa</th>
                        <th className="text-left px-5 py-3">Cliente</th>
                        <th className="text-right px-5 py-3">Total</th>
                        <th className="text-right px-5 py-3">Gorjeta</th>
                        <th className="text-right px-5 py-3">Taxa Cartão</th>
                        <th className="text-left px-5 py-3">Pagamento</th>
                        <th className="text-right px-5 py-3">Total Geral</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F4F5]">
                      {vendasFiltradas.map((v) => (
                        <tr key={v.order_id} className="hover:bg-[#FAFAFA]">
                          <td className="px-5 py-3 whitespace-nowrap text-[#71717A]">{dataHora(v.data)}</td>
                          <td className="px-5 py-3 font-semibold text-[#18181B]">{v.garcom_nome}</td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {v.numero_comanda ?? '—'}{v.mesa_numero ? ` (Mesa ${v.mesa_numero})` : ''}
                          </td>
                          <td className="px-5 py-3">{v.cliente_nome ?? '—'}</td>
                          <td className="px-5 py-3 text-right">{fmt(v.total)}</td>
                          <td className="px-5 py-3 text-right">{fmt(v.gorjeta)}</td>
                          <td className="px-5 py-3 text-right">{fmt(v.taxa_cartao)}</td>
                          <td className="px-5 py-3">{v.formas_pagamento ?? '—'}</td>
                          <td className="px-5 py-3 text-right font-bold text-[#FF441F]">{fmt(v.total_geral)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#FAFAFA] border-t-2 border-[#E4E4E7] font-bold">
                        <td colSpan={4} className="px-5 py-3 text-[#18181B]">Total ({vendasFiltradas.length})</td>
                        <td className="px-5 py-3 text-right">{fmt(vendasFiltradas.reduce((s, v) => s + v.total, 0))}</td>
                        <td className="px-5 py-3 text-right">{fmt(vendasFiltradas.reduce((s, v) => s + v.gorjeta, 0))}</td>
                        <td className="px-5 py-3 text-right">{fmt(vendasFiltradas.reduce((s, v) => s + v.taxa_cartao, 0))}</td>
                        <td className="px-5 py-3"></td>
                        <td className="px-5 py-3 text-right text-[#FF441F]">{fmt(vendasFiltradas.reduce((s, v) => s + v.total_geral, 0))}</td>
                      </tr>
                    </tfoot>
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

export default RelatorioGarcom;
