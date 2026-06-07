import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeusPedidos, atualizarStatusPedido } from '../../services/restauranteService';
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

const FILTROS = ['', 'pending', 'confirmed', 'ready', 'out_for_delivery', 'delivered', 'canceled'];

const RestaurantePedidos = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [atualizando, setAtualizando] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    getMeusPedidos({ status: filtroStatus || undefined })
      .then((r) => setPedidos(r.pedidos ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
        </div>
        <nav className="flex gap-3">
          <button onClick={() => navigate('/restaurante')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Dashboard</button>
          <button onClick={() => navigate('/restaurante/produtos')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Produtos</button>
          <button onClick={() => navigate('/restaurante/pedidos')} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg">Pedidos</button>
          <button onClick={() => navigate('/restaurante/clientes')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Clientes</button>
          <button onClick={() => navigate('/restaurante/aparencia')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Designer</button>
          <button onClick={() => navigate('/restaurante/config')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Config</button>
          <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200">Sair</button>
        </nav>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="mx-2 border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos os status</option>
            {FILTROS.slice(1).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]?.label}</option>
            ))}
          </select>
          <button onClick={carregar} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
            Atualizar
          </button>
        </div>

        {erro && <p className="text-red-600 mb-4 text-sm">{erro}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-400">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((p) => {
              const s = STATUS_LABELS[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-700' };
              const proximo = PROXIMOS_STATUS[p.status];
              return (
                <div key={p.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Pedido #{p.id}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {fmt(p.total)} · {p.payment_method} · {new Date(p.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                    {proximo && (
                      <button
                        disabled={atualizando === p.id}
                        onClick={() => avancarStatus(p)}
                        className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                      >
                        {atualizando === p.id ? '...' : `→ ${STATUS_LABELS[proximo]?.label}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default RestaurantePedidos;
