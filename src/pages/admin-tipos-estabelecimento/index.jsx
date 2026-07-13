import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTiposEstabelecimento, criarTipoEstabelecimento, atualizarTipoEstabelecimento, removerTipoEstabelecimento } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

/* ── Ícones disponíveis para tipos de estabelecimento ───────────── */
const ICONES = [
  'Store', 'UtensilsCrossed', 'Pill', 'HardHat', 'ShoppingBag', 'ShoppingCart', 'Shirt',
  'Flower2', 'Fuel', 'Wine', 'Coffee', 'Cake', 'Scissors', 'Wrench', 'PawPrint', 'BookOpen',
  'Smartphone', 'Gift', 'Package', 'Truck', 'Building2', 'Tag',
];

/* ── Nav admin ──────────────────────────────────────────────────── */
const AdminNav = ({ active }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const links = [
    { label: 'Dashboard',    path: '/admin' },
    { label: 'Empresas',     path: '/admin/empresas' },
    { label: 'Categorias',   path: '/admin/categorias' },
    { label: 'Tipos',        path: '/admin/tipos-estabelecimento' },
    { label: 'Tags',         path: '/admin/tags' },
    { label: 'Comissões',    path: '/admin/comissoes' },
    { label: 'Configurações',path: '/admin/configuracoes' },
  ];
  return (
    <nav className="flex gap-1.5 flex-wrap items-center">
      {links.map((l) => (
        <button key={l.path} onClick={() => navigate(l.path)}
          className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            active === l.path
              ? 'text-white bg-blue-600 shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}>
          {l.label}
        </button>
      ))}
      <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
        className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
        Sair
      </button>
    </nav>
  );
};

/* ── Modal criar/editar tipo ─────────────────────────────────────── */
const EMPTY = { name: '', icon_name: 'Store' };

const Modal = ({ tipo, onClose, onSave }) => {
  const [form, setForm] = useState(
    tipo ? { name: tipo.name, icon_name: tipo.icon_name } : { ...EMPTY }
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      if (tipo) {
        await atualizarTipoEstabelecimento(tipo.id, form);
      } else {
        await criarTipoEstabelecimento(form);
      }
      onSave();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-5">
          {tipo ? 'Editar Tipo de Estabelecimento' : 'Novo Tipo de Estabelecimento'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md bg-blue-600">
              <Icon name={form.icon_name} size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900">{form.name || 'Nome do tipo'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{form.icon_name}</p>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Farmácia"
            />
          </div>

          {/* Seletor de ícone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ícone</label>
            <div className="grid grid-cols-8 gap-1.5 p-3 bg-gray-50 rounded-xl max-h-48 overflow-y-auto">
              {ICONES.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  title={icon}
                  onClick={() => set('icon_name', icon)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    form.icon_name === icon
                      ? 'bg-blue-600 text-white shadow-md scale-110'
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Icon name={icon} size={16} />
                </button>
              ))}
            </div>
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border rounded-xl text-sm text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Componente principal ────────────────────────────────────────── */
const AdminTiposEstabelecimento = () => {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modal, setModal] = useState(null); // null | 'novo' | tipo_obj
  const [removendo, setRemovendo] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    getTiposEstabelecimento()
      .then((d) => setTipos(d.tipos ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleRemover = async (tipo) => {
    if (!window.confirm(`Remover "${tipo.name}"? Estabelecimentos vinculados perderão o tipo.`)) return;
    setRemovendo(tipo.id);
    try {
      await removerTipoEstabelecimento(tipo.id);
      setTipos((prev) => prev.filter((t) => t.id !== tipo.id));
    } catch (e) {
      alert(e.message);
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tipos de Estabelecimento</h1>
          <p className="text-sm text-gray-500">Restaurante, farmácia, material de construção...</p>
        </div>
        <AdminNav active="/admin/tipos-estabelecimento" />
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{tipos.length} tipo(s)</p>
          <button
            onClick={() => setModal('novo')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon name="Plus" size={16} /> Novo Tipo
          </button>
        </div>

        {erro && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg px-4 py-3">{erro}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tipos.length === 0 ? (
          <div className="bg-white rounded-2xl border p-14 text-center">
            <Icon name="Store" size={44} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">Nenhum tipo cadastrado</p>
            <button onClick={() => setModal('novo')}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              Criar primeiro tipo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {tipos.map((tipo) => (
                <motion.div
                  key={tipo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 group hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0 bg-blue-600">
                    <Icon name={tipo.icon_name ?? 'Store'} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{tipo.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{tipo.icon_name}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModal(tipo)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Icon name="Pencil" size={15} />
                    </button>
                    <button
                      onClick={() => handleRemover(tipo)}
                      disabled={removendo === tipo.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Remover"
                    >
                      <Icon name="Trash2" size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {modal && (
        <Modal
          tipo={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminTiposEstabelecimento;
