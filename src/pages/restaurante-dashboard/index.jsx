import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMinhaEmpresa, getMeusPedidos, atualizarStatusPedido } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS_LABELS = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  ready: { label: 'Pronto', color: 'bg-purple-100 text-purple-800' },
  out_for_delivery: { label: 'Em entrega', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
  canceled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

const PROXIMOS_STATUS = {
  pending: 'confirmed',
  confirmed: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

const Card = ({ label, value, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

const RestauranteDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [empresa, setEmpresa] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [atualizando, setAtualizando] = useState(null);

  useEffect(() => {
    Promise.all([getMinhaEmpresa(), getMeusPedidos({ limite: 20 })])
      .then(([e, p]) => {
        setEmpresa(e.empresa);
        setMetricas(e.metricas);
        setPedidos(p.pedidos ?? []);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, []);

  const avancarStatus = async (pedido) => {
    const proximo = PROXIMOS_STATUS[pedido.status];
    if (!proximo) return;
    setAtualizando(pedido.id);
    try {
      const atualizado = await atualizarStatusPedido(pedido.id, proximo);
      setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, status: atualizado.status } : p)));
    } catch (e) {
      alert(e.message);
    } finally {
      setAtualizando(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{empresa?.name ?? 'Meu Restaurante'}</h1>
          <p className="text-sm text-gray-500">Painel do Restaurante</p>
        </div>
        <nav className="flex gap-3 items-center">
          <button onClick={() => navigate('/restaurante')} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg">
            Dashboard
          </button>
          <button onClick={() => navigate('/restaurante/produtos')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Produtos
          </button>
          <button onClick={() => navigate('/restaurante/pedidos')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Pedidos
          </button>
          <button onClick={() => navigate('/restaurante/clientes')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Clientes
          </button>
          <button onClick={() => navigate('/restaurante/config')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Config
          </button>
          <button
            onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
          >
            Sair
          </button>
        </nav>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        {empresa?.slug && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-orange-800">Link do seu cardápio</p>
              <p className="text-xs text-orange-600 font-mono mt-0.5">{window.location.origin}/r/{empresa.slug}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/r/${empresa.slug}`)}
                className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Copiar
              </button>
              <a
                href={`/r/${empresa.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100"
              >
                Abrir
              </a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card label="Total Pedidos" value={metricas?.total_pedidos ?? 0} color="blue" />
          <Card label="Pendentes" value={metricas?.pedidos_pendentes ?? 0} color="orange" />
          <Card label="Entregues" value={metricas?.pedidos_entregues ?? 0} color="green" />
          <Card label="Faturamento" value={fmt(metricas?.faturamento)} color="purple" />
        </div>

        <section className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Pedidos Recentes</h2>
            <button
              onClick={() => navigate('/restaurante/pedidos')}
              className="text-sm text-orange-500 hover:underline"
            >
              Ver todos →
            </button>
          </div>

          {pedidos.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum pedido ainda</p>
          )}

          <div className="space-y-3">
            {pedidos.map((p) => {
              const s = STATUS_LABELS[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-700' };
              const proximo = PROXIMOS_STATUS[p.status];
              return (
                <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pedido #{p.id}</p>
                    <p className="text-xs text-gray-500">{fmt(p.total)} · {p.payment_method}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                    {proximo && (
                      <button
                        disabled={atualizando === p.id}
                        onClick={() => avancarStatus(p)}
                        className="text-xs px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                      >
                        {atualizando === p.id ? '...' : `→ ${STATUS_LABELS[proximo]?.label}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default RestauranteDashboard;
