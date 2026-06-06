import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const MenuCatalogProductBrowse = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isRestaurantOwner, signOut } = useAuth();
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetch('/api/r')
      .then((r) => r.json())
      .then((d) => setRestaurantes(d.restaurantes ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = restaurantes.filter((r) =>
    r.name.toLowerCase().includes(busca.toLowerCase()) ||
    (r.address ?? '').toLowerCase().includes(busca.toLowerCase()),
  );

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
          {isAuthenticated() ? (
            <>
              {isAdmin() && (
                <button onClick={() => navigate('/admin')} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                  Admin
                </button>
              )}
              {isRestaurantOwner() && (
                <button onClick={() => navigate('/restaurante')} className="px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-lg">
                  Meu Restaurante
                </button>
              )}
              <button
                onClick={() => navigate('/customer-account-order-history')}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Meus Pedidos
              </button>
              <button
                onClick={async () => { await signOut(); }}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
              >
                Sair
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/customer-registration-login')}
              className="px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-10 text-center text-white">
        <h1 className="text-2xl font-bold mb-2">Peça seu delivery</h1>
        <p className="text-orange-100 text-sm mb-5">Escolha um restaurante e faça seu pedido</p>
        <div className="max-w-md mx-auto relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar restaurante..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </div>

      {/* Lista */}
      <main className="p-4 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : erro ? (
          <div className="text-center py-16">
            <p className="text-red-600 text-sm">{erro}</p>
            <p className="text-gray-400 text-xs mt-1">Verifique se o backend está rodando</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="Store" size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {busca ? 'Nenhum restaurante encontrado' : 'Nenhum restaurante cadastrado ainda'}
            </p>
            {!busca && (
              <button
                onClick={() => navigate('/restaurant-registration-setup')}
                className="mt-4 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
              >
                Cadastrar meu restaurante
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{filtrados.length} restaurante(s)</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {filtrados.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/r/${r.slug}`)}
                  className="bg-white rounded-xl border hover:shadow-md transition-shadow text-left overflow-hidden"
                >
                  {r.logo_url ? (
                    <img src={r.logo_url} alt={r.name} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                      <Icon name="Store" size={40} className="text-orange-400" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    {r.address && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Icon name="MapPin" size={11} /> {r.address}
                      </p>
                    )}
                    <p className="text-xs text-orange-500 mt-2 font-medium">Ver cardápio →</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MenuCatalogProductBrowse;
