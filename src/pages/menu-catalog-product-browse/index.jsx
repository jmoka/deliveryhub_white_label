import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

/* ── Categorias ─────────────────────────────────────────────────── */
const CATEGORIAS = [
  { id: 'todos',       label: 'Todos',       icon: 'LayoutGrid'     },
  { id: 'pizza',       label: 'Pizza',        icon: 'Pizza'          },
  { id: 'hamburguer',  label: 'Hambúrguer',   icon: 'Sandwich'       },
  { id: 'japones',     label: 'Japonesa',     icon: 'Fish'           },
  { id: 'acai',        label: 'Açaí',         icon: 'GlassWater'     },
  { id: 'marmita',     label: 'Marmita',      icon: 'UtensilsCrossed'},
  { id: 'saudavel',    label: 'Saudável',     icon: 'Leaf'           },
  { id: 'sorvete',     label: 'Sorvetes',     icon: 'Dessert'        },
  { id: 'padaria',     label: 'Padaria',      icon: 'Coffee'         },
];

/* ── Skeleton ────────────────────────────────────────────────────── */
const SkeletonCard = ({ list }) => (
  <div className={`bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden animate-pulse ${list ? 'flex gap-4 p-4' : ''}`}>
    <div className={list ? 'w-32 h-28 bg-[#F4F4F5] rounded-xl flex-shrink-0' : 'h-44 bg-[#F4F4F5]'} />
    <div className={`space-y-2 ${list ? 'flex-1 py-1' : 'p-4'}`}>
      <div className="h-4 bg-[#E4E4E7] rounded-lg w-3/4" />
      <div className="h-3 bg-[#F4F4F5] rounded-lg w-1/2" />
      <div className="flex gap-2 mt-3">
        <div className="h-5 bg-[#F4F4F5] rounded-full w-20" />
        <div className="h-5 bg-[#F4F4F5] rounded-full w-24" />
      </div>
    </div>
  </div>
);

