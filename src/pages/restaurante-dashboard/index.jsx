import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getMinhaEmpresa, getCaixa, abrirCaixa, fecharCaixa, fecharETransferir,
  adicionarSaida, toggleStatusRestaurante, getRelatorioFretes,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import RelatorioPanel from './RelatorioPanel';
import SaidaModal from './SaidaModal';
import FecharCaixaModal from './FecharCaixaModal';
import { supabase } from '../../lib/supabase';
import KpiCard from './KpiCard';
import AlertasToast from './AlertasToast';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const PAGAMENTO_LABEL = { cash: 'Dinheiro', pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito' };
const PAGAMENTO_ICONE = { cash: '💵', pix: '📲', credit_card: '💳', debit_card: '💳' };

const RestauranteDashboard = () => {
  const navigate = useNavigate();

  const [empresa, setEmpresa] = useState(null);
  const [statusAberto, setStatusAberto] = useState(false);
  const [caixa, setCaixa] = useState(null);
  const [valorInicial, setValorInicial] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [showSaida, setShowSaida] = useState(false);
  const [salvandoSaida, setSalvandoSaida] = useState(false);
  const [showFechar, setShowFechar] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [fechamento, setFechamento] = useState(null);
  const [relFretes, setRelFretes] = useState(null);
  const [periodoFretes, setPeriodoFretes] = useState('hoje');
  const [showDetalheFretes, setShowDetalheFretes] = useState(false);
  const [nomeOperador, setNomeOperador] = useState('');
  const [pedidosAbertos, setPedidosAbertos] = useState([]);
  const [comandasAbertas, setComandasAbertas] = useState([]);
  const [mesasAbertas, setMesasAbertas] = useState([]);
  const [restauranteId, setRestauranteId] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const alertaTimers = useRef({});
  const audioCtxRef = useRef(null);
  const lastCheckTimeRef = useRef(new Date().toISOString());
  const newPendingCountRef = useRef(0);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playNotification = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      const play = () => {
        const tone = (freq, start, dur, vol = 0.7) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = freq; o.type = 'square';
          g.gain.setValueAtTime(vol, ctx.currentTime + start);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
          o.start(ctx.currentTime + start);
          o.stop(ctx.currentTime + start + dur + 0.1);
        };
        tone(523, 0,    0.12); // C5
        tone(659, 0.15, 0.12); // E5
        tone(784, 0.3,  0.12); // G5
        tone(1047, 0.45, 0.3); // C6 — acorde final
      };
      if (ctx.state === 'suspended') ctx.resume().then(play);
      else play();
    } catch {}
  }, []);

  // Desbloquear AudioContext no primeiro gesto do usuário
  useEffect(() => {
    const unlock = () => { try { getAudioCtx().resume(); } catch {} };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Título da aba pisca com contagem de pedidos novos quando aba não está em foco
  const flashTitle = useCallback((count) => {
    newPendingCountRef.current = count;
    if (document.visibilityState === 'hidden') {
      document.title = `(${count}) 🔔 NOVO PEDIDO!`;
    }
  }, []);

  useEffect(() => {
    const onFocus = () => {
      newPendingCountRef.current = 0;
      document.title = 'Dashboard';
    };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, []);

  const carregar = async () => {
    try {
      const [emp, caixaData] = await Promise.all([getMinhaEmpresa(), getCaixa()]);
      setEmpresa(emp.empresa);
      setRestauranteId(emp.empresa?.id ?? null);
      const deveEstarAberto = caixaData.status_restaurante === true && !!caixaData.aberto;
      setStatusAberto(deveEstarAberto);
      // Se o DB diz aberto mas caixa está fechado, sincroniza o fechamento no backend
      if (caixaData.status_restaurante === true && !caixaData.aberto) {
        toggleStatusRestaurante(false).catch(() => {});
      }
      setCaixa(caixaData);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  const recarregarCaixa = useCallback(async () => {
    try {
      const data = await getCaixa();
      setCaixa(data);
    } catch { /* silent */ }
  }, []);

  const carregarRelFretes = useCallback(async (periodo) => {
    try {
      const data = await getRelatorioFretes(periodo);
      setRelFretes(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    carregarRelFretes(periodoFretes);
  }, [periodoFretes, carregarRelFretes]);

  useEffect(() => { carregar(); }, []);

  // Auto-refresh pedidos quando caixa aberto
  useEffect(() => {
    if (!caixa?.aberto) return;
    const id = setInterval(recarregarCaixa, 30000);
    return () => clearInterval(id);
  }, [caixa?.aberto, recarregarCaixa]);

  // Realtime: novo pedido → alerta visual + sonoro
  useEffect(() => {
    if (!restauranteId) return;
    const channel = supabase
      .channel(`dash-orders-${restauranteId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restauranteId}`,
      }, (payload) => {
        const p = payload.new;
        playNotification();
        flashTitle(newPendingCountRef.current + 1);
        lastCheckTimeRef.current = p.created_at ?? new Date().toISOString();
        const alerta = { id: p.id, total: p.total, ts: Date.now() };
        setAlertas((prev) => [...prev, alerta]);
        alertaTimers.current[p.id] = setTimeout(() => {
          setAlertas((prev) => prev.filter((a) => a.id !== p.id));
          delete alertaTimers.current[p.id];
        }, 10000);
        recarregarCaixa();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restauranteId}`,
      }, () => recarregarCaixa())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      Object.values(alertaTimers.current).forEach(clearTimeout);
    };
  }, [restauranteId, recarregarCaixa, playNotification, flashTitle]);

  // Polling fallback: detecta novos pedidos caso Realtime falhe
  useEffect(() => {
    if (!restauranteId) return;
    const poll = async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('id, total, created_at')
          .eq('restaurant_id', restauranteId)
          .eq('status', 'pending')
          .gt('created_at', lastCheckTimeRef.current)
          .order('created_at', { ascending: false });
        if (!data || data.length === 0) return;
        lastCheckTimeRef.current = data[0].created_at;
        playNotification();
        data.forEach((p) => {
          flashTitle(newPendingCountRef.current + 1);
          const alerta = { id: p.id, total: p.total, ts: Date.now() };
          setAlertas((prev) => prev.some((a) => a.id === p.id) ? prev : [...prev, alerta]);
          alertaTimers.current[p.id] = setTimeout(() => {
            setAlertas((prev) => prev.filter((a) => a.id !== p.id));
            delete alertaTimers.current[p.id];
          }, 10000);
        });
        recarregarCaixa();
      } catch {}
    };
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [restauranteId, playNotification, flashTitle, recarregarCaixa]);

  const handleToggleStatus = async (novoStatus) => {
    if (novoStatus && !caixa?.aberto) {
      alert('Abra o caixa antes de abrir o restaurante para aceitar pedidos.');
      return;
    }
    setStatusAberto(novoStatus);
    try { await toggleStatusRestaurante(novoStatus); } catch (e) { setStatusAberto(!novoStatus); alert(e.message); }
  };

  const handleAbrirCaixa = async () => {
    if (!nomeOperador.trim()) { alert('Informe o nome do operador'); return; }
    const vi = valorInicial !== '' ? parseFloat(valorInicial) : (caixa?.saldo_caixa ?? 0);
    try {
      const data = await abrirCaixa({ nome_operador: nomeOperador.trim(), valor_inicial: vi });
      setCaixa(data);
      setValorInicial('');
      setNomeOperador('');
    } catch (e) { alert(e.message); }
  };

  const handleAdicionarSaida = async (dados) => {
    setSalvandoSaida(true);
    try {
      await adicionarSaida(dados);
      const novoCaixa = await getCaixa();
      setCaixa(novoCaixa);
      setShowSaida(false);
    } catch (e) { alert(e.message); } finally { setSalvandoSaida(false); }
  };

  const handleFecharCaixa = async (destinacao = {}) => {
    setFechando(true);
    try {
      const res = await fecharCaixa(destinacao);
      setFechamento(res.fechamento ?? res);
      await recarregarCaixa();
      setShowFechar(false);
      setPedidosAbertos([]); setComandasAbertas([]); setMesasAbertas([]);
    } catch (e) {
      if (e.data?.pedidos || e.data?.comandas || e.data?.mesas) {
        setPedidosAbertos(e.data.pedidos ?? []);
        setComandasAbertas(e.data.comandas ?? []);
        setMesasAbertas(e.data.mesas ?? []);
      } else {
        alert(e.message);
      }
    } finally { setFechando(false); }
  };

  const handleFecharETransferir = async ({ nome_operador, valor_inicial }) => {
    setFechando(true);
    try {
      const res = await fecharETransferir({ nome_operador, valor_inicial });
      setFechamento(res.fechamento);
      await recarregarCaixa();
      setShowFechar(false);
      setPedidosAbertos([]); setComandasAbertas([]); setMesasAbertas([]);
    } catch (e) { alert(e.message); } finally { setFechando(false); }
  };


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

  const r = caixa?.resumo;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      <AlertasToast alertas={alertas} onDismiss={(id) => setAlertas((prev) => prev.filter((a) => a.id !== id))} />

      <RestauranteHeader active="/restaurante" title={empresa?.name ?? 'Meu Restaurante'} subtitle="Painel Operacional" />

      <main className="p-6 w-[95%] mx-auto space-y-5">

        {/* Fechamento anterior */}
        {fechamento && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-800">Caixa fechado com sucesso</p>
              <p className="text-xs text-green-600">Vendas: {fmt(fechamento.resumo?.total_vendas)} · Saldo: {fmt(fechamento.resumo?.saldo)}</p>
            </div>
            <button onClick={() => setFechamento(null)} className="text-green-400 hover:text-green-600 p-1"><Icon name="X" size={16} /></button>
          </motion.div>
        )}

        {/* Status restaurante */}
        <motion.div animate={{ borderColor: statusAberto ? '#22C55E' : '#EF4444' }}
          className={`rounded-2xl border-2 p-4 flex items-center justify-between ${statusAberto ? 'bg-green-50' : 'bg-red-50'}`}>
          <div>
            <p className="font-black text-[#18181B]">{statusAberto ? '🟢 Restaurante ABERTO' : '🔴 Restaurante FECHADO'}</p>
            <p className="text-xs text-[#71717A] mt-0.5">{statusAberto ? 'Clientes podem fazer pedidos agora.' : 'Pedidos pausados.'}</p>
          </div>
          <button type="button" onClick={() => handleToggleStatus(!statusAberto)}
            className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${statusAberto ? 'bg-green-500' : 'bg-red-400'}`}>
            <span className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${statusAberto ? 'left-8' : 'left-1.5'}`} />
          </button>
        </motion.div>

        {/* Caixa — expirado (8h) */}
        {caixa?.expirado && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={18} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">Caixa expirado</p>
                <p className="text-xs text-red-600">Mais de 8h desde a abertura. Feche para continuar operando.</p>
              </div>
            </div>
            <button onClick={() => setShowFechar(true)}
              className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 flex-shrink-0">
              Fechar caixa
            </button>
          </div>
        )}

        {/* Caixa — fechado */}
        {!caixa?.aberto && !caixa?.expirado && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Wallet" size={18} className="text-[#FF441F]" />
              <h2 className="font-bold text-[#18181B]">Caixa</h2>
              <span className="ml-auto text-xs bg-[#F4F4F5] text-[#71717A] px-2 py-0.5 rounded-full font-medium">Fechado</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#71717A] mb-1">Nome do operador *</label>
                <input value={nomeOperador} onChange={(e) => setNomeOperador(e.target.value)}
                  placeholder="Ex: João"
                  className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#71717A] mb-1">
                    Valor inicial (R$)
                    {(caixa?.saldo_caixa ?? 0) > 0 && <span className="ml-1 text-[#FF441F]">← cofre</span>}
                  </label>
                  <input type="number" min="0" step="0.01"
                    value={valorInicial !== '' ? valorInicial : (caixa?.saldo_caixa ?? '')}
                    onChange={(e) => setValorInicial(e.target.value)}
                    placeholder={caixa?.saldo_caixa > 0 ? String(caixa.saldo_caixa) : '0,00'}
                    className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
                </div>
                <div className="flex items-end">
                  <button onClick={handleAbrirCaixa}
                    className="px-5 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] transition-colors whitespace-nowrap">
                    Abrir caixa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Caixa — aberto */}
        {caixa?.aberto && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard icon="TrendingUp" label="Vendas" value={fmt(r?.total_vendas)} sub={`${r?.entregues ?? 0} entregues`} color="green" />
              <KpiCard icon="Clock" label="Em andamento" value={r?.em_andamento ?? 0} sub={`${r?.cancelados ?? 0} cancelados`} color="blue" />
              <KpiCard icon="ArrowDownLeft" label="Saídas" value={fmt(r?.total_saidas)} sub={`${caixa?.saidas?.length ?? 0} registros`} color="red" />
              <KpiCard icon="Wallet" label="Saldo caixa" value={fmt(r?.saldo)} sub={`Inicial: ${fmt(caixa.valor_inicial)}`} color="orange" />
            </div>

            {/* KPIs Fretes + Troco */}
            <div className="grid grid-cols-2 gap-3">
              <KpiCard icon="Truck" label="Fretes cobrados" value={fmt(relFretes?.total_fretes)} sub={`${relFretes?.qtd_entregas ?? 0} entregas`} color="blue" />
              <KpiCard icon="Coins" label="Troco dado" value={fmt(relFretes?.total_troco)} sub={`pagamentos em dinheiro`} color="purple" />
            </div>

            {/* Filtro período + tabela detalhe por motoboy */}
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => setShowDetalheFretes((v) => !v)}
                  className="flex items-center gap-2 text-sm font-semibold text-[#18181B] hover:text-[#FF441F]"
                >
                  <Icon name="Truck" size={16} />
                  Fretes e Troco por motoboy
                  <Icon name={showDetalheFretes ? 'ChevronUp' : 'ChevronDown'} size={14} />
                </button>
                <div className="flex gap-1">
                  {[
                    { v: 'hoje', l: 'Hoje' },
                    { v: 'semana', l: '7d' },
                    { v: 'mes', l: 'Mês' },
                    { v: 'ano', l: 'Ano' },
                    { v: 'tudo', l: 'Tudo' },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      onClick={() => setPeriodoFretes(v)}
                      className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors ${periodoFretes === v ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {showDetalheFretes && (
                <div className="mt-4 space-y-3">
                  {/* Por motoboy */}
                  {relFretes?.por_motoboy?.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wide mb-2">Por motoboy</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-xs text-[#71717A]">
                              <th className="text-left py-1.5 pr-3">Motoboy</th>
                              <th className="text-right py-1.5 px-2 whitespace-nowrap">Entregas</th>
                              <th className="text-right py-1.5 px-2 whitespace-nowrap">Fretes</th>
                              <th className="text-right py-1.5 pl-2 whitespace-nowrap">Troco dado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relFretes.por_motoboy.map((m) => (
                              <tr key={m.motoboy_id} className="border-b last:border-0">
                                <td className="py-1.5 pr-3 font-medium text-[#18181B]">{m.nome}</td>
                                <td className="py-1.5 px-2 text-right text-[#71717A]">{m.entregas}</td>
                                <td className="py-1.5 px-2 text-right text-green-700 font-semibold">{fmt(m.fretes)}</td>
                                <td className="py-1.5 pl-2 text-right text-orange-700 font-semibold">{fmt(m.troco)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#71717A] text-center py-4">Nenhuma entrega no período</p>
                  )}

                  {/* Por dia */}
                  {relFretes?.por_dia?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wide mb-2 mt-4">Por dia</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-xs text-[#71717A]">
                              <th className="text-left py-1.5 pr-3">Data</th>
                              <th className="text-right py-1.5 px-2 whitespace-nowrap">Entregas</th>
                              <th className="text-right py-1.5 px-2 whitespace-nowrap">Fretes</th>
                              <th className="text-right py-1.5 pl-2 whitespace-nowrap">Troco dado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relFretes.por_dia.map((d) => (
                              <tr key={d.dia} className="border-b last:border-0">
                                <td className="py-1.5 pr-3 font-medium text-[#18181B]">{d.dia}</td>
                                <td className="py-1.5 px-2 text-right text-[#71717A]">{d.entregas}</td>
                                <td className="py-1.5 px-2 text-right text-green-700 font-semibold">{fmt(d.fretes)}</td>
                                <td className="py-1.5 pl-2 text-right text-orange-700 font-semibold">{fmt(d.troco)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Breakdown espécie vs digital */}
            {(() => {
              const pedidos      = caixa.pedidos ?? [];
              const saidas       = caixa.saidas ?? [];
              const vendasCash   = pedidos.filter((p) => ['delivered', 'paga'].includes(p.status) && p.payment_method === 'cash').reduce((s, p) => s + (p.total ?? 0), 0);
              const saidas_cash  = saidas.filter((s) => !s.meio || s.meio === 'dinheiro').reduce((s, x) => s + (x.valor ?? 0), 0);
              const saldoEspecie = (caixa.valor_inicial ?? 0) + vendasCash - saidas_cash;
              const saldoDigital = (r?.total_vendas ?? 0) - vendasCash;
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">💵 Fundo inicial</p>
                    <p className="text-lg font-black text-green-700">{fmt(caixa.valor_inicial)}</p>
                    <p className="text-[10px] text-green-600">em espécie</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">💵 Vendas espécie</p>
                    <p className="text-lg font-black text-green-700">{fmt(vendasCash)}</p>
                    <p className="text-[10px] text-green-600">pagos em dinheiro</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">🏦 Vendas digital</p>
                    <p className="text-lg font-black text-blue-700">{fmt(saldoDigital)}</p>
                    <p className="text-[10px] text-blue-600">PIX / cartão</p>
                  </div>
                  <div className="bg-[#FF441F]/5 border border-[#FF441F]/30 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-black text-[#FF441F] uppercase tracking-widest mb-1">💵 Espécie no caixa</p>
                    <p className="text-lg font-black text-[#FF441F]">{fmt(saldoEspecie)}</p>
                    <p className="text-[10px] text-[#FF441F]">estimativa física</p>
                  </div>
                </div>
              );
            })()}

            {/* Recebido por forma de pagamento (delivery + salão combinados) */}
            {Object.keys(r?.por_pagamento ?? {}).length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4">
                <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest mb-3">Recebido por forma de pagamento</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(r.por_pagamento).map(([metodo, valor]) => (
                    <div key={metodo} className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-3 text-center">
                      <p className="text-lg">{PAGAMENTO_ICONE[metodo] ?? '💰'}</p>
                      <p className="text-base font-black text-[#18181B]">{fmt(valor)}</p>
                      <p className="text-[10px] text-[#71717A]">{PAGAMENTO_LABEL[metodo] ?? metodo}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barra caixa */}
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#18181B]">Caixa aberto</p>
                  <p className="text-xs text-[#71717A]">Desde {new Date(caixa.aberto_em).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setShowSaida(true)}
                  className="px-3 py-1.5 text-xs font-semibold border border-[#E4E4E7] rounded-lg text-[#27272A] hover:bg-[#F4F4F5] flex items-center gap-1">
                  <Icon name="ArrowDownLeft" size={13} /> Saída
                </button>
                <button onClick={() => setShowFechar(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1">
                  <Icon name="Lock" size={13} /> Fechar caixa
                </button>
              </div>
            </div>

            {/* Pedidos de delivery agora têm painel próprio — ver /restaurante/delivery */}
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF441F]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="Bike" size={18} className="text-[#FF441F]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#18181B]">Pedidos de delivery</p>
                  <p className="text-xs text-[#71717A]">Acompanhe, avance status e atribua motoboy no painel dedicado</p>
                </div>
              </div>
              <button onClick={() => navigate('/restaurante/delivery')}
                className="px-4 py-2 text-sm font-bold bg-[#FF441F] text-white rounded-xl hover:bg-[#E63A19] flex items-center gap-1.5 flex-shrink-0">
                Abrir painel Delivery <Icon name="ArrowRight" size={14} />
              </button>
            </div>

            {/* Saídas */}
            {(caixa.saidas?.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5">
                <h2 className="font-bold text-[#18181B] mb-3 flex items-center gap-2">
                  <Icon name="ArrowDownLeft" size={16} className="text-red-500" /> Saídas registradas
                </h2>
                <div className="space-y-2">
                  {caixa.saidas.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-[#F4F4F5] last:border-0">
                      <div>
                        <p className="font-medium text-[#18181B]">{s.descricao}</p>
                        <p className="text-xs text-[#71717A]">
                          {new Date(s.criado_em).toLocaleString('pt-BR')}
                          {s.meio && <span className="ml-1.5 px-1.5 py-0.5 bg-[#F4F4F5] rounded text-[10px] font-semibold">{s.meio}</span>}
                        </p>
                      </div>
                      <p className="font-bold text-red-500">- {fmt(s.valor)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <RelatorioPanel restauranteNome={empresa?.name} />
          </>
        )}
      </main>

      {showSaida && (
        <SaidaModal
          onConfirmar={handleAdicionarSaida}
          onFechar={() => setShowSaida(false)}
          salvando={salvandoSaida}
        />
      )}

      {showFechar && (
        <FecharCaixaModal
          resumo={caixa?.resumo}
          aberto_em={caixa?.aberto_em}
          valorInicial={caixa?.valor_inicial}
          pedidosAbertos={pedidosAbertos}
          comandasAbertas={comandasAbertas}
          mesasAbertas={mesasAbertas}
          onConfirmar={handleFecharCaixa}
          onFecharETransferir={handleFecharETransferir}
          onCancelar={() => { setShowFechar(false); setPedidosAbertos([]); setComandasAbertas([]); setMesasAbertas([]); }}
          fechando={fechando}
        />
      )}
    </div>
  );
};

export default RestauranteDashboard;
