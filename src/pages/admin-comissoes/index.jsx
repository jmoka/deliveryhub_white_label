import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComissoes, getEmpresas } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../../contexts/ThemeContext';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const AdminComissoes = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [comissoes, setComissoes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
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

      const [c, e] = await Promise.all([getComissoes(params), getEmpresas()]);
      setComissoes(c.comissoes ?? []);
      setTotal(c.total_comissao ?? 0);
      setEmpresas(e.empresas ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const empresaMap = Object.fromEntries(empresas.map((e) => [e.id, e.name]));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-800 border-b dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Painel Dev-Admin</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Comissões da Plataforma</p>
        </div>
        <nav className="flex gap-3 items-center">
          {[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Empresas', path: '/admin/empresas' },
            { label: 'Categorias', path: '/admin/categorias' },
            { label: 'Tipos',      path: '/admin/tipos-estabelecimento' },
            { label: 'Tags',       path: '/admin/tags' },
            { label: 'Comissões', path: '/admin/comissoes' },
            { label: 'Planos', path: '/admin/planos' },
            { label: 'Configurações', path: '/admin/configuracoes' },
          ].map((l) => (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                l.path === '/admin/comissoes'
                  ? 'text-white bg-blue-600'
                  : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900"
          >
            Sair
          </button>
          <ThemeToggle inline />
        </nav>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
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
      </main>
    </div>
  );
};

export default AdminComissoes;
