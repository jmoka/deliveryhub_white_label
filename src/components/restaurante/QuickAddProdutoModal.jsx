import React, { useState } from 'react';
import Icon from '../AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// Modal de quantidade/observação ao clicar num produto — usado tanto pelo picker da
// comanda quanto pela venda balcão, pra ficarem sempre idênticos.
const QuickAddProdutoModal = ({ produto, onFechar, onConfirmar }) => {
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const confirmar = async () => {
    setSalvando(true);
    try {
      await onConfirmar({
        ...(produto.tipo === 'combo' ? { combo_id: produto.id } : { product_id: produto.id }),
        quantity: quantidade,
        observacao: observacao.trim() || undefined,
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F4F4F5] dark:bg-[#3F3F46] flex-shrink-0">
            {produto.image_url
              ? <img src={produto.image_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Icon name="UtensilsCrossed" size={20} className="text-[#A1A1AA]" /></div>}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">
              {produto.tipo === 'combo' && <span className="text-[10px] font-bold text-[#FF441F] mr-1">COMBO</span>}
              {produto.name}
            </p>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {produto.preco_promo != null && <span className="line-through text-[#A1A1AA] mr-1">{fmt(produto.price)}</span>}
              {fmt(produto.preco_promo ?? produto.price)}
            </p>
            {produto.quantidade_estoque != null && (
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">Em estoque: {produto.quantidade_estoque}</p>
            )}
          </div>
        </div>

        <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Quantidade</label>
        <div className="flex items-center gap-3 mt-1 mb-3">
          <button onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] flex items-center justify-center text-lg font-bold text-[#27272A] dark:text-[#F4F4F5]">−</button>
          <span className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] w-8 text-center">{quantidade}</span>
          <button
            onClick={() => setQuantidade((q) => (produto.quantidade_estoque != null ? Math.min(produto.quantidade_estoque, q + 1) : q + 1))}
            disabled={produto.quantidade_estoque != null && quantidade >= produto.quantidade_estoque}
            className="w-10 h-10 rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] flex items-center justify-center text-lg font-bold text-[#27272A] dark:text-[#F4F4F5] disabled:opacity-40">+</button>
        </div>

        <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Observação (opcional)</label>
        <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2}
          placeholder="Ex: sem cebola, ponto da carne..."
          className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm mt-1 mb-4 resize-none" />

        <div className="flex gap-2">
          <button onClick={onFechar} className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA]">
            Cancelar
          </button>
          <button onClick={confirmar} disabled={salvando}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-[#FF441F] hover:bg-[#E63A19] disabled:opacity-50">
            {salvando ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddProdutoModal;
