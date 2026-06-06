import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMetricas, getComissoes } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtNum = (v) => new Intl.NumberFormat('pt-BR').format(v ?? 0);

const Card = ({ label, value, sub, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut, userProfile } = useAuth();
  const [metricas, setMetricas] = useState(null);
  const [comissoes, setComissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([getMetricas(), getComissoes({ limite: 10 })])
      .then(([m, c]) => {
        setMetricas(m);
        setComissoes(c.comissoes ?? []);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 font-medium">{erro}</p>
        <p className="text-sm text-gray-500 mt-1">Verifique se o backend está rodando na porta 3002</p>
      </div>
    </div>
  );

  const r = metricas?.resumo ?? {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Painel Dev-Admin</h1>
          <p className="text-sm text-gray-500">{userProfile?.name || 'Plataforma Delivery'}</p>
        </div>
        <nav className="flex gap-3 items-center">
          <button onClick={() => navigate('/admin')} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg">
            Dashboard
          </button>
          <button onClick={() => navigate('/admin/empresas')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Empresas
          </button>
          <button onClick={() => navigate('/admin/comissoes')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Comissões
          </button>
          <button
            onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
          >
            Sair
          </button>
        </nav>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Cards de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card label="Empresas Ativas" value={fmtNum(r.total_empresas)} color="blue" />
          <Card label="Total Pedidos" value={fmtNum(r.total_pedidos)} sub={`${fmtNum(r.pedidos_entregues)} entregues`} color="green" />
          <Card label="Faturamento" value={fmt(r.faturamento_total)} sub={`Ticket médio ${fmt(r.ticket_medio)}`} color="purple" />
          <Card label="Comissão Plataforma" value={fmt(r.comissao_total)} color="orange" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Empresas */}
          <section className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Top Empresas</h2>
            {metricas?.top_empresas?.length === 0 && (
              <p className="text-sm text-gray-400">Nenhuma venda registrada</p>
            )}
            <div className="space-y-3">
              {(metricas?.top_empresas ?? []).map((e, i) => (
                <div key={e.empresa_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.nome}</p>
                      <p className="text-xs text-gray-500">Comissão: {fmt(e.comissao)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-700">{fmt(e.faturamento)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/admin/empresas')}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Ver todas →
            </button>
          </section>

          {/* Últimas Comissões */}
          <section className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Últimas Comissões</h2>
            {comissoes.length === 0 && (
              <p className="text-sm text-gray-400">Nenhuma comissão registrada</p>
            )}
            <div className="space-y-2">
              {comissoes.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">Pedido #{c.pedido_id}</p>
                    <p className="text-xs text-gray-400">
                      {c.comissao_pct}% de {fmt(c.valor_venda)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">{fmt(c.comissao_valor)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/admin/comissoes')}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Ver todas →
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
