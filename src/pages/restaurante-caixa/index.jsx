import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCaixaHistorico, getCaixaDetalhe } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';

const fmt    = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDt  = (d) => d ? new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const fmtDay = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const isoDay = (d) => new Date(d).toISOString().slice(0, 10);
const isoMon = (d) => new Date(d).toISOString().slice(0, 7);

const STATUS_BADGE  = { aberto: 'bg-green-100 text-green-700 border border-green-200', fechado: 'bg-gray-100 text-gray-600 border border-gray-200', expirado: 'bg-red-100 text-red-700 border border-red-200' };
const STATUS_BORDER = { aberto: 'border-l-green-400', fechado: 'border-l-gray-300', expirado: 'border-l-red-400' };
const STATUS_LABEL  = { aberto: 'Aberto', fechado: 'Fechado', expirado: 'Expirado' };

const LINKS = [
  { label: 'Dashboard', path: '/restaurante' },
  { label: 'Cozinha', path: '/restaurante/cozinha' },
  { label: 'Produtos', path: '/restaurante/produtos' },
  { label: 'Pedidos', path: '/restaurante/pedidos' },
  { label: 'Motoboys', path: '/restaurante/motoboys' },
  { label: 'Clientes', path: '/restaurante/clientes' },
  { label: 'Financeiro', path: '/restaurante/financeiro' },
  { label: 'Caixa', path: '/restaurante/caixa' },
  { label: 'Designer', path: '/restaurante/aparencia' },
  { label: 'Config', path: '/restaurante/config' },
];

const today     = () => new Date().toISOString().slice(0,10);
const thisMonth = () => new Date().toISOString().slice(0,7);

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

