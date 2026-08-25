import React, { useState, useEffect, useMemo } from 'react';
import { getRelatorioMotoboy, getMinhaEmpresa, registrarRepasseMotoboy, estornarRepasseMotoboy } from '../../services/restauranteService';
import RelatorioNav from './RelatorioNav';
import FiltroPeriodo from './FiltroPeriodo';
import { fmt, buildRange, printIframe, reportBaseStyle, printFooterScript, defaultFiltroState } from '../../utils/relatorioPrint';

const dataHora = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—';
const agora = () => new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

const TIPO_LABEL = { fixo: 'Fixo', percentual: '% do frete', km: 'R$/km', km_fallback: 'Km (padrão)' };
const traduzTipo = (t) => TIPO_LABEL[t] ?? t ?? '—';

const buildPrintHtml = (motoboys, entregas, restauranteNome, label, motoboyNome) => {
  const rows = motoboys.map((m) => `<tr>
    <td>${m.nome}</td>
    <td class="right">${m.entregas}</td>
    <td class="right">${fmt(m.total_frete_repassado)}</td>
    <td class="right">${fmt(m.total_adicional)}</td>
    <td class="right bold green">${fmt(m.total_comissao)}</td>
  </tr>`).join('');

  const entregaRows = (entregas ?? []).map((e) => `<tr>
    <td>${dataHora(e.data)}</td>
    <td>${e.motoboy_nome}</td>
    <td>#${e.pedido_id}</td>
    <td>${traduzTipo(e.tipo)}</td>
    <td class="right">${e.distancia_km != null ? `${e.distancia_km} km` : '—'}</td>
    <td class="right">${fmt(e.frete_repassado)}</td>
    <td class="right">${fmt(e.adicional)}</td>
    <td class="right bold">${fmt(e.comissao_valor)}</td>
  </tr>`).join('');

  const eFrete = (entregas ?? []).reduce((s, e) => s + e.frete_repassado, 0);
  const eAdicional = (entregas ?? []).reduce((s, e) => s + e.adicional, 0);
  const eComissao = (entregas ?? []).reduce((s, e) => s + e.comissao_valor, 0);
  const entregaTotalRow = (entregas ?? []).length ? `<tr>
    <td colspan="5" class="bold">Total (${entregas.length})</td>
    <td class="right bold">${fmt(eFrete)}</td>
    <td class="right bold">${fmt(eAdicional)}</td>
    <td class="right bold">${fmt(eComissao)}</td>
  </tr>` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Motoboy</title>
<style>${reportBaseStyle}</style></head><body>
<h1>${restauranteNome ?? 'RESTAURANTE'}</h1>
<div class="sub">Relatório por Motoboy${motoboyNome ? ` — ${motoboyNome}` : ''} — ${label}</div>
<table>
  <tr><th>Motoboy</th><th class="right">Entregas</th><th class="right">Frete Repassado</th><th class="right">Adicional</th><th class="right">Comissão Total</th></tr>
  ${rows || '<tr><td colspan="5">Nenhum motoboy com movimento no período.</td></tr>'}
</table>
<div class="sub" style="margin-top:16px">Detalhamento das entregas</div>
<table>
  <tr><th>Data/Hora</th><th>Motoboy</th><th>Pedido</th><th>Tipo</th><th class="right">Distância</th><th class="right">Frete</th><th class="right">Adicional</th><th class="right">Comissão</th></tr>
  ${entregaRows || '<tr><td colspan="8">Nenhuma entrega no período.</td></tr>'}
  ${entregaTotalRow}
</table>
<footer>Emitido em: ${agora()}</footer>
${printFooterScript}
</body></html>`;
};

const DestaqueCard = ({ label, nome, valor }) => (
  <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 min-w-0">
    <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-1 truncate">{label}</p>
    <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] truncate" title={nome ?? undefined}>{nome ?? '—'}</p>
    {nome && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 truncate" title={valor ?? undefined}>{valor}</p>}
  </div>
);

const SORT_CAMPOS = [
  { id: 'entregas', label: 'Entregas' },
  { id: 'total_frete_repassado', label: 'Frete' },
  { id: 'total_comissao', label: 'Comissão' },
];

const RelatorioMotoboy = () => {
  const [restauranteNome, setRestauranteNome] = useState('');
  const [filtro, setFiltro] = useState(defaultFiltroState());
  const [motoboys, setMotoboys] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [label, setLabel] = useState('');
  const [motoboyId, setMotoboyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [rangeAtual, setRangeAtual] = useState(null);
  const [marcandoPago, setMarcandoPago] = useState(null);
  const [repasseModal, setRepasseModal] = useState(null);
  const [valorDinheiro, setValorDinheiro] = useState('');
  const [valorPix, setValorPix] = useState('');
  const [busca, setBusca] = useState('');
  const [sortCampo, setSortCampo] = useState('total_comissao');

  useEffect(() => {
    getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {});
  }, []);

  const buscar = async () => {
    const range = buildRange(filtro.modo, filtro.dia, filtro.mes, filtro.ano, filtro.periodoIni, filtro.periodoFim);
    if (!range) return;
    setLoading(true); setErro(null);
    try {
      const d = await getRelatorioMotoboy(range.de, range.ate);
      setMotoboys(d.motoboys ?? []);
      setEntregas(d.entregas ?? []);
      setLabel(range.label);
      setRangeAtual(range);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  const abrirRepasse = (m) => {
    setErro(null);
    setRepasseModal(m);
    setValorDinheiro(m.total_comissao.toFixed(2));
    setValorPix('0.00');
  };

  const confirmarRepasse = async () => {
    if (!rangeAtual || !repasseModal) return;
    const total = repasseModal.total_comissao;
    const vd = Number(valorDinheiro || 0);
    const vp = Number(valorPix || 0);
    if (Math.abs(vd + vp - total) > 0.01) {
      setErro(`Soma dos valores (${fmt(vd + vp)}) não bate com o total a repassar (${fmt(total)})`);
      return;
    }
    setMarcandoPago(repasseModal.motoboy_id);
    try {
      await registrarRepasseMotoboy(repasseModal.motoboy_id, {
        de: rangeAtual.de,
        ate: rangeAtual.ate,
        valor_comissao: repasseModal.total_comissao,
        valor_dinheiro: vd,
        valor_pix: vp,
      });
      setRepasseModal(null);
      await buscar();
    } catch (e) { setErro(e.message); }
    finally { setMarcandoPago(null); }
  };

  const estornarRepasse = async (m) => {
    if (!window.confirm(`Reverter o repasse de ${m.nome} pra "não pago"? Se teve baixa em dinheiro no caixa, ela também é estornada.`)) return;
    setMarcandoPago(m.motoboy_id);
    try {
      await estornarRepasseMotoboy(m.repasse.id);
      await buscar();
    } catch (e) { setErro(e.message); }
    finally { setMarcandoPago(null); }
  };

  useEffect(() => { buscar(); }, []); // eslint-disable-line

  const motoboysFiltrados = useMemo(() => {
    let lista = motoboyId ? (motoboys ?? []).filter((m) => String(m.motoboy_id) === motoboyId) : (motoboys ?? []);
    if (busca.trim()) lista = lista.filter((m) => m.nome.toLowerCase().includes(busca.trim().toLowerCase()));
    return [...lista].sort((a, b) => (b[sortCampo] ?? 0) - (a[sortCampo] ?? 0));
  }, [motoboys, motoboyId, busca, sortCampo]);
  const entregasFiltradas = motoboyId ? entregas.filter((e) => String(e.motoboy_id) === motoboyId) : entregas;
  const motoboySelecionadoNome = motoboyId ? (motoboys ?? []).find((m) => String(m.motoboy_id) === motoboyId)?.nome : null;

  const totalEntregas = motoboysFiltrados.reduce((s, m) => s + m.entregas, 0);
  const totalFrete = motoboysFiltrados.reduce((s, m) => s + m.total_frete_repassado, 0);
  const totalAdicional = motoboysFiltrados.reduce((s, m) => s + m.total_adicional, 0);
  const totalComissao = motoboysFiltrados.reduce((s, m) => s + m.total_comissao, 0);

  const quemMaisEntregou = useMemo(() => {
    const comEntregas = (motoboys ?? []).filter((m) => m.entregas > 0);
    return comEntregas.length ? [...comEntregas].sort((a, b) => b.entregas - a.entregas)[0] : null;
  }, [motoboys]);
  const quemMaiorComissao = useMemo(() => {
    const comComissao = (motoboys ?? []).filter((m) => m.total_comissao > 0);
    return comComissao.length ? [...comComissao].sort((a, b) => b.total_comissao - a.total_comissao)[0] : null;
  }, [motoboys]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RelatorioNav titulo="Motoboy" />
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <FiltroPeriodo
          filtro={filtro} setFiltro={setFiltro} onBuscar={buscar} loading={loading}
          podeImprimir={!!motoboys} onImprimir={() => printIframe(buildPrintHtml(motoboysFiltrados, entregasFiltradas, restauranteNome, label, motoboySelecionadoNome))}
        />

        {motoboys && motoboys.length > 0 && (
          <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Buscar por nome</label>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome do motoboy..."
                className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F] min-w-[180px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Motoboy</label>
              <select value={motoboyId} onChange={(e) => setMotoboyId(e.target.value)}
                className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F] min-w-[200px]">
                <option value="">Todos os motoboys</option>
                {motoboys.map((m) => <option key={m.motoboy_id} value={m.motoboy_id}>{m.nome}</option>)}
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
            {motoboyId && (
              <button onClick={() => printIframe(buildPrintHtml(motoboysFiltrados, entregasFiltradas, restauranteNome, label, motoboySelecionadoNome))}
                className="flex items-center gap-2 px-4 py-2 bg-[#18181B] text-white text-sm font-bold rounded-xl hover:bg-[#27272A] transition-colors">
                Imprimir só {motoboySelecionadoNome}
              </button>
            )}
          </div>
        )}

        {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-xl">{erro}</p>}

        {motoboys && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center min-w-0">
                <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest mb-1 truncate">Entregas</p>
                <p className="text-lg sm:text-2xl font-black text-[#18181B] dark:text-[#F4F4F5] truncate">{totalEntregas}</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center min-w-0">
                <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest mb-1 truncate">Frete Repassado</p>
                <p className="text-lg sm:text-2xl font-black text-[#18181B] dark:text-[#F4F4F5] truncate" title={fmt(totalFrete)}>{fmt(totalFrete)}</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl p-4 text-center min-w-0">
                <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest mb-1 truncate">Adicional</p>
                <p className="text-lg sm:text-2xl font-black text-[#18181B] dark:text-[#F4F4F5] truncate" title={fmt(totalAdicional)}>{fmt(totalAdicional)}</p>
              </div>
              <div className="bg-white dark:bg-[#27272A] border border-[#FF441F]/30 rounded-2xl p-4 text-center min-w-0">
                <p className="text-[10px] font-black text-[#FF441F] uppercase tracking-widest mb-1 truncate">Comissão Total</p>
                <p className="text-lg sm:text-2xl font-black text-[#FF441F] truncate" title={fmt(totalComissao)}>{fmt(totalComissao)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DestaqueCard label="Quem Mais Entregou" nome={quemMaisEntregou?.nome} valor={quemMaisEntregou ? `${quemMaisEntregou.entregas} entrega(s)` : null} />
              <DestaqueCard label="Maior Comissão" nome={quemMaiorComissao?.nome} valor={quemMaiorComissao ? fmt(quemMaiorComissao.total_comissao) : null} />
            </div>

            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
              {motoboysFiltrados.length === 0 ? (
                <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhum motoboy afiliado ou sem movimento no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
                        <th className="text-left px-5 py-3">Motoboy</th>
                        <th className="text-right px-5 py-3">Entregas</th>
                        <th className="text-right px-5 py-3">Frete Repassado</th>
                        <th className="text-right px-5 py-3">Adicional</th>
                        <th className="text-right px-5 py-3">Comissão Total</th>
                        <th className="text-center px-5 py-3">Repasse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
                      {motoboysFiltrados.map((m) => (
                        <tr key={m.motoboy_id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                          <td className="px-5 py-3 font-semibold text-[#18181B] dark:text-[#F4F4F5]">{m.nome}</td>
                          <td className="px-5 py-3 text-right">{m.entregas}</td>
                          <td className="px-5 py-3 text-right">{fmt(m.total_frete_repassado)}</td>
                          <td className="px-5 py-3 text-right">{fmt(m.total_adicional)}</td>
                          <td className="px-5 py-3 text-right font-bold text-[#FF441F]">{fmt(m.total_comissao)}</td>
                          <td className="px-5 py-3 text-center">
                            {m.repasse ? (
                              <div className="inline-flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400" title={`Pago em ${dataHora(m.repasse.pago_em)}`}>
                                  ✓ Pago em {dataHora(m.repasse.pago_em)}
                                </span>
                                <button onClick={() => estornarRepasse(m)} disabled={marcandoPago === m.motoboy_id}
                                  title="Reverter pra não pago (corrigir lançamento)"
                                  className="w-5 h-5 rounded-md border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-950/40 disabled:opacity-50 flex-shrink-0">
                                  ↺
                                </button>
                              </div>
                            ) : m.total_comissao > 0 ? (
                              <button onClick={() => abrirRepasse(m)} disabled={marcandoPago === m.motoboy_id}
                                className="px-3 py-1.5 bg-[#18181B] text-white text-xs font-bold rounded-lg hover:bg-[#27272A] disabled:opacity-50">
                                Pagar
                              </button>
                            ) : <span className="text-[#A1A1AA]">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F4F4F5] dark:border-[#3F3F46]">
                <h2 className="text-sm font-black text-[#18181B] dark:text-[#F4F4F5]">Detalhamento das Entregas</h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Entrega a entrega, para conferência</p>
              </div>
              {entregasFiltradas.length === 0 ? (
                <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhuma entrega no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46] text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">
                        <th className="text-left px-5 py-3">Data/Hora</th>
                        <th className="text-left px-5 py-3">Motoboy</th>
                        <th className="text-left px-5 py-3">Pedido</th>
                        <th className="text-left px-5 py-3">Tipo</th>
                        <th className="text-right px-5 py-3">Distância</th>
                        <th className="text-right px-5 py-3">Frete</th>
                        <th className="text-right px-5 py-3">Adicional</th>
                        <th className="text-right px-5 py-3">Comissão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
                      {entregasFiltradas.map((e) => (
                        <tr key={e.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                          <td className="px-5 py-3 whitespace-nowrap text-[#71717A] dark:text-[#A1A1AA]">{dataHora(e.data)}</td>
                          <td className="px-5 py-3 font-semibold text-[#18181B] dark:text-[#F4F4F5]">{e.motoboy_nome}</td>
                          <td className="px-5 py-3 whitespace-nowrap">#{e.pedido_id}</td>
                          <td className="px-5 py-3">{traduzTipo(e.tipo)}</td>
                          <td className="px-5 py-3 text-right">{e.distancia_km != null ? `${e.distancia_km} km` : '—'}</td>
                          <td className="px-5 py-3 text-right">{fmt(e.frete_repassado)}</td>
                          <td className="px-5 py-3 text-right">{fmt(e.adicional)}</td>
                          <td className="px-5 py-3 text-right font-bold text-[#FF441F]">{fmt(e.comissao_valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-t-2 border-[#E4E4E7] dark:border-[#3F3F46] font-bold">
                        <td colSpan={5} className="px-5 py-3 text-[#18181B] dark:text-[#F4F4F5]">Total ({entregasFiltradas.length})</td>
                        <td className="px-5 py-3 text-right">{fmt(entregasFiltradas.reduce((s, e) => s + e.frete_repassado, 0))}</td>
                        <td className="px-5 py-3 text-right">{fmt(entregasFiltradas.reduce((s, e) => s + e.adicional, 0))}</td>
                        <td className="px-5 py-3 text-right text-[#FF441F]">{fmt(entregasFiltradas.reduce((s, e) => s + e.comissao_valor, 0))}</td>
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
              Total a repassar: <span className="font-bold">{fmt(repasseModal.total_comissao)}</span>
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
                <button type="button" onClick={confirmarRepasse} disabled={marcandoPago === repasseModal.motoboy_id}
                  className="flex-1 py-2 text-sm bg-[#FF441F] text-white rounded-xl font-semibold hover:bg-[#E63A19] disabled:opacity-50">
                  {marcandoPago === repasseModal.motoboy_id ? 'Confirmando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatorioMotoboy;
