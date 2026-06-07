import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCardapioPorSlug } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

/* ── Carrossel ────────────────────────────────────────────────── */
const Carousel = ({ images }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);
  if (!images?.length) return null;
  return (
    <div className="relative w-full h-48 sm:h-64 overflow-hidden rounded-xl mb-6">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Seção de produtos ────────────────────────────────────────── */
const ProdutoCard = ({ produto, dark, onAdicionar, qtd }) => {
  const temPromo = produto.tipo === 'promo' && produto.preco_promo != null;
  const precoFinal = temPromo ? produto.preco_promo : produto.price;

  return (
    <div className={`rounded-2xl border overflow-hidden flex flex-col sm:flex-row gap-0 ${dark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-white'} shadow-sm`}>
      {produto.image_url && (
        <img src={produto.image_url} alt={produto.name}
          className="w-full sm:w-32 h-40 sm:h-auto object-cover flex-shrink-0" />
      )}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`font-semibold text-sm leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>{produto.name}</p>
            {produto.destaque && (
              <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-yellow-400 text-yellow-900 rounded font-bold">⭐</span>
            )}
            {produto.tipo === 'combo' && (
              <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded font-bold">COMBO</span>
            )}
          </div>
          {produto.description && (
            <p className={`text-xs line-clamp-2 ${dark ? 'text-white/60' : 'text-gray-500'}`}>{produto.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            {temPromo && (
              <p className={`text-xs line-through ${dark ? 'text-white/40' : 'text-gray-400'}`}>{fmt(produto.price)}</p>
            )}
            <p className={`text-base font-bold ${temPromo ? 'text-green-500' : dark ? 'text-orange-400' : 'text-orange-600'}`}>
              {fmt(precoFinal)}
              {temPromo && <span className="ml-1 text-xs bg-green-500 text-white px-1 rounded">PROMO</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {qtd === 0 ? (
              <button onClick={() => onAdicionar(produto, precoFinal)}
                className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-xl hover:bg-orange-600 transition-colors">
                Adicionar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => onAdicionar(produto, precoFinal, -1)}
                  className="w-7 h-7 bg-gray-200 dark:bg-white/20 rounded-full font-bold text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-300">−</button>
                <span className={`text-sm font-bold w-4 text-center ${dark ? 'text-white' : 'text-gray-900'}`}>{qtd}</span>
                <button onClick={() => onAdicionar(produto, precoFinal, +1)}
                  className="w-7 h-7 bg-orange-500 rounded-full font-bold text-white flex items-center justify-center hover:bg-orange-600">+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Componente principal ─────────────────────────────────────── */
const RestauranteCatalogo = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [catAtiva, setCatAtiva] = useState('destaques');
  const [dark, setDark] = useState(false);
  const catBarRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getCardapioPorSlug(slug)
      .then((d) => {
        setData(d);
        const ap = d.restaurante?.aparencia ?? {};
        if (ap.dark_mode) setDark(true);
        const primeiraTab = d.destaques?.length ? 'destaques'
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
  const totalCarrinho = carrinho.reduce((acc, i) => acc + i.price * i.qtd, 0);
  const totalItens = carrinho.reduce((acc, i) => acc + i.qtd, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <Icon name="Store" size={48} className="text-gray-300 mb-4" />
      <p className="text-lg font-semibold text-gray-700">Restaurante não encontrado</p>
      <p className="text-sm text-gray-400 mt-1">{erro}</p>
      <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Voltar</button>
    </div>
  );

  const { restaurante, cardapio, destaques, promos, combos } = data;
  const ap = restaurante.aparencia ?? {};
  const bgStyle = ap.background_url
    ? { backgroundImage: `url(${ap.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  // Tabs dinâmicas
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

  const bg = dark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900';
  const headerBg = dark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen ${bg} pb-32 transition-colors duration-300`}>
      {/* Hero */}
      <div className="relative" style={bgStyle}>
        <div className={`${ap.background_url ? 'bg-black/60' : dark ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-500 to-orange-700'} px-4 pt-10 pb-6`}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {restaurante.logo_url ? (
                  <img src={restaurante.logo_url} alt={restaurante.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Icon name="Store" size={28} className="text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">{restaurante.name}</h1>
                  {restaurante.address && (
                    <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5">
                      <Icon name="MapPin" size={12} /> {restaurante.address}
                    </p>
                  )}
                  {ap.descricao && <p className="text-white/80 text-sm mt-1">{ap.descricao}</p>}
                </div>
              </div>
              <button onClick={() => setDark((d) => !d)}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-sm"
                title={dark ? 'Modo claro' : 'Modo escuro'}>
                <Icon name={dark ? 'Sun' : 'Moon'} size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      {ap.banner_url && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <img src={ap.banner_url} alt="Banner" className="w-full rounded-2xl object-cover max-h-40" />
        </div>
      )}

      {/* Carrossel */}
      {ap.carousel_images?.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <Carousel images={ap.carousel_images} />
        </div>
      )}

      {/* Nav categorias */}
      <div className={`sticky top-0 z-10 border-b ${headerBg} backdrop-blur-sm`}>
        <div className="max-w-2xl mx-auto px-4">
          <div ref={catBarRef} className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCatAtiva(tab.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  catAtiva === tab.id
                    ? 'bg-orange-500 text-white'
                    : dark ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Produtos */}
      <main className="px-4 py-5 max-w-2xl mx-auto">
        {tabs.length === 0 ? (
          <div className="text-center py-16 opacity-50">
            <Icon name="UtensilsCrossed" size={40} className="mx-auto mb-3" />
            <p>Cardápio em breve</p>
          </div>
        ) : produtosDaTab().length === 0 ? (
          <div className="text-center py-10 opacity-40">
            <p className="text-sm">Nenhum produto nesta categoria</p>
          </div>
        ) : (
          <>
            <h2 className={`text-lg font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
              {tabs.find((t) => t.id === catAtiva)?.label}
            </h2>
            <div className="space-y-3">
              {produtosDaTab().map((p) => (
                <ProdutoCard key={p.id} produto={p} dark={dark}
                  qtd={qtdNoCarrinho(p.id)}
                  onAdicionar={altCarrinho} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Barra carrinho */}
      {totalItens > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-xl">
          <button
            onClick={() => {
              if (!isAuthenticated()) {
                sessionStorage.setItem('pending_cart', JSON.stringify({
                  carrinho, restauranteSlug: slug, restauranteId: restaurante.id,
                }));
                navigate('/customer-registration-login', { state: { from: '/shopping-cart-checkout' } });
                return;
              }
              navigate('/shopping-cart-checkout', {
                state: { carrinho, restauranteSlug: slug, restauranteId: restaurante.id },
              });
            }}
            className="w-full max-w-2xl mx-auto flex items-center justify-between bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 py-3.5 font-semibold shadow-lg"
          >
            <span className="bg-orange-600 rounded-xl px-2.5 py-0.5 text-sm font-bold">{totalItens}</span>
            <span>Ver carrinho</span>
            <span className="text-orange-200">{fmt(totalCarrinho)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RestauranteCatalogo;
