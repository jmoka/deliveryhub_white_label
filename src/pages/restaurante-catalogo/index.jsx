import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCardapioPorSlug } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const RestauranteCatalogo = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [catAtiva, setCatAtiva] = useState(null);

  useEffect(() => {
    setLoading(true);
    getCardapioPorSlug(slug)
      .then((d) => {
        setData(d);
        if (d.cardapio?.length) setCatAtiva(d.cardapio[0].id);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((prev) => {
      const idx = prev.findIndex((i) => i.id === produto.id);
      if (idx >= 0) {
        const novo = [...prev];
        novo[idx] = { ...novo[idx], qtd: novo[idx].qtd + 1 };
        return novo;
      }
      return [...prev, { ...produto, qtd: 1 }];
    });
  };

  const removerDoCarrinho = (produtoId) => {
    setCarrinho((prev) => {
      const idx = prev.findIndex((i) => i.id === produtoId);
      if (idx < 0) return prev;
      const novo = [...prev];
      if (novo[idx].qtd <= 1) {
        novo.splice(idx, 1);
      } else {
        novo[idx] = { ...novo[idx], qtd: novo[idx].qtd - 1 };
      }
      return novo;
    });
  };

  const qtdNoCarrinho = (produtoId) => carrinho.find((i) => i.id === produtoId)?.qtd ?? 0;
  const totalCarrinho = carrinho.reduce((acc, i) => acc + i.price * i.qtd, 0);
  const totalItens = carrinho.reduce((acc, i) => acc + i.qtd, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Icon name="Store" size={48} className="text-gray-300 mb-4" />
        <p className="text-lg font-semibold text-gray-700">Restaurante não encontrado</p>
        <p className="text-sm text-gray-400 mt-1">{erro}</p>
        <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">
          Voltar
        </button>
      </div>
    );
  }

  const { restaurante, cardapio } = data;
  const catAtual = cardapio.find((c) => c.id === catAtiva);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header restaurante */}
      <div className="bg-white border-b">
        {restaurante.logo_url && (
          <img src={restaurante.logo_url} alt={restaurante.name} className="w-full h-40 object-cover" />
        )}
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{restaurante.name}</h1>
          {restaurante.address && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Icon name="MapPin" size={14} /> {restaurante.address}
            </p>
          )}
        </div>

        {/* Abas de categorias */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
          {cardapio.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCatAtiva(cat.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                catAtiva === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Produtos da categoria ativa */}
      <main className="px-4 py-4 max-w-2xl mx-auto">
        {cardapio.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Icon name="UtensilsCrossed" size={40} className="mx-auto mb-3 opacity-50" />
            <p>Nenhum produto disponível</p>
          </div>
        )}

        {catAtual && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{catAtual.name}</h2>
            <div className="space-y-3">
              {catAtual.produtos.map((produto) => {
                const qtd = qtdNoCarrinho(produto.id);
                return (
                  <div key={produto.id} className="bg-white rounded-xl border p-4 flex gap-3">
                    {produto.image_url && (
                      <img
                        src={produto.image_url}
                        alt={produto.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{produto.name}</p>
                      {produto.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{produto.description}</p>
                      )}
                      <p className="text-orange-600 font-bold mt-1">{fmt(produto.price)}</p>
                    </div>
                    <div className="flex flex-col items-center justify-end gap-1">
                      {qtd === 0 ? (
                        <button
                          onClick={() => adicionarAoCarrinho(produto)}
                          className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
                        >
                          Adicionar
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removerDoCarrinho(produto.id)}
                            className="w-7 h-7 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 flex items-center justify-center font-bold"
                          >
                            −
                          </button>
                          <span className="text-sm font-semibold w-4 text-center">{qtd}</span>
                          <button
                            onClick={() => adicionarAoCarrinho(produto)}
                            className="w-7 h-7 bg-orange-500 rounded-full text-white hover:bg-orange-600 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Barra do carrinho fixa */}
      {totalItens > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
          <button
            onClick={() => navigate('/shopping-cart-checkout', { state: { carrinho, restauranteSlug: slug, restauranteId: restaurante.id } })}
            className="w-full max-w-2xl mx-auto flex items-center justify-between bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-3 font-semibold"
          >
            <span className="bg-orange-600 rounded-lg px-2 py-0.5 text-sm">{totalItens}</span>
            <span>Ver carrinho</span>
            <span>{fmt(totalCarrinho)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RestauranteCatalogo;
