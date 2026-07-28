import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'theme';

const getInicial = () => {
  const salvo = localStorage.getItem(STORAGE_KEY);
  if (salvo === 'dark' || salvo === 'light') return salvo;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [tema, setTema] = useState(getInicial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
    localStorage.setItem(STORAGE_KEY, tema);
  }, [tema]);

  const alternarTema = () => setTema((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// Ícone fixo no canto superior direito, disponível em todas as telas.
// Páginas ainda não adaptadas pro dark mode simplesmente ignoram a classe "dark" na <html>
// até serem migradas — alternar o tema não quebra o visual delas.
export const ThemeToggle = () => {
  const { tema, alternarTema } = useTheme() ?? {};
  if (!alternarTema) return null;
  return (
    <button
      onClick={alternarTema}
      title={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label="Alternar tema claro/escuro"
      className="fixed top-3 right-3 z-[100] w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] shadow-md hover:scale-105 transition-transform"
    >
      {tema === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-300">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#18181B]">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
};
