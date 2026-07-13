import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoriasGlobais, criarCategoriaGlobal, atualizarCategoriaGlobal, removerCategoriaGlobal } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

/* ── Ícones disponíveis para categorias ─────────────────────────── */
const ICONES = [
  'LayoutGrid','Pizza','Sandwich','Fish','GlassWater','UtensilsCrossed','Leaf','Dessert','Coffee',
  'Beef','Soup','Cookie','Apple','Cherry','Wheat','IceCream','Wine','Cake','Candy','Lemon',
  'Egg','Carrot','Salad','Drumstick','ShoppingBag','Flame','Star','Heart','Zap','Tag',
  'Utensils','ChefHat','Package','Store','Truck','Clock','BarChart2','Sparkles','Gift','Globe',
];

const CORES = [
  { c1: '#FF441F', c2: '#FF7A00' },
  { c1: '#FF6B35', c2: '#FF8C42' },
  { c1: '#E63946', c2: '#FF6B6B' },
  { c1: '#0EA5E9', c2: '#38BDF8' },
  { c1: '#7C3AED', c2: '#A855F7' },
  { c1: '#059669', c2: '#10B981' },
  { c1: '#16A34A', c2: '#4ADE80' },
  { c1: '#DB2777', c2: '#F472B6' },
  { c1: '#92400E', c2: '#D97706' },
  { c1: '#0284C7', c2: '#7DD3FC' },
  { c1: '#6D28D9', c2: '#C4B5FD' },
  { c1: '#047857', c2: '#6EE7B7' },
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

/* ── Modal criar/editar categoria ───────────────────────────────── */
const EMPTY = { name: '', icon_name: 'Tag', color_primary: '#FF441F', color_secondary: '#FF7A00' };

const Modal = ({ categoria, onClose, onSave }) => {
  const [form, setForm] = useState(
    categoria
      ? { name: categoria.name, icon_name: categoria.icon_name, color_primary: categoria.color_primary, color_secondary: categoria.color_secondary }
      : { ...EMPTY }
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
      if (categoria) {
        await atualizarCategoriaGlobal(categoria.id, form);
      } else {
        await criarCategoriaGlobal(form);
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
          {categoria ? 'Editar Categoria' : 'Nova Categoria'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${form.color_primary}, ${form.color_secondary})` }}>
              <Icon name={form.icon_name} size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900">{form.name || 'Nome da categoria'}</p>
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
              placeholder="Ex: Hamburgueria"
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
            <div className="mt-2">
              <input
                value={form.icon_name}
                onChange={(e) => set('icon_name', e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ou digite o nome exato do ícone (ex: Pizza)"
              />
              <p className="text-xs text-gray-400 mt-1">
                Não achou o ícone que quer? Busque o nome em{' '}
                <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  lucide.dev/icons
                </a>{' '}
                e digite aqui exatamente como aparece (PascalCase, ex: <code>ShoppingBasket</code>).
              </p>
            </div>
          </div>

          {/* Seletor de cores */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cores do gradiente</label>
            <div className="flex flex-wrap gap-2">
              {CORES.map((par) => (
                <button
                  key={par.c1}
                  type="button"
                  onClick={() => { set('color_primary', par.c1); set('color_secondary', par.c2); }}
                  className={`w-10 h-10 rounded-xl shadow-sm transition-all ${
                    form.color_primary === par.c1 ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${par.c1}, ${par.c2})` }}
                />
              ))}
            </div>
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Cor primária</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.color_primary}
                    onChange={(e) => set('color_primary', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0" />
                  <input type="text" value={form.color_primary}
                    onChange={(e) => set('color_primary', e.target.value)}
                    className="flex-1 border rounded-lg px-2 py-1.5 text-xs font-mono" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Cor secundária</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.color_secondary}
                    onChange={(e) => set('color_secondary', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0" />
                  <input type="text" value={form.color_secondary}
                    onChange={(e) => set('color_secondary', e.target.value)}
                    className="flex-1 border rounded-lg px-2 py-1.5 text-xs font-mono" />
                </div>
              </div>
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
const AdminCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modal, setModal] = useState(null); // null | 'nova' | categoria_obj
  const [removendo, setRemovendo] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    getCategoriasGlobais()
      .then((d) => setCategorias(d.categorias ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleRemover = async (cat) => {
    if (!window.confirm(`Remover "${cat.name}"? Produtos vinculados perderão a categoria.`)) return;
    setRemovendo(cat.id);
    try {
      await removerCategoriaGlobal(cat.id);
      setCategorias((prev) => prev.filter((c) => c.id !== cat.id));
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
          <h1 className="text-xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500">Categorias globais da plataforma</p>
        </div>
        <AdminNav active="/admin/categorias" />
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{categorias.length} categoria(s)</p>
          <button
            onClick={() => setModal('nova')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon name="Plus" size={16} /> Nova Categoria
          </button>
        </div>

        {erro && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg px-4 py-3">{erro}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categorias.length === 0 ? (
          <div className="bg-white rounded-2xl border p-14 text-center">
            <Icon name="Tag" size={44} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">Nenhuma categoria cadastrada</p>
            <button onClick={() => setModal('nova')}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              Criar primeira categoria
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {categorias.map((cat) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 group hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${cat.color_primary}, ${cat.color_secondary})` }}
                  >
                    <Icon name={cat.icon_name ?? 'Tag'} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cat.icon_name} · {cat.total_produtos ?? 0} produto(s)
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModal(cat)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Icon name="Pencil" size={15} />
                    </button>
                    <button
                      onClick={() => handleRemover(cat)}
                      disabled={removendo === cat.id}
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
          categoria={modal === 'nova' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminCategorias;
