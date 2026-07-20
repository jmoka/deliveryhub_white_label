import React, { useState, useEffect } from 'react';
import { getRelatorioGarcom, getMinhaEmpresa } from '../../services/restauranteService';
import RelatorioNav from './RelatorioNav';
import FiltroPeriodo from './FiltroPeriodo';
import { fmt, buildRange, printIframe, reportBaseStyle, printFooterScript, defaultFiltroState } from '../../utils/relatorioPrint';

const buildPrintHtml = (garcons, restauranteNome, label) => {
  const rows = garcons.map((g) => `<tr>
    <td>${g.nome}</td>
    <td class="right bold green">${fmt(g.total_vendido)}</td>
    <td class="right">${fmt(g.total_comissao)}</td>
    <td class="right">${fmt(g.total_gorjeta)}</td>
    <td class="right bold">${fmt(g.total_comissao + g.total_gorjeta)}</td>
    <td class="right">${g.comandas_abertas}</td>
    <td class="right">${g.comandas_pendentes}</td>
  </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Garçom</title>
<style>${reportBaseStyle}</style></head><body>
<h1>${restauranteNome ?? 'RESTAURANTE'}</h1>
<div class="sub">Relatório por Garçom — ${label}</div>
<table>
  <tr><th>Garçom</th><th class="right">Total Vendido</th><th class="right">Comissão</th><th class="right">Gorjeta</th><th class="right">Total a Receber</th><th class="right">Comandas Abertas</th><th class="right">Pendentes</th></tr>
  ${rows || '<tr><td colspan="7">Nenhum garçom com movimento no período.</td></tr>'}
</table>
<footer>Emitido em: ${new Date().toLocaleString('pt-BR')}</footer>
${printFooterScript}
</body></html>`;
};

const RelatorioGarcom = () => {
  const [restauranteNome, setRestauranteNome] = useState('');
  const [filtro, setFiltro] = useState(defaultFiltroState());
  const [garcons, setGarcons] = useState(null);
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
      const d = await getRelatorioGarcom(range.de, range.ate);
      setGarcons(d.garcons ?? []);
      setLabel(range.label);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { buscar(); }, []); // eslint-disable-line

  const totalVendido = (garcons ?? []).reduce((s, g) => s + g.total_vendido, 0);
  const totalComissao = (garcons ?? []).reduce((s, g) => s + g.total_comissao, 0);
  const totalGorjeta = (garcons ?? []).reduce((s, g) => s + g.total_gorjeta, 0);
  const totalAReceber = totalComissao + totalGorjeta;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <RelatorioNav titulo="Garçom" />
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <FiltroPeriodo
          filtro={filtro} setFiltro={setFiltro} onBuscar={buscar} loading={loading}
          podeImprimir={!!garcons} onImprimir={() => printIframe(buildPrintHtml(garcons, restauranteNome, label))}
        />

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
              {garcons.length === 0 ? (
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
                      {garcons.map((g) => (
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
          </>
        )}
      </main>
    </div>
  );
};

export default RelatorioGarcom;
