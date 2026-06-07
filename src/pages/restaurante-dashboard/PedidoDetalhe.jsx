import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS_FLOW = ['pending', 'confirmed', 'ready', 'out_for_delivery', 'delivered'];
const STATUS_INFO = {
  pending:          { label: 'Pendente',    icon: 'Clock',        color: 'text-yellow-600' },
  confirmed:        { label: 'Confirmado',  icon: 'CheckCircle',  color: 'text-blue-600' },
  ready:            { label: 'Pronto',      icon: 'Package',      color: 'text-purple-600' },
  out_for_delivery: { label: 'Em entrega',  icon: 'Truck',        color: 'text-indigo-600' },
  delivered:        { label: 'Entregue',    icon: 'CheckCircle2', color: 'text-green-600' },
  canceled:         { label: 'Cancelado',   icon: 'XCircle',      color: 'text-red-500' },
};

// ready → assign motoboy → out_for_delivery (skips normal avancar)
const PROXIMOS_SEM_MOTOBOY = { pending: 'confirmed', confirmed: 'ready' };
const PRECISA_MOTOBOY = ['ready'];

const PedidoDetalhe = ({ detalhe, onAvancar, atualizando, onClose, motoboys, onAtribuir }) => {
  const [motoboyId, setMotoboyId] = useState('');
  const [atribuindo, setAtribuindo] = useState(false);

  if (!detalhe) return null;
  const { pedido, itens, cliente } = detalhe;
  const si = STATUS_INFO[pedido.status] ?? { label: pedido.status, icon: 'Circle', color: 'text-gray-500' };
  const isCanceled = pedido.status === 'canceled';
  const stepIdx = STATUS_FLOW.indexOf(pedido.status);
  const proxSemMotoboy = PROXIMOS_SEM_MOTOBOY[pedido.status];
  const needsMotoboy = PRECISA_MOTOBOY.includes(pedido.status);
  const activeMotoboys = (motoboys ?? []).filter((m) => m.is_active);

  const handleAtribuir = async () => {
    if (!motoboyId) return;
    setAtribuindo(true);
    try {
      await onAtribuir(pedido.id, parseInt(motoboyId, 10));
    } finally {
      setAtribuindo(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="bg-white rounded-2xl border border-[#E4E4E7] p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <p className="font-bold text-[#18181B]">Pedido #{pedido.id}</p>
        <button onClick={onClose} className="text-[#71717A] hover:text-[#18181B] p-1">
          <Icon name="X" size={16} />
        </button>
      </div>

      {/* Status timeline */}
      <div>
        {!isCanceled && (
          <div className="flex items-center gap-1 mb-3">
            {STATUS_FLOW.map((s, i) => {
              const done = i <= stepIdx;
              return (
                <React.Fragment key={s}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-colors ${
                    done ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'
                  }`}>
                    {i + 1}
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`flex-1 h-0.5 ${i < stepIdx ? 'bg-[#FF441F]' : 'bg-[#E4E4E7]'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
        <div className={`flex items-center gap-2 ${si.color}`}>
          <Icon name={si.icon} size={16} />
          <span className="text-sm font-semibold">{si.label}</span>
          {isCanceled && <span className="ml-auto text-xs text-red-400">Terminal</span>}
        </div>
      </div>

      {/* Cliente */}
      {cliente && (
        <div className="bg-[#FAFAFA] rounded-xl p-3">
          <p className="text-xs font-semibold text-[#71717A] mb-1">Cliente</p>
          <p className="text-sm font-medium text-[#18181B]">{cliente.name}</p>
          {cliente.phone_e164 && <p className="text-xs text-[#71717A]">{cliente.phone_e164}</p>}
          {cliente.address_json?.logradouro && (
            <p className="text-xs text-[#71717A] mt-0.5">
              {cliente.address_json.logradouro}{cliente.address_json.numero ? `, ${cliente.address_json.numero}` : ''}
            </p>
          )}
        </div>
      )}

      {/* Itens */}
      <div>
        <p className="text-xs font-semibold text-[#71717A] mb-2">Itens</p>
        <div className="space-y-1.5">
          {itens.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-[#18181B]">
                <span className="font-semibold text-[#FF441F]">{item.quantity}×</span>{' '}
                {item.product_name ?? `Produto #${item.product_id}`}
              </span>
              <span className="text-[#71717A] font-medium">{fmt(item.unit_price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 pt-2 border-t border-[#E4E4E7]">
          <span className="text-sm font-semibold text-[#18181B]">Total</span>
          <span className="text-sm font-bold text-[#FF441F]">{fmt(pedido.total)}</span>
        </div>
      </div>

      <p className="text-xs text-[#71717A]">Pagamento: <span className="font-medium text-[#18181B]">{pedido.payment_method === 'cash' ? 'Dinheiro' : pedido.payment_method}</span></p>

      {/* Ocorrência do motoboy */}
      {pedido.delivery_occurrence && pedido.delivery_notes && (
        <div className={`rounded-xl px-3 py-2.5 border text-xs ${
          pedido.delivery_occurrence === 'cancelada'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-orange-50 border-orange-200 text-orange-700'
        }`}>
          <p className="font-bold flex items-center gap-1 mb-1">
            <Icon name={pedido.delivery_occurrence === 'cancelada' ? 'XCircle' : 'Clock'} size={13} />
            Ocorrência: {pedido.delivery_occurrence === 'cancelada' ? 'Entrega cancelada' : 'Entrega pendente'}
          </p>
          <p className="leading-relaxed">{pedido.delivery_notes}</p>
        </div>
      )}

      {/* Avançar (pending → confirmed → ready) */}
      {proxSemMotoboy && (
        <button
          disabled={atualizando === pedido.id}
          onClick={() => onAvancar(pedido, proxSemMotoboy)}
          className="w-full py-2.5 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 transition-colors"
        >
          {atualizando === pedido.id ? '...' : `Avançar → ${STATUS_INFO[proxSemMotoboy]?.label}`}
        </button>
      )}

      {/* Atribuir motoboy (ready → out_for_delivery) */}
      {needsMotoboy && activeMotoboys.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#71717A]">Enviar com motoboy</p>
          <select
            value={motoboyId}
            onChange={(e) => setMotoboyId(e.target.value)}
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
          >
            <option value="">Selecionar motoboy...</option>
            {activeMotoboys.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button
            disabled={!motoboyId || atribuindo}
            onClick={handleAtribuir}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="Bike" size={14} />
            {atribuindo ? 'Atribuindo...' : 'Enviar para motoboy'}
          </button>
        </div>
      )}

      {needsMotoboy && activeMotoboys.length === 0 && (
        <p className="text-xs text-orange-600 bg-orange-50 rounded-xl px-3 py-2 flex items-center gap-2">
          <Icon name="AlertTriangle" size={14} />
          Nenhum motoboy ativo. Cadastre em <strong>Motoboys</strong>.
        </p>
      )}
    </motion.div>
  );
};

export default PedidoDetalhe;
