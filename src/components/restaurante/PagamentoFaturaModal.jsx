import React, { useState, useEffect, useRef } from 'react';
import {
  getFaturaDetalhe, pagarFatura, getPagBankChavePublica, getConfigPagamentoFatura,
  uploadComprovanteFatura, pularComprovanteFatura,
} from '../../services/restauranteService';
import { usePagBankSdk } from '../../hooks/usePagBankSdk';
import { gerarPixPayload, qrCodeUrl } from '../../utils/pixQrCode';
import { comprimirImagem } from '../../utils/imageCompress';
import Icon from '../AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const CARTAO_INICIAL = { numero: '', validade: '', cvv: '', parcelas: 1 };

// Modal de pagamento de uma fatura (Pix ou cartão débito/crédito via PagBank.js).
// Compartilhado entre a troca de plano (/restaurante/plano), o checkout inicial
// do cadastro de restaurante, e qualquer outra cobrança avulsa da plataforma
// (ex.: marketplace boost) via os overrides pagarFn/buscarStatusFn/chavePublicaFn
// — o objeto passado em `fatura` só precisa ter `id`, `valor` (em reais),
// `pix_code`/`pix_qr_url` opcionais.
const PagamentoFaturaModal = ({
  fatura, onClose, onPago,
  pagarFn = pagarFatura, buscarStatusFn = getFaturaDetalhe, chavePublicaFn = getPagBankChavePublica,
}) => {
  const [metodo, setMetodo] = useState('pix'); // 'pix' | 'credit_card' | 'debit_card'
  const [form, setForm] = useState({ nome: '', email: '', cpf_cnpj: '' });
  const [cartao, setCartao] = useState(CARTAO_INICIAL);
  const [resultado, setResultado] = useState(
    fatura.pix_code ? { pix_code: fatura.pix_code, pix_qr_url: fatura.pix_qr_url } : null
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [pago, setPago] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [configFaturamento, setConfigFaturamento] = useState(null);
  const [comprovantePreview, setComprovantePreview] = useState(null);
  const [enviandoComprovante, setEnviandoComprovante] = useState(false);
  const [comprovanteEnviado, setComprovanteEnviado] = useState(false);
  const [erroUpload, setErroUpload] = useState(null);
  const [showAvisoComprovante, setShowAvisoComprovante] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getConfigPagamentoFatura().then(setConfigFaturamento).catch(() => {});
  }, []);

  // Recebimento manual = só Pix, sem nenhuma ligação real com o PagBank —
  // mesmo princípio já aplicado no checkout do cliente final.
  const modoManual = configFaturamento?.modo === 'manual';

  const sdkPronto = usePagBankSdk(!modoManual && metodo !== 'pix');

  useEffect(() => {
    if (!resultado || pago || metodo !== 'pix') return;
    const interval = setInterval(() => {
      buscarStatusFn(fatura.id)
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
      // Valida a fatura no backend (status pendente etc.) antes de montar o Pix —
      // em modo manual o backend não abre ordem nenhuma no PagBank, só confirma
      // que dá pra pagar; o código Pix é montado aqui com a chave da plataforma.
      const r = await pagarFn(fatura.id, { ...form, metodo: 'pix' });
      if (modoManual) {
        const payload = gerarPixPayload({
          chave: configFaturamento.chave_pix,
          nome: configFaturamento.nome_recebedor,
          cidade: null,
          valor: fatura.valor,
          txid: `fat${fatura.id}`,
        });
        setResultado({ pix_code: payload, pix_qr_url: qrCodeUrl(payload) });
      } else {
        setResultado(r);
      }
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

      const { public_key } = await chavePublicaFn();

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

      const r = await pagarFn(fatura.id, {
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

  const copiar = () => {
    navigator.clipboard?.writeText(resultado.pix_code).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  // Mesmo cutucão do checkout do cliente final: não trava quem prefere avisar
  // e mostrar o pagamento depois, só confere que a intenção foi explícita.
  const handleFechar = () => {
    if (modoManual && !comprovantePreview) { setShowAvisoComprovante(true); return; }
    onClose();
  };

  const handlePularComprovante = async () => {
    setShowAvisoComprovante(false);
    try {
      await pularComprovanteFatura(fatura.id);
    } catch {
      // não trava o dono por causa disso — é só um aviso pro admin
    }
    onClose();
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const base64 = await comprimirImagem(file);
    setComprovantePreview(base64);
    setErroUpload(null);
    setEnviandoComprovante(true);
    try {
      await uploadComprovanteFatura(fatura.id, base64);
      setComprovanteEnviado(true);
    } catch (err) {
      setErroUpload(err.message);
    } finally {
      setEnviandoComprovante(false);
    }
  };

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
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleFechar}>
      <div className="bg-white dark:bg-[#27272A] rounded-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        {pago ? (
          <div className="text-center py-4">
            <Icon name="CheckCircle2" size={40} className="text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">Pagamento confirmado!</p>
          </div>
        ) : resultado ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto">
              <Icon name="QrCode" size={28} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Pix gerado!</h3>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">Escaneie o QR code ou copie o código</p>
              <p className="text-2xl font-bold text-[#FF441F] mt-1">{fmt(fatura.valor)}</p>
              {!modoManual && (
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-2 flex items-center justify-center gap-1.5">
                  <Icon name="ShieldCheck" size={13} className="flex-shrink-0" />
                  Pagamento processado com segurança pelo PagBank
                </p>
              )}
            </div>
            {resultado.pix_qr_url && (
              <img src={resultado.pix_qr_url} alt="QR Code Pix" className="w-48 h-48 mx-auto rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] object-contain" />
            )}

            {modoManual && (
              <div className="space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoChange} />
                {comprovantePreview ? (
                  <div className="relative">
                    <img src={comprovantePreview} alt="Comprovante" className="w-full max-h-40 object-cover rounded-xl border-2 border-green-300 dark:border-green-700" />
                    {enviandoComprovante && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">Enviando...</p>}
                    {comprovanteEnviado && <p className="text-xs text-green-700 dark:text-green-400 mt-1 font-semibold">✓ Comprovante anexado</p>}
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

            <div className="space-y-2">
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Código PIX (copia e cola)</p>
              <div className="bg-[#F4F4F5] dark:bg-[#3F3F46] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-3 text-xs font-mono text-[#27272A] dark:text-[#F4F4F5] break-all text-left max-h-24 overflow-y-auto">
                {resultado.pix_code}
              </div>
              <button onClick={copiar}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  copiado ? 'bg-green-500 text-white' : 'bg-[#FF441F] hover:bg-[#E63A19] text-white'
                }`}>
                {copiado ? '✓ Copiado!' : 'Copiar código'}
              </button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400 text-left">
              {modoManual
                ? 'Após o pagamento, avise pra confirmarmos o recebimento manualmente.'
                : 'Após o pagamento, a fatura é confirmada automaticamente.'}
            </div>
            <button onClick={handleFechar} className="w-full py-3 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl text-sm font-semibold text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
              {modoManual ? 'Enviar o comprovante' : 'Fechar'}
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">Dados pra pagamento</h3>
            {fatura.comissao_valor > 0 && (
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-2">
                Total {fmt(fatura.valor)} — mensalidade {fmt(fatura.valor - fatura.comissao_valor)} + comissão {fmt(fatura.comissao_valor)}
              </p>
            )}
            <div className="flex gap-1.5 mb-4 mt-2">
              <TabButton valor="pix" label="Pix" />
              {!modoManual && <TabButton valor="credit_card" label="Crédito" />}
              {!modoManual && <TabButton valor="debit_card" label="Débito" />}
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

    {showAvisoComprovante && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <div className="w-full max-w-sm bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="AlertTriangle" size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-[#18181B] dark:text-[#F4F4F5]">Comprovante do pagamento não anexado</p>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
                Você pode anexar o comprovante agora, ou pular e avisar/confirmar o pagamento depois.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => { setShowAvisoComprovante(false); fileInputRef.current?.click(); }}
              className="w-full py-2.5 bg-[#FF441F] text-white font-bold text-sm rounded-xl hover:bg-[#E63A19] flex items-center justify-center gap-2">
              <Icon name="Camera" size={15} /> Anexar comprovante
            </button>
            <button
              onClick={handlePularComprovante}
              className="w-full py-2.5 border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] font-semibold text-sm rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
              Avisar/confirmar depois
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default PagamentoFaturaModal;
