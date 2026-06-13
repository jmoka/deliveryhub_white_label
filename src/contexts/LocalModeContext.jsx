import React, { createContext, useContext, useState, useEffect } from 'react';
import { getEmpresas } from '../services/adminService';

const LocalModeContext = createContext(null);

// Lê VITE_LOCAL_RESTAURANT_ID do .env
// Se definido, o admin opera em "Modo Local" — restrito a 1 restaurante
const LOCAL_ID = import.meta.env.VITE_LOCAL_RESTAURANT_ID
  ? parseInt(import.meta.env.VITE_LOCAL_RESTAURANT_ID, 10)
  : null;

export const LocalModeProvider = ({ children }) => {
  const [restauranteNome, setRestauranteNome] = useState(null);

  useEffect(() => {
    if (!LOCAL_ID) return;
    getEmpresas()
      .then((d) => {
        const found = (d.empresas ?? []).find((e) => e.id === LOCAL_ID);
        if (found) setRestauranteNome(found.name);
      })
      .catch(() => {});
  }, []);

  return (
    <LocalModeContext.Provider value={{ isLocalMode: !!LOCAL_ID, localRestaurantId: LOCAL_ID, restauranteNome }}>
      {children}
    </LocalModeContext.Provider>
  );
};

export const useLocalMode = () => useContext(LocalModeContext);

// Banner reutilizável para todas as páginas admin
export const LocalModeBanner = () => {
  const { isLocalMode, restauranteNome, localRestaurantId } = useLocalMode() ?? {};
  if (!isLocalMode) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-300 px-6 py-2 flex items-center gap-2 text-amber-800 text-xs font-semibold">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
      Modo Local — {restauranteNome ? `Restaurante: ${restauranteNome}` : `ID #${localRestaurantId}`}
      <span className="ml-auto font-normal opacity-70">Acesso restrito a 1 restaurante</span>
    </div>
  );
};
