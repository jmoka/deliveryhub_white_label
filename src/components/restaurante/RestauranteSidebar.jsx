import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

// Menu lateral só pra desktop/telas grandes (md+) — substitui a barra horizontal de
// botões que ficava poluída com muitos links. Mobile continua com o próprio menu de cada
// página (hamburger + lista já existente), este componente nunca renderiza abaixo de md.
const RestauranteSidebar = ({ open, onClose, links, activePath, pendentesMotoboy = 0, slugLoja, onSair }) => {
  const navigate = useNavigate();
  const ir = (path) => { navigate(path); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <div className="hidden md:block">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E4E7]">
              <p className="font-bold text-[#18181B]">Menu</p>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F4F5] text-[#71717A]">
                <Icon name="X" size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
              {links.map((l) => (
                <button key={l.path} onClick={() => ir(l.path)}
                  className={`relative flex items-center justify-between text-left px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                    l.path === activePath ? 'text-white bg-[#FF441F]' : 'text-[#27272A] hover:bg-[#F4F4F5]'
                  }`}>
                  {l.label}
                  {l.path === '/restaurante/motoboys' && pendentesMotoboy > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {pendentesMotoboy}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            {(slugLoja || onSair) && (
              <div className="px-3 py-3 border-t border-[#E4E4E7] flex flex-col gap-1.5">
                {slugLoja && (
                  <button onClick={() => window.open(`/r/${slugLoja}`, '_blank')}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 flex items-center gap-2">
                    <Icon name="ExternalLink" size={14} /> Loja
                  </button>
                )}
                {onSair && (
                  <button onClick={onSair}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200">
                    Sair
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RestauranteSidebar;
