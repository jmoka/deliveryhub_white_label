import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';

const SUBLINKS = [
  { label: 'Menu Conferências', path: '/restaurante/relatorios' },
  { label: 'Garçom', path: '/restaurante/relatorios/garcom' },
  { label: 'Motoboy', path: '/restaurante/relatorios/motoboy' },
  { label: 'Financeiro', path: '/restaurante/relatorios/financeiro' },
  { label: 'Produtos', path: '/restaurante/relatorios/produtos' },
];

const RelatorioNav = ({ titulo }) => {
  const navigate = useNavigate();
  const slugLoja = useMinhaLojaSlug();

  return (
    <header className="bg-white dark:bg-[#27272A] border-b border-[#E4E4E7] dark:border-[#3F3F46] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/restaurante/relatorios')} className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
          <Icon name="ChevronLeft" size={20} />
        </button>
        <h1 className="text-xl font-bold text-[#18181B] dark:text-[#F4F4F5]">Relatório — {titulo}</h1>
      </div>
      <nav className="hidden md:flex gap-1.5 flex-wrap">
        {SUBLINKS.map((l) => (
          <button key={l.path} onClick={() => navigate(l.path)}
            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
              l.path === window.location.pathname
                ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30'
                : 'text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]'
            }`}>
            {l.label}
          </button>
        ))}
        {slugLoja && (
          <button onClick={() => window.open(`/r/${slugLoja}`, '_blank')}
            className="px-3 py-2 text-sm font-semibold rounded-lg text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-950/40 border border-green-200 dark:border-green-800 flex items-center gap-1.5">
            <Icon name="ExternalLink" size={14} /> Loja
          </button>
        )}
      </nav>
    </header>
  );
};

export default RelatorioNav;
