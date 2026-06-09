import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const AlertasToast = ({ alertas, onDismiss }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    <AnimatePresence>
      {alertas.map((a) => (
        <motion.div key={a.id}
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="pointer-events-auto flex items-center gap-3 bg-[#FF441F] text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-[#FF441F]/40 border border-white/20"
        >
          <span className="text-xl animate-bounce">🔔</span>
          <div>
            <p className="font-black text-sm leading-tight">Novo pedido!</p>
            <p className="text-xs opacity-90 font-medium">#{a.id} — {fmt(a.total)}</p>
          </div>
          <button
            onClick={() => onDismiss(a.id)}
            className="ml-2 w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-xs font-black"
          >×</button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export default AlertasToast;
