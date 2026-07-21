import React, { useState, useMemo } from 'react';
import { getCaixaDetalhe } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';

const fmt    = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDt  = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const isoDay = (d) => new Date(d).toISOString().slice(0, 10);
const isoMon = (d) => new Date(d).toISOString().slice(0, 7);
const today     = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

const STATUS_BADGE  = { aberto: 'bg-green-100 text-green-700 border border-green-200', fechado: 'bg-gray-100 text-gray-600 border border-gray-200', expirado: 'bg-red-100 text-red-700 border border-red-200' };
const STATUS_BORDER = { aberto: 'border-l-green-400', fechado: 'border-l-gray-300', expirado: 'border-l-red-400' };
const STATUS_LABEL  = { aberto: 'Aberto', fechado: 'Fechado', expirado: 'Expirado' };
const MEIO_LABELS   = { dinheiro: '💵', pix: '🏦', transferencia: '🔀', cartao: '💳' };

const KpiCard = ({ icon, label, value, accent }) => (
  <div className="bg-white rounded-2xl border border-[#E4E4E7] px-5 py-4 flex items-center gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-[#FF441F]/10' : 'bg-[#F4F4F5]'}`}>
      <Icon name={icon} size={18} className={accent ? 'text-[#FF441F]' : 'text-[#71717A]'} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-[#71717A] font-medium truncate">{label}</p>
      <p className={`text-lg font-black truncate ${accent ? 'text-[#FF441F]' : 'text-[#18181B]'}`}>{value}</p>
    </div>
  </div>
);

const Row = ({ label, value, bold, accent }) => (
  <div className={`flex justify-between text-sm py-1.5 border-b border-[#F4F4F5] last:border-0 ${bold ? 'font-bold' : ''}`}>
    <span className="text-[#71717A]">{label}</span>
    <span className={accent ? 'text-[#FF441F] font-bold' : 'text-[#18181B]'}>{value}</span>
  </div>
);

const HistoricoCaixasPanel = ({ historico = [] }) => {
  const [expandido,      setExpandido]      = useState(null);
  const [detalhe,        setDetalhe]        = useState({});
  const [loadingDetalhe, setLoadingDetalhe] = useState(null);

  const [busca,  setBusca]  = useState('');
  const [status, setStatus] = useState('todos');
  const [modoDt, setModoDt] = useState('todos');
  const [mesSel, setMesSel] = useState(thisMonth());
  const [dtIni,  setDtIni]  = useState(today());
  const [dtFim,  setDtFim]  = useState(today());

  const handleExpand = async (id) => {
    if (expandido === id) { setExpandido(null); return; }
    setExpandido(id);
    if (detalhe[id]) return;
    setLoadingDetalhe(id);
    try {
      const d = await getCaixaDetalhe(id);
      setDetalhe((prev) => ({ ...prev, [id]: d }));
    } catch { /* silent */ } finally { setLoadingDetalhe(null); }
  };

  const filtrado = useMemo(() => {
    const now    = new Date();
    const semana = new Date(now); semana.setDate(now.getDate() - 7);
    return historico.filter((c) => {
      if (busca && !c.nome_operador.toLowerCase().includes(busca.toLowerCase())) return false;
      if (status !== 'todos' && c.status !== status) return false;
      const aberto = new Date(c.aberto_em);
      if (modoDt === 'hoje')    return isoDay(aberto) === today();
      if (modoDt === 'semana')  return aberto >= semana;
      if (modoDt === 'mes')     return isoMon(aberto) === thisMonth();
      if (modoDt === 'mes_sel') return isoMon(aberto) === mesSel;
      if (modoDt === 'periodo') return aberto >= new Date(dtIni) && aberto <= new Date(dtFim + 'T23:59:59');
      return true;
    });
  }, [historico, busca, status, modoDt, mesSel, dtIni, dtFim]);

  const kpis = useMemo(() => {
    const perdas = filtrado.reduce((s, c) => { const d = c.destinacao_fechamento?.diferenca ?? 0; return s + (d < 0 ? -d : 0); }, 0);
    const saldo  = filtrado.reduce((s, c) => s + (c.resumo?.saldo ?? 0) + (c.destinacao_fechamento?.diferenca ?? 0), 0);
    return { total: filtrado.length, abertos: filtrado.filter((c) => c.status === 'aberto').length, vendas: filtrado.reduce((s, c) => s + (c.resumo?.total_vendas ?? 0), 0), saldo, perdas };
  }, [filtrado]);

  return (
    <div className="space-y-4">
      {/* Título */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-[#18181B] uppercase tracking-widest">Histórico de Caixas</p>
        <p className="text-xs text-[#71717A]">{historico.length} sessões</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon="Archive"    label="Caixas"       value={kpis.total} />
        <KpiCard icon="Unlock"     label="Abertos"      value={kpis.abertos} />
        <KpiCard icon="TrendingUp" label="Total Vendas" value={fmt(kpis.vendas)} accent />
        <div className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 ${kpis.perdas > 0 ? 'border-red-200' : 'border-[#E4E4E7]'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${kpis.perdas > 0 ? 'bg-red-50' : 'bg-[#F4F4F5]'}`}>
            <Icon name="Wallet" size={18} className={kpis.perdas > 0 ? 'text-red-500' : 'text-[#71717A]'} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#71717A] font-medium">Saldo Líquido Real</p>
            <p className={`text-lg font-black truncate ${kpis.perdas > 0 ? 'text-red-600' : 'text-[#18181B]'}`}>{fmt(kpis.saldo)}</p>
            {kpis.perdas > 0 && <p className="text-[10px] text-red-500 font-semibold"><Icon name="TrendingDown" size={10} className="inline" /> perdas: {fmt(kpis.perdas)}</p>}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
        <p className="text-xs font-black text-[#A1A1AA] uppercase tracking-widest">Filtros</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por operador…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#E4E4E7] rounded-xl bg-[#FAFAFA] focus:outline-none focus:border-[#FF441F]" />
            {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]"><Icon name="X" size={14} /></button>}
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="mx-2 sm:mx-0 sm:w-40 px-3 py-2.5 text-sm border border-[#E4E4E7] rounded-xl bg-[#FAFAFA] focus:outline-none focus:border-[#FF441F]">
            <option value="todos">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="fechado">Fechado</option>
            <option value="expirado">Expirado</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {[{ v: 'todos', l: 'Todos' }, { v: 'hoje', l: 'Hoje' }, { v: 'semana', l: '7 dias' }, { v: 'mes', l: 'Mês atual' }, { v: 'mes_sel', l: 'Mês' }, { v: 'periodo', l: 'Período' }].map(({ v, l }) => (
            <button key={v} onClick={() => setModoDt(v)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${modoDt === v ? 'bg-[#FF441F] text-white border-[#FF441F]' : 'bg-[#FAFAFA] text-[#71717A] border-[#E4E4E7] hover:border-[#FF441F] hover:text-[#FF441F]'}`}>
              {l}
            </button>
          ))}
        </div>
        {modoDt === 'mes_sel' && <input type="month" value={mesSel} onChange={(e) => setMesSel(e.target.value)} className="mx-2 sm:mx-0 w-48 px-3 py-2 text-sm border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#FF441F]" />}
        {modoDt === 'periodo' && (
          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-xs text-[#71717A] font-medium">De</label>
            <input type="date" value={dtIni} onChange={(e) => setDtIni(e.target.value)} className="px-3 py-2 text-sm border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#FF441F]" />
            <label className="text-xs text-[#71717A] font-medium">até</label>
            <input type="date" value={dtFim} onChange={(e) => setDtFim(e.target.value)} className="px-3 py-2 text-sm border border-[#E4E4E7] rounded-xl focus:outline-none focus:border-[#FF441F]" />
          </div>
        )}
        <p className="text-xs text-[#A1A1AA]">{filtrado.length === historico.length ? `${historico.length} caixas` : `${filtrado.length} de ${historico.length} caixas`}</p>
      </div>

      {/* Lista */}
      {filtrado.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-12 text-center">
          <Icon name="FilterX" size={32} className="text-[#D4D4D8] mx-auto mb-3" />
          <p className="text-[#71717A] font-medium">Nenhum caixa encontrado.</p>
          <button onClick={() => { setBusca(''); setStatus('todos'); setModoDt('todos'); }} className="mt-4 text-sm text-[#FF441F] font-semibold hover:underline">Limpar filtros</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrado.map((c) => {
            const r      = c.resumo ?? {};
            const d      = c.destinacao_fechamento;
            const isOpen = expandido === c.id;
            const det    = detalhe[c.id];
            const temPerda = (d?.diferenca ?? 0) < 0;
            const border = temPerda ? 'border-l-red-400' : (STATUS_BORDER[c.status] ?? 'border-l-gray-300');

            return (
              <div key={c.id} className={`bg-white rounded-2xl border border-[#E4E4E7] border-l-4 ${border} overflow-hidden`}>
                <button onClick={() => handleExpand(c.id)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#FAFAFA] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
                    <Icon name="User" size={16} className="text-[#71717A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-700'}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
                      {d?.conferencia_aprovada === true  && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700 border border-green-200">✓ Aprovado</span>}
                      {d?.conferencia_aprovada === false && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 border border-amber-200">⏳ Conf. Pendente</span>}
                      {temPerda && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700 border border-red-200"><Icon name="TrendingDown" size={10} className="inline mr-0.5" />{fmt(d.diferenca)} perda</span>}
                      {c.fechado_com_pendencias && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 border border-amber-200">Fechado com pendências</span>}
                      {c.nome && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#F4F4F5] text-[#71717A]">{c.nome}</span>}
                      <p className="text-sm font-bold text-[#18181B] truncate">{c.nome_operador}</p>
                      <p className="text-xs text-[#A1A1AA]">#{c.id}</p>
                    </div>
                    <p className="text-xs text-[#71717A] mt-0.5"><Icon name="Calendar" size={11} className="inline mr-1" />{fmtDt(c.aberto_em)}{c.fechado_em ? <> → {fmtDt(c.fechado_em)}</> : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <p className={`text-sm font-black ${temPerda ? 'text-red-600' : 'text-[#18181B]'}`}>{fmt((r.saldo ?? 0) + (d?.diferenca ?? 0))}</p>
                    <p className="text-xs text-[#71717A]">vendas: {fmt(r.total_vendas)}</p>
                    {temPerda && <p className="text-[10px] text-red-400">sistema: {fmt(r.saldo)}</p>}
                  </div>
                  <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-[#A1A1AA] flex-shrink-0" />
                </button>

                {isOpen && (
                  <div className="border-t border-[#F4F4F5] px-5 pb-5 pt-4">
                    {loadingDetalhe === c.id ? (
                      <div className="flex justify-center py-4"><div className="w-5 h-5 border-[3px] border-[#FF441F] border-t-transparent rounded-full animate-spin" /></div>
                    ) : det ? (() => {
                      const saidas = det.caixa.saidas ?? [];
                      const entradas = det.caixa.entradas ?? [];
                      const pedidos = det.pedidos ?? [];
                      const dc = det.caixa.destinacao_fechamento;
                      const dif = dc?.diferenca ?? 0;
                      const difCor = dif === 0 ? 'text-green-700' : dif < 0 ? 'text-red-600' : 'text-blue-600';
                      return (
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Resumo</p>
                            <div className="bg-[#FAFAFA] rounded-xl p-3">
                              <Row label="Valor inicial" value={fmt(det.caixa.valor_inicial)} />
                              <Row label="Total vendas"  value={fmt(r.total_vendas)} />
                              {(r.total_entradas ?? 0) > 0 && <Row label="Adições"       value={fmt(r.total_entradas)} />}
                              <Row label="Saídas"        value={`- ${fmt(r.total_saidas)}`} />
                              <Row label="Saldo"         value={fmt(r.saldo)} bold accent />
                            </div>
                            {det.caixa.fechado_com_pendencias && (
                              <div className="rounded-xl p-3 mt-2 border bg-amber-50 border-amber-200">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5 text-amber-700">Pendências no fechamento</p>
                                <Row label="Pedidos"  value={det.caixa.pendencias_fechamento?.pedidos?.length ?? 0} />
                                <Row label="Comandas" value={det.caixa.pendencias_fechamento?.comandas?.length ?? 0} />
                                <Row label="Mesas"     value={det.caixa.pendencias_fechamento?.mesas?.length ?? 0} />
                              </div>
                            )}
                            {dc?.dinheiro_contado !== undefined && (
                              <div className={`rounded-xl p-3 mt-2 border ${dif < 0 ? 'bg-red-50 border-red-200' : dif > 0 ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5 text-[#71717A]">Conferência</p>
                                <Row label="Operador contou" value={fmt(dc.dinheiro_contado)} />
                                <div className={`flex justify-between text-sm font-bold pt-1 border-t mt-1 ${dif < 0 ? 'border-red-200' : 'border-green-200'}`}>
                                  <span className="text-[#71717A]">Diferença</span>
                                  <span className={difCor}>{dif > 0 ? '+' : ''}{fmt(dif)}{dif === 0 ? ' ✓' : dif < 0 ? ' (falta)' : ' (sobra)'}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Pedidos ({pedidos.length})</p>
                            <div className="bg-[#FAFAFA] rounded-xl p-3 max-h-52 overflow-y-auto space-y-0.5">
                              {pedidos.length === 0 ? <p className="text-xs text-[#71717A] text-center py-2">Nenhum pedido</p>
                                : pedidos.map((p) => (
                                  <div key={p.id} className="flex justify-between text-xs py-1.5 border-b border-[#F4F4F5] last:border-0">
                                    <span className="font-semibold text-[#18181B]">#{p.id}</span>
                                    <span className="text-[#71717A]">{p.status}</span>
                                    <span className="font-bold text-[#18181B]">{fmt(p.total)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Movimentos</p>
                            <div className="space-y-1 max-h-52 overflow-y-auto">
                              {entradas.map((e, i) => (
                                <div key={i} className="flex justify-between text-xs bg-green-50 rounded-lg px-2.5 py-1.5">
                                  <span className="text-[#71717A] truncate mr-2">{MEIO_LABELS[e.meio] ?? '💵'} {e.descricao}</span>
                                  <span className="font-bold text-green-700 flex-shrink-0">+ {fmt(e.valor)}</span>
                                </div>
                              ))}
                              {saidas.map((s, i) => (
                                <div key={i} className="flex justify-between text-xs bg-red-50 rounded-lg px-2.5 py-1.5">
                                  <span className="text-[#71717A] truncate mr-2">{MEIO_LABELS[s.meio] ?? '💵'} {s.descricao}</span>
                                  <span className="font-bold text-red-600 flex-shrink-0">- {fmt(s.valor)}</span>
                                </div>
                              ))}
                              {saidas.length === 0 && entradas.length === 0 && <p className="text-xs text-[#71717A] text-center py-2">Sem movimentos</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })() : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoricoCaixasPanel;
