import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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

// Ícone disponível em todas as telas pra alternar claro/escuro.
// Páginas ainda não adaptadas pro dark mode simplesmente ignoram a classe "dark" na <html>
// até serem migradas — alternar o tema não quebra o visual delas.
//
// Por padrão fica fixo no canto superior direito (fallback pra páginas sem cabeçalho
// próprio). Em /restaurante/*, /admin/* e /r/:slug (catálogo público) o próprio
// header da página já renderiza uma cópia `inline` dentro da barra superior — nesse
// caso o fallback fixo se esconde sozinho pra não duplicar nem sobrepor outros botões.
// Também escondido na home ("/") e no catálogo de produtos, onde sobrepunha o botão
// "Entrar" do header.
export const ThemeToggle = ({ inline = false }) => {
  const { tema, alternarTema } = useTheme() ?? {};
  const location = useLocation();
  if (!alternarTema) return null;
  if (!inline && (
    location.pathname.startsWith('/restaurante') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/r/') ||
    location.pathname === '/' ||
    location.pathname === '/menu-catalog-product-browse' ||
    location.pathname === '/customer-account-order-history'
  )) return null;

  const posicao = inline ? '' : 'fixed top-3 right-3 z-[100]';
  return (
    <button
      onClick={alternarTema}
      title={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label="Alternar tema claro/escuro"
      className={`${posicao} w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] shadow-md hover:scale-105 transition-transform flex-shrink-0`}
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
