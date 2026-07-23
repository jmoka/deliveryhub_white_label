import React, { useState } from 'react';
import Icon from '../../components/AppIcon';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';
import { getMinhaEmpresa } from '../../services/restauranteService';
import { printCartazCardapioDigital, printTicketCardapioDigital } from '../../utils/printComanda';

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

  // Busca a empresa na hora do clique (não guarda em state) — evita imprimir sem
  // logo quando o botão é clicado antes do fetch inicial da tela terminar.
  const imprimirComLogo = async (imprimirFn, qrUrl) => {
    const d = await getMinhaEmpresa().catch(() => null);
    imprimirFn(qrUrl, d?.empresa?.name, d?.empresa?.logo_url);
  };

  const copiarLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <RestauranteHeader active="/restaurante/cardapio-digital" title="Cardápio Digital" />

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

              <div className="flex gap-2 mt-4 w-full border-t border-[#E4E4E7] pt-4">
                <button
                  onClick={() => imprimirComLogo(
                    printCartazCardapioDigital,
                    `https://api.qrserver.com/v1/create-qr-code/?size=340x340&data=${encodeURIComponent(urlAtiva)}`,
                  )}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl border border-[#E4E4E7] text-[#27272A] hover:bg-[#F4F4F5]">
                  <Icon name="Printer" size={15} /> Cartaz A4
                </button>
                <button
                  onClick={() => imprimirComLogo(
                    printTicketCardapioDigital,
                    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(urlAtiva)}`,
                  )}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl border border-[#E4E4E7] text-[#27272A] hover:bg-[#F4F4F5]">
                  <Icon name="Printer" size={15} /> Ticket térmico
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default RestauranteCardapioDigital;
