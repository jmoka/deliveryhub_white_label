import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeusPedidos, atualizarStatusPedido, getMinhaEmpresa } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';
import RestauranteSidebar from '../../components/restaurante/RestauranteSidebar';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS_LABELS = {
  pending:            { label: 'Pendente',       color: 'bg-yellow-100 text-yellow-800' },
  confirmed:          { label: 'Confirmado',     color: 'bg-blue-100 text-blue-800' },
  preparing:          { label: 'Em preparo',     color: 'bg-orange-100 text-orange-800' },
  ready:              { label: 'Pronto',         color: 'bg-purple-100 text-purple-800' },
  motoboy_collecting: { label: 'Motoboy vindo',  color: 'bg-sky-100 text-sky-800' },
  out_for_delivery:   { label: 'Em entrega',     color: 'bg-indigo-100 text-indigo-800' },
  delivered:          { label: 'Entregue',       color: 'bg-green-100 text-green-800' },
  canceled:           { label: 'Cancelado',      color: 'bg-red-100 text-red-800' },
};

const PROXIMOS_STATUS = {
  pending: 'confirmed',
  confirmed: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

const FILTROS = ['', 'pending', 'confirmed', 'preparing', 'ready', 'motoboy_collecting', 'out_for_delivery', 'delivered', 'canceled'];

const RestaurantePedidos = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [atualizando, setAtualizando] = useState(null);
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const [restauranteId, setRestauranteId] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    getMeusPedidos({ status: filtroStatus || undefined })
      .then((r) => setPedidos(r.pedidos ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  // Busca ID do restaurante para o filtro realtime
  useEffect(() => {
    getMinhaEmpresa()
      .then((d) => setRestauranteId(d.empresa?.id ?? null))
      .catch(() => {});
  }, []);

  // Realtime: recarrega quando qualquer pedido do restaurante muda
  useEffect(() => {
    if (!restauranteId) return;
    const channel = supabase
      .channel(`pedidos-restaurante-${restauranteId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restauranteId}`,
      }, () => carregar())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [restauranteId, carregar]);

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

  const tipoRestaurante = useTipoRestaurante();
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Relatórios', path: '/restaurante/relatorios' },
    { label: 'Delivery', path: '/restaurante/delivery' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Entregas', path: '/restaurante/entregas' },
    ...(tipoRestaurante ? [
      { label: 'Salão', path: '/restaurante/salao' },
      { label: 'Garçons', path: '/restaurante/garcons' },
      { label: 'Impressoras', path: '/restaurante/impressoras' },
    ] : []),
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  const slugLoja = useMinhaLojaSlug();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#18181B]">Pedidos</h1>
        <nav className="md:hidden flex gap-1.5 flex-wrap">
          {links.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                l.path === '/restaurante/pedidos'
                  ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30'
                  : 'text-[#27272A] hover:bg-[#F4F4F5]'
              }`}>
              {l.label}
            </button>
          ))}
          {slugLoja && (
            <button onClick={() => window.open(`/r/${slugLoja}`, '_blank')}
              className="px-3 py-2 text-sm font-semibold rounded-lg text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 flex items-center gap-1.5">
              <Icon name="ExternalLink" size={14} /> Loja
            </button>
          )}
          <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
            Sair
          </button>
        </nav>
        <button onClick={() => setSidebarAberto(true)}
          className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#27272A] hover:bg-[#F4F4F5] border border-[#E4E4E7]">
          <Icon name="Menu" size={18} /> Menu
        </button>
      </header>

      <RestauranteSidebar
        open={sidebarAberto}
        onClose={() => setSidebarAberto(false)}
        links={links}
        activePath="/restaurante/pedidos"
        slugLoja={slugLoja}
        onSair={async () => { await signOut(); navigate('/customer-registration-login'); }}
      />

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
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
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
                        className="text-xs px-3 py-1.5 bg-[#FF441F] text-white rounded-lg hover:bg-[#e03b1a] disabled:opacity-50"
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
