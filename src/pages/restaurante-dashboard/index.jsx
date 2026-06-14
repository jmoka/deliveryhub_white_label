import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getMinhaEmpresa, getCaixa, abrirCaixa, fecharCaixa, fecharETransferir,
  adicionarSaida, buscarPedidoDetalhe, atualizarStatusPedido, toggleStatusRestaurante,
  listarMotoboys, atribuirMotoboy,
} from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import PedidoDetalhe from './PedidoDetalhe';
import RelatorioPanel from './RelatorioPanel';
import { printComanda } from '../../utils/printComanda';
import SaidaModal from './SaidaModal';
import FecharCaixaModal from './FecharCaixaModal';
import { supabase } from '../../lib/supabase';
import KpiCard from './KpiCard';
import AlertasToast from './AlertasToast';
import PedidoTimeline from './PedidoTimeline';
import MobileMenu from './MobileMenu';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS_LABELS = {
  pending:          { label: 'Recebido',   color: 'bg-yellow-100 text-yellow-800' },
  confirmed:        { label: 'Aguardando Preparo', color: 'bg-blue-100 text-blue-800' },
  preparing:        { label: 'Em Preparo', color: 'bg-orange-100 text-orange-800' },
  ready:            { label: 'Pronto',     color: 'bg-purple-100 text-purple-800' },
  out_for_delivery: { label: 'Em entrega', color: 'bg-indigo-100 text-indigo-800' },
  delivered:        { label: 'Entregue',   color: 'bg-green-100 text-green-800' },
  canceled:         { label: 'Cancelado',  color: 'bg-red-100 text-red-800' },
};

const FILTER_TABS = [
  { value: 'todos',            label: 'Todos',      activeColor: 'border-[#18181B] bg-[#18181B] text-white' },
  { value: 'pending',          label: 'Recebido',   activeColor: 'border-yellow-400 bg-yellow-100 text-yellow-800' },
  { value: 'confirmed',        label: 'Ag. Preparo', activeColor: 'border-blue-400 bg-blue-100 text-blue-800' },
  { value: 'preparing',        label: 'Cozinha',    activeColor: 'border-orange-400 bg-orange-100 text-orange-800' },
  { value: 'ready',            label: 'Pronto',     activeColor: 'border-purple-400 bg-purple-100 text-purple-800' },
  { value: 'out_for_delivery', label: 'Em Entrega', activeColor: 'border-indigo-400 bg-indigo-100 text-indigo-800' },
  { value: 'delivered',        label: 'Entregue',   activeColor: 'border-green-400 bg-green-100 text-green-800' },
  { value: 'canceled',        label: 'Cancelado',  activeColor: 'border-red-400 bg-red-100 text-red-800' },
];


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

const RestauranteDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [empresa, setEmpresa] = useState(null);
  const [statusAberto, setStatusAberto] = useState(false);
  const [caixa, setCaixa] = useState(null);
  const [valorInicial, setValorInicial] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState(null);
  const [pedidoDetalhe, setPedidoDetalhe] = useState(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [atualizando, setAtualizando] = useState(null);

  const [showSaida, setShowSaida] = useState(false);
  const [salvandoSaida, setSalvandoSaida] = useState(false);
  const [showFechar, setShowFechar] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [fechamento, setFechamento] = useState(null);
  const [motoboys, setMotoboys] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [menuAberto, setMenuAberto] = useState(false);
  const [nomeOperador, setNomeOperador] = useState('');
  const [pedidosAbertos, setPedidosAbertos] = useState([]);
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
      const [emp, caixaData, mbData] = await Promise.all([
        getMinhaEmpresa(), getCaixa(), listarMotoboys().catch(() => ({ motoboys: [] })),
      ]);
      setEmpresa(emp.empresa);
      setRestauranteId(emp.empresa?.id ?? null);
      const deveEstarAberto = caixaData.status_restaurante === true && !!caixaData.aberto;
      setStatusAberto(deveEstarAberto);
      // Se o DB diz aberto mas caixa está fechado, sincroniza o fechamento no backend
      if (caixaData.status_restaurante === true && !caixaData.aberto) {
        toggleStatusRestaurante(false).catch(() => {});
      }
      setCaixa(caixaData);
      setMotoboys(mbData.motoboys ?? []);
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

  const handleSelecionarPedido = async (id) => {
    if (pedidoSelecionadoId === id) { setPedidoSelecionadoId(null); setPedidoDetalhe(null); return; }
    setPedidoSelecionadoId(id);
    setPedidoDetalhe(null);
    setLoadingDetalhe(true);
    try {
      const d = await buscarPedidoDetalhe(id);
      setPedidoDetalhe(d);
    } catch (e) { alert(e.message); } finally { setLoadingDetalhe(false); }
  };

  const handleAvancarStatus = async (pedido, novoStatus) => {
    setAtualizando(pedido.id);
    try {
      await atualizarStatusPedido(pedido.id, novoStatus);
      const [novoCaixa, novoDetalhe] = await Promise.all([getCaixa(), buscarPedidoDetalhe(pedido.id)]);
      setCaixa(novoCaixa);
      setPedidoDetalhe(novoDetalhe);
      if (novoStatus === 'preparing' || novoStatus === 'confirmed') {
        const pedidoParaImprimir = { ...novoDetalhe.pedido, customers: novoDetalhe.cliente };
        printComanda(pedidoParaImprimir, novoDetalhe.itens ?? [], empresa?.name);
      }
    } catch (e) { alert(e.message); } finally { setAtualizando(null); }
  };

  const handleReimprimir = () => {
    if (!pedidoDetalhe) return;
    const p = { ...pedidoDetalhe.pedido, customers: pedidoDetalhe.cliente };
    printComanda(p, pedidoDetalhe.itens ?? [], empresa?.name);
  };

  const handleAtribuirMotoboy = async (pedidoId, motoboyId) => {
    try {
      await atribuirMotoboy(pedidoId, motoboyId);
      const [novoCaixa, novoDetalhe] = await Promise.all([getCaixa(), buscarPedidoDetalhe(pedidoId)]);
      setCaixa(novoCaixa);
      setPedidoDetalhe(novoDetalhe);
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
      setPedidoSelecionadoId(null); setPedidoDetalhe(null);
      setPedidosAbertos([]);
    } catch (e) {
      if (e.data?.pedidos) {
        setPedidosAbertos(e.data.pedidos);
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
      setPedidoSelecionadoId(null); setPedidoDetalhe(null);
      setPedidosAbertos([]);
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

      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#18181B]">{empresa?.name ?? 'Meu Restaurante'}</h1>
          <p className="text-sm text-[#71717A]">Painel Operacional</p>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex gap-1.5 flex-wrap items-center">
          {LINKS.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${l.path === '/restaurante' ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30' : 'text-[#27272A] hover:bg-[#F4F4F5]'}`}>
              {l.label}
            </button>
          ))}
          <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200">Sair</button>
        </nav>
        {/* Mobile hamburger */}
        <button className="md:hidden p-2 rounded-lg hover:bg-[#F4F4F5] text-[#18181B]"
          onClick={() => setMenuAberto((v) => !v)}>
          <Icon name={menuAberto ? 'X' : 'Menu'} size={22} />
        </button>
      </header>

      <AnimatePresence>
        {menuAberto && (
          <MobileMenu
            links={LINKS}
            currentPath="/restaurante"
            onNavigate={(path) => { navigate(path); setMenuAberto(false); }}
            onSair={async () => { await signOut(); navigate('/customer-registration-login'); }}
          />
        )}
      </AnimatePresence>

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

            {/* Breakdown espécie vs digital */}
            {(() => {
              const pedidos      = caixa.pedidos ?? [];
              const saidas       = caixa.saidas ?? [];
              const vendasCash   = pedidos.filter((p) => p.status === 'delivered' && p.payment_method === 'cash').reduce((s, p) => s + (p.total ?? 0), 0);
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

            {/* Pedidos do caixa: sidebar filtros + lista + detalhe */}
            {(() => {
              const todosPedidos = caixa.pedidos ?? [];
              const contagem = todosPedidos.reduce((acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; }, {});
              const pedidosFiltrados = filtroStatus === 'todos' ? todosPedidos : todosPedidos.filter((p) => p.status === filtroStatus);
              const colHeight = 'max-h-[calc(100vh-340px)]';
              return (
            <>
            {/* Mobile: filtros horizontal scroll */}
            <div className="flex md:hidden gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {FILTER_TABS.map((tab) => {
                const cnt = tab.value === 'todos' ? todosPedidos.length : (contagem[tab.value] ?? 0);
                const isActive = filtroStatus === tab.value;
                return (
                  <button key={tab.value} onClick={() => setFiltroStatus(tab.value)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isActive ? tab.activeColor : 'border-[#E4E4E7] bg-white text-[#71717A]'
                    }`}>
                    {tab.label}
                    {cnt > 0 && <span className="text-[10px] font-black px-1 py-0.5 rounded-full bg-black/10">{cnt}</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 items-start">

              {/* Sidebar de filtros — desktop */}
              <div className="hidden md:block w-44 flex-shrink-0 sticky top-4">
                <div className="bg-white rounded-2xl border border-[#E4E4E7] p-3 space-y-1">
                  <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest px-2 pb-1">Filtros</p>
                  {FILTER_TABS.map((tab) => {
                    const cnt = tab.value === 'todos' ? todosPedidos.length : (contagem[tab.value] ?? 0);
                    const isActive = filtroStatus === tab.value;
                    return (
                      <button key={tab.value} onClick={() => setFiltroStatus(tab.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          isActive ? tab.activeColor : 'border-transparent bg-transparent text-[#71717A] hover:bg-[#F4F4F5]'
                        }`}>
                        <span>{tab.label}</span>
                        {cnt > 0 && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-black/10' : 'bg-[#F4F4F5] text-[#27272A]'}`}>
                            {cnt}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lista + detalhe: 1 col mobile, 50/50 desktop quando detalhe aberto */}
              <div className={`flex-1 grid gap-4 ${pedidoDetalhe || loadingDetalhe ? 'md:grid-cols-2' : 'grid-cols-1'}`}>

                {/* Lista de pedidos */}
                <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 flex flex-col">
                  <h2 className="font-bold text-[#18181B] flex items-center gap-2 mb-4 flex-shrink-0">
                    <Icon name="ShoppingBag" size={16} className="text-[#FF441F]" />
                    Pedidos da sessão
                    <span className="text-xs font-normal text-[#71717A]">({todosPedidos.length})</span>
                  </h2>

                  <div className={`overflow-y-auto ${colHeight} pr-1`}>
                    {todosPedidos.length === 0 ? (
                      <p className="text-sm text-[#71717A] text-center py-8">Nenhum pedido nesta sessão ainda.</p>
                    ) : pedidosFiltrados.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-[#71717A]">Nenhum pedido com status <strong>{FILTER_TABS.find(t => t.value === filtroStatus)?.label}</strong>.</p>
                        <button onClick={() => setFiltroStatus('todos')} className="mt-2 text-xs text-[#FF441F] font-semibold hover:underline">Ver todos</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pedidosFiltrados.map((p) => {
                          const sl = STATUS_LABELS[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-700' };
                          const selected = pedidoSelecionadoId === p.id;
                          const clienteNome = p.customers?.name ?? null;
                          const isAtivo = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(p.status);
                          return (
                            <button key={p.id} onClick={() => handleSelecionarPedido(p.id)}
                              className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border transition-all text-left ${selected ? 'border-[#FF441F] bg-[#FFF4F1]' : 'border-[#F4F4F5] hover:border-[#E4E4E7] hover:bg-[#FAFAFA]'}`}>
                              <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 mt-0.5 ${
                                p.status === 'pending' ? 'bg-yellow-400' :
                                p.status === 'confirmed' ? 'bg-blue-400' :
                                p.status === 'preparing' ? 'bg-orange-400' :
                                p.status === 'ready' ? 'bg-purple-400' :
                                p.status === 'out_for_delivery' ? 'bg-indigo-400' :
                                p.status === 'delivered' ? 'bg-green-400' : 'bg-red-300'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className="text-sm font-bold text-[#18181B]">#{p.id}</p>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${sl.color}`}>{sl.label}</span>
                                      {isAtivo && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-auto flex-shrink-0" />}
                                    </div>
                                    {clienteNome && (
                                      <p className="text-xs font-semibold text-[#27272A] truncate">{clienteNome}</p>
                                    )}
                                    <p className="text-xs text-[#71717A]">{fmt(p.total)} · {p.payment_method === 'cash' ? 'Dinheiro' : p.payment_method === 'pix' ? 'PIX' : 'Cartão'}</p>
                                  </div>
                                  <p className="text-xs text-[#71717A] flex-shrink-0 tabular-nums">
                                    {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <PedidoTimeline status={p.status} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalhe do pedido */}
                <AnimatePresence>
                  {loadingDetalhe && (
                    <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 flex items-center justify-center">
                      <div className="w-6 h-6 border-[3px] border-[#FF441F] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {pedidoDetalhe && !loadingDetalhe && (
                    <div className={`bg-white rounded-2xl border border-[#E4E4E7] p-5 overflow-y-auto ${colHeight}`}>
                      <PedidoDetalhe
                        detalhe={pedidoDetalhe}
                        onAvancar={handleAvancarStatus}
                        onReimprimir={handleReimprimir}
                        atualizando={atualizando}
                        onClose={() => { setPedidoSelecionadoId(null); setPedidoDetalhe(null); }}
                        motoboys={motoboys}
                        onAtribuir={handleAtribuirMotoboy}
                        saldoCaixa={caixa?.resumo?.especie_calculada ?? caixa?.valor_inicial ?? 0}
                        onDetalheMudou={async () => {
                          if (!pedidoSelecionadoId) return;
                          try {
                            const d = await buscarPedidoDetalhe(pedidoSelecionadoId);
                            setPedidoDetalhe(d);
                          } catch {}
                        }}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            </>
              );
            })()}

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
          onConfirmar={handleFecharCaixa}
          onFecharETransferir={handleFecharETransferir}
          onCancelar={() => { setShowFechar(false); setPedidosAbertos([]); }}
          fechando={fechando}
        />
      )}
    </div>
  );
};

export default RestauranteDashboard;
