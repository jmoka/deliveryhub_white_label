import React, { useState, useEffect } from 'react';
import { getComissoes, getEmpresas, getPagamentosStripeAdmin } from '../../services/adminService';
import AdminHeader from '../../components/admin/AdminHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

const ComissoesPagBankTab = ({ empresas, empresaMap }) => {
  const [comissoes, setComissoes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ empresa_id: '', data_inicio: '', data_fim: '' });

  const carregar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.empresa_id) params.empresa_id = filtros.empresa_id;
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros.data_fim) params.data_fim = filtros.data_fim;

      const c = await getComissoes(params);
      setComissoes(c.comissoes ?? []);
      setTotal(c.total_comissao ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []); // eslint-disable-line

  return (
    <>
      {/* Filtros */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Empresa</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 border-gray-300 dark:border-zinc-700"
            value={filtros.empresa_id}
            onChange={(e) => setFiltros({ ...filtros, empresa_id: e.target.value })}
          >
            <option value="">Todas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Data início</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 border-gray-300 dark:border-zinc-700"
            value={filtros.data_inicio}
            onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Data fim</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 border-gray-300 dark:border-zinc-700"
            value={filtros.data_fim}
            onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
          />
        </div>
        <button
          onClick={carregar}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          Filtrar
        </button>
      </div>

      {/* Total */}
      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Total de Comissões</p>
          <p className="text-xs text-orange-500 dark:text-orange-400">{comissoes.length} registro(s)</p>
        </div>
        <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{fmt(total)}</p>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comissoes.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-zinc-500">
            Nenhuma comissão encontrada para os filtros selecionados
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Empresa</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Pedido</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Venda</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Taxa</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Comissão</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Data</th>
              </tr>
            </thead>
            <tbody>
              {comissoes.map((c) => (
                <tr key={c.id} className="border-b dark:border-zinc-700 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">
                    {empresaMap[c.empresa_id] ?? `Empresa #${c.empresa_id}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">#{c.pedido_id}</td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-zinc-300">{fmt(c.valor_venda)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                      {c.comissao_pct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-orange-700 dark:text-orange-400">
                    {fmt(c.comissao_valor)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 dark:text-zinc-500 text-xs">
                    {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

const StripeTab = ({ empresas, empresaMap }) => {
  const [pagamentos, setPagamentos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const carregar = async (p = page, restauranteId = empresaId) => {
    setLoading(true);
    try {
      const d = await getPagamentosStripeAdmin({ restaurante_id: restauranteId || undefined, page: p, limit });
      setPagamentos(d.pagamentos ?? []);
      setTotal(d.total ?? 0);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(1, empresaId); }, []); // eslint-disable-line

  const totalComissao = pagamentos.reduce((s, p) => s + (p.comissao_valor ?? 0), 0);
  const totalMargem = pagamentos.reduce((s, p) => s + (p.margem_liquida_plataforma ?? 0), 0);

  return (
    <>
      {/* Filtro */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Empresa</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 border-gray-300 dark:border-zinc-700"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
          >
            <option value="">Todas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => carregar(1, empresaId)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          Filtrar
        </button>
      </div>

      {/* Totais da página atual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Comissão retida (página)</p>
            <p className="text-xs text-orange-500 dark:text-orange-400">{pagamentos.length} venda(s)</p>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{fmt(totalComissao)}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Margem líquida (comissão − tarifa Stripe)</p>
            <p className="text-xs text-emerald-500 dark:text-emerald-400">lucro real da plataforma</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{fmt(totalMargem)}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pagamentos.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-zinc-500">
            Nenhuma venda via Stripe encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Pedido</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Venda</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Comissão</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Tarifa Stripe</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Margem</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400">Loja recebe</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Repasse</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id} className="border-b dark:border-zinc-700 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">
                      {p.restaurante_nome ?? empresaMap[p.restaurant_id] ?? `Empresa #${p.restaurant_id}`}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">#{p.order_id}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-zinc-300">{fmt(p.valor)}</td>
                    <td className="px-4 py-3 text-right text-orange-700 dark:text-orange-400">{fmt(p.comissao_valor)}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">- {fmt(p.stripe_taxa_valor)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">{fmt(p.margem_liquida_plataforma)}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-zinc-300">{fmt(p.valor_liquido_loja)}</td>
                    <td className="px-4 py-3">
                      {p.repasse_em ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400">
                          {fmtDate(p.repasse_em)}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                          Aguardando
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="px-5 py-3 border-t dark:border-zinc-700 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-zinc-400">{total} venda{total !== 1 ? 's' : ''} no total</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => carregar(page - 1)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border dark:border-zinc-700 disabled:opacity-40">Anterior</button>
              <button disabled={page * limit >= total} onClick={() => carregar(page + 1)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border dark:border-zinc-700 disabled:opacity-40">Próxima</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const AdminComissoes = () => {
  const [aba, setAba] = useState('pagbank');
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    getEmpresas().then((e) => setEmpresas(e.empresas ?? [])).catch(() => {});
  }, []);

  const empresaMap = Object.fromEntries(empresas.map((e) => [e.id, e.name]));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/comissoes" title="Painel Dev-Admin" subtitle="Comissões da Plataforma" />

      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl w-fit mb-6">
          <button onClick={() => setAba('pagbank')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${aba === 'pagbank' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`}>
            PagBank
          </button>
          <button onClick={() => setAba('stripe')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${aba === 'stripe' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`}>
            Stripe
          </button>
        </div>

        {aba === 'pagbank'
          ? <ComissoesPagBankTab empresas={empresas} empresaMap={empresaMap} />
          : <StripeTab empresas={empresas} empresaMap={empresaMap} />}
      </main>
    </div>
  );
};

export default AdminComissoes;
