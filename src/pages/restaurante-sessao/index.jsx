import React, { useState, useEffect, useCallback } from 'react';
import { getCaixa, getStatusGdoorPedidos, enviarGdoorPedido } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';

const gdoorConcluido = (p) => (p.canal === 'presencial' ? p.status === 'paga' : p.status === 'delivered');

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAGAMENTO_LABEL = { pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito', cash: 'Dinheiro' };
const STATUS_LABEL = {
  pending: 'Recebido', confirmed: 'Confirmado', preparing: 'Em preparo', ready: 'Pronto',
  motoboy_collecting: 'Motoboy a caminho', out_for_delivery: 'Em entrega', delivered: 'Entregue', canceled: 'Cancelado',
  aberta: 'Em aberto', fechada_garcom: 'Aguard. pagamento', paga: 'Pago',
};
const STATUS_COLOR = {
  delivered: 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400', paga: 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400',
  canceled: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400',
  aberta: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400', fechada_garcom: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400',
};

// Lista todos os pedidos/vendas (delivery + salão) desde que o caixa atual foi aberto —
// conferência rápida do turno, sem precisar abrir o Financeiro completo.
const RestauranteSessao = () => {
  const [caixa, setCaixa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroCanal, setFiltroCanal] = useState('todos');
  const [erro, setErro] = useState(null);
  const { moduloGdoor } = useModulosEmpresa();
  const [gdoorStatus, setGdoorStatus] = useState({});
  const [enviandoGdoorId, setEnviandoGdoorId] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const c = await getCaixa();
      setCaixa(c);
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca em lote (1 request pra tabela inteira, não 1 por linha) o status GDOOR
  // só dos pedidos já concluídos (delivery entregue / salão-balcão pago) — os
  // demais nunca teriam job mesmo, não vale a pena perguntar.
  useEffect(() => {
    if (!moduloGdoor) return;
    const idsConcluidos = (caixa?.pedidos ?? []).filter(gdoorConcluido).map((p) => p.id);
    if (!idsConcluidos.length) return;
    getStatusGdoorPedidos(idsConcluidos).then(setGdoorStatus).catch(() => {});
  }, [caixa, moduloGdoor]);

  const enviarGdoor = async (pedidoId) => {
    setEnviandoGdoorId(pedidoId);
    try {
      await enviarGdoorPedido(pedidoId);
      const idsConcluidos = (caixa?.pedidos ?? []).filter(gdoorConcluido).map((p) => p.id);
      setGdoorStatus(await getStatusGdoorPedidos(idsConcluidos));
    } catch (e) {
      alert(e.message);
    } finally {
      setEnviandoGdoorId(null);
    }
  };

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 20000);
    return () => clearInterval(interval);
  }, [carregar]);

  const pedidos = (caixa?.pedidos ?? []).filter((p) => filtroCanal === 'todos' || p.canal === filtroCanal);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/sessao" title="Pedidos da Sessão" onRefresh={carregar} />

      <div className="max-w-5xl mx-auto p-4">
        {loading ? (
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Carregando...</p>
        ) : erro ? (
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        ) : !caixa?.aberto ? (
          <div className="text-center py-16">
            <Icon name="Lock" size={40} className="text-[#D4D4D8] mx-auto mb-3" />
            <p className="text-[#71717A] dark:text-[#A1A1AA] font-semibold">Nenhum caixa aberto agora</p>
            <p className="text-[#A1A1AA] text-sm mt-1">Abra o caixa no Dashboard pra começar a sessão.</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{caixa.nome_operador}</p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Caixa aberto desde {new Date(caixa.aberto_em).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex gap-1.5">
                {['todos', 'delivery', 'presencial'].map((c) => (
                  <button key={c} onClick={() => setFiltroCanal(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${filtroCanal === c ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
                    {c === 'todos' ? 'Todos' : c === 'delivery' ? 'Delivery' : 'Salão'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E4E4E7] dark:border-[#3F3F46] text-left text-xs text-[#71717A] dark:text-[#A1A1AA]">
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Canal</th>
                    <th className="px-4 py-2.5">Cliente / Mesa</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Pagamento</th>
                    <th className="px-4 py-2.5">Hora</th>
                    {moduloGdoor && <th className="px-4 py-2.5">GDOOR</th>}
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <tr key={p.id} className="border-b border-[#F4F4F5] dark:border-[#3F3F46] last:border-0">
                      <td className="px-4 py-2.5 font-semibold text-[#18181B] dark:text-[#F4F4F5]">#{p.numero_comanda ?? p.id}</td>
                      <td className="px-4 py-2.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">{p.canal === 'presencial' ? 'Salão' : 'Delivery'}</td>
                      <td className="px-4 py-2.5 text-[#27272A] dark:text-[#F4F4F5]">
                        {p.canal === 'presencial'
                          ? (p.mesas ? `Mesa ${p.mesas.numero}` : 'Balcão') + (p.cliente_mesa_nome ? ` — ${p.cliente_mesa_nome}` : '')
                          : (p.customers?.name ?? '—')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status] ?? 'bg-zinc-100 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400'}`}>
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">{PAGAMENTO_LABEL[p.payment_method] ?? p.payment_method ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">{new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                      {moduloGdoor && (
                        <td className="px-4 py-2.5">
                          {!gdoorConcluido(p) ? (
                            <span className="text-xs text-[#D4D4D8]">—</span>
                          ) : (() => {
                            const g = gdoorStatus[p.id];
                            if (!g || g.status === 'nao_enviado') {
                              return (
                                <button onClick={() => enviarGdoor(p.id)} disabled={enviandoGdoorId === p.id}
                                  className="text-[10px] px-2 py-1 rounded-full font-bold border border-[#FF441F] text-[#FF441F] hover:bg-[#FF441F]/5 disabled:opacity-40 whitespace-nowrap">
                                  {enviandoGdoorId === p.id ? 'Enviando...' : 'Enviar GDOOR'}
                                </button>
                              );
                            }
                            if (g.status === 'pendente') {
                              return <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Na fila</span>;
                            }
                            if (g.status === 'processado') {
                              return <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">✓ Enviado</span>;
                            }
                            return (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => alert(g.erro_msg || 'Erro desconhecido')}
                                  className="text-[10px] px-2 py-1 rounded-full font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 whitespace-nowrap">
                                  Erro — ver
                                </button>
                                <button onClick={() => enviarGdoor(p.id)} disabled={enviandoGdoorId === p.id}
                                  className="text-[10px] px-2 py-1 rounded-full font-bold border border-[#FF441F] text-[#FF441F] hover:bg-[#FF441F]/5 disabled:opacity-40 whitespace-nowrap">
                                  Reenviar
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-right font-bold text-[#18181B] dark:text-[#F4F4F5]">{fmt(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {pedidos.length === 0 && (
                <p className="text-center py-10 text-sm text-[#A1A1AA]">Nenhum pedido nessa sessão ainda.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RestauranteSessao;
