import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

/* ── Fallback local (usado até a API responder) ─────────────────── */
const CATEGORIAS_FALLBACK = [
  { id: 'todos', name: 'Todos', icon_name: 'LayoutGrid', color_primary: '#FF441F', color_secondary: '#FF7A00' },
];

/* ── Skeleton ────────────────────────────────────────────────────── */
const SkeletonCard = ({ list }) => (
  <div className={`bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden animate-pulse ${list ? 'flex gap-4 p-4' : ''}`}>
    <div className={list ? 'w-32 h-28 bg-[#F4F4F5] rounded-xl flex-shrink-0' : 'h-44 bg-[#F4F4F5]'} />
    <div className={`space-y-2.5 ${list ? 'flex-1 py-1' : 'p-4'}`}>
      <div className="h-4 bg-[#E4E4E7] rounded-lg w-3/4" />
      <div className="h-3 bg-[#F4F4F5] rounded-lg w-1/2" />
      <div className="flex gap-2 mt-3">
        <div className="h-5 bg-[#F4F4F5] rounded-full w-20" />
        <div className="h-5 bg-[#F4F4F5] rounded-full w-24" />
      </div>
    </div>
  </div>
);

/* ── Card restaurante (grid) ─────────────────────────────────────── */
const RestCardGrid = ({ r, i }) => {
  const navigate = useNavigate();
  const nota   = r.nota ?? (4.0 + (i % 5) * 0.2).toFixed(1);
  const tempo  = r.tempo ?? `${20 + (i % 5) * 5}-${35 + (i % 5) * 5} min`;
  const gratis = !r.frete || r.frete === 0;
  const aberto = r.aparencia?.aberto !== false;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.3 }}
      whileHover={{ y: aberto ? -3 : 0, transition: { duration: 0.15 } }}
      onClick={() => navigate(`/r/${r.slug}`)}
      className={`w-full bg-white rounded-2xl border overflow-hidden transition-all text-left ${
        aberto
          ? 'border-[#E4E4E7] hover:shadow-lg hover:border-[#FF441F]/30'
          : 'border-red-300 opacity-80'
      }`}
    >
      <div className="relative h-44 overflow-hidden bg-[#F4F4F5]">
        {r.logo_url
          ? <img src={r.logo_url} alt={r.name} className={`w-full h-full object-cover ${!aberto ? 'grayscale' : ''}`} />
          : <div className="w-full h-full bg-gradient-to-br from-[#FF441F]/10 to-[#FF7A00]/20 flex items-center justify-center">
              <Icon name="Store" size={52} className="text-[#FF441F]/25" />
            </div>}
        <div className="absolute top-2 left-2 flex gap-1">
          {!aberto && <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shadow">Fechado</span>}
          {aberto && gratis && <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full shadow">Grátis</span>}
          {aberto && i < 3   && <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full shadow">Novo</span>}
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm rounded-lg px-1.5 py-0.5 shadow">
          <Icon name="Star" size={11} className="text-yellow-400" fill="currentColor" />
          <span className="text-xs font-bold text-[#27272A]">{nota}</span>
        </div>
      </div>
      <div className="p-4">
        <p className="font-bold text-[#18181B] text-sm leading-tight">{r.name}</p>
        {r.address && <p className="text-xs text-[#71717A] mt-0.5 flex items-center gap-1 truncate"><Icon name="MapPin" size={10}/> {r.address}</p>}
        <div className="flex items-center gap-3 mt-2.5">
          <span className="flex items-center gap-1 text-xs text-[#71717A]"><Icon name="Clock" size={11}/> {tempo}</span>
          <span className={`flex items-center gap-1 text-xs font-medium ${gratis ? 'text-green-600' : 'text-[#71717A]'}`}>
            <Icon name="Truck" size={11}/> {gratis ? 'Grátis' : `R$ ${r.frete?.toFixed(2)}`}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

/* ── Card restaurante (lista) ────────────────────────────────────── */
const RestCardList = ({ r, i }) => {
  const navigate = useNavigate();
  const nota   = r.nota ?? (4.0 + (i % 5) * 0.2).toFixed(1);
  const tempo  = r.tempo ?? `${20 + (i % 5) * 5}-${35 + (i % 5) * 5} min`;
  const gratis = !r.frete || r.frete === 0;
  const aberto = r.aparencia?.aberto !== false;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05, duration: 0.25 }}
      whileHover={{ x: aberto ? 4 : 0 }}
      onClick={() => navigate(`/r/${r.slug}`)}
      className={`w-full flex gap-4 bg-white rounded-2xl border p-4 transition-all text-left ${
        aberto
          ? 'border-[#E4E4E7] hover:border-[#FF441F]/40 hover:shadow-md'
          : 'border-red-300 opacity-80'
      }`}
    >
      <div className="w-28 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#F4F4F5]">
        {r.logo_url
          ? <img src={r.logo_url} alt={r.name} className={`w-full h-full object-cover ${!aberto ? 'grayscale' : ''}`} />
          : <div className="w-full h-full flex items-center justify-center"><Icon name="Store" size={32} className="text-[#FF441F]/30" /></div>}
      </div>
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <p className="font-bold text-[#18181B] text-sm leading-tight truncate">{r.name}</p>
            {!aberto && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0">Fechado</span>}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0 bg-yellow-50 rounded-lg px-1.5 py-0.5">
            <Icon name="Star" size={11} className="text-yellow-400" fill="currentColor" />
            <span className="text-xs font-bold text-yellow-700">{nota}</span>
          </div>
        </div>
        {r.address && <p className="text-xs text-[#71717A] mt-1 flex items-center gap-1 truncate"><Icon name="MapPin" size={10}/> {r.address}</p>}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-[#71717A]"><Icon name="Clock" size={11}/> {tempo}</span>
          <span className={`flex items-center gap-1 text-xs font-medium ${gratis ? 'text-green-600' : 'text-[#71717A]'}`}>
            <Icon name="Truck" size={11}/> {gratis ? 'Grátis' : `R$${r.frete?.toFixed(2)}`}
          </span>
          {gratis && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Frete grátis</span>}
        </div>
      </div>
      <Icon name="ChevronRight" size={18} className="text-[#E4E4E7] self-center flex-shrink-0" />
    </motion.button>
  );
};

/* ── Card produto (comparação) ───────────────────────────────────── */
const ProdutoCompCard = ({ produto, i, navigate }) => {
  const temPromo = produto.tipo === 'promo' && produto.preco_promo != null;
  const preco = temPromo ? produto.preco_promo : produto.price;
  const rest = produto.restaurante;
  const restFechado = rest?.aparencia?.aberto === false;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (i % 12) * 0.04, duration: 0.25 }}
      whileHover={restFechado ? {} : { y: -2, transition: { duration: 0.12 } }}
      onClick={() => rest && !restFechado && navigate(`/r/${rest.slug}`)}
      className={`bg-white rounded-2xl border overflow-hidden transition-all text-left w-full ${
        restFechado
          ? 'border-red-200 opacity-70 cursor-not-allowed'
          : 'border-[#E4E4E7] hover:shadow-md hover:border-[#FF441F]/20'
      }`}
    >
      <div className="relative h-36 bg-[#F4F4F5] overflow-hidden">
        {produto.image_url
          ? <img src={produto.image_url} alt={produto.name} className={`w-full h-full object-cover ${restFechado ? 'grayscale' : ''}`} />
          : <div className="w-full h-full flex items-center justify-center"><Icon name="UtensilsCrossed" size={36} className="text-[#E4E4E7]" /></div>}
        {/* Tags */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {restFechado && (
            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shadow">Fechado</span>
          )}
          {!restFechado && temPromo && (
            <span className="text-[10px] font-bold bg-[#FF441F] text-white px-2 py-0.5 rounded-full shadow">PROMO</span>
          )}
        </div>
        {restFechado && (
          <div className="absolute inset-0 bg-white/30 flex items-end justify-center pb-3">
            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-lg border border-red-200">
              Restaurante fechado
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-[#18181B] leading-tight line-clamp-2">{produto.name}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {!restFechado && temPromo && <p className="text-[10px] line-through text-[#71717A]">{fmt(produto.price)}</p>}
            <p className={`text-sm font-black ${restFechado ? 'text-[#71717A]' : temPromo ? 'text-green-600' : 'text-[#FF441F]'}`}>
              {restFechado ? 'Indisponível' : fmt(preco)}
            </p>
          </div>
        </div>
        {rest && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#F4F4F5]">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-[#F4F4F5] flex-shrink-0">
              {rest.logo_url
                ? <img src={rest.logo_url} alt={rest.name} className={`w-full h-full object-cover ${restFechado ? 'grayscale' : ''}`} />
                : <div className="w-full h-full flex items-center justify-center"><Icon name="Store" size={10} className="text-[#FF441F]/40" /></div>}
            </div>
            <p className="text-[10px] text-[#71717A] font-medium truncate">{rest.name}</p>
            {restFechado && <span className="text-[9px] text-red-500 font-bold flex-shrink-0">• Fechado</span>}
          </div>
        )}
      </div>
    </motion.button>
  );
};

/* ── Carrossel restaurantes populares ────────────────────────────── */
const RestCarrossel = ({ restaurantes, navigate }) => {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-[#E4E4E7] rounded-full shadow flex items-center justify-center hover:bg-[#F4F4F5] -ml-4 hidden sm:flex">
        <Icon name="ChevronLeft" size={16} className="text-[#27272A]" />
      </button>
      <div ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none' }}>
        {restaurantes.map((r, i) => (
          <motion.button
            key={r.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate(`/r/${r.slug}`)}
            className="flex-shrink-0 flex flex-col items-center gap-2 w-20 sm:w-24"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white border-2 border-[#E4E4E7] hover:border-[#FF441F]/40 shadow-sm transition-all">
              {r.logo_url
                ? <img src={r.logo_url} alt={r.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-[#FF441F]/10 to-[#FF7A00]/20 flex items-center justify-center">
                    <Icon name="Store" size={28} className="text-[#FF441F]/40" />
                  </div>}
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-[#27272A] text-center line-clamp-2 leading-tight px-1">{r.name}</p>
          </motion.button>
        ))}
      </div>
      <button onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-[#E4E4E7] rounded-full shadow flex items-center justify-center hover:bg-[#F4F4F5] -mr-4 hidden sm:flex">
        <Icon name="ChevronRight" size={16} className="text-[#27272A]" />
      </button>
    </div>
  );
};

/* ── Sidebar esquerda ────────────────────────────────────────────── */
const SidebarLeft = ({ categorias, catAtiva, setCatAtiva }) => (
  <aside className="hidden lg:flex flex-col gap-1 w-52 xl:w-60 flex-shrink-0">
    <p className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider px-3 mb-2">Categorias</p>
    {categorias.map((c) => {
      const ativo = catAtiva === c.id;
      return (
        <motion.button
          key={c.id}
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCatAtiva(ativo ? null : c.id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left w-full ${
            ativo ? 'text-white shadow-md' : 'text-[#27272A] hover:bg-white hover:shadow-sm'
          }`}
          style={ativo ? { background: `linear-gradient(135deg, ${c.color_primary}, ${c.color_secondary})` } : {}}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={ativo ? { background: 'rgba(255,255,255,0.2)' } : { background: `linear-gradient(135deg, ${c.color_primary}, ${c.color_secondary})` }}
          >
            <Icon name={c.icon_name ?? 'Tag'} size={15} className="text-white" />
          </div>
          {c.name}
        </motion.button>
      );
    })}
  </aside>
);

/* ── Sidebar direita ─────────────────────────────────────────────── */
const SidebarRight = ({ restaurantes, navigate }) => {
  const top = restaurantes.slice(0, 5);
  return (
    <aside className="hidden xl:flex flex-col gap-4 w-52 flex-shrink-0">
      <div className="bg-gradient-to-br from-[#FF441F] to-[#FF7A00] rounded-2xl p-5 text-white">
        <Icon name="Zap" size={20} className="mb-2" />
        <p className="font-bold text-sm leading-tight">Promoções relâmpago</p>
        <p className="text-xs text-white/80 mt-1">Aproveite antes que acabe!</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4">
        <p className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider mb-3">Mais populares</p>
        <div className="space-y-3">
          {top.map((r, i) => (
            <button key={r.id} onClick={() => navigate(`/r/${r.slug}`)}
              className="flex items-center gap-3 w-full hover:opacity-75 transition-opacity text-left">
              <span className="text-base font-black text-[#E4E4E7] w-4 flex-shrink-0">{i + 1}</span>
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#F4F4F5] flex-shrink-0">
                {r.logo_url
                  ? <img src={r.logo_url} alt={r.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Icon name="Store" size={14} className="text-[#FF441F]/40" /></div>}
              </div>
              <p className="text-xs font-semibold text-[#18181B] truncate flex-1">{r.name}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
        <p className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">Como funciona</p>
        {[
          { icon: 'Search',     text: 'Escolha restaurante'    },
          { icon: 'ShoppingBag',text: 'Monte seu pedido'       },
          { icon: 'QrCode',     text: 'Pague com PIX ou cartão'},
          { icon: 'Truck',      text: 'Receba em casa'         },
        ].map((s) => (
          <div key={s.icon} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FF441F]/10 flex items-center justify-center flex-shrink-0">
              <Icon name={s.icon} size={14} className="text-[#FF441F]" />
            </div>
            <p className="text-xs text-[#27272A]">{s.text}</p>
          </div>
        ))}
      </div>
    </aside>
  );
};

/* ── Hero ────────────────────────────────────────────────────────── */
const Hero = ({ busca, setBusca, totalRest, mediaNota }) => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-[#FF441F] via-[#FF5C30] to-[#FF7A00]" />
    <div className="absolute inset-0 opacity-10"
      style={{ backgroundImage: 'radial-gradient(circle at 25% 60%, #fff 1px, transparent 1px), radial-gradient(circle at 75% 20%, #fff 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
    <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
    <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-black/5 translate-y-1/2 -translate-x-1/4" />

    <div className="relative px-4 py-12 sm:py-16 text-center text-white max-w-screen-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-xs font-bold text-white/60 mb-2 tracking-widest uppercase">Delivery · Rápido · Confiável</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
          Seu delivery favorito
        </h1>
        <p className="text-white/80 text-sm sm:text-base mb-8">Peça dos melhores restaurantes da sua cidade</p>
      </motion.div>

      {/* Barra de busca */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="max-w-xl mx-auto mb-8"
      >
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-2xl shadow-black/20">
          <Icon name="Search" size={18} className="text-[#71717A] flex-shrink-0" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar restaurantes ou pratos..."
            className="flex-1 text-sm text-[#27272A] placeholder-[#71717A] outline-none bg-transparent"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-[#71717A] hover:text-[#27272A]">
              <Icon name="X" size={15} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats — space-around */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex justify-around items-center max-w-md mx-auto"
      >
        <div className="flex flex-col items-center gap-0.5">
          <Icon name="Store" size={16} className="text-white/60 mb-0.5" />
          <span className="text-xl font-black">{totalRest > 0 ? `${totalRest}+` : '—'}</span>
          <span className="text-[11px] text-white/60">Restaurantes</span>
        </div>
        <div className="w-px h-10 bg-white/20" />
        <div className="flex flex-col items-center gap-0.5">
          <Icon name="Star" size={16} className="text-white/60 mb-0.5" fill="currentColor" />
          <span className="text-xl font-black">{mediaNota > 0 ? mediaNota.toFixed(1) : '4.8'}</span>
          <span className="text-[11px] text-white/60">Avaliação média</span>
        </div>
        <div className="w-px h-10 bg-white/20" />
        <div className="flex flex-col items-center gap-0.5">
          <Icon name="Truck" size={16} className="text-white/60 mb-0.5" />
          <span className="text-xl font-black">~30</span>
          <span className="text-[11px] text-white/60 whitespace-nowrap">Min. entrega</span>
        </div>
      </motion.div>
    </div>
  </section>
);

/* ── Componente principal ────────────────────────────────────────── */
const MenuCatalogProductBrowse = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isRestaurantOwner, signOut } = useAuth();

  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos]         = useState([]);
  const [categorias, setCategorias]     = useState(CATEGORIAS_FALLBACK);
  const [loading, setLoading]           = useState(true);
  const [loadProd, setLoadProd]         = useState(true);
  const [erro, setErro]                 = useState(null);
  const [busca, setBusca]               = useState('');
  const [catAtiva, setCatAtiva]         = useState(null); // null = "todos" (primeiro da lista)
  const [viewMode, setViewMode]         = useState('grid');

  /* Stats reais */
  const mediaNota = restaurantes.length > 0
    ? restaurantes.reduce((acc, r) => acc + (r.nota ?? 4.5), 0) / restaurantes.length
    : 0;

  useEffect(() => {
    fetch('/api/r')
      .then((r) => r.json())
      .then((d) => setRestaurantes(d.restaurantes ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));

    fetch('/api/r/produtos')
      .then((r) => r.json())
      .then((d) => setProdutos(d.produtos ?? []))
      .catch(() => setProdutos([]))
      .finally(() => setLoadProd(false));

    fetch('/api/categorias/globais')
      .then((r) => r.json())
      .then((d) => {
        const cats = d.categorias ?? [];
        if (cats.length > 0) setCategorias(cats);
      })
      .catch(() => {});
  }, []);

  const filtrados = restaurantes.filter((r) =>
    r.name.toLowerCase().includes(busca.toLowerCase()) ||
    (r.address ?? '').toLowerCase().includes(busca.toLowerCase()),
  );

  const produtosFiltrados = busca
    ? produtos.filter((p) =>
        p.name.toLowerCase().includes(busca.toLowerCase()) ||
        p.restaurante?.name.toLowerCase().includes(busca.toLowerCase()),
      )
    : produtos;

  return (
    <div className="min-h-screen bg-[#F4F4F5]">

      {/* ── Header sticky ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7] shadow-sm">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-[#FF441F] rounded-xl flex items-center justify-center shadow-sm shadow-[#FF441F]/30">
              <Icon name="Utensils" size={18} className="text-white" />
            </div>
            <span className="font-black text-[#18181B] text-lg hidden sm:block tracking-tight">DeliveryHub</span>
          </button>

          <div className="hidden md:flex flex-1 max-w-md">
            <div className="flex items-center gap-2 bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-xl px-3 py-2.5 w-full transition-colors">
              <Icon name="Search" size={15} className="text-[#71717A] flex-shrink-0" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar restaurantes ou pratos"
                className="flex-1 bg-transparent text-sm text-[#27272A] placeholder-[#71717A] outline-none" />
              {busca && <button onClick={() => setBusca('')}><Icon name="X" size={13} className="text-[#71717A]" /></button>}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => navigate('/shopping-cart-checkout')}
              className="relative p-2 text-[#71717A] hover:text-[#FF441F] hover:bg-[#FF441F]/5 rounded-lg transition-colors" title="Carrinho">
              <Icon name="ShoppingCart" size={20} />
            </button>
            {isAuthenticated() ? (
              <>
                {isAdmin() && (
                  <button onClick={() => navigate('/admin')}
                    className="hidden sm:block px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg">
                    Admin
                  </button>
                )}
                {isRestaurantOwner() && (
                  <button onClick={() => navigate('/restaurante')}
                    className="hidden sm:block px-3 py-1.5 text-xs font-semibold text-[#FF441F] hover:bg-[#FF441F]/5 rounded-lg">
                    Meu Rest.
                  </button>
                )}
                <button onClick={() => navigate('/customer-account-order-history')}
                  className="p-2 text-[#71717A] hover:text-[#27272A] hover:bg-[#F4F4F5] rounded-lg" title="Pedidos">
                  <Icon name="ClipboardList" size={19} />
                </button>
                <button onClick={async () => { await signOut(); }}
                  className="p-2 text-[#71717A] hover:text-red-500 hover:bg-red-50 rounded-lg" title="Sair">
                  <Icon name="LogOut" size={18} />
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/customer-registration-login')}
                className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] shadow-sm shadow-[#FF441F]/30 transition-colors">
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <Hero busca={busca} setBusca={setBusca} totalRest={restaurantes.length} mediaNota={mediaNota} />

      {/* ── Ícones de categorias coloridos (só desktop) ──────────── */}
      <div className="hidden lg:block bg-white border-b border-[#E4E4E7]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-5 overflow-x-auto pb-3">
          <div className="flex gap-4" style={{ width: 'max-content', margin: '0 auto' }}>
            {categorias.map((c, i) => {
              const ativo = catAtiva === c.id;
              return (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 20, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 18 }}
                  whileHover={{ scale: 1.18, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCatAtiva(ativo ? null : c.id)}
                  title={c.name}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
                >
                  <motion.div
                    animate={ativo ? { rotate: [0, -8, 8, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all ${
                      ativo
                        ? 'shadow-lg ring-2 ring-white ring-offset-2'
                        : 'shadow-md opacity-75 group-hover:opacity-100 group-hover:shadow-lg'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${c.color_primary}, ${c.color_secondary})` }}
                  >
                    <Icon name={c.icon_name ?? 'Tag'} size={24} />
                  </motion.div>
                  <motion.div
                    animate={{ scale: ativo ? 1 : 0, opacity: ativo ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#FF441F]"
                  />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Carrossel restaurantes populares ─────────────────────── */}
      {restaurantes.length > 0 && (
        <div className="bg-white border-b border-[#E4E4E7]">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-5">
            <p className="text-sm font-bold text-[#18181B] mb-4 flex items-center gap-2">
              <Icon name="Flame" size={15} className="text-[#FF441F]" />
              Populares
            </p>
            <RestCarrossel restaurantes={restaurantes} navigate={navigate} />
          </div>
        </div>
      )}

      {/* ── Categorias mobile (com cor + label) ─────────────────── */}
      <div className="lg:hidden bg-white border-b border-[#E4E4E7] px-4 py-3">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categorias.map((c, i) => {
            const ativo = catAtiva === c.id;
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCatAtiva(ativo ? null : c.id)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-all ${
                    ativo ? 'ring-2 ring-white ring-offset-1' : 'opacity-70'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${c.color_primary}, ${c.color_secondary})` }}
                >
                  <Icon name={c.icon_name ?? 'Tag'} size={20} />
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${ativo ? 'text-[#FF441F]' : 'text-[#71717A]'}`}>
                  {c.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Layout 3 colunas ─────────────────────────────────────── */}
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex gap-6 items-start">

        <SidebarLeft categorias={categorias} catAtiva={catAtiva} setCatAtiva={setCatAtiva} />

        {/* Centro */}
        <main className="flex-1 min-w-0 space-y-8">

          {/* Busca mobile */}
          <div className="md:hidden">
            <div className="flex items-center gap-2 bg-white border border-[#E4E4E7] rounded-xl px-3 py-2.5">
              <Icon name="Search" size={15} className="text-[#71717A] flex-shrink-0" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 bg-transparent text-sm text-[#27272A] placeholder-[#71717A] outline-none" />
              {busca && <button onClick={() => setBusca('')}><Icon name="X" size={13} className="text-[#71717A]" /></button>}
            </div>
          </div>

          {/* ── Seção restaurantes ──────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h2 className="font-bold text-[#18181B] text-base">
                  {catAtiva === null ? 'Todos os restaurantes' : categorias.find((c) => c.id === catAtiva)?.name ?? 'Restaurantes'}
                </h2>
                {!loading && (
                  <p className="text-xs text-[#71717A] mt-0.5">
                    {filtrados.length} {filtrados.length === 1 ? 'restaurante' : 'restaurantes'}
                    {busca && ` para "${busca}"`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 bg-white border border-[#E4E4E7] rounded-xl p-1">
                <button onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#FF441F] text-white' : 'text-[#71717A]'}`}>
                  <Icon name="LayoutGrid" size={16} />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#FF441F] text-white' : 'text-[#71717A]'}`}>
                  <Icon name="List" size={16} />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} list={viewMode === 'list'} />)}
                </motion.div>
              ) : filtrados.length === 0 ? (
                <motion.div key="vazio" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center py-14 bg-white rounded-2xl border border-[#E4E4E7]">
                  <Icon name="Store" size={44} className="text-[#E4E4E7] mx-auto mb-3" />
                  <p className="text-[#27272A] font-bold">{busca ? `Sem resultados para "${busca}"` : 'Nenhum restaurante ainda'}</p>
                  {!busca && (
                    <button onClick={() => navigate('/restaurant-registration-setup')}
                      className="mt-4 px-5 py-2.5 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
                      Cadastrar restaurante
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div key={`${viewMode}-${catAtiva}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
                  {filtrados.map((r, i) =>
                    viewMode === 'grid'
                      ? <RestCardGrid key={r.id} r={r} i={i} />
                      : <RestCardList key={r.id} r={r} i={i} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* ── Seção comparação de preços ───────────────────────── */}
          {(loadProd || produtos.length > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1">
                  <h2 className="font-bold text-[#18181B] text-base flex items-center gap-2">
                    <Icon name="BarChart2" size={16} className="text-[#FF441F]" />
                    Compare preços
                  </h2>
                  <p className="text-xs text-[#71717A] mt-0.5">Produtos de todos os restaurantes</p>
                </div>
              </div>

              {loadProd ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-[#E4E4E7]">
                  <p className="text-[#71717A] text-sm">Nenhum produto encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {produtosFiltrados.slice(0, 24).map((p, i) => (
                    <ProdutoCompCard key={p.id} produto={p} i={i} navigate={navigate} />
                  ))}
                </div>
              )}

              {produtosFiltrados.length > 24 && (
                <p className="text-center text-xs text-[#71717A] mt-4">
                  Mostrando 24 de {produtosFiltrados.length} produtos
                </p>
              )}
            </section>
          )}
        </main>

        <SidebarRight restaurantes={filtrados} navigate={navigate} />
      </div>

      <footer className="border-t border-[#E4E4E7] bg-white mt-8 py-6 text-center">
        <p className="text-xs text-[#71717A]">© {new Date().getFullYear()} DeliveryHub · Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default MenuCatalogProductBrowse;
