import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

// Menu lateral só pra desktop/telas grandes (lg+) — mesmo padrão do
// RestauranteSidebar, substitui a barra horizontal de botões que ficava
// poluída com muitos links. Mobile continua com o AdminMobileMenu já
// existente, este componente nunca renderiza abaixo de lg.
const AdminSidebar = ({ open, onClose, links, activePath, motoboysPendentes = 0, onSair, isFavorito, onToggleFavorito }) => {
  const navigate = useNavigate();
  const ir = (path) => { navigate(path); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed top-0 left-0 h-full w-72 bg-white dark:bg-zinc-800 z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-700">
              <p className="font-bold text-gray-900 dark:text-zinc-100">Menu</p>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400">
                <Icon name="X" size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
              {links.map((l) => (
                <div key={l.path} className={`relative flex items-center rounded-xl transition-colors ${
                    l.path === activePath ? 'text-white bg-blue-600' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700'
                  }`}>
                  <button onClick={() => ir(l.path)}
                    className="flex-1 flex items-center gap-2.5 text-left pl-4 pr-2 py-2.5 text-sm font-semibold min-w-0">
                    <Icon name={l.icon} size={16} className="flex-shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{l.label}</span>
                    {l.path === '/admin/motoboys' && motoboysPendentes > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full flex-shrink-0">
                        {motoboysPendentes}
                      </span>
                    )}
                  </button>
                  {onToggleFavorito && (
                    <button onClick={() => onToggleFavorito(l.path)}
                      className={`p-2 mr-1 rounded-lg flex-shrink-0 ${l.path === activePath ? 'hover:bg-white/20' : 'hover:bg-gray-200 dark:hover:bg-zinc-600'}`}
                      title={isFavorito?.(l.path) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
                      <Icon name="Star" size={15} className={isFavorito?.(l.path) ? 'fill-current' : ''} />
                    </button>
                  )}
                </div>
              ))}
            </nav>
            {onSair && (
              <div className="px-3 py-3 border-t border-gray-200 dark:border-zinc-700">
                <button onClick={onSair}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
                  Sair
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdminSidebar;
