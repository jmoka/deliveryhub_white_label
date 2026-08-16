import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import RestauranteSidebar from './RestauranteSidebar';
import MobileMenu from './MobileMenu';
import { ThemeToggle } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useMinhaLojaLogo } from '../../hooks/useMinhaLojaLogo';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';
import { useSolicitacoesMotoboyCount } from '../../hooks/useSolicitacoesMotoboyCount';
import { useRestauranteFavoritos } from '../../hooks/useRestauranteFavoritos';
import { getRestauranteNavLinks } from '../../config/restauranteNavLinks';

// Header compartilhado de toda a área /restaurante/*. Substitui o header
// duplicado (e divergente) que cada página tinha antes — ver plano
// "Layout compartilhado + favoritos na topbar".
// Bolinha de status do plano na barra superior — verde (em dia), laranja
// (vencendo em breve ou vencida mas dentro da tolerância), vermelha (bloqueado).
const DIAS_ALERTA_VENCIMENTO = 5;

const PlanoStatusDot = ({ planoStatus, onClick }) => {
  if (!planoStatus || !planoStatus.plano_nome) return null;

  const diasAteVencer = planoStatus.proxima_cobranca
    ? Math.ceil((new Date(planoStatus.proxima_cobranca) - new Date()) / 86400000)
    : null;

  let cor = 'bg-green-500';
  let texto = 'Plano em dia';
  if (planoStatus.bloqueado) {
    cor = 'bg-red-500';
    texto = `Painel bloqueado — fatura vencida há ${planoStatus.dias_atraso} dia(s)`;
  } else if (planoStatus.dias_atraso > 0) {
    cor = 'bg-orange-500';
    texto = `Fatura vencida há ${planoStatus.dias_atraso} dia(s) — regularize`;
  } else if (diasAteVencer != null && diasAteVencer <= DIAS_ALERTA_VENCIMENTO) {
    cor = 'bg-orange-500';
    texto = `Próxima cobrança em ${diasAteVencer} dia(s)`;
  }

  return (
    <button onClick={onClick} title={texto}
      className="p-2 rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] flex-shrink-0">
      <span className={`block w-2.5 h-2.5 rounded-full ${cor} ${planoStatus.bloqueado ? 'animate-pulse' : ''}`} />
    </button>
  );
};

const RestauranteHeader = ({ active, title, subtitle, onRefresh }) => {
  const navigate = useNavigate();
  const { signOut, planoStatus } = useAuth();
  const slugLoja = useMinhaLojaSlug();
  const logoUrl = useMinhaLojaLogo();
  const { moduloDelivery, moduloSalao } = useModulosEmpresa();
  const pendentesMotoboy = useSolicitacoesMotoboyCount();
  const { favoritos, toggleFavorito, isFavorito } = useRestauranteFavoritos();
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  // Botão de atualizar dados sem recarregar a página inteira — o spin mínimo de
  // 400ms é só feedback visual, mesmo se o onRefresh do caller for instantâneo.
  const handleRefresh = async () => {
    if (!onRefresh || atualizando) return;
    setAtualizando(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setAtualizando(false), 400);
    }
  };

  const links = getRestauranteNavLinks(moduloDelivery, moduloSalao);
  const linksFavoritos = links.filter((l) => favoritos.includes(l.path));

  return (
    <>
      <header className="bg-white dark:bg-[#18181B] border-b border-[#E4E4E7] dark:border-[#3F3F46] px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl
            ? <img src={logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            : <div className="w-8 h-8 rounded-lg bg-[#FF441F]/10 flex items-center justify-center flex-shrink-0"><Icon name="UtensilsCrossed" size={16} className="text-[#FF441F]" /></div>}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">{title}</h1>
            {subtitle && <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] truncate">{subtitle}</p>}
          </div>
        </div>

        {linksFavoritos.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
            {linksFavoritos.map((l) => (
              <button key={l.path} onClick={() => navigate(l.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                  l.path === active ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#27272A] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46]'
                }`}>
                <Icon name={l.icon} size={13} /> {l.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <PlanoStatusDot planoStatus={planoStatus} onClick={() => navigate('/restaurante/plano')} />
          {onRefresh && (
            <button onClick={handleRefresh} disabled={atualizando} title="Atualizar dados"
              className="p-2 rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] text-[#27272A] dark:text-[#F4F4F5] disabled:opacity-50">
              <Icon name="RefreshCw" size={18} className={atualizando ? 'animate-spin' : ''} />
            </button>
          )}
          <button onClick={() => navigate('/restaurante/meu-perfil')} title="Meu perfil"
            className="hidden md:flex p-2 rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] text-[#27272A] dark:text-[#F4F4F5]">
            <Icon name="UserCircle" size={18} />
          </button>
          <ThemeToggle inline />
          <button onClick={() => setSidebarAberto(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46]">
            <Icon name="Menu" size={18} /> Menu
          </button>
          <button className="md:hidden p-2 rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5]" onClick={() => setMenuAberto((v) => !v)}>
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
            onMeuPerfil={() => { navigate('/restaurante/meu-perfil'); setMenuAberto(false); }}
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
        onMeuPerfil={() => { navigate('/restaurante/meu-perfil'); setSidebarAberto(false); }}
        isFavorito={isFavorito}
        onToggleFavorito={toggleFavorito}
      />
    </>
  );
};

export default RestauranteHeader;
