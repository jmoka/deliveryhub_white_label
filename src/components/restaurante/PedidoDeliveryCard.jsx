import React from 'react';
import Icon from '../AppIcon';
import { formatDuracao } from '../../utils/formatDuracao';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão', debit_card: 'Débito', cash: 'Dinheiro' };

const BUCKET_INFO = {
  aguardando: { label: 'Aguardando Preparo', border: 'border-blue-300 bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
  preparando: { label: 'Em Preparo', border: 'border-orange-300 bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
  pronto: { label: 'Pronto', border: 'border-emerald-300 bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
};

// Pedido de delivery agrupado (mesmo visual do OrderCard da tela Cozinha) — usado em
// Produção/Bar pra manter o mesmo padrão de card em todas as praças. Diferença chave:
// aqui a ação avança/volta só os ITENS deste setor específico (não o status do pedido
// inteiro), porque um pedido pode ter itens espalhados por mais de uma praça — só o
// backend (marcarItemPronto) decide quando TODAS já terminaram pra liberar pro motoboy.
const PedidoDeliveryCard = ({ pedido, itens, posicao, now, bucket, onIniciarPreparo, onMarcarPronto, onVoltar, atualizando, highlighted = false, codigoBarras = null, cardId = null }) => {
  const isAtualizando = atualizando === pedido.id;
  const tempoDecorrido = now - new Date(pedido.created_at).getTime();
  const c = BUCKET_INFO[bucket];
  const ehPrioridade = posicao === 1 && bucket !== 'pronto';

  return (
    <div
      id={cardId ?? `pedido-delivery-${pedido.id}`}
      className={`rounded-2xl border-2 overflow-hidden flex flex-col transition-all duration-300 ${
        highlighted
          ? 'border-yellow-400 bg-yellow-50 shadow-xl shadow-yellow-300/40 scale-[1.02]'
          : ehPrioridade
          ? 'border-yellow-400 bg-white'
          : c.border
      }`}
    >
      {ehPrioridade && !highlighted && (
        <div className="bg-yellow-400 px-4 py-1 flex items-center gap-1.5">
          <p className="text-[10px] font-black text-yellow-900 uppercase tracking-wide">Próximo da fila</p>
        </div>
      )}

      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-black ${ehPrioridade ? 'bg-yellow-400 text-black' : 'bg-[#E4E4E7] text-[#27272A]'}`}>
              {posicao}
            </span>
            <p className="text-2xl font-black text-[#18181B]">#{pedido.id}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.badge}`}>{c.label}</span>
          </div>
          {pedido.customers?.name && (
            <p className="text-sm font-semibold text-[#27272A]">{pedido.customers.name}</p>
          )}
          <p className="text-xs text-[#71717A] mt-0.5 flex items-center gap-1">
            <Icon name="Clock" size={11} />
            {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            <span className="ml-1 font-semibold font-mono text-green-600">· {formatDuracao(tempoDecorrido)}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-700">Delivery</span>
          {codigoBarras && (
            <div className="flex items-center justify-center gap-1 px-2 py-1 bg-[#F4F4F5] rounded-lg">
              <Icon name="Barcode" size={11} className="text-[#71717A]" />
              <span className="text-[10px] font-mono text-[#71717A]">{codigoBarras}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 bg-white mx-3 rounded-xl mb-3 border border-[#E4E4E7] flex-1">
        <div className="space-y-2">
          {itens.map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="w-7 h-7 bg-[#FF441F] text-white font-black text-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.quantity}
              </span>
              <p className="text-sm font-semibold text-[#18181B] leading-tight">{item.product_name}</p>
            </div>
          ))}
        </div>
        {(pedido.total != null || pedido.payment_method) && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F4F4F5]">
            <span className="text-xs text-[#71717A]">{PAYMENT_LABELS[pedido.payment_method] ?? pedido.payment_method}</span>
            {pedido.total != null && <span className="text-sm font-black text-[#FF441F]">{fmt(pedido.total)}</span>}
          </div>
        )}
      </div>

      {pedido.outras_pracas?.length > 0 && (
        <div className="mx-3 mb-3 -mt-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
            <Icon name="Info" size={13} className="text-amber-600 flex-shrink-0" />
            Pedido também tem:
          </p>
          <div className="space-y-0.5">
            {pedido.outras_pracas.map((g) => (
              <p key={g.setor} className="text-xs text-amber-800 leading-snug flex items-center gap-1.5">
                <Icon name={g.pronto ? 'CheckCircle2' : 'Clock'} size={12} className={g.pronto ? 'text-emerald-600' : 'text-amber-600'} />
                {g.itens.join(', ')} <span className="font-semibold">({g.setor}{g.pronto ? ' — pronto' : ' — aguardando'})</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {bucket === 'pronto' ? (
        <div className="px-3 pb-3">
          <button
            disabled={isAtualizando}
            onClick={onVoltar}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs font-bold text-[#71717A] hover:bg-[#F4F4F5] disabled:opacity-40 transition-colors"
          >
            <Icon name="Undo2" size={13} /> Desfazer — clicou errado
          </button>
        </div>
      ) : (
        <div className="px-3 pb-3 flex gap-2">
          {bucket === 'preparando' && (
            <button
              disabled={isAtualizando}
              onClick={onVoltar}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-[#E4E4E7] rounded-xl text-xs font-bold text-[#71717A] hover:bg-[#F4F4F5] disabled:opacity-40 transition-colors"
            >
              <Icon name="ArrowLeft" size={13} /> Ag. Preparo
            </button>
          )}
          <button
            disabled={isAtualizando}
            onClick={bucket === 'aguardando' ? onIniciarPreparo : onMarcarPronto}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-black rounded-xl disabled:opacity-50 transition-colors shadow-md ${
              bucket === 'aguardando' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isAtualizando ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Icon name={bucket === 'aguardando' ? 'ChefHat' : 'Package'} size={15} />
                {bucket === 'aguardando' ? 'Iniciar Preparo' : 'Marcar Pronto'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PedidoDeliveryCard;
