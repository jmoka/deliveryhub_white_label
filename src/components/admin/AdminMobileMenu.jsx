import React from 'react';
import { motion } from 'framer-motion';

const AdminMobileMenu = ({ links, currentPath, onNavigate, onSair }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="lg:hidden bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-4 py-3 flex flex-col gap-1 z-40 relative shadow-md"
  >
    {links.map((l) => (
      <button key={l.path} onClick={() => onNavigate(l.path)}
        className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
          l.path === currentPath ? 'text-white bg-blue-600' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
        }`}>
        {l.label}
      </button>
    ))}
    <button onClick={onSair}
      className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
      Sair
    </button>
  </motion.div>
);

export default AdminMobileMenu;
