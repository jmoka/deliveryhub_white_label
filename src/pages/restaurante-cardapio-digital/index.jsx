import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../components/AppIcon';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';
import { getMinhaEmpresa, getMeusProdutos } from '../../services/restauranteService';
import { printCartazCardapioDigital, printTicketCardapioDigital } from '../../utils/printComanda';
import { printCardapioImpresso } from '../../utils/printCardapioImpresso';

const fmtPreco = (v) => `R$ ${Number(v ?? 0).toFixed(2).replace('.', ',')}`;

const LS_RODAPE = 'cardapioImpresso.rodape';
const LS_USAR_LOGO = 'cardapioImpresso.usarLogo';

const CardapioImpressoModal = ({ onClose }) => {
  const [carregando, setCarregando] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [selecionados, setSelecionados] = useState(new Set());
  const [usarLogo, setUsarLogo] = useState(() => localStorage.getItem(LS_USAR_LOGO) !== 'false');
  const [rodape, setRodape] = useState(() => localStorage.getItem(LS_RODAPE) ?? '');

  useEffect(() => {
    Promise.all([getMeusProdutos(), getMinhaEmpresa()])
      .then(([p, e]) => {
        const lista = p.produtos ?? [];
        setProdutos(lista);
        setEmpresa(e.empresa);
        setSelecionados(new Set(lista.map((item) => item.id)));
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  // Agrupa por categoria direto dos produtos (já vêm com category_name) —
  // não precisa buscar /categorias à parte só pra montar essa lista.
  const categorias = useMemo(() => {
    const mapa = new Map();
    for (const p of produtos) {
      const nome = p.category_name || 'Outros';
      if (!mapa.has(nome)) mapa.set(nome, []);
      mapa.get(nome).push(p);
    }
    return [...mapa.entries()]
      .map(([nome, itens]) => ({ nome, produtos: itens }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos]);

  const toggleProduto = (id) => {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  };

  const toggleCategoria = (categoria) => {
    const ids = categoria.produtos.map((p) => p.id);
    const todosSelecionados = ids.every((id) => selecionados.has(id));
    setSelecionados((atual) => {
      const novo = new Set(atual);
      ids.forEach((id) => (todosSelecionados ? novo.delete(id) : novo.add(id)));
      return novo;
    });
  };

  const selecionarTodos = () => {
    setSelecionados((atual) => (atual.size === produtos.length ? new Set() : new Set(produtos.map((p) => p.id))));
  };

  const gerar = () => {
    localStorage.setItem(LS_RODAPE, rodape);
    localStorage.setItem(LS_USAR_LOGO, String(usarLogo));

    const categoriasSelecionadas = categorias
      .map((c) => ({ nome: c.nome, produtos: c.produtos.filter((p) => selecionados.has(p.id)) }))
      .filter((c) => c.produtos.length > 0);

    const endereco = empresa
      ? [empresa.address, empresa.neighborhood, empresa.city].filter(Boolean).join(', ')
      : '';

    printCardapioImpresso({
      categorias: categoriasSelecionadas,
      restauranteNome: empresa?.name,
      logoUrl: empresa?.logo_url,
      usarLogo,
      endereco,
      whatsapp: empresa?.whatsapp ?? '',
      rodape: rodape.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4E7]">
          <div>
            <h2 className="text-lg font-bold text-[#18181B]">Cardápio impresso</h2>
            <p className="text-xs text-[#71717A]">Escolha os produtos que entram na folha pra imprimir e plastificar.</p>
          </div>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-[#18181B]">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-[#E4E4E7] space-y-3">
          <label className="flex items-center gap-2 text-sm text-[#27272A] cursor-pointer">
            <input type="checkbox" checked={usarLogo} onChange={(e) => setUsarLogo(e.target.checked)} className="w-4 h-4 accent-[#FF441F]" />
            Incluir logomarca no topo
          </label>
          <div>
            <label className="block text-xs font-semibold text-[#71717A] mb-1">Frase do rodapé (opcional)</label>
            <input type="text" value={rodape} onChange={(e) => setRodape(e.target.value)}
              placeholder="Ex: Peça também pelo nosso delivery!"
              className="w-full border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]" />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-b border-[#E4E4E7]">
          <label className="flex items-center gap-1.5 text-xs text-[#71717A] cursor-pointer">
            <input type="checkbox" checked={produtos.length > 0 && selecionados.size === produtos.length} onChange={selecionarTodos} className="w-4 h-4 accent-[#FF441F]" />
            Selecionar todos ({produtos.length})
          </label>
          <span className="text-xs font-semibold text-[#18181B]">{selecionados.size} selecionado(s)</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {carregando ? (
            <p className="text-xs text-[#A1A1AA] py-8 text-center">Carregando...</p>
          ) : categorias.length === 0 ? (
            <p className="text-xs text-[#A1A1AA] py-8 text-center">Nenhum produto cadastrado ainda.</p>
          ) : (
            categorias.map((categoria) => {
              const ids = categoria.produtos.map((p) => p.id);
              const todosSelecionados = ids.every((id) => selecionados.has(id));
              return (
                <div key={categoria.nome}>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" checked={todosSelecionados} onChange={() => toggleCategoria(categoria)} className="w-4 h-4 accent-[#FF441F]" />
                    <span className="text-sm font-bold text-[#18181B]">{categoria.nome}</span>
                  </label>
                  <div className="pl-6 space-y-1.5">
                    {categoria.produtos.map((p) => (
                      <label key={p.id} className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="flex items-center gap-2 text-sm text-[#27272A]">
                          <input type="checkbox" checked={selecionados.has(p.id)} onChange={() => toggleProduto(p.id)} className="w-4 h-4 accent-[#FF441F]" />
                          {p.name}
                        </span>
                        <span className="text-xs text-[#71717A]">{fmtPreco(p.preco_promo ?? p.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E4E4E7]">
          <button onClick={gerar} disabled={selecionados.size === 0}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl bg-[#FF441F] text-white hover:bg-[#E63A19] disabled:opacity-40">
            <Icon name="Printer" size={15} /> Gerar cardápio impresso ({selecionados.size})
          </button>
        </div>
      </div>
    </div>
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
  const [mostrarModalCardapioImpresso, setMostrarModalCardapioImpresso] = useState(false);

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

              <button
                onClick={() => setMostrarModalCardapioImpresso(true)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl border border-[#E4E4E7] text-[#27272A] hover:bg-[#F4F4F5]">
                <Icon name="Printer" size={15} /> Cardápio impresso (pra plastificar)
              </button>
            </div>
          );
        })()}
      </div>

      {mostrarModalCardapioImpresso && (
        <CardapioImpressoModal onClose={() => setMostrarModalCardapioImpresso(false)} />
      )}
    </div>
  );
};

export default RestauranteCardapioDigital;
