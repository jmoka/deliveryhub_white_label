import React from 'react';
import Icon from '../AppIcon';

// Resumo por praça (Cozinha/Bar/Drinks...) de um pedido delivery — dá autonomia pro
// painel ver quais praças já terminaram sem precisar abrir o pedido, antes de mandar
// pro motoboy. `pracas` vem do backend (RestauranteService.pracasPorPedido), populado em
// /restaurante/delivery, /restaurante/pedidos e no detalhe do pedido.
const PracasStatus = ({ pracas, compact = false }) => {
  if (!pracas?.length) return null;
  const todasProntas = pracas.every((g) => g.pronto);
  if (pracas.length === 1 && todasProntas) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap mt-1">
        {pracas.map((g) => (
          <span key={g.setor}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              g.pronto
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
            }`}>
            <Icon name={g.pronto ? 'CheckCircle2' : 'Clock'} size={10} />
            {g.setor}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#F4F4F5] dark:bg-[#18181B] rounded-xl px-3 py-2.5 space-y-1.5">
      <p className="text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide">
        {todasProntas ? 'Todas as praças prontas' : 'Aguardando praças pra liberar pro motoboy'}
      </p>
      {pracas.map((g) => (
        <div key={g.setor} className="flex items-start gap-1.5 text-xs">
          <Icon name={g.pronto ? 'CheckCircle2' : 'Clock'} size={13}
            className={`flex-shrink-0 mt-0.5 ${g.pronto ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
          <p className="leading-snug">
            <span className={`font-bold ${g.pronto ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>{g.setor}</span>
            <span className="text-[#71717A] dark:text-[#A1A1AA]"> — {g.itens.join(', ')}</span>
            {!g.pronto && <span className="ml-1 font-bold text-amber-700 dark:text-amber-400">(faltando)</span>}
          </p>
        </div>
      ))}
    </div>
  );
};

export default PracasStatus;
