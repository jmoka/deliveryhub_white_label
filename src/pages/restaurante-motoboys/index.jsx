import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarMotoboys, criarMotoboy, toggleMotoboy } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Motoboys', path: '/restaurante/motoboys' },
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <nav className="flex gap-1.5 flex-wrap">
      {links.map((l) => (
        <button key={l.path} onClick={() => navigate(l.path)}
          className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            active === l.path
              ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30'
              : 'text-[#27272A] hover:bg-[#F4F4F5]'
          }`}>
          {l.label}
        </button>
      ))}
    </nav>
  );
};

const RestauranteMotoboys = () => {
  const [motoboys, setMotoboys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copiado, setCopiado] = useState(null);

  const reload = () =>
    listarMotoboys()
      .then((r) => setMotoboys(r.motoboys ?? []))
      .catch((e) => setMsg({ tipo: 'erro', texto: e.message }))
      .finally(() => setLoading(false));

  useEffect(() => { reload(); }, []);

  const handleCriar = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSalvando(true);
    try {
      await criarMotoboy({ name: form.name.trim(), phone: form.phone.trim() || undefined });
      setForm({ name: '', phone: '' });
      setMsg({ tipo: 'ok', texto: 'Motoboy criado!' });
      setTimeout(() => setMsg(null), 3000);
      reload();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setSalvando(false);
    }
  };

  const handleToggle = async (mb) => {
    try {
      await toggleMotoboy(mb.id, !mb.is_active);
      setMotoboys((prev) => prev.map((m) => m.id === mb.id ? { ...m, is_active: !m.is_active } : m));
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    }
  };

  const copiarLink = (mb) => {
    const url = `${window.location.origin}/motoboy?token=${mb.access_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(mb.id);
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <header className="bg-white border-b border-[#E4E4E7] px-4 sm:px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-[#18181B]">Motoboys</h1>
            <p className="text-sm text-[#71717A]">Cadastro e links de acesso</p>
          </div>
          <NavRestaurante active="/restaurante/motoboys" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Form novo motoboy */}
        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5">
          <h2 className="font-bold text-[#18181B] text-sm mb-4 flex items-center gap-2">
            <Icon name="UserPlus" size={16} className="text-[#FF441F]" /> Novo motoboy
          </h2>
          <form onSubmit={handleCriar} className="flex flex-col sm:flex-row gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome"
              required
              className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Telefone (opcional)"
              className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
            />
            <button type="submit" disabled={salvando}
              className="px-5 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50 whitespace-nowrap">
              {salvando ? '...' : '+ Adicionar'}
            </button>
          </form>
        </div>

        {msg && (
          <div className={`text-sm rounded-xl px-4 py-3 ${
            msg.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {msg.texto}
          </div>
        )}

        {/* Lista */}
        <div className="bg-white rounded-2xl border border-[#E4E4E7] divide-y divide-[#F4F4F5]">
          {motoboys.length === 0 ? (
            <p className="p-5 text-sm text-[#71717A] text-center">Nenhum motoboy cadastrado</p>
          ) : motoboys.map((mb) => (
            <div key={mb.id} className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${mb.is_active ? 'bg-[#FF441F]/10' : 'bg-[#F4F4F5]'}`}>
                <Icon name="Bike" size={16} className={mb.is_active ? 'text-[#FF441F]' : 'text-[#A1A1AA]'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#18181B]">{mb.name}</p>
                {mb.phone && <p className="text-xs text-[#71717A]">{mb.phone}</p>}
                <p className="text-xs text-[#71717A] mt-0.5">
                  Status: <span className={mb.is_active ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {mb.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copiarLink(mb)}
                  title="Copiar link de acesso"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                    copiado === mb.id ? 'bg-green-500 text-white' : 'bg-[#F4F4F5] text-[#27272A] hover:bg-[#E4E4E7]'
                  }`}
                >
                  <Icon name={copiado === mb.id ? 'Check' : 'Link'} size={12} />
                  {copiado === mb.id ? 'Copiado!' : 'Link'}
                </button>
                <button
                  onClick={() => handleToggle(mb)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    mb.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {mb.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#71717A] text-center">
          Compartilhe o link de acesso com o motoboy. Ele abre o portal sem precisar de conta.
        </p>
      </main>
    </div>
  );
};

export default RestauranteMotoboys;
