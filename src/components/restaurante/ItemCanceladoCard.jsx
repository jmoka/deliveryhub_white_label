import React from 'react';
import Icon from '../AppIcon';

// Card read-only pra aba "Canceladas" de qualquer ponto de produção (Produção, Cozinha,
// KDS por setor) — mesmo item que já existia na fila, só que cancelado (item cancelado
// direto no KDS, ou pedido inteiro cancelado pelo admin, que cascateia pro item). Nunca
// tem ação: é só histórico pra equipe não achar que o pedido "sumiu" sem explicação.
const ItemCanceladoCard = ({ item }) => {
  const ehDelivery = item.tipo === 'delivery';
  const localLabel = ehDelivery
    ? (item.cliente ? `Pedido #${item.order_id} • ${item.cliente}` : `Pedido #${item.order_id}`)
    : (item.mesa && item.cliente ? `${item.mesa} • ${item.cliente}` : item.mesa ?? item.cliente ?? 'Avulsa');

  return (
    <div className={`rounded-2xl border-2 border-red-900/40 overflow-hidden ${ehDelivery ? 'bg-white dark:bg-[#27272A]' : 'bg-red-950/10'}`}>
      <div className="p-4 opacity-80">
        <div className="flex items-start justify-between mb-1 gap-2">
          <div className="leading-tight">
            <p className={`text-xl font-black ${ehDelivery ? 'text-[#18181B] dark:text-[#F4F4F5]' : 'text-white'}`}>Quantidade: {item.quantity}</p>
            <p className={`text-lg font-bold ${ehDelivery ? 'text-[#18181B] dark:text-[#F4F4F5]' : 'text-white'}`}>
              Produto: {item.product_name}
              {!ehDelivery && <span className="text-purple-300 font-normal text-xs"> · Salão</span>}
            </p>
          </div>
          <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${ehDelivery ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400' : 'bg-purple-500/20 text-purple-300'}`}>
            {ehDelivery ? 'Delivery' : 'Salão'}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-sm font-black text-white bg-red-600 rounded-lg px-2 py-1 mb-2 w-fit">
          <Icon name="XCircle" size={14} /> {item.pedido_cancelado ? 'Pedido Cancelado' : 'Item Cancelado'}
        </p>

        {item.observacao && (
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-1">Obs: {item.observacao}</p>
        )}

        <div className={`flex items-center gap-2 text-base font-bold mb-1 ${ehDelivery ? 'text-[#71717A] dark:text-[#A1A1AA]' : 'text-[#A1A1AA]'}`}>
          <Icon name="MapPin" size={14} />
          <span className={ehDelivery ? 'text-sm' : ''}>{localLabel}</span>
          {item.numero_comanda && (
            <>
              <span>•</span>
              <span>Comanda #{item.numero_comanda}</span>
            </>
          )}
        </div>

        <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
          Cancelado em {item.cancelado_em ? new Date(item.cancelado_em).toLocaleString('pt-BR') : '—'}
        </p>
      </div>
    </div>
  );
};

export default ItemCanceladoCard;
