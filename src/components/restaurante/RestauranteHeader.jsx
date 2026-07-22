import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import RestauranteSidebar from './RestauranteSidebar';
import MobileMenu from './MobileMenu';
import { useAuth } from '../../contexts/AuthContext';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useMinhaLojaLogo } from '../../hooks/useMinhaLojaLogo';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';
import { useSolicitacoesMotoboyCount } from '../../hooks/useSolicitacoesMotoboyCount';
import { useRestauranteFavoritos } from '../../hooks/useRestauranteFavoritos';
import { getRestauranteNavLinks } from '../../config/restauranteNavLinks';

// Header compartilhado de toda a área /restaurante/*. Substitui o header
// duplicado (e divergente) que cada página tinha antes — ver plano
// "Layout compartilhado + favoritos na topbar".
const RestauranteHeader = ({ active, title, subtitle }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const slugLoja = useMinhaLojaSlug();
  const logoUrl = useMinhaLojaLogo();
  const tipoRestaurante = useTipoRestaurante();
  const pendentesMotoboy = useSolicitacoesMotoboyCount();
  const { favoritos, toggleFavorito, isFavorito } = useRestauranteFavoritos();
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  const links = getRestauranteNavLinks(tipoRestaurante);
  const linksFavoritos = links.filter((l) => favoritos.includes(l.path));

  return (
    <>
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl
            ? <img src={logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            : <div className="w-8 h-8 rounded-lg bg-[#FF441F]/10 flex items-center justify-center flex-shrink-0"><Icon name="UtensilsCrossed" size={16} className="text-[#FF441F]" /></div>}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#18181B] truncate">{title}</h1>
            {subtitle && <p className="text-sm text-[#71717A] truncate">{subtitle}</p>}
          </div>
        </div>

        {linksFavoritos.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
            {linksFavoritos.map((l) => (
              <button key={l.path} onClick={() => navigate(l.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                  l.path === active ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#27272A] hover:bg-[#E4E4E7]'
                }`}>
                <Icon name={l.icon} size={13} /> {l.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setSidebarAberto(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#27272A] hover:bg-[#F4F4F5] border border-[#E4E4E7]">
            <Icon name="Menu" size={18} /> Menu
          </button>
          <button className="md:hidden p-2 rounded-lg hover:bg-[#F4F4F5] text-[#18181B]" onClick={() => setMenuAberto((v) => !v)}>
            <Icon name={menuAberto ? 'X' : 'Menu'} size={22} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuAberto && (
          <MobileMenu
            links={links}
            currentPath={active}
            pendentesMotoboy={pendentesMotoboy}
            slugLoja={slugLoja}
            onNavigate={(path) => { navigate(path); setMenuAberto(false); }}
            onSair={async () => { await signOut(); navigate('/customer-registration-login'); }}
          />
        )}
      </AnimatePresence>

      <RestauranteSidebar
        open={sidebarAberto}
        onClose={() => setSidebarAberto(false)}
        links={links}
        activePath={active}
        pendentesMotoboy={pendentesMotoboy}
        slugLoja={slugLoja}
        onSair={async () => { await signOut(); navigate('/customer-registration-login'); }}
        isFavorito={isFavorito}
        onToggleFavorito={toggleFavorito}
      />
    </>
  );
};

export default RestauranteHeader;
