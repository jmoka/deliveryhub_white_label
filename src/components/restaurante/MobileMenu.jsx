import React from 'react';
import { motion } from 'framer-motion';

const MobileMenu = ({ links, currentPath, onNavigate, onSair, pendentesMotoboy = 0, slugLoja }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="md:hidden bg-white dark:bg-[#18181B] border-b border-[#E4E4E7] dark:border-[#3F3F46] px-4 py-3 flex flex-col gap-1 z-40 relative shadow-md"
  >
    {links.map((l) => (
      <button key={l.path} onClick={() => onNavigate(l.path)}
        className={`w-full flex items-center justify-between text-left px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
          l.path === currentPath ? 'text-white bg-[#FF441F]' : 'text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]'
        }`}>
        {l.label}
        {l.path === '/restaurante/motoboys' && pendentesMotoboy > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {pendentesMotoboy}
          </span>
        )}
      </button>
    ))}
    {slugLoja && (
      <button onClick={() => window.open(`/r/${slugLoja}`, '_blank')}
        className="w-full text-left px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-950/60 rounded-xl border border-green-200 dark:border-green-800 flex items-center gap-2">
        Loja
      </button>
    )}
    <button onClick={onSair}
      className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
      Sair
    </button>
  </motion.div>
);

export default MobileMenu;
