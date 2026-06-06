import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComissoes, getEmpresas } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Painel Dev-Admin</h1>
          <p className="text-sm text-gray-500">Comissões da Plataforma</p>
        </div>
        <nav className="flex gap-3">
          {[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Empresas', path: '/admin/empresas' },
            { label: 'Comissões', path: '/admin/comissoes' },
          ].map((l) => (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                l.path === '/admin/comissoes'
                  ? 'text-white bg-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
          >
            Sair
          </button>
        </nav>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Filtros */}
        <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Data início</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtros.data_inicio}
              onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data fim</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-700">Total de Comissões</p>
            <p className="text-xs text-orange-500">{comissoes.length} registro(s)</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{fmt(total)}</p>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comissoes.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              Nenhuma comissão encontrada para os filtros selecionados
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Pedido</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Venda</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Taxa</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Comissão</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Data</th>
                </tr>
              </thead>
              <tbody>
                {comissoes.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {empresaMap[c.empresa_id] ?? `Empresa #${c.empresa_id}`}
                    </td>
                    <td className="px-4 py-3 text-gray-500">#{c.pedido_id}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(c.valor_venda)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        {c.comissao_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-700">
                      {fmt(c.comissao_valor)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
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
