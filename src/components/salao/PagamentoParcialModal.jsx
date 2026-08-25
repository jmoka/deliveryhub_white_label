import React from 'react';
import Icon from '../AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAGAMENTO_LABEL = { pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito', cash: 'Dinheiro' };
const FORMAS = [
  { id: 'pix', label: 'PIX', icon: 'Zap' },
  { id: 'credit_card', label: 'Crédito', icon: 'CreditCard' },
  { id: 'debit_card', label: 'Débito', icon: 'CreditCard' },
  { id: 'cash', label: 'Dinheiro', icon: 'Banknote' },
];

/* ── Seletor de forma de pagamento em botões grandes ────────────────── */
const FormaPagamentoBotoes = ({ value, onChange, disabled }) => (
  <div className="grid grid-cols-2 gap-2">
    {FORMAS.map((f) => (
      <button key={f.id} type="button" disabled={disabled} onClick={() => onChange(f.id)}
        className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
          value === f.id
            ? 'bg-[#FF441F] text-white'
            : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#E4E4E7] dark:hover:bg-[#52525B]'
        }`}>
        <Icon name={f.icon} size={16} />
        {f.label}
      </button>
    ))}
  </div>
);

/**
 * Modal compartilhado de pagamento parcial de comanda — usado tanto pelo app do
 * garçom quanto pelo painel do salão (dono/caixa). É um componente controlado:
 * cada tela mantém seu próprio state/handlers (registrar, editar, remover,
 * troco via Pix) exatamente como já fazia — aqui só fica o layout, ampliado
 * (números e botões grandes) pra facilitar digitar/ler no balcão.
 *
 * Handlers omitidos (onEditarPagamento/onRemoverPagamento/onAlterarTrocoPix)
 * escondem a ação correspondente — assim o app do garçom (que só edita os
 * próprios lançamentos) e o painel do salão (que corrige até comanda paga)
 * reaproveitam o mesmo modal sem vazar ação que não deveriam ter.
 */
const PagamentoParcialModal = ({
  onFechar,
  saldo,
  faltaPagar,
  totalPago,
  pagamentos = [],
  podeRegistrar,
  taxaCartaoPercentual = 0,

  valor, setValor,
  forma, setForma,
  valorRecebido, setValorRecebido,
  trocoViaPix, setTrocoViaPix,
  onRegistrar,
  salvando,
  erro,

  editandoId,
  valorEdicao, setValorEdicao,
  formaEdicao, setFormaEdicao,
  onIniciarEdicao,
  onSalvarEdicao,
  onCancelarEdicao,

  podeEditarPagamento,
  podeRemoverPagamento,
  podeTrocoPix,
  valorEdicaoDesabilitado,
  onRemoverPagamento,
  onAlterarTrocoPix,
}) => {
  const faltaPagarEfetivo = faltaPagar ?? saldo ?? 0;
  const totalPagoEfetivo = totalPago ?? pagamentos.reduce((acc, p) => acc + p.valor + (p.taxa_cartao_valor || 0), 0);
  const isCartao = forma === 'credit_card' || forma === 'debit_card';
  const taxaCartaoValor = isCartao ? parseFloat((Number(valor || 0) * (taxaCartaoPercentual / 100)).toFixed(2)) : 0;
  const troco = forma === 'cash' && valorRecebido ? Number(valorRecebido) - Number(valor || 0) : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[88vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 pb-4 border-b border-[#E4E4E7] dark:border-[#3F3F46] flex-shrink-0">
          <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Pagamento parcial</h2>
          <button onClick={onFechar} className="p-1.5 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5]">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto pl-5 pr-6 sm:pr-7 py-5 space-y-5">
          {/* Saldo devedor + já pago em destaque */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide mb-1">Saldo devedor</p>
              <p className={`text-2xl sm:text-3xl font-black ${(saldo ?? 0) > 0.01 ? 'text-[#FF441F]' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {fmt(saldo)}
              </p>
            </div>
            <div className="bg-[#FAFAFA] dark:bg-[#18181B] rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide mb-1">Já pago</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{fmt(totalPagoEfetivo)}</p>
            </div>
          </div>

          {/* Pagamentos já lançados */}
          {pagamentos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide">Já lançados</h3>
              {pagamentos.map((p) => (
                editandoId === p.id ? (
                  <div key={p.id} className="bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-xl p-3 space-y-2">
                    <input type="number" inputMode="decimal" value={valorEdicao} onChange={(e) => setValorEdicao(e.target.value)}
                      disabled={valorEdicaoDesabilitado}
                      className="w-full text-center text-2xl font-black bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl px-3 py-3 disabled:opacity-50" />
                    <FormaPagamentoBotoes value={formaEdicao} onChange={setFormaEdicao} />
                    <div className="flex gap-2">
                      <button onClick={onCancelarEdicao} className="flex-1 py-2.5 text-sm font-semibold text-[#71717A] dark:text-[#A1A1AA] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46]">
                        Cancelar
                      </button>
                      <button onClick={onSalvarEdicao} disabled={!valorEdicao || salvando}
                        className="flex-1 py-2.5 text-sm font-bold text-white bg-[#FF441F] rounded-xl disabled:opacity-40">
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={p.id} className="border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                          {PAGAMENTO_LABEL[p.forma_pagamento] ?? p.forma_pagamento}
                          <span className="text-xs font-normal text-[#71717A] dark:text-[#A1A1AA]"> · {p.origem === 'garcom' ? 'garçom' : 'caixa'}</span>
                        </p>
                        {p.taxa_cartao_valor > 0 && (
                          <p className="text-xs text-[#FF441F]">+ taxa cartão {fmt(p.taxa_cartao_valor)}</p>
                        )}
                        {p.forma_pagamento === 'cash' && p.valor_recebido != null && (
                          <p className="text-[11px] text-[#A1A1AA]">
                            Recebido {fmt(p.valor_recebido)} · Troco{p.troco_via_pix ? ' (Pix)' : ''} {fmt(p.troco || 0)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">{fmt(p.valor + (p.taxa_cartao_valor || 0))}</span>
                        {onAlterarTrocoPix && podeTrocoPix?.(p) && (
                          <button onClick={() => onAlterarTrocoPix(p)} title="Alternar troco via Pix"
                            className={`px-2 h-8 rounded-lg border text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                              p.troco_via_pix
                                ? 'border-[#FF441F]/40 bg-[#FF441F]/10 text-[#FF441F]'
                                : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}>
                            Troco Pix
                          </button>
                        )}
                        {onIniciarEdicao && podeEditarPagamento?.(p) && (
                          <button onClick={() => onIniciarEdicao(p)}
                            className="w-8 h-8 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center flex-shrink-0">
                            <Icon name="Pencil" size={14} />
                          </button>
                        )}
                        {onRemoverPagamento && podeRemoverPagamento?.(p) && (
                          <button onClick={() => onRemoverPagamento(p)}
                            className="w-8 h-8 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                            <Icon name="X" size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Novo lançamento */}
          {faltaPagarEfetivo > 0.01 && podeRegistrar && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wide">Novo pagamento</h3>
              <input type="number" inputMode="decimal" autoFocus value={valor} onChange={(e) => setValor(e.target.value)}
                placeholder="R$ 0,00"
                className="w-full text-center text-3xl font-black bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] border-2 border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl px-4 py-4 focus:outline-none focus:border-[#FF441F]" />

              <FormaPagamentoBotoes value={forma} onChange={setForma} />

              {taxaCartaoValor > 0 && (
                <p className="text-sm text-[#FF441F] font-semibold text-center">
                  + taxa cartão ({taxaCartaoPercentual}%): {fmt(taxaCartaoValor)} — cobrar {fmt(Number(valor || 0) + taxaCartaoValor)}
                </p>
              )}

              {forma === 'cash' && (
                <div className="space-y-2">
                  <input type="number" inputMode="decimal" value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)}
                    placeholder="Valor recebido do cliente"
                    className="w-full text-center text-2xl font-black bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] border-2 border-red-500 rounded-2xl px-4 py-3.5 focus:outline-none" />
                  {troco !== null && (
                    <p className={`text-center text-xl font-black ${troco < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      Troco: {fmt(Math.max(troco, 0))}
                    </p>
                  )}
                  {troco > 0 && (
                    <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={trocoViaPix} onChange={(e) => setTrocoViaPix(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#FF441F]" />
                      <span className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Troco via Pix (não sai do caixa em espécie)</span>
                    </label>
                  )}
                </div>
              )}

              {erro && <p className="text-sm text-red-600 dark:text-red-400 text-center">{erro}</p>}

              <button onClick={onRegistrar} disabled={salvando || !valor}
                className="w-full py-4 bg-[#FF441F] text-white rounded-2xl text-lg font-black disabled:opacity-40">
                {salvando ? 'Registrando...' : 'Pagar'}
              </button>
            </div>
          )}

          {faltaPagarEfetivo <= 0.01 && (
            <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Comanda quitada.</p>
          )}
          {faltaPagarEfetivo > 0.01 && !podeRegistrar && (
            <p className="text-center text-sm text-[#A1A1AA]">Você não tem permissão para registrar pagamento parcial.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PagamentoParcialModal;
