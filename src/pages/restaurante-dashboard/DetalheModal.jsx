import React from 'react';
import Icon from '../../components/AppIcon';

const Row = ({ label, value, bold, accent, sinal }) => (
  <div className={`flex justify-between text-sm py-1.5 border-b border-[#F4F4F5] dark:border-[#3F3F46] last:border-0 ${bold ? 'font-bold' : ''}`}>
    <span className="text-[#71717A] dark:text-[#A1A1AA]">{label}</span>
    <span className={accent ? 'text-[#FF441F] font-bold' : 'text-[#18181B] dark:text-[#F4F4F5]'}>{sinal}{value}</span>
  </div>
);

// Modal genérico de detalhamento — usado pelos cards clicáveis do dashboard
// (Espécie no caixa, Vendas digital, Saldo geral do dia) pra explicar de onde
// vem cada número em vez de só mostrar o total.
const DetalheModal = ({ titulo, subtitulo, linhas = [], totalLabel, totalValue, nota, onFechar }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onFechar}>
    <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">{titulo}</h2>
          {subtitulo && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{subtitulo}</p>}
        </div>
        <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]">
          <Icon name="X" size={18} />
        </button>
      </div>

      <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-xl px-4 py-3">
        {linhas.length === 0
          ? <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] text-center py-2">Nada registrado ainda.</p>
          : linhas.map((l, i) => <Row key={i} {...l} />)}
        {totalLabel && (
          <div className="pt-1 mt-1 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
            <Row label={totalLabel} value={totalValue} bold accent />
          </div>
        )}
      </div>

      {nota && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mt-3">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <Icon name="Info" size={13} className="inline mr-1 -mt-0.5" />
            {nota}
          </p>
        </div>
      )}
    </div>
  </div>
);

export default DetalheModal;
