import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  getMinhaEmpresa, getCaixa, buscarPedidoDetalhe, atualizarStatusPedido,
  listarMotoboys, atribuirMotoboy, entregarPedidoProprio,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import PedidoDetalhe from '../restaurante-dashboard/PedidoDetalhe';
import PedidoTimeline from '../restaurante-dashboard/PedidoTimeline';
import { printComanda } from '../../utils/printComanda';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS_LABELS = {
  pending:          { label: 'Recebido',   color: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400' },
  confirmed:        { label: 'Aguardando Preparo', color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400' },
  preparing:        { label: 'Em Preparo', color: 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400' },
  ready:            { label: 'Pronto',     color: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400' },
  out_for_delivery: { label: 'Em entrega', color: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400' },
  delivered:        { label: 'Entregue',   color: 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400' },
  canceled:         { label: 'Cancelado',  color: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400' },
};

const FILTER_TABS = [
  { value: 'todos',            label: 'Todos',      activeColor: 'border-[#18181B] bg-[#18181B] text-white' },
  { value: 'pending',          label: 'Recebido',   activeColor: 'border-yellow-400 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400' },
  { value: 'confirmed',        label: 'Ag. Preparo', activeColor: 'border-blue-400 dark:border-blue-800 bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400' },
  { value: 'preparing',        label: 'Cozinha',    activeColor: 'border-orange-400 dark:border-orange-800 bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400' },
  { value: 'ready',            label: 'Pronto',     activeColor: 'border-purple-400 dark:border-purple-800 bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400' },
  { value: 'out_for_delivery', label: 'Em Entrega', activeColor: 'border-indigo-400 dark:border-indigo-800 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400' },
  { value: 'delivered',        label: 'Entregue',   activeColor: 'border-green-400 dark:border-green-800 bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400' },
  { value: 'canceled',         label: 'Cancelado',  activeColor: 'border-red-400 dark:border-red-800 bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400' },
];


// Painel dedicado só ao delivery — extraído da seção "Pedidos da sessão" do Dashboard
// principal, que misturava pedidos de delivery com comandas do salão (status "aberta"
// aparecia sem tradução, confuso). Aqui o filtro de canal já vem aplicado: só delivery.
const RestauranteDelivery = () => {
  const [empresa, setEmpresa] = useState(null);
  const [caixa, setCaixa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [motoboys, setMotoboys] = useState([]);

  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState(null);
  const [pedidoDetalhe, setPedidoDetalhe] = useState(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [atualizando, setAtualizando] = useState(null);

  const recarregarCaixa = useCallback(async () => {
    try {
      const data = await getCaixa();
      setCaixa(data);
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      getMinhaEmpresa().then((d) => setEmpresa(d.empresa)).catch(() => {}),
      listarMotoboys().then((r) => setMotoboys(r.motoboys ?? [])).catch(() => {}),
    ]);
    recarregarCaixa();
  }, [recarregarCaixa]);

  useEffect(() => {
    const id = setInterval(recarregarCaixa, 20000);
    return () => clearInterval(id);
  }, [recarregarCaixa]);

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

  const handleEntregarProprio = async (pedido) => {
    await entregarPedidoProprio(pedido.id);
    const [novoDetalhe] = await Promise.all([buscarPedidoDetalhe(pedido.id)]);
    setPedidoDetalhe(novoDetalhe);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#18181B]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const todosPedidos = (caixa?.pedidos ?? []).filter((p) => p.canal !== 'presencial');
  const contagem = todosPedidos.reduce((acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; }, {});
  const pedidosFiltrados = filtroStatus === 'todos' ? todosPedidos : todosPedidos.filter((p) => p.status === filtroStatus);
  const colHeight = 'max-h-[calc(100vh-280px)]';

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/delivery" title="Delivery" />

      <main className="p-4 max-w-6xl mx-auto">
        {erro && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{erro}</p>}

        {!caixa?.aberto ? (
          <div className="text-center py-16">
            <Icon name="Lock" size={40} className="text-[#D4D4D8] mx-auto mb-3" />
            <p className="text-[#71717A] dark:text-[#A1A1AA] font-semibold">Nenhum caixa aberto agora</p>
            <p className="text-[#A1A1AA] text-sm mt-1">Abra o caixa no Dashboard pra começar a receber pedidos.</p>
          </div>
        ) : (
          <>
            {/* Mobile: filtros horizontal scroll */}
            <div className="flex md:hidden gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {FILTER_TABS.map((tab) => {
                const cnt = tab.value === 'todos' ? todosPedidos.length : (contagem[tab.value] ?? 0);
                const isActive = filtroStatus === tab.value;
                return (
                  <button key={tab.value} onClick={() => setFiltroStatus(tab.value)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isActive ? tab.activeColor : 'border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA]'
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
                <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-3 space-y-1">
                  <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-widest px-2 pb-1">Filtros</p>
                  {FILTER_TABS.map((tab) => {
                    const cnt = tab.value === 'todos' ? todosPedidos.length : (contagem[tab.value] ?? 0);
                    const isActive = filtroStatus === tab.value;
                    return (
                      <button key={tab.value} onClick={() => setFiltroStatus(tab.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          isActive ? tab.activeColor : 'border-transparent bg-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]'
                        }`}>
                        <span>{tab.label}</span>
                        {cnt > 0 && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-black/10' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5]'}`}>
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
                <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-5 flex flex-col">
                  <h2 className="font-bold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2 mb-4 flex-shrink-0">
                    <Icon name="Bike" size={16} className="text-[#FF441F]" />
                    Pedidos delivery
                    <span className="text-xs font-normal text-[#71717A] dark:text-[#A1A1AA]">({todosPedidos.length})</span>
                  </h2>

                  <div className={`overflow-y-auto ${colHeight} pr-1`}>
                    {todosPedidos.length === 0 ? (
                      <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-8">Nenhum pedido de delivery nesta sessão ainda.</p>
                    ) : pedidosFiltrados.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Nenhum pedido com status <strong>{FILTER_TABS.find((t) => t.value === filtroStatus)?.label}</strong>.</p>
                        <button onClick={() => setFiltroStatus('todos')} className="mt-2 text-xs text-[#FF441F] font-semibold hover:underline">Ver todos</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pedidosFiltrados.map((p) => {
                          const sl = STATUS_LABELS[p.status] ?? { label: p.status, color: 'bg-gray-100 dark:bg-gray-950/40 text-gray-700 dark:text-gray-400' };
                          const selected = pedidoSelecionadoId === p.id;
                          const clienteNome = p.customers?.name ?? null;
                          const isAtivo = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(p.status);
                          return (
                            <button key={p.id} onClick={() => handleSelecionarPedido(p.id)}
                              className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border transition-all text-left ${selected ? 'border-[#FF441F] bg-[#FFF4F1] dark:bg-[#3F2620]' : 'border-[#F4F4F5] dark:border-[#3F3F46] hover:border-[#E4E4E7] dark:hover:border-[#3F3F46] hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]'}`}>
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
                                      <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">#{p.id}</p>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${sl.color}`}>{sl.label}</span>
                                      {isAtivo && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-auto flex-shrink-0" />}
                                    </div>
                                    {clienteNome && (
                                      <p className="text-xs font-semibold text-[#27272A] dark:text-[#F4F4F5] truncate">{clienteNome}</p>
                                    )}
                                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{fmt(p.total)} · {p.payment_method === 'cash' ? 'Dinheiro' : p.payment_method === 'pix' ? 'PIX' : 'Cartão'}</p>
                                  </div>
                                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex-shrink-0 tabular-nums">
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

                <AnimatePresence>
                  {loadingDetalhe && (
                    <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-5 flex items-center justify-center">
                      <div className="w-6 h-6 border-[3px] border-[#FF441F] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {pedidoDetalhe && !loadingDetalhe && (
                    <div className={`bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-5 overflow-y-auto ${colHeight}`}>
                      <PedidoDetalhe
                        detalhe={pedidoDetalhe}
                        onAvancar={handleAvancarStatus}
                        onReimprimir={handleReimprimir}
                        atualizando={atualizando}
                        onClose={() => { setPedidoSelecionadoId(null); setPedidoDetalhe(null); }}
                        motoboys={motoboys}
                        onAtribuir={handleAtribuirMotoboy}
                        onEntregarProprio={handleEntregarProprio}
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
        )}
      </main>
    </div>
  );
};

export default RestauranteDelivery;
