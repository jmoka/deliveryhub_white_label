import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmpresas, criarEmpresa, atualizarEmpresa, removerEmpresa } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const AdminNav = ({ active }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const links = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Empresas', path: '/admin/empresas' },
    { label: 'Comissões', path: '/admin/comissoes' },
  ];
  return (
    <nav className="flex gap-3 items-center">
      {links.map((l) => (
        <button
          key={l.path}
          onClick={() => navigate(l.path)}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            active === l.path ? 'text-white bg-blue-600' : 'text-gray-700 hover:bg-gray-100'
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
  );
};

const Modal = ({ empresa, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: empresa?.name ?? '',
    address: empresa?.address ?? '',
    comissao_pct: empresa?.comissao_pct ?? 5,
    user_id: empresa?.user_id ?? '',
  });
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      if (empresa) {
        await atualizarEmpresa(empresa.id, form);
      } else {
        await criarEmpresa(form);
      }
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">{empresa ? 'Editar Empresa' : 'Nova Empresa'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comissão plataforma (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.comissao_pct}
              onChange={(e) => setForm({ ...form, comissao_pct: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UUID do dono (restaurant_owner)
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value.trim() })}
            />
            <p className="text-xs text-gray-400 mt-1">
              UUID do usuário cadastrado como restaurant_owner. Deixe vazio se não houver dono ainda.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminEmpresas = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modal, setModal] = useState(null); // null | 'novo' | empresa_obj

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await getEmpresas();
      setEmpresas(data.empresas ?? []);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleRemover = async (empresa) => {
    if (!confirm(`Remover "${empresa.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await removerEmpresa(empresa.id);
      carregar();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Painel Dev-Admin</h1>
          <p className="text-sm text-gray-500">Gestão de Empresas</p>
        </div>
        <AdminNav active="/admin/empresas" />
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Empresas <span className="text-gray-400 font-normal text-sm">({empresas.length})</span>
          </h2>
          <button
            onClick={() => setModal('novo')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            + Nova Empresa
          </button>
        </div>

        {erro && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {erro} — verifique se o backend está rodando.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            {empresas.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-lg">Nenhuma empresa cadastrada</p>
                <button
                  onClick={() => setModal('novo')}
                  className="mt-3 text-blue-600 text-sm hover:underline"
                >
                  Cadastrar primeira empresa
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Slug / Link</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Endereço</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Comissão</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Cadastro</th>
                    <th className="px-4 py-3 w-px whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">#{e.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{e.name}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {e.slug ? (
                          <a
                            href={`/r/${e.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline font-mono"
                          >
                            /r/{e.slug}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                        {e.address ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          {e.comissao_pct ?? 5}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">
                        {new Date(e.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => navigate(`/admin/empresas/${e.id}`)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => setModal(e)}
                            className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleRemover(e)}
                            className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {modal && (
        <Modal
          empresa={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminEmpresas;
