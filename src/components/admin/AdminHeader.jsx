import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import { ThemeToggle } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AdminMobileMenu from './AdminMobileMenu';
import { ADMIN_NAV_LINKS } from '../../config/adminNavLinks';

// Header compartilhado de toda a área /admin/*. Substitui o header/nav
// duplicado (e divergente) que cada página tinha antes — mesmo padrão do
// RestauranteHeader, sem colapso em hambúrguer nenhuma página ficava
// "bagunçada" em mobile (nav de 8 botões sem quebra nem esconder).
const AdminHeader = ({ active, title, subtitle, beforeTitle }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  const handleSair = async () => {
    await signOut();
    navigate('/customer-registration-login');
  };

  return (
    <>
      <header className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          {beforeTitle}
          <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-zinc-400 truncate">{subtitle}</p>}
        </div>

        <nav className="hidden lg:flex gap-1.5 items-center flex-wrap justify-end">
          {ADMIN_NAV_LINKS.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                active === l.path
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}>
              {l.label}
            </button>
          ))}
          <ThemeToggle inline />
          <button onClick={handleSair}
            className="px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900 whitespace-nowrap">
            Sair
          </button>
        </nav>

        <div className="flex lg:hidden items-center gap-2 flex-shrink-0">
          <ThemeToggle inline />
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-900 dark:text-zinc-100"
            onClick={() => setMenuAberto((v) => !v)}
          >
            <Icon name={menuAberto ? 'X' : 'Menu'} size={22} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuAberto && (
          <AdminMobileMenu
            links={ADMIN_NAV_LINKS}
            currentPath={active}
            onNavigate={(path) => { navigate(path); setMenuAberto(false); }}
            onSair={handleSair}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminHeader;
