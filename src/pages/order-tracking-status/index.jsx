import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import OrderActions from './components/OrderActions';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS_INFO = {
  pending:            { label: 'Recebido',              icon: 'Clock',        color: 'text-yellow-600', bg: 'bg-yellow-50' },
  confirmed:          { label: 'Confirmado',            icon: 'CheckCircle',  color: 'text-blue-600',   bg: 'bg-blue-50' },
  preparing:          { label: 'Em preparo',            icon: 'ChefHat',      color: 'text-orange-600', bg: 'bg-orange-50' },
  ready:              { label: 'Pronto',                icon: 'Package',      color: 'text-purple-600', bg: 'bg-purple-50' },
  motoboy_collecting: { label: 'Motoboy indo buscar',   icon: 'Bike',         color: 'text-blue-600',   bg: 'bg-blue-50' },
  out_for_delivery:   { label: 'Saiu para entrega',     icon: 'Navigation',   color: 'text-indigo-600', bg: 'bg-indigo-50' },
  delivered:          { label: 'Entregue!',             icon: 'PartyPopper',  color: 'text-green-600',  bg: 'bg-green-50' },
  canceled:           { label: 'Cancelado',             icon: 'XCircle',      color: 'text-red-600',    bg: 'bg-red-50' },
};

const TIMELINE = ['pending', 'confirmed', 'preparing', 'ready', 'motoboy_collecting', 'out_for_delivery', 'delivered'];

const OrderTrackingStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, restauranteSlug } = location.state ?? {};

  const [pedido, setPedido] = useState(null);
  const [pagamentoPago, setPagamentoPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [cancelSucesso, setCancelSucesso] = useState(null);

  const buscarPedido = useCallback(async () => {
    if (!orderId) return;
    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;
      if (!token) return;

      const res = await fetch(`/api/pedidos/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // API returns { pedido:{...}, itens:[], cliente:{...}, empresa:{...}, pagamento_pago }
      setPedido({ ...data.pedido, itens: data.itens ?? [] });
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (erro || !pedido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Icon name="AlertCircle" size={48} className="text-red-300 mb-4" />
        <p className="text-gray-700 font-medium">Não foi possível carregar o pedido</p>
        <p className="text-sm text-gray-400 mt-1">{erro}</p>
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
      const res = await fetch(`/api/pedidos/${oid}/cancelar`, {
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

  const statusInfo = STATUS_INFO[pedido.status] ?? STATUS_INFO.pending;
  const timelineIdx = TIMELINE.indexOf(pedido.status);
  const valorDevolver = pagamentoPago?.valor ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/customer-account-order-history')} className="p-2 rounded-lg hover:bg-gray-100">
          <Icon name="ArrowLeft" size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Pedido #{pedido.id}</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Status atual */}
        <div className={`rounded-xl border p-5 text-center ${statusInfo.bg}`}>
          <Icon name={statusInfo.icon} size={40} className={`mx-auto mb-2 ${statusInfo.color}`} />
          <p className={`text-lg font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
          <p className="text-xs text-gray-500 mt-1">
            Última atualização: {new Date(pedido.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Timeline */}
        {pedido.status !== 'canceled' && (
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              {TIMELINE.map((s, idx) => {
                const done = idx <= timelineIdx;
                const info = STATUS_INFO[s];
                return (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-orange-500' : 'bg-gray-100'}`}>
                        <Icon name={info.icon} size={14} className={done ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center max-w-12 leading-tight hidden sm:block">
                        {info.label.split(' ')[0]}
                      </p>
                    </div>
                    {idx < TIMELINE.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${idx < timelineIdx ? 'bg-orange-500' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Posição do motoboy quando em entrega */}
        {pedido.status === 'out_for_delivery' && pedido.motoboy_lat && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="Bike" size={18} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-indigo-800">Motoboy a caminho</p>
              <p className="text-xs text-indigo-500 mt-0.5">
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
          <div className="bg-white rounded-xl border p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Itens do pedido</h2>
            <div className="space-y-2">
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-600">
                  <span>{item.nome ?? item.product_name ?? `Produto #${item.product_id}`} × {item.quantity}</span>
                  <span>{fmt(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-2 space-y-1.5">
              {(() => {
                const frete = parseFloat(pedido.frete_cobrado ?? 0);
                const subtotal = pedido.itens.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
                return (
                  <>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal ({pedido.itens.reduce((a, i) => a + i.quantity, 0)} itens)</span>
                      <span>{fmt(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Icon name="Truck" size={13} /> Frete motoboy
                      </span>
                      <span>{fmt(frete)}</span>
                    </div>
                    <div className="border-t pt-1.5 flex justify-between font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-orange-600">{fmt(pedido.total)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Banner de cancelamento confirmado */}
        {cancelSucesso && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <Icon name="CheckCircle" size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Pedido cancelado</p>
              {cancelSucesso.precisa_estorno && (
                <p className="text-sm text-green-700 mt-0.5">
                  Valor a devolver:{' '}
                  <strong>{fmt(cancelSucesso.valor_devolver)}</strong> — o estorno será processado pelo restaurante.
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
          />
        )}

        {/* Ações de navegação */}
        <div className="flex gap-3">
          {restauranteSlug && (
            <button
              onClick={() => navigate(`/r/${restauranteSlug}`)}
              className="flex-1 py-2.5 border border-orange-500 text-orange-500 text-sm font-medium rounded-lg hover:bg-orange-50"
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

        <p className="text-center text-xs text-gray-400">Atualização em tempo real</p>
      </main>
    </div>
  );
};

export default OrderTrackingStatus;
