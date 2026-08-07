import React, { useState, useEffect, useCallback } from 'react';
import { getMeuPlano, getFaturaDetalhe, pagarFatura, renovarPlanoAgora, getPlanosDisponiveis, assinarPlano, getPagBankChavePublica } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—';

const STATUS_LABEL = {
  trial: { label: 'Período grátis', cls: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
  ativa: { label: 'Ativa', cls: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' },
  cancelada: { label: 'Cancelada', cls: 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400' },
  pendente: { label: 'Pendente', cls: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
  paga: { label: 'Paga', cls: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' },
  vencida: { label: 'Vencida', cls: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' },
  isenta: { label: 'Isenta', cls: 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400' },
};

const Badge = ({ status }) => {
  const s = STATUS_LABEL[status] ?? { label: status, cls: 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
};

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

const PagamentoModal = ({ fatura, onClose, onPago }) => {
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

const PlanosDisponiveisModal = ({ planoAtualId, onClose, onEscolher }) => {
  const [planos, setPlanos] = useState(null);
  const [erro, setErro] = useState(null);
  const [escolhendoId, setEscolhendoId] = useState(null);

  useEffect(() => {
    getPlanosDisponiveis()
      .then((d) => setPlanos(d.planos ?? []))
      .catch((e) => setErro(e.message));
  }, []);

  const handleEscolher = async (plano) => {
    if (plano.id === planoAtualId) return;
    if (!window.confirm(`Pagar ${fmt(plano.valor)} pra trocar pro plano "${plano.nome}"? A troca só vale depois do pagamento confirmado.`)) return;
    setEscolhendoId(plano.id);
    setErro(null);
    try {
      const fatura = await assinarPlano(plano.id);
      onEscolher(fatura);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEscolhendoId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#27272A] rounded-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#18181B] dark:text-[#F4F4F5]">Escolha um plano</h3>
          <button onClick={onClose} className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            <Icon name="X" size={18} />
          </button>
        </div>

        {erro && <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg p-3 mb-3">{erro}</p>}

        {!planos ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {planos.map((p) => {
              const atual = p.id === planoAtualId;
              return (
                <div key={p.id} className={`border rounded-xl p-4 ${atual ? 'border-[#FF441F] bg-[#FF441F]/5' : 'border-[#E4E4E7] dark:border-[#3F3F46]'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{p.nome}</h4>
                    {atual && <span className="text-xs font-semibold text-[#FF441F] bg-[#FF441F]/10 px-2 py-0.5 rounded-full">Plano atual</span>}
                  </div>
                  <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-2">{fmt(p.valor)} / {p.periodicidade}</p>
                  <div className="flex gap-1.5 mb-3">
                    {p.inclui_delivery && <span className="text-xs font-medium bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">Delivery</span>}
                    {p.inclui_salao && <span className="text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">Salão</span>}
                    <span className="text-xs font-medium bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
                      {p.limite_produtos != null ? `Até ${p.limite_produtos} produtos` : 'Produtos ilimitados'}
                    </span>
                  </div>
                  {!atual && (
                    <button
                      onClick={() => handleEscolher(p)}
                      disabled={escolhendoId === p.id}
                      className="w-full py-2 bg-[#FF441F] hover:bg-[#E63A19] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {escolhendoId === p.id ? 'Gerando cobrança...' : `Assinar — pagar ${fmt(p.valor)}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const RestaurantePlano = () => {
  const { refreshPlanoStatus } = useAuth();
  const [dados, setDados] = useState(null);
  const [semPlano, setSemPlano] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [faturaPagando, setFaturaPagando] = useState(null);
  const [renovando, setRenovando] = useState(false);
  const [mostrarPlanos, setMostrarPlanos] = useState(false);

  const handleRenovar = async () => {
    setRenovando(true);
    try {
      const r = await renovarPlanoAgora();
      carregar();
      refreshPlanoStatus?.();
      if (r?.fatura_pendente_id) {
        const fatura = await getFaturaDetalhe(r.fatura_pendente_id);
        setFaturaPagando(fatura);
      } else {
        alert('Nada a pagar neste período — faturamento abaixo do piso configurado no plano.');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setRenovando(false);
    }
  };

  const carregar = useCallback(() => {
    setLoading(true);
    setSemPlano(false);
    getMeuPlano()
      .then((d) => setDados(d))
      .catch((e) => {
        if (e?.data?.statusCode === 404 || /não tem assinatura/i.test(e.message ?? '')) {
          setSemPlano(true);
        } else {
          setErro(e.message);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { refreshPlanoStatus?.(); }, [refreshPlanoStatus]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/plano" title="Meu Plano" subtitle="Assinatura, limites e faturas" />

      <main className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : erro ? (
          <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 rounded-xl p-4">{erro}</p>
        ) : semPlano ? (
          <div className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-10 text-center">
            <Icon name="CreditCard" size={40} className="text-[#E4E4E7] dark:text-[#3F3F46] mx-auto mb-3" />
            <p className="text-[#18181B] dark:text-[#F4F4F5] font-semibold mb-1">Nenhum plano atribuído</p>
            <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Fale com o suporte da plataforma pra ativar um plano de assinatura na sua loja.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {dados.bloqueado && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 flex items-start gap-3">
                <Icon name="AlertTriangle" size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">Painel bloqueado por atraso</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    Fatura vencida há {dados.dias_atraso} dia(s). Pague abaixo pra liberar o acesso completo ao painel.
                  </p>
                </div>
              </div>
            )}

            {/* Plano atual */}
            <div className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{dados.assinatura?.planos?.nome ?? dados.plano_nome}</h2>
                <Badge status={dados.assinatura?.status} />
              </div>
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">
                  {fmt(dados.assinatura?.planos?.valor)} / {dados.assinatura?.planos?.periodicidade}
                  {dados.assinatura?.trial_fim && dados.assinatura?.status === 'trial' && (
                    <> · grátis até {fmtData(dados.assinatura.trial_fim)}</>
                  )}
                </p>
                <button
                  onClick={() => setMostrarPlanos(true)}
                  className="text-xs font-semibold text-[#FF441F] hover:underline flex-shrink-0"
                >
                  Upgrade de plano
                </button>
              </div>

              <div className="flex gap-1.5 mb-4">
                {dados.assinatura?.planos?.inclui_delivery && (
                  <span className="text-xs font-medium bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                    Delivery
                  </span>
                )}
                {dados.assinatura?.planos?.inclui_salao && (
                  <span className="text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
                    Salão
                  </span>
                )}
              </div>

              {/* Uso de produtos */}
              <div>
                <div className="flex items-center justify-between text-xs text-[#71717A] dark:text-[#A1A1AA] mb-1">
                  <span>Produtos cadastrados</span>
                  <span>
                    {dados.produtos_ativos}
                    {dados.limite_produtos != null ? ` / ${dados.limite_produtos}` : ' (ilimitado)'}
                  </span>
                </div>
                {dados.limite_produtos != null && (
                  <div className="w-full h-2 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dados.produtos_ativos >= dados.limite_produtos ? 'bg-red-500' : 'bg-[#FF441F]'}`}
                      style={{ width: `${Math.min(100, (dados.produtos_ativos / dados.limite_produtos) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {dados.assinatura?.status !== 'cancelada' && (
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#E4E4E7] dark:border-[#3F3F46]">
                  <div>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Próxima cobrança</p>
                    <p className="text-sm font-medium text-[#18181B] dark:text-[#F4F4F5]">{fmtData(dados.proxima_cobranca)}</p>
                  </div>
                  <button
                    onClick={handleRenovar}
                    disabled={renovando}
                    className="px-3 py-1.5 text-xs font-semibold text-[#FF441F] border border-[#FF441F]/30 hover:bg-[#FF441F]/5 rounded-lg disabled:opacity-50"
                  >
                    {renovando ? 'Renovando...' : 'Renovar agora'}
                  </button>
                </div>
              )}
            </div>

            {/* Faturas */}
            <div className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
              <h2 className="font-semibold text-[#18181B] dark:text-[#F4F4F5] px-6 pt-5 pb-3">Faturas</h2>
              {dados.faturas.length === 0 ? (
                <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] px-6 pb-5">Nenhuma fatura gerada ainda.</p>
              ) : (
                <div className="divide-y divide-[#E4E4E7] dark:divide-[#3F3F46]">
                  {dados.faturas.map((f) => (
                    <div key={f.id} className="px-6 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#18181B] dark:text-[#F4F4F5]">{fmtData(f.periodo_inicio)} – {fmtData(f.periodo_fim)}</p>
                        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Vencimento {fmtData(f.vencimento)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">{fmt(f.valor)}</span>
                        <Badge status={f.status} />
                        {(f.status === 'pendente' || f.status === 'vencida') && (
                          <button
                            onClick={() => setFaturaPagando(f)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#FF441F] hover:bg-[#E63A19] rounded-lg"
                          >
                            Pagar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {faturaPagando && (
        <PagamentoModal
          fatura={faturaPagando}
          onClose={() => setFaturaPagando(null)}
          onPago={() => { setFaturaPagando(null); carregar(); refreshPlanoStatus?.(); }}
        />
      )}

      {mostrarPlanos && (
        <PlanosDisponiveisModal
          planoAtualId={dados?.assinatura?.plano_id}
          onClose={() => setMostrarPlanos(false)}
          onEscolher={(fatura) => { setMostrarPlanos(false); setFaturaPagando(fatura); }}
        />
      )}
    </div>
  );
};

export default RestaurantePlano;
