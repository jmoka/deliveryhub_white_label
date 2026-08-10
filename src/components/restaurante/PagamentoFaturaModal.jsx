import React, { useState, useEffect } from 'react';
import { getFaturaDetalhe, pagarFatura, getPagBankChavePublica } from '../../services/restauranteService';
import Icon from '../AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const PAGBANK_SDK_URL = 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js';

// Carrega o PagBank.js uma única vez (compartilhado entre aberturas do modal)
const usePagBankSdk = (ativo) => {
  const [pronto, setPronto] = useState(!!window.PagSeguro);

  useEffect(() => {
    if (!ativo || window.PagSeguro) { if (window.PagSeguro) setPronto(true); return; }
    let script = document.querySelector(`script[src="${PAGBANK_SDK_URL}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = PAGBANK_SDK_URL;
      script.async = true;
      document.body.appendChild(script);
    }
    const onLoad = () => setPronto(!!window.PagSeguro);
    script.addEventListener('load', onLoad);
    if (window.PagSeguro) setPronto(true);
    return () => script.removeEventListener('load', onLoad);
  }, [ativo]);

  return pronto;
};

const CARTAO_INICIAL = { numero: '', validade: '', cvv: '', parcelas: 1 };

// Modal de pagamento de uma fatura (Pix ou cartão débito/crédito via PagBank.js).
// Compartilhado entre a troca de plano (/restaurante/plano) e o checkout inicial
// do cadastro de restaurante.
const PagamentoFaturaModal = ({ fatura, onClose, onPago }) => {
  const [metodo, setMetodo] = useState('pix'); // 'pix' | 'credit_card' | 'debit_card'
  const [form, setForm] = useState({ nome: '', email: '', cpf_cnpj: '' });
  const [cartao, setCartao] = useState(CARTAO_INICIAL);
  const [resultado, setResultado] = useState(
    fatura.pix_code ? { pix_code: fatura.pix_code, pix_qr_url: fatura.pix_qr_url } : null
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [pago, setPago] = useState(false);

  const sdkPronto = usePagBankSdk(metodo !== 'pix');

  useEffect(() => {
    if (!resultado || pago || metodo !== 'pix') return;
    const interval = setInterval(() => {
      getFaturaDetalhe(fatura.id)
        .then((f) => {
          if (f.status === 'paga') {
            setPago(true);
            clearInterval(interval);
            setTimeout(onPago, 1500);
          }
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [resultado, pago, fatura.id, onPago, metodo]);

  const handleSubmitPix = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const r = await pagarFatura(fatura.id, { ...form, metodo: 'pix' });
      setResultado(r);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmitCartao = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      if (!window.PagSeguro) throw new Error('PagBank ainda carregando, tente de novo em instantes.');

      const digitos = cartao.validade.replace(/\D/g, '');
      const mes = digitos.slice(0, 2);
      const ano = digitos.slice(2, 4);
      const mesNum = Number(mes);
      if (digitos.length !== 4 || mesNum < 1 || mesNum > 12) {
        throw new Error('Validade inválida — use o formato MM/AA');
      }
      const anoCompleto = `20${ano}`;

      const { public_key } = await getPagBankChavePublica();

      const card = window.PagSeguro.encryptCard({
        publicKey: public_key,
        holder: form.nome,
        number: cartao.numero.replace(/\s/g, ''),
        expMonth: mes,
        expYear: anoCompleto,
        securityCode: cartao.cvv,
      });

      if (card.hasErrors) {
        throw new Error(card.errors?.[0]?.message ?? 'Dados do cartão inválidos');
      }

      const r = await pagarFatura(fatura.id, {
        ...form,
        metodo,
        card_encrypted: card.encryptedCard,
        parcelas: metodo === 'credit_card' ? Number(cartao.parcelas) : 1,
      });
      if (r?.pago) {
        setPago(true);
        setTimeout(onPago, 1500);
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const copiar = () => navigator.clipboard?.writeText(resultado.pix_code);

  const TabButton = ({ valor, label }) => (
    <button
      type="button"
      onClick={() => { setMetodo(valor); setErro(null); }}
      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
        metodo === valor
          ? 'bg-[#FF441F] text-white'
          : 'bg-[#F4F4F5] dark:bg-[#18181B] text-[#71717A] dark:text-[#A1A1AA]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#27272A] rounded-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        {pago ? (
          <div className="text-center py-4">
            <Icon name="CheckCircle2" size={40} className="text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">Pagamento confirmado!</p>
          </div>
        ) : resultado ? (
          <div className="text-center">
            <h3 className="font-bold text-[#18181B] dark:text-[#F4F4F5] mb-3">Pague via Pix</h3>
            {resultado.pix_qr_url && (
              <img src={resultado.pix_qr_url} alt="QR Code Pix" className="w-48 h-48 mx-auto rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46]" />
            )}
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-3 mb-2">Ou copie o código:</p>
            <button onClick={copiar} className="w-full text-xs font-mono bg-[#F4F4F5] dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 break-all text-left">
              {resultado.pix_code}
            </button>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-3">Aguardando confirmação do pagamento...</p>
            <button onClick={onClose} className="mt-4 text-sm text-[#71717A] dark:text-[#A1A1AA] hover:underline">Fechar</button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-[#18181B] dark:text-[#F4F4F5] mb-3">Dados pra pagamento</h3>
            <div className="flex gap-1.5 mb-4">
              <TabButton valor="pix" label="Pix" />
              <TabButton valor="credit_card" label="Crédito" />
              <TabButton valor="debit_card" label="Débito" />
            </div>

            <form onSubmit={metodo === 'pix' ? handleSubmitPix : handleSubmitCartao} className="space-y-3">
              <input required placeholder="Nome completo" value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40" />
              <input required type="email" placeholder="E-mail" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40" />
              <input required placeholder="CPF ou CNPJ" value={form.cpf_cnpj}
                onChange={(e) => setForm((f) => ({ ...f, cpf_cnpj: e.target.value }))}
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40" />

              {metodo !== 'pix' && (
                <>
                  <input required placeholder="Número do cartão" inputMode="numeric" maxLength={19} value={cartao.numero}
                    onChange={(e) => setCartao((c) => ({ ...c, numero: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40" />
                  <div className="flex gap-2">
                    <input required placeholder="MM/AA" inputMode="numeric" maxLength={5} value={cartao.validade}
                      onChange={(e) => {
                        const digitos = e.target.value.replace(/\D/g, '').slice(0, 4);
                        const formatado = digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
                        setCartao((c) => ({ ...c, validade: formatado }));
                      }}
                      className="flex-1 min-w-0 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40" />
                    <input required placeholder="CVV" inputMode="numeric" maxLength={4} value={cartao.cvv}
                      onChange={(e) => setCartao((c) => ({ ...c, cvv: e.target.value }))}
                      className="flex-1 min-w-0 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40" />
                  </div>
                  {metodo === 'credit_card' && (
                    <select value={cartao.parcelas}
                      onChange={(e) => setCartao((c) => ({ ...c, parcelas: e.target.value }))}
                      className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}x {n === 1 ? 'à vista' : `de ${fmt(fatura.valor / n)}`}</option>
                      ))}
                    </select>
                  )}
                  {!sdkPronto && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Carregando PagBank...</p>}
                </>
              )}

              {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg text-sm text-[#71717A] dark:text-[#A1A1AA]">
                  Cancelar
                </button>
                <button type="submit" disabled={enviando || (metodo !== 'pix' && !sdkPronto)}
                  className="flex-1 py-2 bg-[#FF441F] text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  {enviando ? 'Processando...' : metodo === 'pix' ? 'Gerar Pix' : 'Pagar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PagamentoFaturaModal;
