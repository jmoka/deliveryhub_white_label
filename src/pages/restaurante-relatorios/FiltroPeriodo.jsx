import React from 'react';
import Icon from '../../components/AppIcon';
import { ANOS, MODOS } from '../../utils/relatorioPrint';

const FiltroPeriodo = ({ filtro, setFiltro, onBuscar, loading, onImprimir, podeImprimir, onExportarJson, podeExportar }) => {
  const set = (patch) => setFiltro((f) => ({ ...f, ...patch }));

  return (
    <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex gap-1 bg-[#F4F4F5] dark:bg-[#3F3F46] p-1 rounded-xl">
          {MODOS.map((m) => (
            <button key={m.value} onClick={() => set({ modo: m.value })}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtro.modo === m.value ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] shadow-sm' : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]'}`}>
              {m.label}
            </button>
          ))}
        </div>

        {filtro.modo === 'dia' && (
          <input type="date" value={filtro.dia} onChange={(e) => set({ dia: e.target.value })}
            className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
        )}
        {filtro.modo === 'mes' && (
          <input type="month" value={filtro.mes} onChange={(e) => set({ mes: e.target.value })}
            className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
        )}
        {filtro.modo === 'ano' && (
          <select value={filtro.ano} onChange={(e) => set({ ano: e.target.value })}
            className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]">
            {ANOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        {filtro.modo === 'periodo' && (
          <>
            <input type="date" value={filtro.periodoIni} onChange={(e) => set({ periodoIni: e.target.value })}
              className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
            <span className="text-sm text-[#71717A] dark:text-[#A1A1AA] self-center">até</span>
            <input type="date" value={filtro.periodoFim} min={filtro.periodoIni} onChange={(e) => set({ periodoFim: e.target.value })}
              className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          </>
        )}

        <button onClick={onBuscar} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 transition-colors">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Search" size={14} />}
          Buscar
        </button>

        {podeImprimir && (
          <button onClick={onImprimir}
            className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-sm font-bold text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] transition-colors">
            <Icon name="Printer" size={14} /> Imprimir
          </button>
        )}

        {podeExportar && (
          <button onClick={onExportarJson}
            className="flex items-center gap-2 px-4 py-2 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-sm font-bold text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] transition-colors">
            <Icon name="Download" size={14} /> Baixar JSON
          </button>
        )}
      </div>
    </div>
  );
};

export default FiltroPeriodo;
