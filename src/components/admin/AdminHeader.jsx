import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import { ThemeToggle } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AdminMobileMenu from './AdminMobileMenu';
import AdminSidebar from './AdminSidebar';
import { ADMIN_NAV_LINKS } from '../../config/adminNavLinks';
import { useMotoboysPendentesAdmin } from '../../hooks/useMotoboysPendentesAdmin';
import { useAdminFavoritos } from '../../hooks/useAdminFavoritos';

// Header compartilhado de toda a área /admin/*. Substitui o header/nav
// duplicado (e divergente) que cada página tinha antes — mesmo padrão do
// RestauranteHeader, sem colapso em hambúrguer nenhuma página ficava
// "bagunçada" em mobile (nav de 8 botões sem quebra nem esconder).

// Ícones dos favoritos começam grandes/bem visíveis e só encolhem conforme a
// quantidade aumenta, pra continuar cabendo numa linha só na topbar (mesma
// lógica de RestauranteHeader.jsx).
const tamanhoFavoritos = (qtd) => {
  if (qtd <= 3) return { icone: 35, padding: 'p-3' };
  if (qtd <= 5) return { icone: 31, padding: 'p-2.5' };
  if (qtd <= 7) return { icone: 27, padding: 'p-2' };
  return { icone: 23, padding: 'p-1.5' };
};

const AdminHeader = ({ active, title, subtitle, beforeTitle }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const motoboysPendentes = useMotoboysPendentesAdmin();
  const { favoritos, toggleFavorito, isFavorito, mostrarNomes, toggleMostrarNomes } = useAdminFavoritos();
  const linksFavoritos = ADMIN_NAV_LINKS.filter((l) => favoritos.includes(l.path));

  const handleSair = async () => {
    await signOut();
    navigate('/customer-registration-login');
  };

  return (
    <>
      <header className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {beforeTitle}
          <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-zinc-400 sm:truncate">{subtitle}</p>}
        </div>

        {linksFavoritos.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {linksFavoritos.map((l) => {
                const { icone, padding } = mostrarNomes ? { icone: 13, padding: 'px-3 py-1.5' } : tamanhoFavoritos(linksFavoritos.length);
                return (
                  <button key={l.path} onClick={() => navigate(l.path)} title={l.label}
                    className={`relative flex items-center gap-1.5 ${padding} text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                      l.path === active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                    }`}>
                    <Icon name={l.icon} size={icone} /> {mostrarNomes && l.label}
                    {l.path === '/admin/motoboys' && motoboysPendentes > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {motoboysPendentes}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={toggleMostrarNomes} title={mostrarNomes ? 'Mostrar só ícones' : 'Mostrar nomes'}
              className="p-1.5 rounded-full flex-shrink-0 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700">
              <Icon name={mostrarNomes ? 'ChevronsLeftRight' : 'ChevronsRightLeft'} size={13} />
            </button>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <ThemeToggle inline />
          <button onClick={() => setSidebarAberto(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
            <Icon name="Menu" size={18} /> Menu
          </button>
          <button onClick={handleSair}
            className="px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900 whitespace-nowrap">
            Sair
          </button>
        </div>

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
            motoboysPendentes={motoboysPendentes}
          />
        )}
      </AnimatePresence>

      <AdminSidebar
        open={sidebarAberto}
        onClose={() => setSidebarAberto(false)}
        links={ADMIN_NAV_LINKS}
        activePath={active}
        motoboysPendentes={motoboysPendentes}
        onSair={handleSair}
        isFavorito={isFavorito}
        onToggleFavorito={toggleFavorito}
      />
    </>
  );
};

export default AdminHeader;