const RestauranteCaixa = () => {
  const navigate = useNavigate();

  const [historico,      setHistorico]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [erro,           setErro]           = useState(null);
  const [expandido,      setExpandido]      = useState(null);
  const [detalhe,        setDetalhe]        = useState({});
  const [loadingDetalhe, setLoadingDetalhe] = useState(null);

  // ── filtros ──────────────────────────────────────────────────────────────
  const [busca,    setBusca]    = useState('');
  const [status,   setStatus]   = useState('todos');
  const [modoDt,   setModoDt]   = useState('todos');   // todos | hoje | semana | mes | mes_sel | periodo
  const [mesSel,   setMesSel]   = useState(thisMonth());
  const [dtIni,    setDtIni]    = useState(today());
  const [dtFim,    setDtFim]    = useState(today());

  useEffect(() => {
    getCaixaHistorico()
      .then((d) => setHistorico(d.historico ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

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

  // ── filtragem client-side ─────────────────────────────────────────────────
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

  // ── KPIs do resultado filtrado ────────────────────────────────────────────
  const kpis = useMemo(() => ({
    total:   filtrado.length,
    abertos: filtrado.filter((c) => c.status === 'aberto').length,
    vendas:  filtrado.reduce((s, c) => s + (c.resumo?.total_vendas ?? 0), 0),
    saldo:   filtrado.reduce((s, c) => s + (c.resumo?.saldo ?? 0), 0),
  }), [filtrado]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <p className="text-red-600 text-sm">{erro}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* ── Header ── */}
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#18181B]">Histórico de Caixa</h1>
          <p className="text-sm text-[#71717A]">{historico.length} sessões carregadas</p>
        </div>
        <nav className="hidden md:flex gap-1.5 flex-wrap items-center">
          {LINKS.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${l.path === '/restaurante/caixa' ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30' : 'text-[#27272A] hover:bg-[#F4F4F5]'}`}>
              {l.label}
            </button>
          ))}
        </nav>
        <button onClick={() => navigate('/restaurante')} className="md:hidden flex items-center gap-1.5 text-sm text-[#71717A]">
          <Icon name="ChevronLeft" size={16} /> Voltar
        </button>
      </header>

      <main className="px-4 py-6 w-full max-w-5xl mx-auto space-y-5">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon="Archive"     label="Caixas"       value={kpis.total} />
          <KpiCard icon="Unlock"      label="Abertos"      value={kpis.abertos} />
          <KpiCard icon="TrendingUp"  label="Total Vendas" value={fmt(kpis.vendas)} accent />
          <KpiCard icon="Wallet"      label="Saldo Líquido" value={fmt(kpis.saldo)} />
        </div>

        {/* ── Filtros ── */}
        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
          <p className="text-xs font-black text-[#A1A1AA] uppercase tracking-widest">Filtros</p>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Busca por operador */}
            <div className="relative flex-1">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
              <input
                type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por operador…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#E4E4E7] rounded-xl bg-[#FAFAFA] text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#FF441F] focus:ring-1 focus:ring-[#FF441F]/30"
              />
              {busca && (
                <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B]">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>

            {/* Status */}
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="mx-2 sm:mx-0 sm:w-40 px-3 py-2.5 text-sm border border-[#E4E4E7] rounded-xl bg-[#FAFAFA] text-[#18181B] focus:outline-none focus:border-[#FF441F]">
              <option value="todos">Todos os status</option>
              <option value="aberto">Aberto</option>
              <option value="fechado">Fechado</option>
              <option value="expirado">Expirado</option>
            </select>
          </div>

          {/* Filtro de data */}
          <div className="flex flex-wrap gap-2 items-center">
            {[
              { v: 'todos',   l: 'Todos' },
              { v: 'hoje',    l: 'Hoje' },
              { v: 'semana',  l: 'Últimos 7 dias' },
              { v: 'mes',     l: 'Mês atual' },
              { v: 'mes_sel', l: 'Mês específico' },
              { v: 'periodo', l: 'Período' },
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setModoDt(v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${modoDt === v ? 'bg-[#FF441F] text-white border-[#FF441F]' : 'bg-[#FAFAFA] text-[#71717A] border-[#E4E4E7] hover:border-[#FF441F] hover:text-[#FF441F]'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Seletores extras conforme modo */}
          {modoDt === 'mes_sel' && (
            <input type="month" value={mesSel} onChange={(e) => setMesSel(e.target.value)}
              className="mx-2 sm:mx-0 w-48 px-3 py-2 text-sm border border-[#E4E4E7] rounded-xl bg-[#FAFAFA] text-[#18181B] focus:outline-none focus:border-[#FF441F]" />
          )}
          {modoDt === 'periodo' && (
            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-xs text-[#71717A] font-medium">De</label>
              <input type="date" value={dtIni} onChange={(e) => setDtIni(e.target.value)}
                className="px-3 py-2 text-sm border border-[#E4E4E7] rounded-xl bg-[#FAFAFA] text-[#18181B] focus:outline-none focus:border-[#FF441F]" />
              <label className="text-xs text-[#71717A] font-medium">até</label>
              <input type="date" value={dtFim} onChange={(e) => setDtFim(e.target.value)}
                className="px-3 py-2 text-sm border border-[#E4E4E7] rounded-xl bg-[#FAFAFA] text-[#18181B] focus:outline-none focus:border-[#FF441F]" />
            </div>
          )}

          {/* Resultado */}
          <p className="text-xs text-[#A1A1AA]">
            {filtrado.length === historico.length
              ? `${historico.length} caixas`
              : `${filtrado.length} de ${historico.length} caixas`}
          </p>
        </div>

        {/* ── Lista ── */}
        {filtrado.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-12 text-center">
            <Icon name="FilterX" size={32} className="text-[#D4D4D8] mx-auto mb-3" />
            <p className="text-[#71717A] font-medium">Nenhum caixa encontrado com esses filtros.</p>
            <button onClick={() => { setBusca(''); setStatus('todos'); setModoDt('todos'); }}
              className="mt-4 text-sm text-[#FF441F] font-semibold hover:underline">
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrado.map((c) => {
              const r     = c.resumo ?? {};
              const isOpen = expandido === c.id;
              const det   = detalhe[c.id];
              const border = STATUS_BORDER[c.status] ?? 'border-l-gray-300';

              return (
                <div key={c.id} className={`bg-white rounded-2xl border border-[#E4E4E7] border-l-4 ${border} overflow-hidden`}>

                  {/* ── Card collapsed ── */}
                  <button onClick={() => handleExpand(c.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#FAFAFA] transition-colors">

                    {/* Ícone operador */}
                    <div className="w-9 h-9 rounded-xl bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
                      <Icon name="User" size={16} className="text-[#71717A]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </span>
                        <p className="text-sm font-bold text-[#18181B] truncate">{c.nome_operador}</p>
                        <p className="text-xs text-[#A1A1AA]">#{c.id}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <p className="text-xs text-[#71717A]">
                          <Icon name="Calendar" size={11} className="inline mr-1" />
                          {fmtDt(c.aberto_em)}
                          {c.fechado_em ? <> → {fmtDt(c.fechado_em)}</> : ''}
                        </p>
                        {r.total_pedidos > 0 && (
                          <p className="text-xs text-[#71717A]">
                            <Icon name="ShoppingBag" size={11} className="inline mr-1" />
                            {r.total_pedidos} pedidos
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 mr-2">
                      <p className="text-sm font-black text-[#18181B]">{fmt(r.saldo)}</p>
                      <p className="text-xs text-[#71717A]">vendas: {fmt(r.total_vendas)}</p>
                    </div>

                    <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-[#A1A1AA] flex-shrink-0" />
                  </button>

                  {/* ── Detalhe expandido ── */}
                  {isOpen && (
                    <div className="border-t border-[#F4F4F5] px-5 pb-5 pt-4">
                      {loadingDetalhe === c.id ? (
                        <div className="flex justify-center py-4">
                          <div className="w-5 h-5 border-[3px] border-[#FF441F] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : det ? (() => {
                          const saidas = det.caixa.saidas ?? [];
                          const pedidos = det.pedidos ?? [];
                          // Espécie: valor_inicial + vendas dinheiro - saídas dinheiro/sem meio
                          const vendasDinheiro = pedidos
                            .filter((p) => p.status === 'delivered' && p.payment_method === 'cash')
                            .reduce((s, p) => s + (p.total ?? 0), 0);
                          const saidas_dinheiro = saidas
                            .filter((s) => !s.meio || s.meio === 'dinheiro')
                            .reduce((s, x) => s + (x.valor ?? 0), 0);
                          const saldo_especie = (det.caixa.valor_inicial ?? 0) + vendasDinheiro - saidas_dinheiro;

                          const MEIO_LABELS = { dinheiro: '💵', pix: '🏦', transferencia: '🔀', cartao: '💳' };

                          return (
                          <div className="grid md:grid-cols-3 gap-4">

                            {/* Resumo financeiro + espécie */}
                            <div>
                              <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">Resumo</p>
                              <div className="bg-[#FAFAFA] rounded-xl p-3">
                                <Row label="Valor inicial"  value={fmt(det.caixa.valor_inicial)} />
                                <Row label="Total vendas"   value={fmt(r.total_vendas)} />
                                <Row label="Saídas"         value={`- ${fmt(r.total_saidas)}`} />
                                <Row label="Saldo"          value={fmt(r.saldo)} bold accent />
                                <Row label="Entregues"      value={r.entregues ?? 0} />
                                <Row label="Em andamento"   value={r.em_andamento ?? 0} />
                                <Row label="Cancelados"     value={r.cancelados ?? 0} />
                              </div>
                              {/* Espécie */}
                              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-3 mb-2">💵 Espécie (Dinheiro)</p>
                              <div className="bg-green-50 rounded-xl p-3">
                                <Row label="Fundo inicial"     value={fmt(det.caixa.valor_inicial)} />
                                <Row label="Vendas dinheiro"   value={fmt(vendasDinheiro)} />
                                <Row label="Saídas dinheiro"   value={`- ${fmt(saidas_dinheiro)}`} />
                                <div className="pt-1 border-t border-green-200 mt-1">
                                  <Row label="Saldo espécie"   value={fmt(saldo_especie)} bold />
                                </div>
                              </div>
                            </div>

                            {/* Pedidos */}
                            <div>
                              <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">
                                Pedidos ({pedidos.length})
                              </p>
                              <div className="bg-[#FAFAFA] rounded-xl p-3 max-h-52 overflow-y-auto space-y-0.5">
                                {pedidos.length === 0 ? (
                                  <p className="text-xs text-[#71717A] text-center py-2">Nenhum pedido</p>
                                ) : pedidos.map((p) => (
                                  <div key={p.id} className="flex justify-between text-xs py-1.5 border-b border-[#F4F4F5] last:border-0">
                                    <span className="font-semibold text-[#18181B]">#{p.id}</span>
                                    <span className="text-[#71717A]">{p.status}</span>
                                    <span className="font-bold text-[#18181B]">{fmt(p.total)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Saídas com meio */}
                            <div>
                              <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-2">
                                Saídas ({saidas.length})
                              </p>
                              <div className="bg-[#FAFAFA] rounded-xl p-3 max-h-52 overflow-y-auto">
                                {saidas.length === 0 ? (
                                  <p className="text-xs text-[#71717A] text-center py-2">Nenhuma saída</p>
                                ) : saidas.map((s, i) => (
                                  <div key={i} className="flex justify-between text-xs py-1.5 border-b border-[#F4F4F5] last:border-0">
                                    <span className="text-[#71717A] truncate mr-2 flex items-center gap-1">
                                      {MEIO_LABELS[s.meio] ?? '💵'}
                                      {s.descricao}
                                    </span>
                                    <span className="font-bold text-red-500 flex-shrink-0">- {fmt(s.valor)}</span>
                                  </div>
                                ))}
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
      </main>
    </div>
  );
};

export default RestauranteCaixa;
