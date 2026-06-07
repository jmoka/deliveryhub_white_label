import React from 'react';
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
const PROXIMOS = { pending: 'confirmed', confirmed: 'ready', ready: 'out_for_delivery', out_for_delivery: 'delivered' };

const PedidoDetalhe = ({ detalhe, onAvancar, atualizando, onClose }) => {
  if (!detalhe) return null;
  const { pedido, itens, cliente } = detalhe;
  const si = STATUS_INFO[pedido.status] ?? { label: pedido.status, icon: 'Circle', color: 'text-gray-500' };
  const proximo = PROXIMOS[pedido.status];
  const isCanceled = pedido.status === 'canceled';
  const stepIdx = STATUS_FLOW.indexOf(pedido.status);

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

      {/* Pagamento */}
      <p className="text-xs text-[#71717A]">Pagamento: <span className="font-medium text-[#18181B]">{pedido.payment_method}</span></p>

      {/* Avançar */}
      {proximo && (
        <button
          disabled={atualizando === pedido.id}
          onClick={() => onAvancar(pedido, proximo)}
          className="w-full py-2.5 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 transition-colors"
        >
          {atualizando === pedido.id ? '...' : `Avançar → ${STATUS_INFO[proximo]?.label}`}
        </button>
      )}
    </motion.div>
  );
};

export default PedidoDetalhe;
