import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import { useSolicitacoesMotoboyCount } from '../../hooks/useSolicitacoesMotoboyCount';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useMinhaLojaLogo } from '../../hooks/useMinhaLojaLogo';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';
import { useAuth } from '../../contexts/AuthContext';
import RestauranteSidebar from '../../components/restaurante/RestauranteSidebar';
import MobileMenu from '../../components/restaurante/MobileMenu';

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const pendentes = useSolicitacoesMotoboyCount();
  const slugLoja = useMinhaLojaSlug();
  const logoUrl = useMinhaLojaLogo();
  const tipoRestaurante = useTipoRestaurante();
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Relatórios', path: '/restaurante/relatorios' },
    { label: 'Delivery', path: '/restaurante/delivery' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Entregas', path: '/restaurante/entregas' },
    { label: 'Motoboys', path: '/restaurante/motoboys' },
    ...(tipoRestaurante ? [
      { label: 'Salão', path: '/restaurante/salao' },
      { label: 'Garçons', path: '/restaurante/garcons' },
      { label: 'Impressoras', path: '/restaurante/impressoras' },
    ] : []),
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Cardápio Digital', path: '/restaurante/cardapio-digital' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <>
      <div className="md:hidden flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logoUrl
            ? <img src={logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
            : <div className="w-8 h-8 rounded-lg bg-[#FF441F]/10 flex items-center justify-center"><Icon name="UtensilsCrossed" size={16} className="text-[#FF441F]" /></div>}
        </div>
        <button className="p-2 rounded-lg hover:bg-[#F4F4F5] text-[#18181B]" onClick={() => setMenuAberto((v) => !v)}>
          <Icon name={menuAberto ? 'X' : 'Menu'} size={22} />
        </button>
      </div>
      <AnimatePresence>
        {menuAberto && (
          <MobileMenu
            links={links}
            currentPath={active}
            pendentesMotoboy={pendentes}
            slugLoja={slugLoja}
            onNavigate={(path) => { navigate(path); setMenuAberto(false); }}
            onSair={async () => { await signOut(); navigate('/customer-registration-login'); }}
          />
        )}
      </AnimatePresence>
      <div className="hidden md:flex md:flex-1 justify-end">
        <button onClick={() => setSidebarAberto(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#27272A] hover:bg-[#F4F4F5] border border-[#E4E4E7]">
          <Icon name="Menu" size={18} /> Menu
        </button>
      </div>
      <RestauranteSidebar
        open={sidebarAberto}
        onClose={() => setSidebarAberto(false)}
        links={links}
        activePath={active}
        pendentesMotoboy={pendentes}
        slugLoja={slugLoja}
      />
    </>
  );
};

// Roda em localhost só o próprio PC alcança — celular do cliente escaneando o QR na
// mesa precisa do IP de rede (VITE_LAN_URL), mesmo esquema do QR de acompanhamento
// da mesa (ver utils/mesaAcompanharUrl.js).
const getCardapioUrls = (slug) => {
  const path = `/cardapio/${slug}`;
  const rodandoLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const lanUrl = import.meta.env.VITE_LAN_URL;
  return {
    principal: `${window.location.origin}${path}`,
    lan: rodandoLocal && lanUrl ? `${lanUrl}${path}` : null,
  };
};

const RestauranteCardapioDigital = () => {
  const slugLoja = useMinhaLojaSlug();
  const [copiado, setCopiado] = useState(false);
  const [modo, setModo] = useState('online'); // 'online' | 'local'

  const copiarLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <div className="bg-white border-b border-[#E4E4E7] p-4">
        <NavRestaurante active="/restaurante/cardapio-digital" />
      </div>

      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-lg font-black text-[#18181B] mb-1">Cardápio Digital</h1>
        <p className="text-sm text-[#71717A] mb-4">
          Gere um QR code pras mesas — o cliente escaneia e vê produtos e preços, sem precisar pedir pelo app.
        </p>

        {!slugLoja ? (
          <p className="text-sm text-[#71717A]">Carregando...</p>
        ) : (() => {
          const urls = getCardapioUrls(slugLoja);
          const urlAtiva = modo === 'local' && urls.lan ? urls.lan : urls.principal;
          const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(urlAtiva)}`;

          return (
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 flex flex-col items-center">
              {urls.lan && (
                <div className="flex gap-2 mb-4 self-start">
                  <button onClick={() => setModo('online')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold ${modo === 'online' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>
                    ONLINE
                  </button>
                  <button onClick={() => setModo('local')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold ${modo === 'local' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>
                    LOCAL
                  </button>
                </div>
              )}

              <img src={qrSrc} alt="QR code do cardápio digital" width={260} height={260} className="rounded-xl border border-[#E4E4E7]" />

              <p className="text-xs text-[#71717A] mt-3 break-all text-center">{urlAtiva}</p>

              <div className="flex gap-2 mt-4 w-full">
                <button onClick={() => copiarLink(urlAtiva)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl border border-[#E4E4E7] text-[#27272A] hover:bg-[#F4F4F5]">
                  <Icon name={copiado ? 'Check' : 'Copy'} size={15} /> {copiado ? 'Copiado!' : 'Copiar link'}
                </button>
                <a href={urlAtiva} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl bg-[#FF441F] text-white hover:bg-[#E63A19]">
                  <Icon name="ExternalLink" size={15} /> Abrir cardápio
                </a>
              </div>
              <a href={qrSrc} download={`cardapio-${slugLoja}.png`}
                className="mt-2 text-xs font-semibold text-[#FF441F] hover:underline">
                Baixar QR code (PNG)
              </a>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default RestauranteCardapioDigital;
