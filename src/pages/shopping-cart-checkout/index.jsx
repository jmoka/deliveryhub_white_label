import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const PAYMENT_LABELS = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
};

const formatCpf = (v) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

/* ── Tela PIX ─────────────────────────────────────────────────── */
const PixScreen = ({ pixData, total, onIrAcompanhar }) => {
  const [copiado, setCopiado] = useState(false);

  const copiar = () => {
    navigator.clipboard.writeText(pixData.pix_code).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border shadow-sm p-6 text-center space-y-5">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Icon name="QrCode" size={28} className="text-green-600" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-gray-900">PIX gerado!</h1>
          <p className="text-sm text-gray-500 mt-1">Escaneie o QR code ou copie o código</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{fmt(total)}</p>
        </div>

        {/* QR code */}
        {pixData.pix_qr_url && (
          <img
            src={pixData.pix_qr_url}
            alt="QR Code PIX"
            className="w-48 h-48 mx-auto border rounded-xl object-contain"
          />
        )}

        {/* Código copia e cola */}
        {pixData.pix_code && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Código PIX (copia e cola)</p>
            <div className="bg-gray-50 border rounded-xl p-3 text-xs font-mono text-gray-700 break-all text-left max-h-24 overflow-y-auto">
              {pixData.pix_code}
            </div>
            <button
              onClick={copiar}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                copiado
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {copiado ? '✓ Copiado!' : 'Copiar código'}
            </button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 text-left">
          Após o pagamento, seu pedido será confirmado automaticamente. Validade: 24h.
        </div>

        <button
          onClick={onIrAcompanhar}
          className="w-full py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Acompanhar pedido
        </button>
      </div>
    </div>
  );
};

/* ── Checkout principal ───────────────────────────────────────── */
const ShoppingCartCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [restored] = useState(() => {
    if (location.state?.carrinho) return location.state;
    try {
      const s = sessionStorage.getItem('pending_cart');
      if (s) { sessionStorage.removeItem('pending_cart'); return JSON.parse(s); }
    } catch {}
    return {};
  });

  const { carrinho = [], restauranteId, restauranteSlug } = restored;

  const [itens, setItens] = useState(carrinho);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [pixData, setPixData] = useState(null);   // null = ainda não gerado
  const [orderId, setOrderId] = useState(null);

  const total = itens.reduce((acc, i) => acc + i.price * i.qtd, 0);

  useEffect(() => {
    if (!restauranteId && !restauranteSlug) {
      navigate('/menu-catalog-product-browse', { replace: true });
    }
  }, []);

  const remover = (prodId) =>
    setItens((prev) => prev.filter((i) => i.id !== prodId));

  const altQtd = (prodId, delta) =>
    setItens((prev) =>
      prev.map((i) => (i.id === prodId ? { ...i, qtd: i.qtd + delta } : i))
         .filter((i) => i.qtd > 0),
    );

  const handleFinalizar = async () => {
    if (itens.length === 0) return;
    if (!restauranteId) { setErro('Dados do restaurante ausentes'); return; }
    if (paymentMethod === 'pix' && cpf.replace(/\D/g, '').length !== 11) {
      setErro('CPF inválido. Informe os 11 dígitos para gerar o PIX.');
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;
      if (!token) throw new Error('Sessão expirada. Faça login.');

      // 1. Criar pedido
      const resP = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          restaurant_id: restauranteId,
          payment_method: paymentMethod,
          itens: itens.map((i) => ({ product_id: i.id, quantity: i.qtd })),
        }),
      });
      const pedido = await resP.json();
      if (!resP.ok) throw new Error(pedido?.message ?? `HTTP ${resP.status}`);

      const newOrderId = pedido.pedido?.id ?? pedido.id;
      setOrderId(newOrderId);

      // 2. Se PIX → gerar cobrança
      if (paymentMethod === 'pix') {
        const user = (await supabase.auth.getUser())?.data?.user;
        const resPix = await fetch('/api/pagamentos/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            order_id: newOrderId,
            customer: {
              name: user?.user_metadata?.name ?? user?.email ?? 'Cliente',
              email: user?.email ?? '',
              tax_id: cpf.replace(/\D/g, ''),
            },
          }),
        });
        const pixResp = await resPix.json();
        if (!resPix.ok) {
          // PIX falhou mas pedido criado — vai pro tracking mesmo assim
          console.error('PIX falhou:', pixResp);
          navigate('/order-tracking-status', { state: { orderId: newOrderId, restauranteSlug }, replace: true });
          return;
        }
        setPixData(pixResp);
        return;
      }

      // 3. Outros métodos → ir pro tracking
      navigate('/order-tracking-status', {
        state: { orderId: newOrderId, restauranteSlug },
        replace: true,
      });
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tela PIX gerado
  if (pixData) {
    return (
      <PixScreen
        pixData={pixData}
        total={total}
        onIrAcompanhar={() =>
          navigate('/order-tracking-status', { state: { orderId, restauranteSlug }, replace: true })
        }
      />
    );
  }

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
                  <button onClick={() => altQtd(item.id, -1)}
                    className="w-6 h-6 bg-gray-100 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-200">−</button>
                  <span className="w-4 text-center text-sm">{item.qtd}</span>
                  <button onClick={() => altQtd(item.id, +1)}
                    className="w-6 h-6 bg-orange-500 rounded-full text-sm font-bold text-white hover:bg-orange-600">+</button>
                  <button onClick={() => remover(item.id)} className="ml-1 text-red-400 hover:text-red-600">
                    <Icon name="X" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Forma de pagamento */}
        <section className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Forma de pagamento</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PAYMENT_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setPaymentMethod(key); setErro(null); }}
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

          {/* CPF — obrigatório apenas para PIX */}
          {paymentMethod === 'pix' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF do pagador <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                maxLength={14}
              />
              <p className="text-xs text-gray-400 mt-1">Necessário para gerar o código PIX</p>
            </div>
          )}
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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <button
          onClick={handleFinalizar}
          disabled={loading || itens.length === 0}
          className="w-full max-w-lg mx-auto flex items-center justify-between bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 py-3 font-semibold disabled:opacity-50"
        >
          <span>
            {loading
              ? 'Processando...'
              : paymentMethod === 'pix'
              ? 'Gerar PIX'
              : 'Confirmar pedido'}
          </span>
          <span>{fmt(total)}</span>
        </button>
      </div>
    </div>
  );
};

export default ShoppingCartCheckout;
