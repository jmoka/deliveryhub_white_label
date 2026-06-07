import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCardapioPorSlug } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

/* ── Skeleton produto ────────────────────────────────────────────── */
const SkeletonProduto = () => (
  <div className="flex gap-4 p-4 bg-white rounded-2xl border border-[#E4E4E7] animate-pulse">
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="h-5 bg-gray-200 rounded w-20 mt-3" />
    </div>
    <div className="w-28 h-24 bg-gray-200 rounded-xl flex-shrink-0" />
  </div>
);

/* ── Card de produto ─────────────────────────────────────────────── */
const ProdutoCard = ({ produto, onAdicionar, qtd }) => {
  const temPromo = produto.tipo === 'promo' && produto.preco_promo != null;
  const indisponivel = produto.disponivel === false;
  const precoFinal = temPromo ? produto.preco_promo : produto.price;

  return (
    <motion.div
      layout
      className={`flex gap-4 p-4 bg-white rounded-2xl border transition-shadow ${
        indisponivel ? 'border-[#E4E4E7] opacity-60' : 'border-[#E4E4E7] hover:shadow-md hover:border-[#FF441F]/20'
      }`}
    >
      {/* Texto */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start gap-2">
            <p className="font-semibold text-[#18181B] text-sm leading-snug flex-1">{produto.name}</p>
            {produto.destaque && (
              <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 bg-yellow-400/20 text-yellow-700 rounded font-bold">⭐ Destaque</span>
            )}
            {produto.tipo === 'combo' && (
              <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">COMBO</span>
            )}
          </div>
          {produto.description && (
            <p className="text-xs text-[#71717A] mt-1 line-clamp-2">{produto.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Preço */}
          <div>
            {temPromo && (
              <p className="text-xs line-through text-[#71717A]">{fmt(produto.price)}</p>
            )}
            <div className="flex items-center gap-1.5">
              <p className={`text-base font-bold ${temPromo ? 'text-green-600' : 'text-[#FF441F]'}`}>
                {fmt(precoFinal)}
              </p>
              {temPromo && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">PROMO</span>
              )}
            </div>
          </div>

          {/* Controles */}
          {!indisponivel && (
            <div className="flex items-center gap-2">
              {qtd === 0 ? (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onAdicionar(produto, precoFinal)}
                  className="px-3.5 py-1.5 bg-[#FF441F] text-white text-xs font-bold rounded-xl hover:bg-[#E63A19] transition-colors"
                >
                  Adicionar
                </motion.button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAdicionar(produto, precoFinal, -1)}
                    className="w-7 h-7 bg-[#F4F4F5] rounded-full font-bold text-[#27272A] flex items-center justify-center hover:bg-[#E4E4E7] text-base"
                  >
                    −
                  </button>
                  <span className="text-sm font-bold text-[#18181B] w-5 text-center">{qtd}</span>
                  <button
                    onClick={() => onAdicionar(produto, precoFinal, +1)}
                    className="w-7 h-7 bg-[#FF441F] rounded-full font-bold text-white flex items-center justify-center hover:bg-[#E63A19] text-base"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )}

          {indisponivel && (
            <span className="text-xs text-[#71717A] bg-[#F4F4F5] px-2 py-1 rounded-lg">Indisponível</span>
          )}
        </div>
      </div>

      {/* Imagem */}
      {produto.image_url && (
        <div className="relative flex-shrink-0 w-28 h-24">
          <img
            src={produto.image_url}
            alt={produto.name}
            className="w-full h-full object-cover rounded-xl"
          />
          {indisponivel && (
            <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center">
              <span className="text-[10px] text-[#71717A] font-semibold">Indisponível</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

/* ── Drawer / Bottom Sheet do carrinho ───────────────────────────── */
const CarrinhoDrawer = ({ carrinho, onAdicionar, onFechar, restauranteId, restauranteSlug, isAuthenticated, navigate }) => {
  const totalItens = carrinho.reduce((acc, i) => acc + i.qtd, 0);
  const totalValor = carrinho.reduce((acc, i) => acc + i.price * i.qtd, 0);

  const irParaCheckout = () => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('pending_cart', JSON.stringify({
        carrinho, restauranteSlug, restauranteId,
      }));
      navigate('/customer-registration-login', { state: { from: '/shopping-cart-checkout' } });
      return;
    }
    navigate('/shopping-cart-checkout', {
      state: { carrinho, restauranteSlug, restauranteId },
    });
  };

  return (
    <>
      {/* Backdrop mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onFechar}
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
      />

      {/* Drawer */}
      <motion.div
        initial={{ y: '100%', x: 0 }}
        animate={{ y: 0, x: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl md:hidden max-h-[80vh] flex flex-col"
      >
        <DrawerConteudo
          carrinho={carrinho}
          onAdicionar={onAdicionar}
          totalItens={totalItens}
          totalValor={totalValor}
          onFechar={onFechar}
          onCheckout={irParaCheckout}
        />
      </motion.div>

      {/* Desktop: drawer lateral */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="hidden md:flex fixed top-0 right-0 bottom-0 w-80 z-50 bg-white shadow-2xl flex-col"
      >
        <DrawerConteudo
          carrinho={carrinho}
          onAdicionar={onAdicionar}
          totalItens={totalItens}
          totalValor={totalValor}
          onFechar={onFechar}
          onCheckout={irParaCheckout}
        />
      </motion.div>
    </>
  );
};

const DrawerConteudo = ({ carrinho, onAdicionar, totalItens, totalValor, onFechar, onCheckout }) => (
  <>
    {/* Handle / Header */}
    <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E4E4E7]">
      <div className="md:hidden w-10 h-1 bg-[#E4E4E7] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
      <h3 className="font-bold text-[#18181B] text-base">Carrinho ({totalItens})</h3>
      <button onClick={onFechar} className="p-1.5 hover:bg-[#F4F4F5] rounded-lg">
        <Icon name="X" size={18} className="text-[#71717A]" />
      </button>
    </div>

    {/* Itens */}
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
      {carrinho.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          {item.image_url && (
            <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#18181B] truncate">{item.name}</p>
            <p className="text-xs text-[#71717A]">{fmt(item.price)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onAdicionar(item, item.price, -1)}
              className="w-6 h-6 bg-[#F4F4F5] rounded-full text-sm font-bold text-[#27272A] flex items-center justify-center"
            >
              −
            </button>
            <span className="text-sm font-bold text-[#18181B] w-4 text-center">{item.qtd}</span>
            <button
              onClick={() => onAdicionar(item, item.price, +1)}
              className="w-6 h-6 bg-[#FF441F] rounded-full text-sm font-bold text-white flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Total + CTA */}
    <div className="px-5 py-4 border-t border-[#E4E4E7]">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#71717A]">Subtotal</span>
        <span className="font-medium text-[#27272A]">{fmt(totalValor)}</span>
      </div>
      <div className="flex justify-between text-base font-bold mb-4">
        <span className="text-[#18181B]">Total</span>
        <span className="text-[#FF441F]">{fmt(totalValor)}</span>
      </div>
      <button
        onClick={onCheckout}
        className="w-full py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] transition-colors text-sm"
      >
        Finalizar pedido
      </button>
    </div>
  </>
);

/* ── Componente principal ────────────────────────────────────────── */
const RestauranteCatalogo = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [catAtiva, setCatAtiva] = useState('destaques');
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const catBarRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getCardapioPorSlug(slug)
      .then((d) => {
        setData(d);
        const primeiraTab =
          d.destaques?.length ? 'destaques'
          : d.promos?.length ? 'promos'
          : d.combos?.length ? 'combos'
          : d.cardapio?.[0]?.id ?? null;
        setCatAtiva(primeiraTab);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const altCarrinho = (produto, preco, delta = 1) => {
    setCarrinho((prev) => {
      const idx = prev.findIndex((i) => i.id === produto.id);
      if (idx >= 0) {
        const novo = [...prev];
        const novaQtd = novo[idx].qtd + delta;
        if (novaQtd <= 0) { novo.splice(idx, 1); return novo; }
        novo[idx] = { ...novo[idx], qtd: novaQtd };
        return novo;
      }
      if (delta < 0) return prev;
      return [...prev, { ...produto, price: preco, qtd: 1 }];
    });
  };

  const qtdNoCarrinho = (id) => carrinho.find((i) => i.id === id)?.qtd ?? 0;
  const totalItens = carrinho.reduce((acc, i) => acc + i.qtd, 0);
  const totalValor = carrinho.reduce((acc, i) => acc + i.price * i.qtd, 0);

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="h-56 bg-gradient-to-br from-[#FF441F] to-[#FF7A00] animate-pulse" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[...Array(4)].map((_, i) => <SkeletonProduto key={i} />)}
      </div>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-6 text-center">
      <Icon name="Store" size={56} className="text-[#E4E4E7] mb-4" />
      <p className="text-lg font-semibold text-[#27272A]">Restaurante não encontrado</p>
      <p className="text-sm text-[#71717A] mt-1">{erro}</p>
      <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2.5 bg-[#FF441F] text-white rounded-xl text-sm font-semibold">
        Voltar
      </button>
    </div>
  );

  const { restaurante, cardapio, destaques, promos, combos } = data;
  const ap = restaurante.aparencia ?? {};

  const tabs = [
    ...(destaques?.length ? [{ id: 'destaques', label: '⭐ Destaques' }] : []),
    ...(promos?.length ? [{ id: 'promos', label: '🔥 Promoções' }] : []),
    ...(combos?.length ? [{ id: 'combos', label: '🍱 Combos' }] : []),
    ...cardapio.map((c) => ({ id: c.id, label: c.name })),
  ];

  const produtosDaTab = () => {
    if (catAtiva === 'destaques') return destaques ?? [];
    if (catAtiva === 'promos') return promos ?? [];
    if (catAtiva === 'combos') return combos ?? [];
    return cardapio.find((c) => c.id === catAtiva)?.produtos ?? [];
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32">
      {/* ── Hero capa ──────────────────────────────────────────────── */}
      <div className="relative">
        {/* Imagem de fundo ou gradiente */}
        {ap.background_url || ap.banner_url ? (
          <img
            src={ap.background_url ?? ap.banner_url}
            alt={restaurante.name}
            className="w-full h-52 sm:h-64 object-cover"
          />
        ) : (
          <div className="w-full h-52 sm:h-64 bg-gradient-to-br from-[#FF441F] to-[#FF7A00]" />
        )}
        <div className="absolute inset-0 bg-black/40" />

        {/* Botão voltar */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
        >
          <Icon name="ArrowLeft" size={18} className="text-white" />
        </button>

        {/* Info restaurante sobre o hero */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <div className="max-w-2xl mx-auto flex items-end gap-4">
            {/* Logo */}
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl border-2 border-white overflow-hidden bg-white">
              {restaurante.logo_url ? (
                <img src={restaurante.logo_url} alt={restaurante.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#F4F4F5] flex items-center justify-center">
                  <Icon name="Store" size={28} className="text-[#FF441F]" />
                </div>
              )}
            </div>
            {/* Nome + info */}
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-bold text-white leading-tight">{restaurante.name}</h1>
              {restaurante.address && (
                <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                  <Icon name="MapPin" size={10} /> {restaurante.address}
                </p>
              )}
              {ap.descricao && (
                <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{ap.descricao}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Carrossel imagens ───────────────────────────────────────── */}
      {ap.carousel_images?.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {ap.carousel_images.map((src, i) => (
              <img key={i} src={src} alt="" className="h-28 w-48 object-cover rounded-2xl flex-shrink-0" />
            ))}
          </div>
        </div>
      )}

      {/* ── Nav categorias sticky ───────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7] shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          <div
            ref={catBarRef}
            className="flex gap-2 overflow-x-auto py-3 scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCatAtiva(tab.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                  catAtiva === tab.id
                    ? 'bg-[#FF441F] text-white'
                    : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Produtos ───────────────────────────────────────────────── */}
      <main className="px-4 py-5 max-w-2xl mx-auto">
        {tabs.length === 0 ? (
          <div className="text-center py-16 text-[#71717A]">
            <Icon name="UtensilsCrossed" size={44} className="mx-auto mb-3 text-[#E4E4E7]" />
            <p>Cardápio em breve</p>
          </div>
        ) : produtosDaTab().length === 0 ? (
          <div className="text-center py-10 text-[#71717A]">
            <p className="text-sm">Nenhum produto nesta categoria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {produtosDaTab().map((p) => (
              <ProdutoCard
                key={p.id}
                produto={p}
                qtd={qtdNoCarrinho(p.id)}
                onAdicionar={altCarrinho}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Botão flutuante carrinho ────────────────────────────────── */}
      <AnimatePresence>
        {totalItens > 0 && !carrinhoAberto && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-30 max-w-2xl mx-auto"
          >
            <button
              onClick={() => setCarrinhoAberto(true)}
              className="w-full flex items-center justify-between bg-[#FF441F] hover:bg-[#E63A19] text-white rounded-2xl px-5 py-3.5 font-bold shadow-lg shadow-[#FF441F]/30 transition-colors"
            >
              <span className="bg-[#E63A19] rounded-xl px-2.5 py-0.5 text-sm font-bold">{totalItens}</span>
              <span>Ver carrinho</span>
              <span className="text-white/80 text-sm">{fmt(totalValor)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drawer carrinho ────────────────────────────────────────── */}
      <AnimatePresence>
        {carrinhoAberto && (
          <CarrinhoDrawer
            carrinho={carrinho}
            onAdicionar={altCarrinho}
            onFechar={() => setCarrinhoAberto(false)}
            restauranteId={restaurante.id}
            restauranteSlug={slug}
            isAuthenticated={isAuthenticated}
            navigate={navigate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestauranteCatalogo;
