import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { apiPath } from '../../lib/apiUrl';
import { formatDuracao } from '../../utils/formatDuracao';
import { useNowTick } from '../../hooks/useNowTick';
import Icon from '../../components/AppIcon';
import OrderActions from './components/OrderActions';
import MapaDistanciaEntrega from '../../components/MapaDistanciaEntrega';
import { getTermos } from '../../hooks/useTerminologiaEstabelecimento';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// Rotulo de "preparing"/"ready" muda pra Embalando/Pacote pronto quando o
// estabelecimento DESSE pedido nao e Restaurante (ver empresa.tipo_restaurante
// vindo de GET /pedidos/:id).
const buildStatusInfo = (tipoRestaurante) => {
  const termos = getTermos(tipoRestaurante);
  return {
    pending:            { label: 'Recebido',              icon: 'Clock',        color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40' },
    confirmed:          { label: 'Confirmado',            icon: 'CheckCircle',  color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/40' },
    preparing:          { label: termos.emPreparo,        icon: termos.icone,   color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40' },
    ready:              { label: termos.pronto,           icon: 'Package',      color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
    motoboy_collecting: { label: 'Motoboy indo buscar',   icon: 'Bike',         color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/40' },
    out_for_delivery:   { label: 'Saiu para entrega',     icon: 'Navigation',   color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    delivered:          { label: 'Entregue!',             icon: 'PartyPopper',  color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-950/40' },
    canceled:           { label: 'Cancelado',             icon: 'XCircle',      color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/40' },
  };
};

const TIMELINE = ['pending', 'confirmed', 'preparing', 'ready', 'motoboy_collecting', 'out_for_delivery', 'delivered'];

const OrderTrackingStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, restauranteSlug } = location.state ?? {};

  const [pedido, setPedido] = useState(null);
  const [tipoRestaurante, setTipoRestaurante] = useState(true);
  const [pontos, setPontos] = useState({ restaurante: null, cliente: null });
  const [pagamentoPago, setPagamentoPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [cancelSucesso, setCancelSucesso] = useState(null);
  const now = useNowTick();

  const buscarPedido = useCallback(async () => {
    if (!orderId) return;
    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;
      if (!token) return;

      const res = await fetch(`${apiPath('/api/pedidos')}/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // API returns { pedido:{...}, itens:[], cliente:{...}, empresa:{...}, pagamento_pago }
      setPedido({ ...data.pedido, itens: data.itens ?? [] });
      setTipoRestaurante(data.empresa?.tipo_restaurante ?? true);
      setPontos({
        restaurante: { lat: data.empresa?.lat, lng: data.empresa?.lng },
        cliente: { lat: data.cliente?.lat, lng: data.cliente?.lng },
      });
      setPagamentoPago(data.pagamento_pago ?? null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      navigate('/menu-catalog-product-browse', { replace: true });
      return;
    }
    buscarPedido();

    // Realtime: atualiza instantaneamente quando status muda no DB
    const channel = supabase
      .channel(`order-track-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setPedido((prev) => prev ? { ...prev, ...payload.new } : prev);
      })
      .subscribe();

    // Fallback polling 30s caso realtime falhe
    const interval = setInterval(() => {
      if (pedido?.status !== 'delivered' && pedido?.status !== 'canceled') {
        buscarPedido();
      }
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [buscarPedido, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#18181B]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (erro || !pedido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#18181B] p-6 text-center">
        <Icon name="AlertCircle" size={48} className="text-red-300 dark:text-red-800 mb-4" />
        <p className="text-gray-700 dark:text-[#F4F4F5] font-medium">Não foi possível carregar o pedido</p>
        <p className="text-sm text-gray-400 dark:text-[#71717A] mt-1">{erro}</p>
        <button onClick={() => navigate('/customer-account-order-history')} className="mt-5 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg">
          Ver meus pedidos
        </button>
      </div>
    );
  }

  const handleCancelarPedido = async ({ orderId: oid, reason }) => {
    setCancelando(true);
    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;
      const res = await fetch(`${apiPath('/api/pedidos')}/${oid}/cancelar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPedido((prev) => ({ ...prev, status: 'canceled', cancel_reason: reason }));
      setCancelSucesso(data);
    } finally {
      setCancelando(false);
    }
  };

  const termos = getTermos(tipoRestaurante);
  const STATUS_INFO = buildStatusInfo(tipoRestaurante);
  const statusInfo = STATUS_INFO[pedido.status] ?? STATUS_INFO.pending;
  const timelineIdx = TIMELINE.indexOf(pedido.status);
  const valorDevolver = pagamentoPago?.valor ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#18181B] pb-10">
      <header className="bg-white dark:bg-[#18181B] border-b dark:border-[#3F3F46] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/customer-account-order-history')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#27272A]">
          <Icon name="ArrowLeft" size={20} className="text-gray-600 dark:text-[#A1A1AA]" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-[#F4F4F5]">Pedido #{pedido.id}</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Status atual */}
        <div className={`rounded-xl border dark:border-[#3F3F46] p-5 text-center ${statusInfo.bg}`}>
          <Icon name={statusInfo.icon} size={40} className={`mx-auto mb-2 ${statusInfo.color}`} />
          <p className={`text-lg font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
          <p className="text-xs text-gray-500 dark:text-[#A1A1AA] mt-1">
            Última atualização: {new Date(pedido.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Timeline */}
        {pedido.status !== 'canceled' && (
          <div className="bg-white dark:bg-[#18181B] rounded-xl border dark:border-[#3F3F46] p-4">
            <div className="flex items-center justify-between">
              {TIMELINE.map((s, idx) => {
                const done = idx <= timelineIdx;
                const info = STATUS_INFO[s];
                return (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-orange-500' : 'bg-gray-100 dark:bg-[#3F3F46]'}`}>
                        <Icon name={info.icon} size={14} className={done ? 'text-white' : 'text-gray-400 dark:text-[#71717A]'} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-[#A1A1AA] mt-1 text-center max-w-12 leading-tight hidden sm:block">
                        {info.label.split(' ')[0]}
                      </p>
                    </div>
                    {idx < TIMELINE.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${idx < timelineIdx ? 'bg-orange-500' : 'bg-gray-200 dark:bg-[#3F3F46]'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Posição do motoboy quando em entrega */}
        {pedido.status === 'out_for_delivery' && pedido.motoboy_lat && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/40 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="Bike" size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-400">Motoboy a caminho</p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400/70 mt-0.5">
                Posição às {new Date(pedido.motoboy_location_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps?q=${pedido.motoboy_lat},${pedido.motoboy_lng}`}
              target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 flex items-center gap-1 whitespace-nowrap"
            >
              <Icon name="MapPin" size={11} /> Ver no mapa
            </a>
          </div>
        )}

        {/* Itens */}
        {pedido.itens?.length > 0 && (
          <div className="bg-white dark:bg-[#18181B] rounded-xl border dark:border-[#3F3F46] p-4">
            <h2 className="font-semibold text-gray-900 dark:text-[#F4F4F5] mb-3">Itens do pedido</h2>
            <div className="space-y-2">
              {pedido.itens.map((item) => {
                const enviadoEm = item.enviado_em ? new Date(item.enviado_em).getTime() : null;
                const emPreparo = enviadoEm && item.status !== 'pronto';
                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-[#A1A1AA]">
                      <span>{item.nome ?? item.product_name ?? `Produto #${item.product_id}`} × {item.quantity}</span>
                      <span>{fmt(item.unit_price * item.quantity)}</span>
                    </div>
                    {emPreparo && (
                      <p className="text-xs text-orange-500 dark:text-orange-400 font-mono flex items-center gap-1 mt-0.5">
                        <Icon name="Clock" size={11} /> preparando há {formatDuracao(now - enviadoEm)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t dark:border-[#3F3F46] pt-2 mt-2 space-y-1.5">
              {(() => {
                const frete = parseFloat(pedido.frete_cobrado ?? 0);
                const excedente = parseFloat(pedido.frete_excedente_cobrado ?? 0);
                const subtotal = pedido.itens.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
                return (
                  <>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-[#A1A1AA]">
                      <span>Subtotal ({pedido.itens.reduce((a, i) => a + i.quantity, 0)} itens)</span>
                      <span>{fmt(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-[#A1A1AA]">
                      <span className="flex items-center gap-1">
                        <Icon name="Truck" size={13} /> Frete motoboy
                      </span>
                      <span>{fmt(frete)}</span>
                    </div>
                    {pedido.distancia_entrega_km != null && (
                      <div className="flex justify-between text-sm text-gray-500 dark:text-[#A1A1AA]">
                        <span className="flex items-center gap-1">
                          <Icon name="MapPin" size={13} /> Excedente distância{pedido.distancia_entrega_km != null ? ` (${pedido.distancia_entrega_km}km)` : ''}
                        </span>
                        <span>{fmt(excedente)}</span>
                      </div>
                    )}
                    <div className="border-t dark:border-[#3F3F46] pt-1.5 flex justify-between font-bold text-gray-900 dark:text-[#F4F4F5]">
                      <span>Total</span>
                      <span className="text-orange-600 dark:text-orange-400">{fmt(pedido.total)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
            {pedido.distancia_entrega_km != null && (
              <div className="mt-3">
                <MapaDistanciaEntrega
                  restauranteLat={pontos.restaurante?.lat} restauranteLng={pontos.restaurante?.lng}
                  clienteLat={pontos.cliente?.lat} clienteLng={pontos.cliente?.lng}
                  distanciaKm={pedido.distancia_entrega_km}
                  tipoRestaurante={tipoRestaurante}
                />
              </div>
            )}
          </div>
        )}

        {/* Banner de cancelamento confirmado */}
        {cancelSucesso && (
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
            <Icon name="CheckCircle" size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-400">Pedido cancelado</p>
              {cancelSucesso.precisa_estorno && (
                <p className="text-sm text-green-700 dark:text-green-400/80 mt-0.5">
                  Valor a devolver:{' '}
                  <strong>{fmt(cancelSucesso.valor_devolver)}</strong> — o estorno será processado pelo {termos.estabelecimento.toLowerCase()}.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cancelar antes do preparo */}
        {['pending', 'confirmed'].includes(pedido.status) && (
          <OrderActions
            orderStatus={pedido.status}
            orderId={pedido.id}
            onCancelOrder={handleCancelarPedido}
            isPago={valorDevolver > 0}
            valorDevolver={valorDevolver}
            tipoRestaurante={tipoRestaurante}
          />
        )}

        {/* Ações de navegação */}
        <div className="flex gap-3">
          {restauranteSlug && (
            <button
              onClick={() => navigate(`/r/${restauranteSlug}`)}
              className="flex-1 py-2.5 border border-orange-500 text-orange-500 dark:text-orange-400 text-sm font-medium rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40"
            >
              Novo pedido
            </button>
          )}
          <button
            onClick={() => navigate('/customer-account-order-history')}
            className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
          >
            Meus pedidos
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-[#71717A]">Atualização em tempo real</p>
      </main>
    </div>
  );
};

export default OrderTrackingStatus;
