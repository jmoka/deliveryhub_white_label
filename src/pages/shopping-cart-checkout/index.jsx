import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { apiPath } from '../../lib/apiUrl';
import Icon from '../../components/AppIcon';
import StepEndereco from './StepEndereco';
import { getPerfil } from '../../services/perfilService';
import { cartCount, cartByRestaurant, cartClear } from '../../utils/multiCart';
import MultiCartCheckout from './MultiCartCheckout';
import { gerarPixPayload, qrCodeUrl } from '../../utils/pixQrCode';

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
          : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'
        }`}>
          {i < etapa ? <Icon name="Check" size={13} /> : i + 1}
        </div>
        {i < total - 1 && (
          <div className={`flex-1 h-0.5 rounded-full ${i < etapa ? 'bg-[#FF441F]' : 'bg-[#E4E4E7] dark:bg-[#3F3F46]'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const LABELS_ETAPA = ['Endereço', 'Seus itens', 'Pagamento', 'Confirmar'];

/* ── Tela PIX ─────────────────────────────────────────────────────  */
const comprimirImagem = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = url;
  });

const PixScreen = ({ pixData, total, onIrAcompanhar, manual = false, pedidoId }) => {
  const [copiado, setCopiado] = useState(false);
  const [comprovantePreview, setComprovantePreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erroUpload, setErroUpload] = useState(null);
  const fileInputRef = React.useRef(null);

  const copiar = () => {
    navigator.clipboard.writeText(pixData.pix_code).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const base64 = await comprimirImagem(file);
    setComprovantePreview(base64);
    setErroUpload(null);
    setEnviando(true);
    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;
      const res = await fetch(apiPath(`/api/pedidos/${pedidoId}/comprovante`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64 }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message ?? `HTTP ${res.status}`);
      setEnviado(true);
    } catch (err) {
      setErroUpload(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white dark:bg-[#27272A] rounded-3xl border border-[#E4E4E7] dark:border-[#3F3F46] shadow-lg p-6 text-center space-y-5"
      >
        <div className="w-14 h-14 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto">
          <Icon name="QrCode" size={28} className="text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">PIX gerado!</h1>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">Escaneie o QR code ou copie o código</p>
          <p className="text-2xl font-bold text-[#FF441F] mt-1">{fmt(total)}</p>
        </div>
        {pixData.pix_qr_url && (
          <img src={pixData.pix_qr_url} alt="QR Code PIX"
            className="w-48 h-48 mx-auto border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl object-contain" />
        )}

        {manual && (
          <div className="space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoChange} />
            {comprovantePreview ? (
              <div className="relative">
                <img src={comprovantePreview} alt="Comprovante" className="w-full max-h-40 object-cover rounded-xl border-2 border-green-300 dark:border-green-700" />
                {enviando && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">Enviando...</p>}
                {enviado && <p className="text-xs text-green-700 dark:text-green-400 mt-1 font-semibold">✓ Comprovante anexado</p>}
                {erroUpload && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{erroUpload}</p>}
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                <Icon name="Camera" size={16} /> Anexar comprovante do pagamento
              </button>
            )}
          </div>
        )}

        {pixData.pix_code && (
          <div className="space-y-2">
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Código PIX (copia e cola)</p>
            <div className="bg-[#F4F4F5] dark:bg-[#3F3F46] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-3 text-xs font-mono text-[#27272A] dark:text-[#F4F4F5] break-all text-left max-h-24 overflow-y-auto">
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
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400 text-left">
          {manual
            ? 'Pague com o app do seu banco. O pagamento será confirmado pelo motoboy na entrega.'
            : 'Após o pagamento, seu pedido é confirmado automaticamente. Válido por 24h.'}
        </div>
        <button onClick={onIrAcompanhar}
          className="w-full py-3 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl text-sm font-semibold text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
          Acompanhar pedido
        </button>
      </motion.div>
    </div>
  );
};

/* ── Step 1: Itens ───────────────────────────────────────────────── */
const StepItens = ({ itens, setItens, onNext, subtotal, frete, excedente, total }) => {
  const remover = (id) => setItens((p) => p.filter((i) => i.id !== id));
  const altQtd = (id, delta) =>
    setItens((p) => p.map((i) => i.id === id ? { ...i, qtd: i.qtd + delta } : i).filter((i) => i.qtd > 0));

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 space-y-3">
        {itens.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">{item.name}</p>
              <p className="text-xs text-[#FF441F] font-medium">{fmt(item.price)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => altQtd(item.id, -1)}
                className="w-7 h-7 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-full font-bold text-[#27272A] dark:text-[#F4F4F5] flex items-center justify-center hover:bg-[#E4E4E7] dark:hover:bg-[#52525B] text-base">
                −
              </button>
              <span className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] w-4 text-center">{item.qtd}</span>
              <button onClick={() => altQtd(item.id, +1)}
                className="w-7 h-7 bg-[#FF441F] rounded-full font-bold text-white flex items-center justify-center hover:bg-[#E63A19] text-base">
                +
              </button>
              <button onClick={() => remover(item.id)} className="ml-1 p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-red-500">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal + frete + total */}
      <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] px-4 py-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#71717A] dark:text-[#A1A1AA]">Subtotal ({itens.reduce((a, i) => a + i.qtd, 0)} itens)</span>
          <span className="font-medium text-[#18181B] dark:text-[#F4F4F5]">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1">
            <Icon name="Truck" size={13} /> Frete motoboy
          </span>
          <span className="font-medium text-[#18181B] dark:text-[#F4F4F5]">{fmt(frete)}</span>
        </div>
        {excedente?.distanciaKm != null && (
          <div className="flex justify-between text-sm">
            <span className="text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1">
              <Icon name="MapPin" size={13} /> Excedente distância ({excedente.distanciaKm}km)
            </span>
            <span className="font-medium text-[#18181B] dark:text-[#F4F4F5]">{fmt(excedente.valorExcedente)}</span>
          </div>
        )}
        <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] pt-2 flex justify-between font-bold">
          <span className="text-[#18181B] dark:text-[#F4F4F5]">Total</span>
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
const StepPagamento = ({ paymentMethod, setPaymentMethod, cpf, setCpf, trocoPara, setTrocoPara, subtotal, frete, excedente, total, onNext, onBack, pagamentoManual = false, chavePix = null }) => (
  <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
    {/* Resumo do valor — sempre visível */}
    <div className="bg-[#18181B] dark:bg-[#3F3F46] rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
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
      {excedente?.distanciaKm != null && (
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[#A1A1AA] uppercase tracking-widest font-bold">Excedente ({excedente.distanciaKm}km)</span>
          <span className="text-sm font-semibold text-white">{fmt(excedente.valorExcedente)}</span>
        </div>
      )}
      <div className="flex flex-col items-end">
        <span className="text-[10px] text-[#FF441F] uppercase tracking-widest font-bold">Total</span>
        <span className="text-lg font-black text-white">{fmt(total)}</span>
      </div>
    </div>

    <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
      <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-3">Forma de pagamento</p>
      <div className="space-y-2">
        {PAYMENT_OPTIONS.map((op) => {
          const pixIndisponivel = pagamentoManual && op.key === 'pix' && !chavePix;
          return (
            <button key={op.key} onClick={() => !pixIndisponivel && setPaymentMethod(op.key)}
              disabled={pixIndisponivel}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                pixIndisponivel
                  ? 'border-[#E4E4E7] dark:border-[#3F3F46] opacity-50 cursor-not-allowed'
                  : paymentMethod === op.key
                    ? 'border-[#FF441F] bg-[#FF441F]/5'
                    : 'border-[#E4E4E7] dark:border-[#3F3F46] hover:border-[#FF441F]/40'
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                paymentMethod === op.key && !pixIndisponivel ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'
              }`}>
                <Icon name={op.icon} size={18} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${paymentMethod === op.key && !pixIndisponivel ? 'text-[#FF441F]' : 'text-[#18181B] dark:text-[#F4F4F5]'}`}>
                  {op.label}
                </p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {pixIndisponivel
                    ? 'Indisponível — restaurante não configurou chave PIX'
                    : pagamentoManual && op.key !== 'cash' ? 'Combinado na entrega' : op.desc}
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                paymentMethod === op.key && !pixIndisponivel ? 'border-[#FF441F] bg-[#FF441F]' : 'border-[#E4E4E7] dark:border-[#3F3F46]'
              }`}>
                {paymentMethod === op.key && !pixIndisponivel && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* CPF para PIX */}
      <AnimatePresence>
        {paymentMethod === 'pix' && !pagamentoManual && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
              <label className="block text-sm font-medium text-[#27272A] dark:text-[#F4F4F5] mb-1.5">
                CPF do pagador <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/30 focus:border-[#FF441F]"
              />
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">Necessário para gerar o código PIX</p>
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
            <div className="mt-4 pt-4 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
              <label className="block text-sm font-medium text-[#27272A] dark:text-[#F4F4F5] mb-1.5">
                Com quanto vai pagar? <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal">(para troco)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#71717A] dark:text-[#A1A1AA] font-medium">R$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={trocoPara}
                  onChange={(e) => setTrocoPara(e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/30 focus:border-[#FF441F]"
                />
              </div>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">Deixe em branco se pagar o valor exato</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    <div className="flex gap-3">
      <button onClick={onBack}
        className="flex-1 py-3.5 border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] font-semibold rounded-2xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] transition-colors text-sm">
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
const StepConfirmar = ({ itens, paymentMethod, trocoPara, subtotal, frete, excedente, total, perfil, retirada, loading, erro, onConfirmar, onBack }) => {
  const payOpt = PAYMENT_OPTIONS.find((o) => o.key === paymentMethod);
  const addr = perfil?.address_json ?? {};
  const linhaRua = [addr.logradouro, addr.numero].filter(Boolean).join(', ');
  const linhaCompl = [addr.complemento, addr.bairro].filter(Boolean).join(' — ');
  const linhaCidade = [addr.cidade, addr.estado].filter(Boolean).join(', ');
  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
      {/* Endereço entrega / retirada */}
      {retirada ? (
        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] px-4 py-3 flex items-start gap-3">
          <div className="w-9 h-9 bg-green-50 dark:bg-green-950/40 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="Store" size={16} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">Retirar no balcão — <span className="text-[#18181B] dark:text-[#F4F4F5]">{perfil?.name}</span></p>
            {perfil?.phone_e164 && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{perfil.phone_e164}</p>}
          </div>
        </div>
      ) : perfil && (
        <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] px-4 py-3 flex items-start gap-3">
          <div className="w-9 h-9 bg-[#FF441F]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="MapPin" size={16} className="text-[#FF441F]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">Entregar para: <span className="text-[#18181B] dark:text-[#F4F4F5]">{perfil.name}</span></p>
            {linhaRua && <p className="text-sm text-[#18181B] dark:text-[#F4F4F5] font-medium mt-0.5">{linhaRua}</p>}
            {linhaCompl && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{linhaCompl}</p>}
            {linhaCidade && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{linhaCidade}</p>}
            {perfil.phone_e164 && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{perfil.phone_e164}</p>}
          </div>
        </div>
      )}
      {/* Itens resumo */}
      <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
        <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-3">Resumo do pedido</p>
        <div className="space-y-2">
          {itens.map((i) => (
            <div key={i.id} className="flex justify-between text-sm">
              <span className="text-[#71717A] dark:text-[#A1A1AA]">{i.name} × {i.qtd}</span>
              <span className="text-[#27272A] dark:text-[#F4F4F5] font-medium">{fmt(i.price * i.qtd)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm">
            <span className="text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1">
              <Icon name={retirada ? 'Store' : 'Truck'} size={13} /> {retirada ? 'Retirada no balcão' : 'Frete motoboy'}
            </span>
            <span className={`font-medium ${retirada ? 'text-green-600' : 'text-[#27272A] dark:text-[#F4F4F5]'}`}>
              {retirada ? 'Grátis' : fmt(frete)}
            </span>
          </div>
          {excedente?.distanciaKm != null && (
            <div className="flex justify-between text-sm">
              <span className="text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1">
                <Icon name="MapPin" size={13} /> Excedente distância ({excedente.distanciaKm}km)
              </span>
              <span className="font-medium text-[#27272A] dark:text-[#F4F4F5]">{fmt(excedente.valorExcedente)}</span>
            </div>
          )}
          <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] pt-2 flex justify-between font-bold">
            <span className="text-[#18181B] dark:text-[#F4F4F5]">Total</span>
            <span className="text-[#FF441F] text-lg">{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Pagamento */}
      <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#FF441F]/10 rounded-xl flex items-center justify-center">
          <Icon name={payOpt?.icon ?? 'CreditCard'} size={18} className="text-[#FF441F]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">{payOpt?.label}</p>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{payOpt?.desc}</p>
          {paymentMethod === 'cash' && trocoPara > 0 && (
            <p className="text-xs text-[#27272A] dark:text-[#F4F4F5] mt-0.5">
              Pagará {fmt(trocoPara)} · Troco: {fmt(Math.max(0, trocoPara - total))}
            </p>
          )}
        </div>
      </div>

      {erro && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {erro}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3.5 border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] font-semibold rounded-2xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] transition-colors text-sm">
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

  const { carrinho = [], restauranteId, restauranteSlug, freteMotoboy = 0, pagamentoManual = false, chavePix = null, restauranteNome = null, permiteRetiradaBalcao = false } = restored;

  const [itens, setItens] = useState(carrinho);
  const [perfil, setPerfil] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [cpf, setCpf] = useState('');
  const [trocoPara, setTrocoPara] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [pixData, setPixData] = useState(null);
  const [pixManual, setPixManual] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [etapa, setEtapa] = useState(0); // 0=endereço 1=itens 2=pagamento 3=confirmar
  const [excedente, setExcedente] = useState(null); // { distanciaKm, valorExcedente } | null
  const [calculandoDistancia, setCalculandoDistancia] = useState(false);
  const [retirada, setRetirada] = useState(false); // true = retirar no balcão, sem frete

  useEffect(() => {
    getPerfil().then(setPerfil).catch(() => {});
  }, []);

  // Preview do excedente de km assim que o endereço é salvo — o backend recalcula
  // tudo de novo (autoritativo) na hora de criar o pedido, isso aqui é só pra
  // mostrar o valor pro cliente antes de confirmar. Aguardado (não fire-and-forget)
  // pra já aparecer confirmado assim que o passo seguinte abrir.
  const buscarEstimativaExcedente = async () => {
    if (!restauranteId) return;
    setCalculandoDistancia(true);
    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;
      if (!token) return;
      const res = await fetch(apiPath(`/api/pedidos/estimativa-frete?restaurant_id=${restauranteId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setExcedente(data);
    } catch {
    } finally {
      setCalculandoDistancia(false);
    }
  };

  const frete = retirada ? 0 : (parseFloat(freteMotoboy) || 0);
  const subtotal = itens.reduce((acc, i) => acc + i.price * i.qtd, 0);
  const total = subtotal + frete + (retirada ? 0 : (excedente?.valorExcedente ?? 0));

  const irParaStep = (n) => { setErro(null); setEtapa(n); };

  const validarPagamento = () => {
    if (!pagamentoManual && paymentMethod === 'pix' && cpf.replace(/\D/g, '').length !== 11) {
      setErro('CPF inválido. Informe os 11 dígitos para gerar o PIX.');
      return false;
    }
    if (pagamentoManual && paymentMethod === 'pix' && !chavePix) {
      setErro('PIX indisponível — o restaurante não configurou uma chave PIX. Escolha outra forma de pagamento.');
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
      const resP = await fetch(apiPath('/api/pedidos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          restaurant_id: restauranteId,
          payment_method: paymentMethod,
          troco_para: paymentMethod === 'cash' && trocoParsed > 0 ? trocoParsed : undefined,
          itens: itens.map((i) => (i.tipo === 'combo' ? { combo_id: i.id, quantity: i.qtd } : { product_id: i.id, quantity: i.qtd })),
          retirada_balcao: retirada,
        }),
      });
      const pedido = await resP.json();
      if (!resP.ok) throw new Error(pedido?.message ?? `HTTP ${resP.status}`);

      const newOrderId = pedido.pedido?.id ?? pedido.id;
      setOrderId(newOrderId);

      if (pagamentoManual && paymentMethod === 'pix' && chavePix) {
        // Modo manual: QR gerado localmente com a chave PIX cadastrada, sem chamar a
        // API do PagBank — o motoboy confirma o recebimento na entrega.
        const payload = gerarPixPayload({ chave: chavePix, nome: restauranteNome, cidade: null, valor: total, txid: `ped${newOrderId}` });
        setPixManual(true);
        setPixData({ pix_code: payload, pix_qr_url: qrCodeUrl(payload) });
        return;
      }

      if (!pagamentoManual && paymentMethod === 'pix') {
        const user = (await supabase.auth.getUser())?.data?.user;
        const resPix = await fetch(apiPath('/api/pagamentos/pix'), {
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
        manual={pixManual}
        pedidoId={orderId}
        onIrAcompanhar={() =>
          navigate('/order-tracking-status', { state: { orderId, restauranteSlug }, replace: true })
        }
      />
    );
  }

  if (itens.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B] flex flex-col items-center justify-center p-6 text-center">
        <Icon name="ShoppingCart" size={52} className="text-[#E4E4E7] dark:text-[#3F3F46] mb-4" />
        <p className="text-[#27272A] dark:text-[#F4F4F5] font-semibold text-lg">Carrinho vazio</p>
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      {/* Header */}
      <header className="bg-white dark:bg-[#27272A] border-b border-[#E4E4E7] dark:border-[#3F3F46] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => etapa > 0 ? irParaStep(etapa - 1) : navigate(restauranteSlug ? `/r/${restauranteSlug}` : -1)}
          className="p-2 rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]"
        >
          <Icon name="ArrowLeft" size={20} className="text-[#27272A] dark:text-[#F4F4F5]" />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">Finalizar Pedido</h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{LABELS_ETAPA[etapa]}</p>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white dark:bg-[#27272A] border-b border-[#E4E4E7] dark:border-[#3F3F46]">
        <div className="max-w-lg mx-auto">
          <ProgressBar etapa={etapa} total={4} />
          <div className="flex justify-between px-4 pb-2">
            {LABELS_ETAPA.map((l, i) => (
              <span key={i} className={`text-[10px] font-medium ${i === etapa ? 'text-[#FF441F]' : 'text-[#71717A] dark:text-[#A1A1AA]'}`}>
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
            <StepEndereco
              key="endereco"
              perfil={perfil}
              restauranteId={restauranteId}
              permiteRetirada={permiteRetiradaBalcao}
              retirada={retirada}
              setRetirada={setRetirada}
              onNext={async (updated) => { setPerfil(updated); if (!retirada) await buscarEstimativaExcedente(); irParaStep(1); }}
              onBack={() => navigate(restauranteSlug ? `/r/${restauranteSlug}` : -1)}
            />
          )}
          {etapa === 1 && (
            <StepItens
              key="itens"
              itens={itens}
              setItens={setItens}
              subtotal={subtotal}
              frete={frete}
              excedente={excedente}
              total={total}
              onNext={() => irParaStep(2)}
            />
          )}
          {etapa === 2 && (
            <StepPagamento
              key="pagamento"
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cpf={cpf}
              setCpf={setCpf}
              pagamentoManual={pagamentoManual}
              chavePix={chavePix}
              trocoPara={trocoPara}
              setTrocoPara={setTrocoPara}
              subtotal={subtotal}
              frete={frete}
              excedente={excedente}
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
              excedente={excedente}
              total={total}
              perfil={perfil}
              retirada={retirada}
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
      pagamentoManual: !!grupo.pagamento_manual,
      chavePix: grupo.chave_pix ?? null,
      restauranteNome: grupo.nome ?? null,
    }));
    cartClear();
    return <SingleCartCheckout />;
  }

  // 2+ restaurants → MultiCartCheckout (cash only)
  if (groups.length > 1) return <MultiCartCheckout />;

  return <SingleCartCheckout />;
};

export default ShoppingCartCheckout;
