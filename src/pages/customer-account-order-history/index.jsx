import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS_LABELS = {
  pending:          { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700' },
  confirmed:        { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  ready:            { label: 'Pronto',     color: 'bg-purple-100 text-purple-700' },
  out_for_delivery: { label: 'Em entrega', color: 'bg-indigo-100 text-indigo-700' },
  delivered:        { label: 'Entregue',   color: 'bg-green-100 text-green-700' },
  canceled:         { label: 'Cancelado',  color: 'bg-red-100 text-red-700' },
};

const CustomerAccountOrderHistory = () => {
  const navigate = useNavigate();
  const { user, userProfile, isAuthenticated, signOut } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/customer-registration-login', { state: { from: '/customer-account-order-history' } });
      return;
    }

    const carregar = async () => {
      try {
        const sessionResult = await supabase.auth.getSession();
        const token = sessionResult?.data?.session?.access_token;
        if (!token) throw new Error('Sessão expirada');

        const res = await fetch('/api/pedidos/meus', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPedidos(data.pedidos ?? []);
      } catch (e) {
        setErro(e.message);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Icon name="Utensils" size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">DeliveryHub</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/menu-catalog-product-browse')} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">
            Restaurantes
          </button>
          <button
            onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {/* CTA restaurante — só aparece para role=customer */}
        {userProfile?.role === 'customer' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-orange-800">Tem um restaurante?</p>
              <p className="text-xs text-orange-600 mt-0.5">Cadastre e comece a receber pedidos agora</p>
            </div>
            <button
              onClick={() => navigate('/restaurant-registration-setup')}
              className="flex-shrink-0 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
            >
              Cadastrar restaurante
            </button>
          </div>
        )}

        {/* Perfil */}
        <div className="bg-white rounded-xl border p-4 mb-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Icon name="User" size={24} className="text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{userProfile?.name ?? user?.email ?? 'Usuário'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{userProfile?.role ?? 'customer'}</p>
          </div>
          <button
            onClick={() => navigate('/customer-profile')}
            className="flex-shrink-0 px-3 py-2 text-xs font-medium text-[#FF441F] border border-[#FF441F]/30 rounded-xl hover:bg-[#FF441F]/5 flex items-center gap-1.5"
          >
            <Icon name="Settings" size={13} />
            Meu Perfil
          </button>
        </div>

        {/* Pedidos */}
        <h2 className="font-semibold text-gray-900 mb-3">Meus Pedidos</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : erro ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {erro}
          </div>
        ) : pedidos.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Icon name="ShoppingBag" size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum pedido ainda</p>
            <button
              onClick={() => navigate('/menu-catalog-product-browse')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
            >
              Ver restaurantes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((p) => {
              const s = STATUS_LABELS[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-700' };
              const finalizado = p.status === 'delivered' || p.status === 'canceled';
              return (
                <div key={p.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">Pedido #{p.id}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(p.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.payment_method?.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                      <p className="text-base font-bold text-orange-600 mt-1">{fmt(p.total)}</p>
                    </div>
                  </div>
                  {!finalizado && (
                    <button
                      onClick={() => navigate('/order-tracking-status', { state: { orderId: p.id } })}
                      className="mt-3 w-full py-2 text-sm text-orange-500 border border-orange-200 rounded-lg hover:bg-orange-50"
                    >
                      Acompanhar pedido →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerAccountOrderHistory;
