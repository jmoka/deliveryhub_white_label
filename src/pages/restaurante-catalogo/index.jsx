import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCardapioPorSlug } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

/* ── Skeleton ────────────────────────────────────────────────────── */
const SkeletonProduto = () => (
  <div className="flex gap-4 p-4 bg-white rounded-2xl border border-[#E4E4E7] animate-pulse">
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-[#E4E4E7] rounded-lg w-3/4" />
      <div className="h-3 bg-[#F4F4F5] rounded-lg w-full" />
      <div className="h-3 bg-[#F4F4F5] rounded-lg w-2/3" />
      <div className="h-7 bg-[#E4E4E7] rounded-xl w-24 mt-3" />
    </div>
    <div className="w-28 h-24 bg-[#F4F4F5] rounded-xl flex-shrink-0" />
  </div>
);

/* ── Card produto ────────────────────────────────────────────────── */
const ProdutoCard = ({ produto, onAdicionar, qtd, restauranteFechado }) => {
  const temPromo = produto.tipo === 'promo' && produto.preco_promo != null;
  const indisponivel = produto.disponivel === false || restauranteFechado;
  const precoFinal = temPromo ? produto.preco_promo : produto.price;

  return (
    <motion.div
      layout
      whileHover={indisponivel ? {} : { y: -1 }}
      className={`flex gap-4 p-4 bg-white rounded-2xl border transition-all h-full ${
        indisponivel ? 'border-[#E4E4E7] opacity-60' : 'border-[#E4E4E7] hover:shadow-md hover:border-[#FF441F]/20'
      }`}
    >
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start gap-2 flex-wrap">
            <p className="font-semibold text-[#18181B] text-sm leading-snug flex-1">{produto.name}</p>
            {produto.destaque && (
              <span className="text-[10px] px-1.5 py-0.5 bg-yellow-400/20 text-yellow-700 rounded font-bold flex-shrink-0">⭐ Destaque</span>
            )}
            {produto.tipo === 'combo' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold flex-shrink-0">COMBO</span>
            )}
          </div>
          {produto.description && (
            <p className="text-xs text-[#71717A] mt-1 line-clamp-2">{produto.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <div>
            {temPromo && <p className="text-xs line-through text-[#71717A]">{fmt(produto.price)}</p>}
            <div className="flex items-center gap-1.5">
              <p className={`text-base font-bold ${temPromo ? 'text-green-600' : 'text-[#FF441F]'}`}>{fmt(precoFinal)}</p>
              {temPromo && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">PROMO</span>}
            </div>
          </div>

          {!indisponivel ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              {qtd === 0 ? (
                <motion.button whileTap={{ scale: 0.92 }} onClick={() => onAdicionar(produto, precoFinal)}
                  className="px-3.5 py-1.5 bg-[#FF441F] text-white text-xs font-bold rounded-xl hover:bg-[#E63A19] transition-colors">
                  Adicionar
                </motion.button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => onAdicionar(produto, precoFinal, -1)}
                    className="w-7 h-7 bg-[#F4F4F5] rounded-full font-bold text-[#27272A] flex items-center justify-center hover:bg-[#E4E4E7] text-base">−</button>
                  <span className="text-sm font-bold text-[#18181B] w-5 text-center">{qtd}</span>
                  <button onClick={() => onAdicionar(produto, precoFinal, +1)}
                    className="w-7 h-7 bg-[#FF441F] rounded-full font-bold text-white flex items-center justify-center hover:bg-[#E63A19] text-base">+</button>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-[#71717A] bg-[#F4F4F5] px-2 py-1 rounded-lg">Indisponível</span>
          )}
        </div>
      </div>

      {produto.image_url && (
        <div className="relative flex-shrink-0 w-28 h-24">
          <img src={produto.image_url} alt={produto.name} className="w-full h-full object-cover rounded-xl" />
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

/* ── Conteúdo do carrinho (mobile + desktop) ─────────────────────── */
const CarrinhoConteudo = ({ carrinho, onAdicionar, onFechar, onCheckout }) => {
  const totalItens = carrinho.reduce((acc, i) => acc + i.qtd, 0);
  const totalValor = carrinho.reduce((acc, i) => acc + i.price * i.qtd, 0);

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E4E4E7] flex-shrink-0">
        <h3 className="font-bold text-[#18181B] text-base">
          Carrinho <span className="text-[#FF441F]">({totalItens})</span>
        </h3>
        {onFechar && (
          <button onClick={onFechar} className="p-1.5 hover:bg-[#F4F4F5] rounded-lg">
            <Icon name="X" size={18} className="text-[#71717A]" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <AnimatePresence>
          {carrinho.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              className="flex items-center gap-3">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#18181B] truncate">{item.name}</p>
                <p className="text-xs text-[#71717A]">{fmt(item.price)}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => onAdicionar(item, item.price, -1)}
                  className="w-6 h-6 bg-[#F4F4F5] rounded-full text-sm font-bold text-[#27272A] flex items-center justify-center">−</button>
                <span className="text-sm font-bold text-[#18181B] w-4 text-center">{item.qtd}</span>
                <button onClick={() => onAdicionar(item, item.price, +1)}
                  className="w-6 h-6 bg-[#FF441F] rounded-full text-sm font-bold text-white flex items-center justify-center">+</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="px-5 py-4 border-t border-[#E4E4E7] flex-shrink-0">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[#71717A]">Subtotal</span>
          <span className="font-medium text-[#27272A]">{fmt(totalValor)}</span>
        </div>
        <div className="flex justify-between text-base font-bold mb-4">
          <span className="text-[#18181B]">Total</span>
          <span className="text-[#FF441F]">{fmt(totalValor)}</span>
        </div>
        <motion.button whileTap={{ scale: 0.98 }} onClick={onCheckout}
          className="w-full py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] transition-colors text-sm shadow-lg shadow-[#FF441F]/20">
          Finalizar pedido →
        </motion.button>
      </div>
    </>
  );
};

/* ── Drawer mobile (bottom sheet) ────────────────────────────────── */
const CarrinhoMobile = ({ carrinho, onAdicionar, onFechar, onCheckout }) => (
  <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onFechar} className="fixed inset-0 bg-black/40 z-40 lg:hidden" />
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl lg:hidden max-h-[82vh] flex flex-col"
    >
      <div className="w-10 h-1 bg-[#E4E4E7] rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
      <CarrinhoConteudo carrinho={carrinho} onAdicionar={onAdicionar} onFechar={onFechar} onCheckout={onCheckout} />
    </motion.div>
  </>
);

/* ── Sidebar desktop ─────────────────────────────────────────────── */
const CarrinhoDesktop = ({ carrinho, onAdicionar, onCheckout }) => (
  <aside className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
    <div className="sticky top-28 bg-white rounded-2xl border border-[#E4E4E7] shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
      {carrinho.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <Icon name="ShoppingCart" size={44} className="text-[#E4E4E7] mb-3" />
          <p className="text-sm font-semibold text-[#27272A]">Carrinho vazio</p>
          <p className="text-xs text-[#71717A] mt-1">Adicione itens do cardápio</p>
        </div>
      ) : (
        <CarrinhoConteudo carrinho={carrinho} onAdicionar={onAdicionar} onFechar={null} onCheckout={onCheckout} />
      )}
    </div>
  </aside>
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

  const irParaCheckout = () => {
    const restauranteId = data?.restaurante?.id;
    if (!isAuthenticated()) {
      sessionStorage.setItem('pending_cart', JSON.stringify({ carrinho, restauranteSlug: slug, restauranteId }));
      navigate('/customer-registration-login', { state: { from: '/shopping-cart-checkout' } });
      return;
    }
    navigate('/shopping-cart-checkout', { state: { carrinho, restauranteSlug: slug, restauranteId } });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <div className="h-64 bg-gradient-to-br from-[#FF441F] to-[#FF7A00] animate-pulse" />
      <div className="max-w-screen-xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => <SkeletonProduto key={i} />)}
      </div>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F4F5] p-6 text-center">
      <Icon name="Store" size={56} className="text-[#E4E4E7] mb-4" />
      <p className="text-lg font-semibold text-[#27272A]">Restaurante não encontrado</p>
      <p className="text-sm text-[#71717A] mt-1">{erro}</p>
      <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2.5 bg-[#FF441F] text-white rounded-xl text-sm font-semibold">Voltar</button>
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

  const bgStyle = ap.background_url
    ? { backgroundImage: `url(${ap.background_url})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }
    : ap.background_color
    ? { backgroundColor: ap.background_color }
    : {};

  return (
    <div className="min-h-screen bg-[#F4F4F5]" style={bgStyle}>

      {/* ── Header global ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7]">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F4F4F5] rounded-lg text-[#71717A] hover:text-[#27272A] transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#FF441F] rounded-lg flex items-center justify-center shadow-sm shadow-[#FF441F]/30">
              <Icon name="Utensils" size={14} className="text-white" />
            </div>
            <span className="font-black text-[#18181B] text-sm hidden sm:block">DeliveryHub</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#18181B] text-sm truncate">{restaurante.name}</p>
          </div>
          {/* Carrinho icon mobile */}
          <button onClick={() => setCarrinhoAberto(true)}
            className="relative p-2 text-[#71717A] hover:text-[#FF441F] hover:bg-[#FF441F]/5 rounded-lg transition-colors lg:hidden">
            <Icon name="ShoppingCart" size={20} />
            {totalItens > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF441F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItens > 9 ? '9+' : totalItens}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="relative">
        {ap.banner_url ? (
          <img src={ap.banner_url} alt={restaurante.name} className="w-full h-52 sm:h-72 object-cover" />
        ) : (
          <div className="w-full h-52 sm:h-72 bg-gradient-to-br from-[#FF441F] to-[#FF7A00]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <div className="max-w-screen-xl mx-auto flex items-end gap-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
              className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white overflow-hidden bg-white shadow-lg"
            >
              {restaurante.logo_url ? (
                <img src={restaurante.logo_url} alt={restaurante.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#F4F4F5] flex items-center justify-center">
                  <Icon name="Store" size={32} className="text-[#FF441F]" />
                </div>
              )}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 min-w-0 pb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight truncate">{restaurante.name}</h1>
              {restaurante.address && (
                <p className="text-white/70 text-xs flex items-center gap-1 mt-1">
                  <Icon name="MapPin" size={11} /> {restaurante.address}
                </p>
              )}
              {ap.descricao && <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{ap.descricao}</p>}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E4E4E7]">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Icon name="Star" size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold text-[#18181B]">{ap.nota ?? '4.8'}</span>
            <span className="text-xs text-[#71717A]">({ap.total_avaliacoes ?? '200+'} avaliações)</span>
          </div>
          <div className="w-px h-4 bg-[#E4E4E7] flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Icon name="Clock" size={14} className="text-[#FF7A00]" />
            <span className="text-sm text-[#27272A]">{ap.tempo_entrega ?? '25-40 min'}</span>
          </div>
          <div className="w-px h-4 bg-[#E4E4E7] flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Icon name="Bike" size={14} className="text-[#FF441F]" />
            <span className="text-sm text-[#27272A]">
              {ap.frete === 0 || ap.frete === '0' ? 'Frete grátis' : ap.frete ? fmt(Number(ap.frete)) : 'Frete grátis'}
            </span>
          </div>
          {ap.pedido_minimo && (
            <>
              <div className="w-px h-4 bg-[#E4E4E7] flex-shrink-0" />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Icon name="ShoppingBag" size={14} className="text-[#71717A]" />
                <span className="text-sm text-[#71717A]">Mín. {fmt(ap.pedido_minimo)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Carrossel de imagens ───────────────────────────────────── */}
      {ap.carousel_images?.length > 0 && (
        <div className="max-w-screen-xl mx-auto px-4 pt-4">
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {ap.carousel_images.map((src, i) => (
              <img key={i} src={src} alt="" className="h-32 sm:h-40 w-52 sm:w-64 object-cover rounded-2xl flex-shrink-0 shadow-sm" />
            ))}
          </div>
        </div>
      )}

      {/* ── Banner restaurante fechado ─────────────────────────────── */}
      {ap.aberto === false && (
        <div className="bg-red-500 text-white px-4 py-3">
          <div className="max-w-screen-xl mx-auto flex items-center gap-2">
            <Icon name="Clock" size={16} />
            <p className="text-sm font-bold">Restaurante fechado no momento — pedidos indisponíveis</p>
          </div>
        </div>
      )}

      {/* ── Nav categorias sticky ───────────────────────────────────── */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7]">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3" style={{ scrollbarWidth: 'none' }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setCatAtiva(tab.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                  catAtiva === tab.id
                    ? 'bg-[#FF441F] text-white shadow-sm'
                    : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Layout 2 colunas desktop ────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex gap-6 items-start pb-32 lg:pb-8">

        {/* Produtos */}
        <main className="flex-1 min-w-0">
          {tabs.length === 0 ? (
            <div className="text-center py-16 text-[#71717A]">
              <Icon name="UtensilsCrossed" size={44} className="mx-auto mb-3 text-[#E4E4E7]" />
              <p className="font-medium">Cardápio em breve</p>
            </div>
          ) : produtosDaTab().length === 0 ? (
            <div className="text-center py-10 text-[#71717A]">
              <p className="text-sm">Nenhum produto nesta categoria</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={catAtiva}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 xl:grid-cols-2 gap-3"
              >
                {produtosDaTab().map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}>
                    <ProdutoCard produto={p} qtd={qtdNoCarrinho(p.id)} onAdicionar={altCarrinho} restauranteFechado={ap.aberto === false} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Carrinho desktop (sidebar) */}
        <CarrinhoDesktop carrinho={carrinho} onAdicionar={altCarrinho} onCheckout={irParaCheckout} />
      </div>

      {/* ── Botão flutuante carrinho (mobile) ───────────────────────── */}
      <AnimatePresence>
        {totalItens > 0 && !carrinhoAberto && ap.aberto !== false && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-30 lg:hidden">
            <button onClick={() => setCarrinhoAberto(true)}
              className="w-full flex items-center justify-between bg-[#FF441F] hover:bg-[#E63A19] text-white rounded-2xl px-5 py-3.5 font-bold shadow-lg shadow-[#FF441F]/30 transition-colors">
              <span className="bg-[#E63A19] rounded-xl px-2.5 py-0.5 text-sm font-bold">{totalItens}</span>
              <span>Ver carrinho</span>
              <span className="text-white/80 text-sm">{fmt(totalValor)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drawer carrinho (mobile) ────────────────────────────────── */}
      <AnimatePresence>
        {carrinhoAberto && (
          <CarrinhoMobile
            carrinho={carrinho}
            onAdicionar={altCarrinho}
            onFechar={() => setCarrinhoAberto(false)}
            onCheckout={irParaCheckout}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestauranteCatalogo;
