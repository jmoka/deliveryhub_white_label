import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientes, criarCliente, atualizarCliente } from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_FORM = { name: '', email: '', phone_e164: '', notes: '' };

const Modal = ({ cliente, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: cliente?.name ?? '',
    email: cliente?.email ?? '',
    phone_e164: cliente?.phone_e164 ?? '',
    notes: cliente?.notes ?? '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      if (cliente) {
        await atualizarCliente(cliente.id, form);
      } else {
        await criarCliente(form);
      }
      onSave();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">{cliente ? 'Editar Cliente' : 'Novo Cliente'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              value={form.phone_e164}
              onChange={(e) => setForm((f) => ({ ...f, phone_e164: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="+5511999999999"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={2}
              placeholder="Preferências, restrições, etc."
            />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 py-2 bg-[#FF441F] text-white rounded-lg text-sm hover:bg-[#e03b1a] disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RestauranteClientes = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(null); // null | 'novo' | cliente_obj

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getClientes({ busca: busca || undefined });
      setClientes(d.clientes ?? []);
      setTotal(d.total ?? 0);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    const t = setTimeout(carregar, busca ? 400 : 0);
    return () => clearTimeout(t);
  }, [carregar]);

  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Config', path: '/restaurante/config' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#18181B]">Clientes</h1>
          <p className="text-sm text-[#71717A]">{total} cadastrado(s)</p>
        </div>
        <nav className="flex gap-1.5 flex-wrap justify-end">
          {links.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                l.path === '/restaurante/clientes'
                  ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30'
                  : 'text-[#27272A] hover:bg-[#F4F4F5]'
              }`}>
              {l.label}
            </button>
          ))}
          <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
            Sair
          </button>
        </nav>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm max-w-xs"
          />
          <button
            onClick={() => setModal('novo')}
            className="px-4 py-2 bg-[#FF441F] text-white text-sm font-semibold rounded-lg hover:bg-[#e03b1a]"
          >
            + Novo cliente
          </button>
        </div>

        {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-400 mb-3">
              {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </p>
            {!busca && (
              <button onClick={() => setModal('novo')} className="text-sm text-[#FF441F] hover:underline">
                Cadastrar primeiro cliente →
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Telefone</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 hidden md:table-cell">Desde</th>
                  <th className="px-4 py-3 w-px whitespace-nowrap" />
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell font-mono text-xs">{c.phone_e164 ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs hidden md:table-cell">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModal(c)}
                        className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {modal && (
        <Modal
          cliente={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default RestauranteClientes;
