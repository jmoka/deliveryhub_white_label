import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getMinhaEmpresa, getCaixa, abrirCaixa, toggleStatusRestaurante, getRelatorioFretes, getConfig,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import RelatorioPanel from './RelatorioPanel';
import SaldoDiaModal from './SaldoDiaModal';
import CaixaAtualPanel from '../restaurante-financeiro/CaixaAtualPanel';
import { supabase } from '../../lib/supabase';
import KpiCard from './KpiCard';
import AlertasToast from './AlertasToast';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useTerminologiaEstabelecimento } from '../../hooks/useTerminologiaEstabelecimento';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const RestauranteDashboard = () => {
  const navigate = useNavigate();
  const { planoStatus } = useAuth();
  const { termos } = useTerminologiaEstabelecimento();
  const { moduloDelivery, moduloSalao } = useModulosEmpresa();

  const [empresa, setEmpresa] = useState(null);
  const [statusAberto, setStatusAberto] = useState(false);
  const [caixa, setCaixa] = useState(null);
  const [valorInicial, setValorInicial] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [fechamento, setFechamento] = useState(null);
  const [relFretes, setRelFretes] = useState(null);
  const [periodoFretes, setPeriodoFretes] = useState('hoje');
  const [showDetalheFretes, setShowDetalheFretes] = useState(false);
  const [showSaldoDia, setShowSaldoDia] = useState(false);
  const [nomeOperador, setNomeOperador] = useState('');
  const [taxaPagbank, setTaxaPagbank] = useState(0);
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
  useEffect(() => { getConfig().then((cfg) => setTaxaPagbank(cfg.taxa_pagbank_percent ?? 0)).catch(() => {}); }, []);

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
      alert('Abra o caixa antes de abrir a loja virtual para aceitar pedidos.');
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#18181B]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#18181B]">
      <p className="text-red-600 dark:text-red-400 text-sm">{erro}</p>
    </div>
  );

  const r = caixa?.resumo;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">

      <AlertasToast alertas={alertas} onDismiss={(id) => setAlertas((prev) => prev.filter((a) => a.id !== id))} />

      <RestauranteHeader
        active="/restaurante"
        title={empresa?.name ?? `Meu ${termos.estabelecimento}`}
        subtitle={`Painel Operacional${planoStatus?.plano_nome ? ` · ${planoStatus.plano_nome}` : ''}`}
        onRefresh={carregar}
      />

      <main className="p-6 w-[95%] mx-auto space-y-5">

        {/* Fechamento anterior */}
        {fechamento && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-400">Caixa fechado com sucesso</p>
              <p className="text-xs text-green-600 dark:text-green-400">Vendas: {fmt(fechamento.resumo?.total_vendas)} · Saldo: {fmt(fechamento.resumo?.saldo)}</p>
            </div>
            <button onClick={() => setFechamento(null)} className="text-green-400 hover:text-green-600 dark:hover:text-green-400 p-1"><Icon name="X" size={16} /></button>
          </motion.div>
        )}

        {/* Status loja virtual (delivery) — independente do caixa/salão. Só faz
            sentido se o módulo delivery estiver liberado pra essa empresa; sem
            ele não existe loja virtual pra abrir/fechar. */}
        {moduloDelivery && (
        <motion.div animate={{ borderColor: statusAberto ? '#22C55E' : '#EF4444' }}
          className={`rounded-2xl border-2 p-4 flex items-center justify-between ${statusAberto ? 'bg-green-50 dark:bg-green-950/40' : 'bg-red-50 dark:bg-red-950/40'}`}>
          <div>
            <p className="font-black text-[#18181B] dark:text-[#F4F4F5]">{statusAberto ? '🟢 LOJA VIRTUAL ABERTA' : '🔴 LOJA VIRTUAL FECHADA'}</p>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              {statusAberto
                ? 'Clientes podem fazer pedidos pelo site/app agora.'
                : `Site/app fora do ar pra pedidos. O caixa continua funcionando normalmente — use isso pra atender só no ${termos.estabelecimento.toLowerCase()} sem abrir a loja virtual.`}
            </p>
          </div>
          <button type="button" onClick={() => handleToggleStatus(!statusAberto)}
            className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${statusAberto ? 'bg-green-500' : 'bg-red-400'}`}>
            <span className={`absolute top-1.5 w-4 h-4 bg-white dark:bg-[#27272A] rounded-full shadow transition-transform ${statusAberto ? 'left-8' : 'left-1.5'}`} />
          </button>
        </motion.div>
        )}

        {/* Caixa — expirado (8h). O botão de fechar já está no painel de caixa abaixo
            (CaixaAtualPanel) — aqui é só o aviso. */}
        {caixa?.expirado && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-2">
            <Icon name="AlertTriangle" size={18} className="text-red-500 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-400">Caixa expirado</p>
              <p className="text-xs text-red-600 dark:text-red-400">Mais de 8h desde a abertura. Feche o caixa abaixo para continuar operando.</p>
            </div>
          </div>
        )}

        {/* Caixa — fechado */}
        {!caixa?.aberto && !caixa?.expirado && (
          <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Wallet" size={18} className="text-[#FF441F]" />
              <h2 className="font-bold text-[#18181B] dark:text-[#F4F4F5]">Caixa</h2>
              <span className="ml-auto text-xs bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA] px-2 py-0.5 rounded-full font-medium">Fechado</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] mb-1">Nome do operador *</label>
                <input value={nomeOperador} onChange={(e) => setNomeOperador(e.target.value)}
                  placeholder="Ex: João"
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] mb-1">
                    Valor inicial (R$)
                    {(caixa?.saldo_caixa ?? 0) > 0 && <span className="ml-1 text-[#FF441F]">← cofre</span>}
                  </label>
                  <input type="number" min="0" step="0.01"
                    value={valorInicial !== '' ? valorInicial : (caixa?.saldo_caixa ?? '')}
                    onChange={(e) => setValorInicial(e.target.value)}
                    placeholder={caixa?.saldo_caixa > 0 ? String(caixa.saldo_caixa) : '0,00'}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
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
            {/* KPIs exclusivos daqui — Vendas/Saídas já aparecem no CaixaAtualPanel abaixo (Total
                Vendas/Sangrias), então só ficam os dois que não têm equivalente lá. */}
            <div className="grid grid-cols-2 gap-3">
              <KpiCard icon="Clock" label="Em andamento" value={r?.em_andamento ?? 0} sub={`${r?.cancelados ?? 0} cancelados`} color="blue" />
              <KpiCard icon="Wallet" label="Saldo geral do dia" value={fmt(r?.saldo)} sub={`Inicial: ${fmt(caixa.valor_inicial)}`} color="orange" onClick={() => setShowSaldoDia(true)} />
            </div>

            {/* Fretes/motoboy só existem em pedido de delivery ou salão — prestador
                100% serviço não tem motoboy nem esse tipo de troco pra conferir. */}
            {(moduloDelivery || moduloSalao) && (
            <>
            {/* KPIs Fretes + Troco */}
            <div className="grid grid-cols-2 gap-3">
              <KpiCard icon="Truck" label="Fretes cobrados" value={fmt(relFretes?.total_fretes)} sub={`${relFretes?.qtd_entregas ?? 0} entregas`} color="blue" />
              <KpiCard icon="Coins" label="Troco dado" value={fmt(relFretes?.total_troco)} sub={`pagamentos em dinheiro`} color="purple" />
            </div>

            {/* Filtro período + tabela detalhe por motoboy */}
            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => setShowDetalheFretes((v) => !v)}
                  className="flex items-center gap-2 text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] hover:text-[#FF441F]"
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
                      className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors ${periodoFretes === v ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46]'}`}
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
                      <p className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide mb-2">Por motoboy</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-xs text-[#71717A] dark:text-[#A1A1AA]">
                              <th className="text-left py-1.5 pr-3">Motoboy</th>
                              <th className="text-right py-1.5 px-2 whitespace-nowrap">Entregas</th>
                              <th className="text-right py-1.5 px-2 whitespace-nowrap">Fretes</th>
                              <th className="text-right py-1.5 pl-2 whitespace-nowrap">Troco dado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relFretes.por_motoboy.map((m) => (
                              <tr key={m.motoboy_id} className="border-b last:border-0">
                                <td className="py-1.5 pr-3 font-medium text-[#18181B] dark:text-[#F4F4F5]">{m.nome}</td>
                                <td className="py-1.5 px-2 text-right text-[#71717A] dark:text-[#A1A1AA]">{m.entregas}</td>
                                <td className="py-1.5 px-2 text-right text-green-700 dark:text-green-400 font-semibold">{fmt(m.fretes)}</td>
                                <td className="py-1.5 pl-2 text-right text-orange-700 dark:text-orange-400 font-semibold">{fmt(m.troco)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-4">Nenhuma entrega no período</p>
                  )}

                  {/* Por dia */}
                  {relFretes?.por_dia?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide mb-2 mt-4">Por dia</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-xs text-[#71717A] dark:text-[#A1A1AA]">
                              <th className="text-left py-1.5 pr-3">Data</th>
                              <th className="text-right py-1.5 px-2 whitespace-nowrap">Entregas</th>
                              <th className="text-right py-1.5 px-2 whitespace-nowrap">Fretes</th>
                              <th className="text-right py-1.5 pl-2 whitespace-nowrap">Troco dado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relFretes.por_dia.map((d) => (
                              <tr key={d.dia} className="border-b last:border-0">
                                <td className="py-1.5 pr-3 font-medium text-[#18181B] dark:text-[#F4F4F5]">{d.dia}</td>
                                <td className="py-1.5 px-2 text-right text-[#71717A] dark:text-[#A1A1AA]">{d.entregas}</td>
                                <td className="py-1.5 px-2 text-right text-green-700 dark:text-green-400 font-semibold">{fmt(d.fretes)}</td>
                                <td className="py-1.5 pl-2 text-right text-orange-700 dark:text-orange-400 font-semibold">{fmt(d.troco)}</td>
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
            </>
            )}

            {/* Painel de caixa completo (mesmo componente do Financeiro) — ações de
                Sangria/Adição/Fechar Caixa, espécie vs digital, vendas por método e
                movimentos recentes com opção de retornar sangria. */}
            <CaixaAtualPanel caixa={caixa} taxaPagbank={taxaPagbank} onRefresh={recarregarCaixa} restauranteNome={empresa?.name} onFechado={setFechamento} />

            {/* Pedidos de delivery agora têm painel próprio — ver /restaurante/delivery.
                Prestador 100% serviço não tem pedido de delivery pra acompanhar aqui. */}
            {(moduloDelivery || moduloSalao) && (
            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF441F]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="Bike" size={18} className="text-[#FF441F]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">Pedidos de delivery</p>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Acompanhe, avance status e atribua motoboy no painel dedicado</p>
                </div>
              </div>
              <button onClick={() => navigate('/restaurante/delivery')}
                className="px-4 py-2 text-sm font-bold bg-[#FF441F] text-white rounded-xl hover:bg-[#E63A19] flex items-center gap-1.5 flex-shrink-0">
                Abrir painel Delivery <Icon name="ArrowRight" size={14} />
              </button>
            </div>
            )}

            <RelatorioPanel restauranteNome={empresa?.name} />
          </>
        )}
      </main>

      {showSaldoDia && (
        <SaldoDiaModal
          resumo={caixa?.resumo}
          valorInicial={caixa?.valor_inicial}
          onFechar={() => setShowSaldoDia(false)}
        />
      )}
    </div>
  );
};

export default RestauranteDashboard;
