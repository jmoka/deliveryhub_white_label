import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

/* ── Categorias estáticas ────────────────────────────────────────── */
const CATEGORIAS = [
  { id: 'todos', label: 'Todos', icon: 'LayoutGrid', color: '#FF441F' },
  { id: 'pizza', label: 'Pizza', icon: 'Pizza', color: '#FF7A00' },
  { id: 'hamburguer', label: 'Hambúrguer', icon: 'Sandwich', color: '#E63A19' },
  { id: 'japones', label: 'Japonesa', icon: 'Fish', color: '#0EA5E9' },
  { id: 'acai', label: 'Açaí', icon: 'GlassWater', color: '#8B5CF6' },
  { id: 'marmita', label: 'Marmita', icon: 'UtensilsCrossed', color: '#10B981' },
  { id: 'saudavel', label: 'Saudável', icon: 'Leaf', color: '#22C55E' },
  { id: 'sorvete', label: 'Sorvetes', icon: 'Dessert', color: '#EC4899' },
  { id: 'padaria', label: 'Padaria', icon: 'Coffee', color: '#F59E0B' },
];

/* ── Skeleton card ───────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
    <div className="h-44 bg-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="flex gap-2 mt-3">
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
    </div>
  </div>
);

/* ── Badge ───────────────────────────────────────────────────────── */
const Badge = ({ children, color = 'green' }) => {
  const colors = {
    green: 'bg-green-500 text-white',
    red: 'bg-[#FF441F] text-white',
    blue: 'bg-blue-500 text-white',
    orange: 'bg-[#FF7A00] text-white',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
};

/* ── Card de restaurante ─────────────────────────────────────────── */
const RestauranteCard = ({ restaurante, idx }) => {
  const navigate = useNavigate();
  const nota = restaurante.nota ?? (4.3 + Math.random() * 0.6).toFixed(1);
  const tempo = restaurante.tempo_entrega ?? `${20 + Math.floor(Math.random() * 20)}-${35 + Math.floor(Math.random() * 15)} min`;
  const frete = restaurante.frete === 0 ? 'Grátis' : restaurante.frete ? `R$ ${restaurante.frete.toFixed(2)}` : 'Grátis';
  const isNovo = idx < 2;

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.3 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/r/${restaurante.slug}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left border border-gray-100 w-full"
    >
      {/* Imagem capa */}
      <div className="relative h-44 overflow-hidden">
        {restaurante.logo_url ? (
          <img
            src={restaurante.logo_url}
            alt={restaurante.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FF441F]/10 to-[#FF7A00]/20 flex items-center justify-center">
            <Icon name="Store" size={52} className="text-[#FF441F]/30" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {frete === 'Grátis' && <Badge color="green">Frete grátis</Badge>}
          {isNovo && <Badge color="blue">Novo</Badge>}
          {restaurante.destaque && <Badge color="red">Destaque</Badge>}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-[#18181B] text-sm leading-tight">{restaurante.name}</p>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Icon name="Star" size={12} className="text-yellow-400" fill="currentColor" />
            <span className="text-xs font-semibold text-[#27272A]">{nota}</span>
          </div>
        </div>
        {restaurante.address && (
          <p className="text-xs text-[#71717A] mt-0.5 flex items-center gap-1">
            <Icon name="MapPin" size={10} /> {restaurante.address}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2.5">
          <span className="flex items-center gap-1 text-xs text-[#71717A]">
            <Icon name="Clock" size={11} /> {tempo}
          </span>
          <span className={`flex items-center gap-1 text-xs font-medium ${frete === 'Grátis' ? 'text-green-600' : 'text-[#71717A]'}`}>
            <Icon name="Truck" size={11} /> {frete === 'Grátis' ? 'Frete grátis' : frete}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

/* ── Componente principal ────────────────────────────────────────── */
const MenuCatalogProductBrowse = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isRestaurantOwner, signOut } = useAuth();
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [catAtiva, setCatAtiva] = useState('todos');
  const [buscaFocada, setBuscaFocada] = useState(false);
  const catRef = useRef(null);

  useEffect(() => {
    fetch('/api/r')
      .then((r) => r.json())
      .then((d) => setRestaurantes(d.restaurantes ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = restaurantes.filter((r) => {
    const matchBusca =
      r.name.toLowerCase().includes(busca.toLowerCase()) ||
      (r.address ?? '').toLowerCase().includes(busca.toLowerCase());
    return matchBusca;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ── Header sticky ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <div className="w-8 h-8 bg-[#FF441F] rounded-xl flex items-center justify-center">
              <Icon name="Utensils" size={17} className="text-white" />
            </div>
            <span className="font-bold text-[#18181B] text-base hidden sm:block">DeliveryHub</span>
          </button>

          {/* Busca */}
          <div className="flex-1 max-w-xl">
            <div className={`flex items-center gap-2 bg-[#F4F4F5] rounded-xl px-3 py-2.5 transition-all ${buscaFocada ? 'ring-2 ring-[#FF441F]/30 bg-white' : ''}`}>
              <Icon name="Search" size={15} className="text-[#71717A] flex-shrink-0" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onFocus={() => setBuscaFocada(true)}
                onBlur={() => setBuscaFocada(false)}
                placeholder="Buscar restaurantes ou pratos"
                className="flex-1 bg-transparent text-sm text-[#27272A] placeholder-[#71717A] outline-none"
              />
              {busca && (
                <button onClick={() => setBusca('')}>
                  <Icon name="X" size={14} className="text-[#71717A]" />
                </button>
              )}
            </div>
          </div>

          {/* Ações direita */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isAuthenticated() ? (
              <>
                {isAdmin() && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    Admin
                  </button>
                )}
                {isRestaurantOwner() && (
                  <button
                    onClick={() => navigate('/restaurante')}
                    className="px-3 py-1.5 text-xs font-medium text-[#FF441F] hover:bg-brand-light rounded-lg"
                  >
                    Meu Rest.
                  </button>
                )}
                <button
                  onClick={() => navigate('/customer-account-order-history')}
                  className="p-2 text-[#71717A] hover:text-[#27272A] hover:bg-[#F4F4F5] rounded-lg"
                  title="Meus Pedidos"
                >
                  <Icon name="ClipboardList" size={18} />
                </button>
                <button
                  onClick={async () => { await signOut(); }}
                  className="p-2 text-[#71717A] hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Sair"
                >
                  <Icon name="LogOut" size={17} />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/customer-registration-login')}
                className="px-4 py-2 bg-[#FF441F] text-white text-sm font-semibold rounded-xl hover:bg-[#E63A19] transition-colors"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#FF441F] to-[#FF7A00] px-4 py-10 sm:py-14 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 leading-tight">
            Seu delivery favorito
          </h1>
          <p className="text-white/80 text-sm sm:text-base mb-2">
            Escolha um restaurante e peça agora
          </p>
        </motion.div>
      </section>

      {/* ── Categorias ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div
          ref={catRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCatAtiva(cat.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                catAtiva === cat.id
                  ? 'bg-[#FF441F] text-white shadow-md'
                  : 'bg-white text-[#27272A] border border-[#E4E4E7] hover:border-[#FF441F]/40'
              }`}
            >
              <Icon
                name={cat.icon}
                size={20}
                className={catAtiva === cat.id ? 'text-white' : ''}
                style={catAtiva !== cat.id ? { color: cat.color } : {}}
              />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista de restaurantes ──────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : erro ? (
          <div className="text-center py-16">
            <Icon name="WifiOff" size={48} className="text-[#E4E4E7] mx-auto mb-3" />
            <p className="text-[#71717A] text-sm">{erro}</p>
            <p className="text-[#71717A] text-xs mt-1">Verifique se o backend está rodando</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="Store" size={56} className="text-[#E4E4E7] mx-auto mb-4" />
            <p className="text-[#27272A] font-semibold text-lg">
              {busca ? 'Nenhum restaurante encontrado' : 'Nenhum restaurante cadastrado'}
            </p>
            <p className="text-[#71717A] text-sm mt-1">
              {busca ? `Sem resultados para "${busca}"` : 'Seja o primeiro a cadastrar!'}
            </p>
            {!busca && (
              <button
                onClick={() => navigate('/restaurant-registration-setup')}
                className="mt-5 px-5 py-2.5 bg-[#FF441F] text-white text-sm font-semibold rounded-xl hover:bg-[#E63A19] transition-colors"
              >
                Cadastrar restaurante
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Título seção */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#18181B]">
                {catAtiva === 'todos' ? 'Todos os restaurantes' : CATEGORIAS.find((c) => c.id === catAtiva)?.label}
                <span className="text-[#71717A] font-normal text-sm ml-2">({filtrados.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtrados.map((r, i) => (
                <RestauranteCard key={r.id} restaurante={r} idx={i} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Footer mínimo ──────────────────────────────────────────── */}
      <footer className="border-t border-[#E4E4E7] mt-12 py-6 text-center">
        <p className="text-xs text-[#71717A]">© {new Date().getFullYear()} DeliveryHub · Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default MenuCatalogProductBrowse;
