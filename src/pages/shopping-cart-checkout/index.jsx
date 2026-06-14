import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import StepEndereco from './StepEndereco';
import { getPerfil } from '../../services/perfilService';
import { cartCount, cartByRestaurant, cartClear } from '../../utils/multiCart';
import MultiCartCheckout from './MultiCartCheckout';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const PAYMENT_OPTIONS = [
  { key: 'pix', label: 'PIX', icon: 'QrCode', desc: 'Aprovação instantânea' },
  { key: 'credit_card', label: 'Cartão de crédito', icon: 'CreditCard', desc: 'Débito em 1-2 dias' },
  { key: 'debit_card', label: 'Cartão de débito', icon: 'Landmark', desc: 'Débito imediato' },
  { key: 'cash', label: 'Dinheiro', icon: 'Banknote', desc: 'Pague na entrega' },
];

const formatCpf = (v) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

/* ── Progress ────────────────────────────────────────────────────── */
const ProgressBar = ({ etapa, total }) => (
  <div className="flex items-center gap-2 px-4 py-3">
    {Array.from({ length: total }).map((_, i) => (
      <React.Fragment key={i}>
        <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
          i < etapa ? 'bg-[#FF441F] text-white'
          : i === etapa ? 'bg-[#FF441F] text-white ring-4 ring-[#FF441F]/20'
          : 'bg-[#F4F4F5] text-[#71717A]'
        }`}>
          {i < etapa ? <Icon name="Check" size={13} /> : i + 1}
        </div>
        {i < total - 1 && (
          <div className={`flex-1 h-0.5 rounded-full ${i < etapa ? 'bg-[#FF441F]' : 'bg-[#E4E4E7]'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const LABELS_ETAPA = ['Seus itens', 'Endereço', 'Pagamento', 'Confirmar'];

/* ── Tela PIX ─────────────────────────────────────────────────────  */
const PixScreen = ({ pixData, total, onIrAcompanhar }) => {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard.writeText(pixData.pix_code).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-3xl border border-[#E4E4E7] shadow-lg p-6 text-center space-y-5"
      >
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Icon name="QrCode" size={28} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#18181B]">PIX gerado!</h1>
          <p className="text-sm text-[#71717A] mt-1">Escaneie o QR code ou copie o código</p>
          <p className="text-2xl font-bold text-[#FF441F] mt-1">{fmt(total)}</p>
        </div>
        {pixData.pix_qr_url && (
          <img src={pixData.pix_qr_url} alt="QR Code PIX"
            className="w-48 h-48 mx-auto border border-[#E4E4E7] rounded-2xl object-contain" />
        )}
        {pixData.pix_code && (
          <div className="space-y-2">
            <p className="text-xs text-[#71717A]">Código PIX (copia e cola)</p>
            <div className="bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl p-3 text-xs font-mono text-[#27272A] break-all text-left max-h-24 overflow-y-auto">
              {pixData.pix_code}
            </div>
            <button onClick={copiar}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                copiado ? 'bg-green-500 text-white' : 'bg-[#FF441F] hover:bg-[#E63A19] text-white'
              }`}>
              {copiado ? '✓ Copiado!' : 'Copiar código'}
            </button>
          </div>
        )}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 text-left">
          Após o pagamento, seu pedido é confirmado automaticamente. Válido por 24h.
        </div>
        <button onClick={onIrAcompanhar}
          className="w-full py-3 border border-[#E4E4E7] rounded-2xl text-sm font-semibold text-[#27272A] hover:bg-[#F4F4F5]">
          Acompanhar pedido
        </button>
      </motion.div>
    </div>
  );
};

/* ── Step 1: Itens ───────────────────────────────────────────────── */
const StepItens = ({ itens, setItens, onNext, subtotal, frete, total }) => {
  const remover = (id) => setItens((p) => p.filter((i) => i.id !== id));
  const altQtd = (id, delta) =>
    setItens((p) => p.map((i) => i.id === id ? { ...i, qtd: i.qtd + delta } : i).filter((i) => i.qtd > 0));

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
        {itens.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#18181B] truncate">{item.name}</p>
              <p className="text-xs text-[#FF441F] font-medium">{fmt(item.price)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => altQtd(item.id, -1)}
                className="w-7 h-7 bg-[#F4F4F5] rounded-full font-bold text-[#27272A] flex items-center justify-center hover:bg-[#E4E4E7] text-base">
                −
              </button>
              <span className="text-sm font-bold text-[#18181B] w-4 text-center">{item.qtd}</span>
              <button onClick={() => altQtd(item.id, +1)}
                className="w-7 h-7 bg-[#FF441F] rounded-full font-bold text-white flex items-center justify-center hover:bg-[#E63A19] text-base">
                +
              </button>
              <button onClick={() => remover(item.id)} className="ml-1 p-1 text-[#71717A] hover:text-red-500">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal + frete + total */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] px-4 py-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#71717A]">Subtotal ({itens.reduce((a, i) => a + i.qtd, 0)} itens)</span>
          <span className="font-medium text-[#18181B]">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#71717A] flex items-center gap-1">
            <Icon name="Truck" size={13} /> Frete motoboy
          </span>
          <span className="font-medium text-[#18181B]">{fmt(frete)}</span>
        </div>
        <div className="border-t border-[#E4E4E7] pt-2 flex justify-between font-bold">
          <span className="text-[#18181B]">Total</span>
          <span className="text-[#FF441F]">{fmt(total)}</span>
        </div>
      </div>

      <button onClick={onNext}
        className="w-full py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] transition-colors">
        Continuar
      </button>
    </motion.div>
  );
};

/* ── Step 2: Pagamento ───────────────────────────────────────────── */
const StepPagamento = ({ paymentMethod, setPaymentMethod, cpf, setCpf, trocoPara, setTrocoPara, subtotal, frete, total, onNext, onBack }) => (
  <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
    {/* Resumo do valor — sempre visível */}
    <div className="bg-[#18181B] rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-[10px] text-[#A1A1AA] uppercase tracking-widest font-bold">Subtotal</span>
        <span className="text-sm font-semibold text-white">{fmt(subtotal)}</span>
      </div>
      {frete > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[#A1A1AA] uppercase tracking-widest font-bold">Frete</span>
          <span className="text-sm font-semibold text-white">{fmt(frete)}</span>
        </div>
      )}
      <div className="flex flex-col items-end">
        <span className="text-[10px] text-[#FF441F] uppercase tracking-widest font-bold">Total</span>
        <span className="text-lg font-black text-white">{fmt(total)}</span>
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4">
      <p className="text-sm font-semibold text-[#18181B] mb-3">Forma de pagamento</p>
      <div className="space-y-2">
        {PAYMENT_OPTIONS.map((op) => (
          <button key={op.key} onClick={() => setPaymentMethod(op.key)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
              paymentMethod === op.key
                ? 'border-[#FF441F] bg-[#FF441F]/5'
                : 'border-[#E4E4E7] hover:border-[#FF441F]/40'
            }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              paymentMethod === op.key ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] text-[#71717A]'
            }`}>
              <Icon name={op.icon} size={18} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${paymentMethod === op.key ? 'text-[#FF441F]' : 'text-[#18181B]'}`}>
                {op.label}
              </p>
              <p className="text-xs text-[#71717A]">{op.desc}</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
              paymentMethod === op.key ? 'border-[#FF441F] bg-[#FF441F]' : 'border-[#E4E4E7]'
            }`}>
              {paymentMethod === op.key && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
            </div>
          </button>
        ))}
      </div>

      {/* CPF para PIX */}
      <AnimatePresence>
        {paymentMethod === 'pix' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-[#E4E4E7]">
              <label className="block text-sm font-medium text-[#27272A] mb-1.5">
                CPF do pagador <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/30 focus:border-[#FF441F]"
              />
              <p className="text-xs text-[#71717A] mt-1">Necessário para gerar o código PIX</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Troco para dinheiro */}
      <AnimatePresence>
        {paymentMethod === 'cash' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-[#E4E4E7]">
              <label className="block text-sm font-medium text-[#27272A] mb-1.5">
                Com quanto vai pagar? <span className="text-[#71717A] font-normal">(para troco)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#71717A] font-medium">R$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={trocoPara}
                  onChange={(e) => setTrocoPara(e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-[#E4E4E7] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/30 focus:border-[#FF441F]"
                />
              </div>
              <p className="text-xs text-[#71717A] mt-1">Deixe em branco se pagar o valor exato</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    <div className="flex gap-3">
      <button onClick={onBack}
        className="flex-1 py-3.5 border border-[#E4E4E7] text-[#27272A] font-semibold rounded-2xl hover:bg-[#F4F4F5] transition-colors text-sm">
        Voltar
      </button>
      <button onClick={onNext}
        className="flex-[2] py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] transition-colors">
        Revisar pedido
      </button>
    </div>
  </motion.div>
);

/* ── Step 3: Confirmar ───────────────────────────────────────────── */
const StepConfirmar = ({ itens, paymentMethod, trocoPara, subtotal, frete, total, perfil, loading, erro, onConfirmar, onBack }) => {
  const payOpt = PAYMENT_OPTIONS.find((o) => o.key === paymentMethod);
  const addr = perfil?.address_json ?? {};
  const linhaRua = [addr.logradouro, addr.numero].filter(Boolean).join(', ');
  const linhaCompl = [addr.complemento, addr.bairro].filter(Boolean).join(' — ');
  const linhaCidade = [addr.cidade, addr.estado].filter(Boolean).join(', ');
  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
      {/* Endereço entrega */}
      {perfil && (
        <div className="bg-white rounded-2xl border border-[#E4E4E7] px-4 py-3 flex items-start gap-3">
          <div className="w-9 h-9 bg-[#FF441F]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="MapPin" size={16} className="text-[#FF441F]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#71717A]">Entregar para: <span className="text-[#18181B]">{perfil.name}</span></p>
            {linhaRua && <p className="text-sm text-[#18181B] font-medium mt-0.5">{linhaRua}</p>}
            {linhaCompl && <p className="text-xs text-[#71717A]">{linhaCompl}</p>}
            {linhaCidade && <p className="text-xs text-[#71717A]">{linhaCidade}</p>}
            {perfil.phone_e164 && <p className="text-xs text-[#71717A] mt-0.5">{perfil.phone_e164}</p>}
          </div>
        </div>
      )}
      {/* Itens resumo */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4">
        <p className="text-sm font-semibold text-[#18181B] mb-3">Resumo do pedido</p>
        <div className="space-y-2">
          {itens.map((i) => (
            <div key={i.id} className="flex justify-between text-sm">
              <span className="text-[#71717A]">{i.name} × {i.qtd}</span>
              <span className="text-[#27272A] font-medium">{fmt(i.price * i.qtd)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm">
            <span className="text-[#71717A] flex items-center gap-1">
              <Icon name="Truck" size={13} /> Frete motoboy
            </span>
            <span className="font-medium text-[#27272A]">{fmt(frete)}</span>
          </div>
          <div className="border-t border-[#E4E4E7] pt-2 flex justify-between font-bold">
            <span className="text-[#18181B]">Total</span>
            <span className="text-[#FF441F] text-lg">{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Pagamento */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#FF441F]/10 rounded-xl flex items-center justify-center">
          <Icon name={payOpt?.icon ?? 'CreditCard'} size={18} className="text-[#FF441F]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#18181B]">{payOpt?.label}</p>
          <p className="text-xs text-[#71717A]">{payOpt?.desc}</p>
          {paymentMethod === 'cash' && trocoPara > 0 && (
            <p className="text-xs text-[#27272A] mt-0.5">
              Pagará {fmt(trocoPara)} · Troco: {fmt(Math.max(0, trocoPara - total))}
            </p>
          )}
        </div>
      </div>

      {erro && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {erro}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3.5 border border-[#E4E4E7] text-[#27272A] font-semibold rounded-2xl hover:bg-[#F4F4F5] transition-colors text-sm">
          Voltar
        </button>
        <button onClick={onConfirmar} disabled={loading}
          className="flex-[2] py-3.5 bg-[#FF441F] text-white font-bold rounded-2xl hover:bg-[#E63A19] disabled:opacity-50 transition-colors">
          {loading
            ? 'Processando...'
            : paymentMethod === 'pix' ? 'Gerar PIX' : 'Confirmar pedido'}
        </button>
      </div>
    </motion.div>
  );
};

/* ── Checkout principal ───────────────────────────────────────────  */
const SingleCartCheckout = () => {
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

  const { carrinho = [], restauranteId, restauranteSlug, freteMotoboy = 0 } = restored;

  const [itens, setItens] = useState(carrinho);
  const [perfil, setPerfil] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [cpf, setCpf] = useState('');
  const [trocoPara, setTrocoPara] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [pixData, setPixData] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [etapa, setEtapa] = useState(0); // 0=itens 1=endereço 2=pagamento 3=confirmar

  useEffect(() => {
    getPerfil().then(setPerfil).catch(() => {});
  }, []);

  const frete = parseFloat(freteMotoboy) || 0;
  const subtotal = itens.reduce((acc, i) => acc + i.price * i.qtd, 0);
  const total = subtotal + frete;

  const irParaStep = (n) => { setErro(null); setEtapa(n); };

  const validarPagamento = () => {
    if (paymentMethod === 'pix' && cpf.replace(/\D/g, '').length !== 11) {
      setErro('CPF inválido. Informe os 11 dígitos para gerar o PIX.');
      return false;
    }
    return true;
  };

  const handleFinalizar = async () => {
    if (!validarPagamento()) return;
    if (itens.length === 0) return;
    if (!restauranteId) { setErro('Dados do restaurante ausentes'); return; }

    setLoading(true);
    setErro(null);

    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;
      if (!token) throw new Error('Sessão expirada. Faça login.');

      const trocoParsed = parseFloat(trocoPara) || null;
      const resP = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          restaurant_id: restauranteId,
          payment_method: paymentMethod,
          troco_para: paymentMethod === 'cash' && trocoParsed > 0 ? trocoParsed : undefined,
          itens: itens.map((i) => ({ product_id: i.id, quantity: i.qtd })),
        }),
      });
      const pedido = await resP.json();
      if (!resP.ok) throw new Error(pedido?.message ?? `HTTP ${resP.status}`);

      const newOrderId = pedido.pedido?.id ?? pedido.id;
      setOrderId(newOrderId);

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
          navigate('/order-tracking-status', { state: { orderId: newOrderId, restauranteSlug }, replace: true });
          return;
        }
        setPixData(pixResp);
        return;
      }

      navigate('/order-tracking-status', { state: { orderId: newOrderId, restauranteSlug }, replace: true });
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
        <Icon name="ShoppingCart" size={52} className="text-[#E4E4E7] mb-4" />
        <p className="text-[#27272A] font-semibold text-lg">Carrinho vazio</p>
        <button
          onClick={() => navigate(restauranteSlug ? `/r/${restauranteSlug}` : '/')}
          className="mt-5 px-5 py-2.5 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]"
        >
          {restauranteSlug ? 'Voltar ao cardápio' : 'Ver restaurantes'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E4E4E7] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => etapa > 0 ? irParaStep(etapa - 1) : navigate(restauranteSlug ? `/r/${restauranteSlug}` : -1)}
          className="p-2 rounded-xl hover:bg-[#F4F4F5]"
        >
          <Icon name="ArrowLeft" size={20} className="text-[#27272A]" />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#18181B]">Finalizar Pedido</h1>
          <p className="text-xs text-[#71717A]">{LABELS_ETAPA[etapa]}</p>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-[#E4E4E7]">
        <div className="max-w-lg mx-auto">
          <ProgressBar etapa={etapa} total={4} />
          <div className="flex justify-between px-4 pb-2">
            {LABELS_ETAPA.map((l, i) => (
              <span key={i} className={`text-[10px] font-medium ${i === etapa ? 'text-[#FF441F]' : 'text-[#71717A]'}`}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="p-4 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {etapa === 0 && (
            <StepItens
              key="itens"
              itens={itens}
              setItens={setItens}
              subtotal={subtotal}
              frete={frete}
              total={total}
              onNext={() => irParaStep(1)}
            />
          )}
          {etapa === 1 && (
            <StepEndereco
              key="endereco"
              perfil={perfil}
              onNext={(updated) => { setPerfil(updated); irParaStep(2); }}
              onBack={() => irParaStep(0)}
            />
          )}
          {etapa === 2 && (
            <StepPagamento
              key="pagamento"
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cpf={cpf}
              setCpf={setCpf}
              trocoPara={trocoPara}
              setTrocoPara={setTrocoPara}
              subtotal={subtotal}
              frete={frete}
              total={total}
              onNext={() => { if (!validarPagamento()) return; irParaStep(3); }}
              onBack={() => irParaStep(1)}
            />
          )}
          {etapa === 3 && (
            <StepConfirmar
              key="confirmar"
              itens={itens}
              paymentMethod={paymentMethod}
              trocoPara={parseFloat(trocoPara) || 0}
              subtotal={subtotal}
              frete={frete}
              total={total}
              perfil={perfil}
              loading={loading}
              erro={erro}
              onConfirmar={handleFinalizar}
              onBack={() => irParaStep(2)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const ShoppingCartCheckout = () => {
  const location = useLocation();

  // Single cart from restaurant page always takes priority
  if (location.state?.carrinho) return <SingleCartCheckout />;

  const groups = Object.values(cartByRestaurant());

  // 1 restaurant in multiCart → full checkout (address + payment selection)
  if (groups.length === 1) {
    const grupo = groups[0];
    const carrinho = grupo.items.map((i) => ({
      id: i.produto_id,
      name: i.name,
      price: i.price,
      image_url: i.image_url ?? null,
      qtd: i.qty,
    }));
    sessionStorage.setItem('pending_cart', JSON.stringify({
      carrinho,
      restauranteId: grupo.restaurante_id,
      restauranteSlug: grupo.slug ?? '',
      freteMotoboy: grupo.frete_motoboy ?? 0,
    }));
    cartClear();
    return <SingleCartCheckout />;
  }

  // 2+ restaurants → MultiCartCheckout (cash only)
  if (groups.length > 1) return <MultiCartCheckout />;

  return <SingleCartCheckout />;
};

export default ShoppingCartCheckout;
