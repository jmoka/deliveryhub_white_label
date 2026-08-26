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
import { usePontosPreparoLinks } from '../../hooks/usePontosPreparoLinks';
import { useRestauranteFavoritos } from '../../hooks/useRestauranteFavoritos';
import { getRestauranteNavLinks } from '../../config/restauranteNavLinks';

// Header compartilhado de toda a área /restaurante/*. Substitui o header
// duplicado (e divergente) que cada página tinha antes — ver plano
// "Layout compartilhado + favoritos na topbar".
// Bolinha de status do plano na barra superior — verde (em dia), laranja
// (vencendo em breve ou vencida mas dentro da tolerância), vermelha (bloqueado).
const DIAS_ALERTA_VENCIMENTO = 5;

// Ícones dos favoritos começam grandes/bem visíveis e só encolhem conforme a
// quantidade aumenta, pra continuar cabendo numa linha só na topbar.
const tamanhoFavoritos = (qtd) => {
  if (qtd <= 3) return { icone: 50, padding: 'p-4' };
  if (qtd <= 5) return { icone: 44, padding: 'p-3.5' };
  if (qtd <= 7) return { icone: 38, padding: 'p-3' };
  return { icone: 33, padding: 'p-2.5' };
};

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
  const pontosPreparoLinks = usePontosPreparoLinks();
  const { favoritos, toggleFavorito, isFavorito, mostrarNomes, toggleMostrarNomes } = useRestauranteFavoritos();
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

  const links = getRestauranteNavLinks(moduloDelivery, moduloSalao, pontosPreparoLinks);
  const linksFavoritos = links.filter((l) => favoritos.includes(l.path));

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-[#18181B] border-b border-[#E4E4E7] dark:border-[#3F3F46] px-6 py-4 flex items-center justify-between gap-3">
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
          <div className="hidden md:flex items-center gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {linksFavoritos.map((l) => {
                const { icone, padding } = mostrarNomes ? { icone: 13, padding: 'px-3 py-1.5' } : tamanhoFavoritos(linksFavoritos.length);
                return (
                  <button key={l.path} onClick={() => navigate(l.path)} title={l.label}
                    className={`flex items-center gap-1.5 ${padding} text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                      l.path === active ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#27272A] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46]'
                    }`}>
                    <Icon name={l.icon} size={icone} /> {mostrarNomes && l.label}
                  </button>
                );
              })}
            </div>
            <button onClick={toggleMostrarNomes} title={mostrarNomes ? 'Mostrar só ícones' : 'Mostrar nomes'}
              className="p-1.5 rounded-full flex-shrink-0 text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]">
              <Icon name={mostrarNomes ? 'ChevronsLeftRight' : 'ChevronsRightLeft'} size={13} />
            </button>
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
