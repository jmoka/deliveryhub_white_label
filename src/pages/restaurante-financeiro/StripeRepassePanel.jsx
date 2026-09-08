import React, { useEffect, useState } from 'react';
import { getPagamentosStripe } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

const StripeRepassePanel = () => {
  const [pagamentos, setPagamentos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const carregar = async (p = page) => {
    setLoading(true); setErro(null);
    try {
      const d = await getPagamentosStripe(p, limit);
      setPagamentos(d.pagamentos ?? []);
      setTotal(d.total ?? 0);
      setPage(p);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(1); }, []); // eslint-disable-line

  if (loading && pagamentos.length === 0 && !erro) {
    return (
      <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-10 flex justify-center">
        <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (erro) {
    return <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-xl">{erro}</p>;
  }

  return (
    <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F4F4F5] dark:border-[#3F3F46] flex items-center gap-2">
        <Icon name="CreditCard" size={16} className="text-[#71717A] dark:text-[#A1A1AA]" />
        <div>
          <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">Vendas via Cartão (Stripe)</p>
          <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">Comissão retida e valor líquido que cai na sua conta Stripe</p>
        </div>
      </div>

      {pagamentos.length === 0 ? (
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhuma venda via Stripe ainda.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFAFA] dark:bg-[#18181B] border-b border-[#F4F4F5] dark:border-[#3F3F46]">
                  <th className="px-4 py-2 text-left text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Pedido</th>
                  <th className="px-4 py-2 text-right text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Venda</th>
                  <th className="px-4 py-2 text-right text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Comissão</th>
                  <th className="px-4 py-2 text-right text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Você recebe</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-widest">Repasse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#3F3F46]">
                {pagamentos.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#18181B] dark:text-[#F4F4F5]">#{p.order_id}</p>
                      <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{fmtDate(p.pago_em ?? p.criado_em)}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-[#18181B] dark:text-[#F4F4F5]">{fmt(p.valor)}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">- {fmt(p.comissao_valor)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700 dark:text-green-400">{fmt(p.valor_liquido)}</td>
                    <td className="px-4 py-3">
                      {p.repasse_em ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400">
                          <Icon name="Check" size={10} /> Repassado {fmtDate(p.repasse_em)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                          Aguardando repasse
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > limit && (
            <div className="px-5 py-3 border-t border-[#F4F4F5] dark:border-[#3F3F46] flex items-center justify-between">
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{total} venda{total !== 1 ? 's' : ''} no total</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => carregar(page - 1)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] disabled:opacity-40">Anterior</button>
                <button disabled={page * limit >= total} onClick={() => carregar(page + 1)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] disabled:opacity-40">Próxima</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StripeRepassePanel;
