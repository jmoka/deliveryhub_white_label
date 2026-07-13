import React from 'react';
import { motion } from 'framer-motion';

const MobileMenu = ({ links, currentPath, onNavigate, onSair, pendentesMotoboy = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="md:hidden bg-white border-b border-[#E4E4E7] px-4 py-3 flex flex-col gap-1 z-40 relative shadow-md"
  >
    {links.map((l) => (
      <button key={l.path} onClick={() => onNavigate(l.path)}
        className={`w-full flex items-center justify-between text-left px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
          l.path === currentPath ? 'text-white bg-[#FF441F]' : 'text-[#27272A] hover:bg-[#F4F4F5]'
        }`}>
        {l.label}
        {l.path === '/restaurante/motoboys' && pendentesMotoboy > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {pendentesMotoboy}
          </span>
        )}
      </button>
    ))}
    <button onClick={onSair}
      className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200">
      Sair
    </button>
  </motion.div>
);

export default MobileMenu;
