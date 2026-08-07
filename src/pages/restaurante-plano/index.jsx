import React, { useState, useEffect, useCallback } from 'react';
import { getMeuPlano, getFaturaDetalhe, pagarFatura, renovarPlanoAgora } from '../../services/restauranteService';
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

const PagamentoModal = ({ fatura, onClose, onPago }) => {
  const [form, setForm] = useState({ nome: '', email: '', cpf_cnpj: '' });
  const [resultado, setResultado] = useState(
    fatura.pix_code ? { pix_code: fatura.pix_code, pix_qr_url: fatura.pix_qr_url } : null
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [pago, setPago] = useState(false);

  useEffect(() => {
    if (!resultado || pago) return;
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
  }, [resultado, pago, fatura.id, onPago]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const r = await pagarFatura(fatura.id, form);
      setResultado(r);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const copiar = () => navigator.clipboard?.writeText(resultado.pix_code);

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
          <form onSubmit={handleSubmit} className="space-y-3">
            <h3 className="font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">Dados pra pagamento</h3>
            <input required placeholder="Nome completo" value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40" />
            <input required type="email" placeholder="E-mail" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40" />
            <input required placeholder="CPF ou CNPJ" value={form.cpf_cnpj}
              onChange={(e) => setForm((f) => ({ ...f, cpf_cnpj: e.target.value }))}
              className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40" />
            {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg text-sm text-[#71717A] dark:text-[#A1A1AA]">
                Cancelar
              </button>
              <button type="submit" disabled={enviando}
                className="flex-1 py-2 bg-[#FF441F] text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {enviando ? 'Gerando...' : 'Gerar Pix'}
              </button>
            </div>
          </form>
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
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-2">
                {fmt(dados.assinatura?.planos?.valor)} / {dados.assinatura?.planos?.periodicidade}
                {dados.assinatura?.trial_fim && dados.assinatura?.status === 'trial' && (
                  <> · grátis até {fmtData(dados.assinatura.trial_fim)}</>
                )}
              </p>

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
    </div>
  );
};

export default RestaurantePlano;
