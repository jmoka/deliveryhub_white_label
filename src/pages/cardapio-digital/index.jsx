import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getCardapioPorSlug } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import { imgUrl } from '../../lib/imgUrl';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// Cardápio só-leitura pra QR code de mesa — mostra produto/preço/descrição com busca
// e filtro por categoria, sem carrinho nem checkout (isso é o /r/:slug).
const ProdutoLinha = ({ produto }) => {
  const temPromo = produto.tags?.includes('promo') && produto.preco_promo != null;
  const indisponivel = produto.disponivel === false;
  const precoFinal = temPromo ? produto.preco_promo : produto.price;

  return (
    <div className={`flex gap-3 p-3 bg-white rounded-2xl border border-[#E4E4E7] ${indisponivel ? 'opacity-60' : ''}`}>
      {produto.image_url && (
        <img src={imgUrl(produto.image_url)} alt={produto.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="font-semibold text-[#18181B] text-sm leading-snug flex-1">{produto.name}</p>
          {produto.destaque && (
            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-400/20 text-yellow-700 rounded font-bold flex-shrink-0">⭐</span>
          )}
        </div>
        {produto.description && (
          <p className="text-xs text-[#71717A] mt-0.5 line-clamp-2">{produto.description}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          {temPromo && <span className="text-xs line-through text-[#A1A1AA]">{fmt(produto.price)}</span>}
          <span className={`text-sm font-bold ${temPromo ? 'text-green-600' : 'text-[#FF441F]'}`}>{fmt(precoFinal)}</span>
          {indisponivel && <span className="text-[10px] text-[#71717A] bg-[#F4F4F5] px-1.5 py-0.5 rounded ml-auto">Indisponível</span>}
        </div>
      </div>
    </div>
  );
};

const CardapioDigital = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [catAtiva, setCatAtiva] = useState('todos');

  useEffect(() => {
    setLoading(true);
    getCardapioPorSlug(slug)
      .then(setData)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const produtosFiltrados = useMemo(() => {
    if (!data) return [];
    const base = catAtiva === 'todos'
      ? data.cardapio.flatMap((c) => c.produtos ?? [])
      : data.cardapio.find((c) => c.id === catAtiva)?.produtos ?? [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return base;
    return base.filter((p) =>
      p.name.toLowerCase().includes(termo) || p.description?.toLowerCase().includes(termo)
    );
  }, [data, catAtiva, busca]);

  if (loading) return (
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center">
      <p className="text-sm text-[#71717A]">Carregando cardápio...</p>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F4F5] p-6 text-center">
      <Icon name="Store" size={56} className="text-[#E4E4E7] mb-4" />
      <p className="text-lg font-semibold text-[#27272A]">Cardápio não encontrado</p>
      <p className="text-sm text-[#71717A] mt-1">{erro}</p>
    </div>
  );

  const { restaurante, cardapio } = data;

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7]">
        <div className="max-w-screen-sm mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F4F4F5] flex-shrink-0">
            {restaurante.logo_url ? (
              <img src={imgUrl(restaurante.logo_url)} alt={restaurante.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Icon name="Store" size={18} className="text-[#FF441F]" /></div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#18181B] text-sm truncate">{restaurante.name}</p>
            <p className="text-xs text-[#71717A]">Cardápio</p>
          </div>
        </div>
        <div className="max-w-screen-sm mx-auto px-4 pb-3">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..."
              className="w-full border border-[#E4E4E7] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#FF441F]" />
          </div>
          <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setCatAtiva('todos')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                catAtiva === 'todos' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'
              }`}>
              Todos
            </button>
            {cardapio.map((c) => (
              <button key={c.id} onClick={() => setCatAtiva(c.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                  catAtiva === c.id ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'
                }`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-screen-sm mx-auto px-4 py-4 space-y-2">
        {produtosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-[#71717A]">
            <Icon name="UtensilsCrossed" size={44} className="mx-auto mb-3 text-[#E4E4E7]" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          produtosFiltrados.map((p) => <ProdutoLinha key={p.id} produto={p} />)
        )}
      </main>
    </div>
  );
};

export default CardapioDigital;