/* ── Card restaurante ────────────────────────────────────────────── */
const RestCard = ({ r, i, list }) => {
  const navigate = useNavigate();
  const nota   = r.nota  ?? (4.0 + Math.random() * 0.9).toFixed(1);
  const tempo  = r.tempo ?? `${20 + (i % 5) * 5}-${35 + (i % 5) * 5} min`;
  const gratis = !r.frete || r.frete === 0;

  if (list) {
    return (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05, duration: 0.25 }}
        whileHover={{ x: 4 }}
        onClick={() => navigate(`/r/${r.slug}`)}
        className="w-full flex gap-4 bg-white rounded-2xl border border-[#E4E4E7] p-4 hover:border-[#FF441F]/40 hover:shadow-md transition-all text-left"
      >
        <div className="w-32 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-[#F4F4F5]">
          {r.logo_url
            ? <img src={r.logo_url} alt={r.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Icon name="Store" size={36} className="text-[#FF441F]/30" /></div>}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-[#18181B] text-sm leading-tight">{r.name}</p>
            <div className="flex items-center gap-0.5 flex-shrink-0 bg-yellow-50 rounded-lg px-1.5 py-0.5">
              <Icon name="Star" size={11} className="text-yellow-400" fill="currentColor" />
              <span className="text-xs font-bold text-yellow-700">{nota}</span>
            </div>
          </div>
          {r.address && <p className="text-xs text-[#71717A] mt-1 flex items-center gap-1"><Icon name="MapPin" size={10}/> {r.address}</p>}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-[#71717A]"><Icon name="Clock" size={11}/> {tempo}</span>
            <span className={`flex items-center gap-1 text-xs font-medium ${gratis ? 'text-green-600' : 'text-[#71717A]'}`}>
              <Icon name="Truck" size={11}/> {gratis ? 'Frete grátis' : `R$ ${r.frete?.toFixed(2)}`}
            </span>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {gratis && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Grátis</span>}
            {i < 3 && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Novo</span>}
          </div>
        </div>
        <Icon name="ChevronRight" size={18} className="text-[#E4E4E7] self-center flex-shrink-0" />
      </motion.button>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.3 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={() => navigate(`/r/${r.slug}`)}
      className="w-full bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden hover:shadow-lg hover:border-[#FF441F]/30 transition-all text-left"
    >
      <div className="relative h-44 overflow-hidden bg-[#F4F4F5]">
        {r.logo_url
          ? <img src={r.logo_url} alt={r.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#FF441F]/10 to-[#FF7A00]/20 flex items-center justify-center"><Icon name="Store" size={52} className="text-[#FF441F]/25" /></div>}
        {/* badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {gratis && <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full shadow">Grátis</span>}
          {i < 3 && <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full shadow">Novo</span>}
        </div>
        {/* nota */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm rounded-lg px-1.5 py-0.5 shadow">
          <Icon name="Star" size={11} className="text-yellow-400" fill="currentColor" />
          <span className="text-xs font-bold text-[#27272A]">{nota}</span>
        </div>
      </div>
      <div className="p-4">
        <p className="font-bold text-[#18181B] text-sm leading-tight">{r.name}</p>
        {r.address && <p className="text-xs text-[#71717A] mt-0.5 flex items-center gap-1"><Icon name="MapPin" size={10}/> {r.address}</p>}
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

/* ── Sidebar esquerda — desktop ───────────────────────────────────  */
const SidebarLeft = ({ catAtiva, setCatAtiva }) => (
  <aside className="hidden lg:flex flex-col gap-1 w-56 xl:w-64 flex-shrink-0">
    <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider px-3 mb-1">Categorias</p>
    {CATEGORIAS.map((c) => (
      <button
        key={c.id}
        onClick={() => setCatAtiva(c.id)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full ${
          catAtiva === c.id
            ? 'bg-[#FF441F] text-white shadow-md shadow-[#FF441F]/20'
            : 'text-[#27272A] hover:bg-white hover:shadow-sm'
        }`}
      >
        <Icon name={c.icon} size={17} />
        {c.label}
      </button>
    ))}
  </aside>
);

/* ── Sidebar direita — destaques/promos desktop ───────────────────  */
const SidebarRight = ({ restaurantes, navigate }) => {
  const destaques = restaurantes.slice(0, 4);
  return (
    <aside className="hidden xl:flex flex-col gap-4 w-56 flex-shrink-0">
      {/* Banner promo */}
      <div className="bg-gradient-to-br from-[#FF441F] to-[#FF7A00] rounded-2xl p-5 text-white">
        <Icon name="Zap" size={22} className="mb-2" />
        <p className="font-bold text-sm leading-tight">Promoções relâmpago</p>
        <p className="text-xs text-white/80 mt-1">Aproveite antes que acabe!</p>
      </div>

      {/* Top restaurantes */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4">
        <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-3">Mais populares</p>
        <div className="space-y-3">
          {destaques.map((r, i) => (
            <button key={r.id} onClick={() => navigate(`/r/${r.slug}`)}
              className="flex items-center gap-3 w-full hover:opacity-75 transition-opacity text-left">
              <span className="text-lg font-black text-[#E4E4E7] w-5 flex-shrink-0">{i + 1}</span>
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#F4F4F5] flex-shrink-0">
                {r.logo_url
                  ? <img src={r.logo_url} alt={r.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Icon name="Store" size={16} className="text-[#FF441F]/40" /></div>}
              </div>
              <p className="text-xs font-semibold text-[#18181B] truncate flex-1">{r.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
        <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Como funciona</p>
        {[
          { icon: 'Search', text: 'Escolha o restaurante' },
          { icon: 'ShoppingBag', text: 'Monte seu pedido' },
          { icon: 'CreditCard', text: 'Pague com PIX ou cartão' },
          { icon: 'Truck', text: 'Receba em casa' },
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

/* ── Hero banner ─────────────────────────────────────────────────── */
const Hero = ({ busca, setBusca }) => (
  <section className="relative overflow-hidden">
    {/* Background com padrão */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#FF441F] via-[#FF5C30] to-[#FF7A00]" />
    <div className="absolute inset-0 opacity-10"
      style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-black/5 translate-y-1/2 -translate-x-1/4" />

    <div className="relative px-4 py-12 sm:py-16 text-center text-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-sm font-semibold text-white/70 mb-2 tracking-wide uppercase">Delivery · Rápido · Confiável</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">
          Seu delivery<br className="sm:hidden" /> favorito
        </h1>
        <p className="text-white/80 text-sm sm:text-base mb-8">Peça dos melhores restaurantes da sua cidade</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-2xl shadow-black/20">
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

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex items-center justify-center gap-6 mt-8 flex-wrap"
      >
        {[
          { icon: 'Store', value: '50+', label: 'Restaurantes' },
          { icon: 'Star', value: '4.8', label: 'Avaliação média' },
          { icon: 'Truck', value: '30 min', label: 'Entrega média' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-white/90">
            <Icon name={s.icon} size={14} className="text-white/60" />
            <span className="font-bold text-sm">{s.value}</span>
            <span className="text-white/60 text-xs">{s.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ── Componente principal ────────────────────────────────────────── */
const MenuCatalogProductBrowse = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isRestaurantOwner, signOut } = useAuth();
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [catAtiva, setCatAtiva] = useState('todos');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    fetch('/api/r')
      .then((r) => r.json())
      .then((d) => setRestaurantes(d.restaurantes ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = restaurantes.filter((r) =>
    r.name.toLowerCase().includes(busca.toLowerCase()) ||
    (r.address ?? '').toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#F4F4F5]">

      {/* ── Header sticky ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7] shadow-sm">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-[#FF441F] rounded-xl flex items-center justify-center shadow-sm shadow-[#FF441F]/30">
              <Icon name="Utensils" size={18} className="text-white" />
            </div>
            <span className="font-black text-[#18181B] text-lg hidden sm:block tracking-tight">DeliveryHub</span>
          </button>

          {/* Busca desktop (header) */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="flex items-center gap-2 bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-xl px-3 py-2.5 w-full transition-colors">
              <Icon name="Search" size={15} className="text-[#71717A] flex-shrink-0" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar restaurantes ou pratos"
                className="flex-1 bg-transparent text-sm text-[#27272A] placeholder-[#71717A] outline-none"
              />
              {busca && <button onClick={() => setBusca('')}><Icon name="X" size={13} className="text-[#71717A]" /></button>}
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          {/* Auth ações */}
          <div className="flex items-center gap-1 flex-shrink-0">
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

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <Hero busca={busca} setBusca={setBusca} />

      {/* ── Categorias mobile (horizontal scroll) ─────────────────── */}
      <div className="lg:hidden bg-white border-b border-[#E4E4E7] px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIAS.map((c) => (
            <button key={c.id} onClick={() => setCatAtiva(c.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                catAtiva === c.id ? 'bg-[#FF441F] text-white shadow-md' : 'bg-[#F4F4F5] text-[#27272A]'
              }`}>
              <Icon name={c.icon} size={14} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Layout 3 colunas ───────────────────────────────────────── */}
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex gap-6 items-start">

        {/* Sidebar esquerda */}
        <SidebarLeft catAtiva={catAtiva} setCatAtiva={setCatAtiva} />

        {/* Centro — lista principal */}
        <main className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="font-bold text-[#18181B] text-base">
                {catAtiva === 'todos'
                  ? 'Todos os restaurantes'
                  : CATEGORIAS.find((c) => c.id === catAtiva)?.label}
              </h2>
              {!loading && (
                <p className="text-xs text-[#71717A] mt-0.5">
                  {filtrados.length} {filtrados.length === 1 ? 'restaurante' : 'restaurantes'}
                  {busca && ` para "${busca}"`}
                </p>
              )}
            </div>
            {/* Toggle grid/lista */}
            <div className="flex items-center gap-1 bg-white border border-[#E4E4E7] rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#FF441F] text-white' : 'text-[#71717A] hover:text-[#27272A]'}`}
              >
                <Icon name="LayoutGrid" size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#FF441F] text-white' : 'text-[#71717A] hover:text-[#27272A]'}`}
              >
                <Icon name="List" size={16} />
              </button>
            </div>
          </div>

          {/* Busca mobile (abaixo do hero) */}
          <div className="md:hidden mb-4">
            <div className="flex items-center gap-2 bg-white border border-[#E4E4E7] rounded-xl px-3 py-2.5">
              <Icon name="Search" size={15} className="text-[#71717A] flex-shrink-0" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar restaurantes..."
                className="flex-1 bg-transparent text-sm text-[#27272A] placeholder-[#71717A] outline-none"
              />
              {busca && <button onClick={() => setBusca('')}><Icon name="X" size={13} className="text-[#71717A]" /></button>}
            </div>
          </div>

          {/* Conteúdo */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="skeleton"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}
              >
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} list={viewMode === 'list'} />)}
              </motion.div>
            ) : erro ? (
              <motion.div key="erro" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 bg-white rounded-2xl border border-[#E4E4E7]"
              >
                <Icon name="WifiOff" size={44} className="text-[#E4E4E7] mx-auto mb-3" />
                <p className="text-[#27272A] font-semibold">Falha na conexão</p>
                <p className="text-[#71717A] text-xs mt-1">{erro}</p>
              </motion.div>
            ) : filtrados.length === 0 ? (
              <motion.div key="vazio" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 bg-white rounded-2xl border border-[#E4E4E7]"
              >
                <Icon name="Store" size={52} className="text-[#E4E4E7] mx-auto mb-4" />
                <p className="text-[#27272A] font-bold text-lg">
                  {busca ? 'Nenhum resultado' : 'Nenhum restaurante ainda'}
                </p>
                <p className="text-[#71717A] text-sm mt-1">
                  {busca ? `Sem resultados para "${busca}"` : 'Cadastre o primeiro restaurante!'}
                </p>
                {!busca && (
                  <button
                    onClick={() => navigate('/restaurant-registration-setup')}
                    className="mt-5 px-5 py-2.5 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]"
                  >
                    Cadastrar restaurante
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={`${viewMode}-${catAtiva}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}
              >
                {filtrados.map((r, i) => (
                  <RestCard key={r.id} r={r} i={i} list={viewMode === 'list'} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sidebar direita */}
        <SidebarRight restaurantes={filtrados} navigate={navigate} />
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E4E4E7] bg-white mt-8 py-6 text-center">
        <p className="text-xs text-[#71717A]">© {new Date().getFullYear()} DeliveryHub · Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default MenuCatalogProductBrowse;
