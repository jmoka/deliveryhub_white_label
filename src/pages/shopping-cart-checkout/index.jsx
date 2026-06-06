import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const PAYMENT_LABELS = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
};

const ShoppingCartCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Carrinho vem do RestauranteCatalogo via location.state
  const { carrinho = [], restauranteId, restauranteSlug } = location.state ?? {};

  const [itens, setItens] = useState(carrinho);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const total = itens.reduce((acc, i) => acc + i.price * i.qtd, 0);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/customer-registration-login', {
        state: { from: '/shopping-cart-checkout' },
        replace: true,
      });
    }
  }, []);

  useEffect(() => {
    if (!restauranteId && !restauranteSlug) {
      navigate('/menu-catalog-product-browse', { replace: true });
    }
  }, []);

  const remover = (prodId) =>
    setItens((prev) => prev.filter((i) => i.id !== prodId));

  const altQtd = (prodId, delta) =>
    setItens((prev) =>
      prev
        .map((i) => (i.id === prodId ? { ...i, qtd: i.qtd + delta } : i))
        .filter((i) => i.qtd > 0),
    );

  const handleFinalizar = async () => {
    if (itens.length === 0) return;
    if (!restauranteId) { setErro('Dados do restaurante ausentes'); return; }

    setLoading(true);
    setErro(null);

    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;
      if (!token) throw new Error('Sessão expirada. Faça login.');

      const body = {
        restaurant_id: restauranteId,
        payment_method: paymentMethod,
        itens: itens.map((i) => ({ product_id: i.id, quantity: i.qtd })),
      };

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);

      navigate('/order-tracking-status', {
        state: { orderId: data.id, restauranteSlug },
        replace: true,
      });
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (itens.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Icon name="ShoppingCart" size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Carrinho vazio</p>
        <button
          onClick={() => navigate(restauranteSlug ? `/r/${restauranteSlug}` : '/menu-catalog-product-browse')}
          className="mt-4 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
        >
          {restauranteSlug ? 'Voltar ao cardápio' : 'Ver restaurantes'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(restauranteSlug ? `/r/${restauranteSlug}` : -1)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Icon name="ArrowLeft" size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Finalizar Pedido</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Itens */}
        <section className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Itens do pedido</h2>
          <div className="space-y-3">
            {itens.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-orange-600">{fmt(item.price)} cada</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => altQtd(item.id, -1)}
                    className="w-6 h-6 bg-gray-100 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm">{item.qtd}</span>
                  <button
                    onClick={() => altQtd(item.id, +1)}
                    className="w-6 h-6 bg-orange-500 rounded-full text-sm font-bold text-white hover:bg-orange-600"
                  >
                    +
                  </button>
                  <button onClick={() => remover(item.id)} className="ml-1 text-red-400 hover:text-red-600">
                    <Icon name="X" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pagamento */}
        <section className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Forma de pagamento</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PAYMENT_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPaymentMethod(key)}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  paymentMethod === key
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Resumo */}
        <section className="bg-white rounded-xl border p-4 space-y-2">
          <h2 className="font-semibold text-gray-900 mb-2">Resumo</h2>
          {itens.map((i) => (
            <div key={i.id} className="flex justify-between text-sm text-gray-600">
              <span>{i.name} × {i.qtd}</span>
              <span>{fmt(i.price * i.qtd)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-orange-600">{fmt(total)}</span>
          </div>
        </section>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {erro}
          </div>
        )}
      </main>

      {/* Botão fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <button
          onClick={handleFinalizar}
          disabled={loading || itens.length === 0}
          className="w-full max-w-lg mx-auto flex items-center justify-between bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 py-3 font-semibold disabled:opacity-50"
        >
          <span>{loading ? 'Enviando...' : 'Confirmar pedido'}</span>
          <span>{fmt(total)}</span>
        </button>
      </div>
    </div>
  );
};

export default ShoppingCartCheckout;
