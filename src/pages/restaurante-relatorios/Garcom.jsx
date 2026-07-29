import React, { useState, useEffect, useMemo } from 'react';
import { getRelatorioGarcom, getMinhaEmpresa, registrarRepasseGarcom, estornarRepasseGarcom } from '../../services/restauranteService';
import RelatorioNav from './RelatorioNav';
import FiltroPeriodo from './FiltroPeriodo';
import { fmt, buildRange, printIframe, reportBaseStyle, printFooterScript, defaultFiltroState } from '../../utils/relatorioPrint';

const dataHora = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—';
const agora = () => new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

const PAGAMENTO_LABEL = { pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito', cash: 'Dinheiro' };
const traduzFormas = (s) => s ? s.split(' + ').map((f) => PAGAMENTO_LABEL[f] ?? f).join(' + ') : '—';

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
    <td>${traduzFormas(v.formas_pagamento)}</td>
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

const DestaqueCard = ({ label, nome, valor }) => (
  <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4">
    <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">{nome ?? '—'}</p>
    {nome && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{valor}</p>}
  </div>
);

const SORT_CAMPOS = [
  { id: 'total_vendido', label: 'Venda' },
  { id: 'total_gorjeta', label: 'Gorjeta' },
  { id: 'total_comissao', label: 'Comissão' },
];

const RelatorioGarcom = () => {
  const [restauranteNome, setRestauranteNome] = useState('');
  const [filtro, setFiltro] = useState(defaultFiltroState());
  const [garcons, setGarcons] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [label, setLabel] = useState('');
  const [garcomId, setGarcomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [rangeAtual, setRangeAtual] = useState(null);
  const [marcandoPago, setMarcandoPago] = useState(null);
  const [repasseModal, setRepasseModal] = useState(null);
  const [valorDinheiro, setValorDinheiro] = useState('');
  const [valorPix, setValorPix] = useState('');
  const [busca, setBusca] = useState('');
  const [sortCampo, setSortCampo] = useState('total_vendido');
  const [expandido, setExpandido] = useState(null);

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
      setRangeAtual(range);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  const abrirRepasse = (g) => {
    setErro(null);
    setRepasseModal(g);
    setValorDinheiro((g.total_gorjeta + g.total_comissao).toFixed(2));
    setValorPix('0.00');
  };

  const confirmarRepasse = async () => {
    if (!rangeAtual || !repasseModal) return;
    const total = repasseModal.total_gorjeta + repasseModal.total_comissao;
    const vd = Number(valorDinheiro || 0);
    const vp = Number(valorPix || 0);
    if (Math.abs(vd + vp - total) > 0.01) {
      setErro(`Soma dos valores (${fmt(vd + vp)}) não bate com o total a repassar (${fmt(total)})`);
      return;
    }
    setMarcandoPago(repasseModal.garcom_id);
    try {
      await registrarRepasseGarcom(repasseModal.garcom_id, {
        de: rangeAtual.de,
        ate: rangeAtual.ate,
        valor_gorjeta: repasseModal.total_gorjeta,
        valor_comissao: repasseModal.total_comissao,
        valor_dinheiro: vd,
        valor_pix: vp,
      });
      setRepasseModal(null);
      await buscar();
    } catch (e) { setErro(e.message); }
    finally { setMarcandoPago(null); }
  };

  const estornarRepasse = async (g) => {
    if (!window.confirm(`Reverter o repasse de ${g.nome} pra "não pago"? Se teve baixa em dinheiro no caixa, ela também é estornada.`)) return;
    setMarcandoPago(g.garcom_id);
    try {
      await estornarRepasseGarcom(g.repasse.id);
      await buscar();
    } catch (e) { setErro(e.message); }
    finally { setMarcandoPago(null); }
  };

  useEffect(() => { buscar(); }, []); // eslint-disable-line

  const garconsFiltrados = useMemo(() => {
    let lista = garcomId ? (garcons ?? []).filter((g) => String(g.garcom_id) === garcomId) : (garcons ?? []);
    if (busca.trim()) lista = lista.filter((g) => g.nome.toLowerCase().includes(busca.trim().toLowerCase()));
    return [...lista].sort((a, b) => (b[sortCampo] ?? 0) - (a[sortCampo] ?? 0));
  }, [garcons, garcomId, busca, sortCampo]);
  const vendasFiltradas = garcomId ? vendas.filter((v) => String(v.garcom_id) === garcomId) : vendas;
  const garcomSelecionadoNome = garcomId ? (garcons ?? []).find((g) => String(g.garcom_id) === garcomId)?.nome : null;

  const totalVendido = garconsFiltrados.reduce((s, g) => s + g.total_vendido, 0);
  const totalComissao = garconsFiltrados.reduce((s, g) => s + g.total_comissao, 0);
  const totalGorjeta = garconsFiltrados.reduce((s, g) => s + g.total_gorjeta, 0);
  const totalAReceber = totalComissao + totalGorjeta;

  const quemVendeuMais = useMemo(() => {
    const comVenda = (garcons ?? []).filter((g) => g.total_vendido > 0);
    return comVenda.length ? [...comVenda].sort((a, b) => b.total_vendido - a.total_vendido)[0] : null;
  }, [garcons]);
  const quemGanhouMaisGorjeta = useMemo(() => {
    const comGorjeta = (garcons ?? []).filter((g) => g.total_gorjeta > 0);
    return comGorjeta.length ? [...comGorjeta].sort((a, b) => b.total_gorjeta - a.total_gorjeta)[0] : null;
  }, [garcons]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RelatorioNav titulo="Garçom" />
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <FiltroPeriodo
          filtro={filtro} setFiltro={setFiltro} onBuscar={buscar} loading={loading}
          podeImprimir={!!garcons} onImprimir={() => printIframe(buildPrintHtml(garconsFiltrados, vendasFiltradas, restauranteNome, label, garcomSelecionadoNome))}
        />

        {garcons && garcons.length > 0 && (
          <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Buscar por nome</label>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome do garçom..."
                className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F] min-w-[180px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Garçom</label>
              <select value={garcomId} onChange={(e) => setGarcomId(e.target.value)}
                className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F] min-w-[200px]">
                <option value="">Todos os garçons</option>
                {garcons.map((g) => <option key={g.garcom_id} value={g.garcom_id}>{g.nome}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Ordenar por</label>
              <div className="flex gap-1 bg-[#F4F4F5] dark:bg-[#3F3F46] p-1 rounded-xl">
                {SORT_CAMPOS.map((s) => (
                  <button key={s.id} onClick={() => setSortCampo(s.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${sortCampo === s.id ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] shadow-sm' : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {garcomId && (
              <button onClick={() => printIframe(buildPrintHtml(garconsFiltrados, vendasFiltradas, restauranteNome, label, garcomSelecionadoNome))}
                className="flex items-center gap-2 px-4 py-2 bg-[#18181B] text-white text-sm font-bold rounded-xl hover:bg-[#27272A] transition-colors">
                Imprimir só {garcomSelecionadoNome}
              </button>
            )}
          </div>
        )}

        {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-xl">{erro}</p>}

        {garcons && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-[#27272A] border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Total Vendido</p>
                <p className="text-2xl font-black text-green-700 dark:text-green-400">{fmt(totalVendido)}</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest mb-1">Comissão Total</p>
                <p className="text-2xl font-black text-[#18181B] dark:text-[#F4F4F5]">{fmt(totalComissao)}</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest mb-1">Gorjeta Total</p>
                <p className="text-2xl font-black text-[#18181B] dark:text-[#F4F4F5]">{fmt(totalGorjeta)}</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#FF441F]/30 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-[#FF441F] uppercase tracking-widest mb-1">Total a Receber</p>
                <p className="text-2xl font-black text-[#FF441F]">{fmt(totalAReceber)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DestaqueCard label="Quem Vendeu Mais" nome={quemVendeuMais?.nome} valor={quemVendeuMais ? fmt(quemVendeuMais.total_vendido) : null} />
              <DestaqueCard label="Quem Ganhou Mais Gorjeta" nome={quemGanhouMaisGorjeta?.nome} valor={quemGanhouMaisGorjeta ? fmt(quemGanhouMaisGorjeta.total_gorjeta) : null} />
            </div>

            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
              {garconsFiltrados.length === 0 ? (
                <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhum garçom cadastrado ou sem movimento no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
                        <th className="text-left px-5 py-3">Garçom</th>
                        <th className="text-right px-5 py-3">Total Vendido</th>
                        <th className="text-right px-5 py-3">Comissão</th>
                        <th className="text-right px-5 py-3">Gorjeta</th>
                        <th className="text-right px-5 py-3">Total a Receber</th>
                        <th className="text-right px-5 py-3">Comandas Abertas</th>
                        <th className="text-right px-5 py-3">Pendentes</th>
                        <th className="text-left px-5 py-3">Produto Favorito</th>
                        <th className="text-center px-5 py-3">Repasse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
                      {garconsFiltrados.map((g) => (
                        <React.Fragment key={g.garcom_id}>
                        <tr className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                          <td className="px-5 py-3 font-semibold text-[#18181B] dark:text-[#F4F4F5]">{g.nome}</td>
                          <td className="px-5 py-3 text-right font-bold text-green-700 dark:text-green-400">{fmt(g.total_vendido)}</td>
                          <td className="px-5 py-3 text-right">{fmt(g.total_comissao)}</td>
                          <td className="px-5 py-3 text-right">{fmt(g.total_gorjeta)}</td>
                          <td className="px-5 py-3 text-right font-bold text-[#FF441F]">{fmt(g.total_comissao + g.total_gorjeta)}</td>
                          <td className="px-5 py-3 text-right">
                            {g.comandas_abertas > 0
                              ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400">{g.comandas_abertas}</span>
                              : <span className="text-[#A1A1AA]">0</span>}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {g.comandas_pendentes > 0
                              ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400">{g.comandas_pendentes}</span>
                              : <span className="text-[#A1A1AA]">0</span>}
                          </td>
                          <td className="px-5 py-3">
                            {(g.produtos ?? []).length > 0 ? (
                              <button onClick={() => setExpandido(expandido === g.garcom_id ? null : g.garcom_id)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-[#27272A] dark:text-[#F4F4F5] hover:text-[#FF441F]">
                                {g.produtos[0].name} ({g.produtos[0].quantidade})
                                {g.produtos.length > 1 && <span className="text-[#A1A1AA]">{expandido === g.garcom_id ? '▲' : '▼'}</span>}
                              </button>
                            ) : <span className="text-xs text-[#A1A1AA]">—</span>}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {g.repasse ? (
                              <div className="inline-flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400" title={`Pago em ${dataHora(g.repasse.pago_em)}`}>
                                  ✓ Pago em {dataHora(g.repasse.pago_em)}
                                </span>
                                <button onClick={() => estornarRepasse(g)} disabled={marcandoPago === g.garcom_id}
                                  title="Reverter pra não pago (corrigir lançamento)"
                                  className="w-5 h-5 rounded-md border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-950/40 disabled:opacity-50 flex-shrink-0">
                                  ↺
                                </button>
                              </div>
                            ) : (g.total_comissao + g.total_gorjeta) > 0 ? (
                              <button onClick={() => abrirRepasse(g)} disabled={marcandoPago === g.garcom_id}
                                className="px-3 py-1.5 bg-[#18181B] text-white text-xs font-bold rounded-lg hover:bg-[#27272A] disabled:opacity-50">
                                Pagar
                              </button>
                            ) : <span className="text-[#A1A1AA]">—</span>}
                          </td>
                        </tr>
                        {expandido === g.garcom_id && (g.produtos ?? []).length > 1 && (
                          <tr className="bg-[#FAFAFA] dark:bg-[#18181B]">
                            <td colSpan={9} className="px-5 py-3">
                              <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1.5">Top produtos de {g.nome}</p>
                              <div className="flex flex-wrap gap-2">
                                {g.produtos.map((p) => (
                                  <span key={p.product_id} className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5]">
                                    {p.name} <span className="text-[#71717A] dark:text-[#A1A1AA]">— {p.quantidade} un. · {fmt(p.receita)}</span>
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F4F4F5] dark:border-[#3F3F46]">
                <h2 className="text-sm font-black text-[#18181B] dark:text-[#F4F4F5]">Detalhamento das Vendas</h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Comanda a comanda, para conferência</p>
              </div>
              {vendasFiltradas.length === 0 ? (
                <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhuma venda no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
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
                    <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
                      {vendasFiltradas.map((v) => (
                        <tr key={v.order_id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                          <td className="px-5 py-3 whitespace-nowrap text-[#71717A] dark:text-[#A1A1AA]">{dataHora(v.data)}</td>
                          <td className="px-5 py-3 font-semibold text-[#18181B] dark:text-[#F4F4F5]">{v.garcom_nome}</td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {v.numero_comanda ?? '—'}{v.mesa_numero ? ` (Mesa ${v.mesa_numero})` : ''}
                          </td>
                          <td className="px-5 py-3">{v.cliente_nome ?? '—'}</td>
                          <td className="px-5 py-3 text-right">{fmt(v.total)}</td>
                          <td className="px-5 py-3 text-right">{fmt(v.gorjeta)}</td>
                          <td className="px-5 py-3 text-right">{fmt(v.taxa_cartao)}</td>
                          <td className="px-5 py-3">{traduzFormas(v.formas_pagamento)}</td>
                          <td className="px-5 py-3 text-right font-bold text-[#FF441F]">{fmt(v.total_geral)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-t-2 border-[#E4E4E7] dark:border-[#3F3F46] font-bold">
                        <td colSpan={4} className="px-5 py-3 text-[#18181B] dark:text-[#F4F4F5]">Total ({vendasFiltradas.length})</td>
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

      {repasseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">Pagar {repasseModal.nome}</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-4">
              Total a repassar: <span className="font-bold">{fmt(repasseModal.total_gorjeta + repasseModal.total_comissao)}</span>
              {' '}(gorjeta {fmt(repasseModal.total_gorjeta)} + comissão {fmt(repasseModal.total_comissao)})
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] mb-1">Dinheiro (R$)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={valorDinheiro}
                    onChange={(e) => setValorDinheiro(e.target.value)}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] mb-1">PIX (R$)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={valorPix}
                    onChange={(e) => setValorPix(e.target.value)}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Valor em dinheiro dá baixa automática no caixa aberto (sangria). PIX não mexe no caixa.</p>
              {erro && <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-xl">{erro}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setRepasseModal(null); setErro(null); }}
                  className="flex-1 py-2 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
                  Cancelar
                </button>
                <button type="button" onClick={confirmarRepasse} disabled={marcandoPago === repasseModal.garcom_id}
                  className="flex-1 py-2 text-sm bg-[#FF441F] text-white rounded-xl font-semibold hover:bg-[#E63A19] disabled:opacity-50">
                  {marcandoPago === repasseModal.garcom_id ? 'Confirmando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatorioGarcom;
