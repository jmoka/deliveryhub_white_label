import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoriasGlobais, criarCategoriaGlobal, atualizarCategoriaGlobal, removerCategoriaGlobal } from '../../services/adminService';
import Icon from '../../components/AppIcon';
import AdminHeader from '../../components/admin/AdminHeader';

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

/* ── Normaliza nome pra comparar sem acento/maiúscula ───────────── */
const normalizarNome = (s) =>
  (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

/* ── Modal criar/editar categoria ───────────────────────────────── */
const EMPTY = { name: '', icon_name: 'Tag', color_primary: '#FF441F', color_secondary: '#FF7A00' };

const Modal = ({ categoria, categoriasExistentes, onClose, onSave }) => {
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

    const nomeNormalizado = normalizarNome(form.name);
    const duplicada = (categoriasExistentes ?? []).find(
      (c) => c.id !== categoria?.id && normalizarNome(c.name) === nomeNormalizado
    );
    if (duplicada) {
      setErro(`Já existe uma categoria chamada "${duplicada.name}"`);
      return;
    }

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
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-5">
          {categoria ? 'Editar Categoria' : 'Nova Categoria'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${form.color_primary}, ${form.color_secondary})` }}>
              <Icon name={form.icon_name} size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-zinc-100">{form.name || 'Nome da categoria'}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{form.icon_name}</p>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Nome *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Hamburgueria"
            />
          </div>

          {/* Seletor de ícone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Ícone</label>
            <div className="grid grid-cols-8 gap-1.5 p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl max-h-48 overflow-y-auto">
              {ICONES.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  title={icon}
                  onClick={() => set('icon_name', icon)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    form.icon_name === icon
                      ? 'bg-blue-600 text-white shadow-md scale-110'
                      : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
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
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ou digite o nome exato do ícone (ex: Pizza)"
              />
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                Não achou o ícone que quer? Busque o nome em{' '}
                <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">
                  lucide.dev/icons
                </a>{' '}
                e digite aqui o nome do ícone (aceita qualquer formato, ex: <code>shopping-basket</code> ou <code>ShoppingBasket</code>).
              </p>
            </div>
          </div>

          {/* Seletor de cores */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Cores do gradiente</label>
            <div className="flex flex-wrap gap-2">
              {CORES.map((par) => (
                <button
                  key={par.c1}
                  type="button"
                  onClick={() => { set('color_primary', par.c1); set('color_secondary', par.c2); }}
                  className={`w-10 h-10 rounded-xl shadow-sm transition-all ${
                    form.color_primary === par.c1 ? 'ring-2 ring-offset-2 ring-blue-500 ring-offset-white dark:ring-offset-zinc-800 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${par.c1}, ${par.c2})` }}
                />
              ))}
            </div>
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">Cor primária</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.color_primary}
                    onChange={(e) => set('color_primary', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0" />
                  <input type="text" value={form.color_primary}
                    onChange={(e) => set('color_primary', e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-lg px-2 py-1.5 text-xs font-mono" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">Cor secundária</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.color_secondary}
                    onChange={(e) => set('color_secondary', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0" />
                  <input type="text" value={form.color_secondary}
                    onChange={(e) => set('color_secondary', e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-lg px-2 py-1.5 text-xs font-mono" />
                </div>
              </div>
            </div>
          </div>

          {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
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
  const [busca, setBusca] = useState('');

  const categoriasFiltradas = categorias.filter((c) =>
    normalizarNome(c.name).includes(normalizarNome(busca))
  );

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
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/categorias" title="Categorias" subtitle="Categorias globais da plataforma" />

      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-3">
          <p className="text-sm text-gray-500 dark:text-zinc-400 whitespace-nowrap">{categorias.length} categoria(s)</p>
          <button
            onClick={() => setModal('nova')}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2 flex-shrink-0"
          >
            <Icon name="Plus" size={16} /> <span className="hidden sm:inline">Nova Categoria</span><span className="sm:hidden">Nova</span>
          </button>
        </div>

        <div className="relative mb-6">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar categoria já cadastrada..."
            className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {erro && <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{erro}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categorias.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-14 text-center">
            <Icon name="Tag" size={44} className="text-gray-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-zinc-500 mb-4">Nenhuma categoria cadastrada</p>
            <button onClick={() => setModal('nova')}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              Criar primeira categoria
            </button>
          </div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-10 text-center">
            <Icon name="SearchX" size={36} className="text-gray-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-zinc-500">Nenhuma categoria encontrada para "{busca}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            <AnimatePresence>
              {categoriasFiltradas.map((cat) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 group hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${cat.color_primary}, ${cat.color_secondary})` }}
                  >
                    <Icon name={cat.icon_name ?? 'Tag'} size={18} className="sm:hidden" />
                    <Icon name={cat.icon_name ?? 'Tag'} size={24} className="hidden sm:block" />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <p className="font-bold text-gray-900 dark:text-zinc-100 text-sm sm:text-base truncate">{cat.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                      {cat.icon_name} · {cat.total_produtos ?? 0} produto(s)
                    </p>
                  </div>
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                    <button
                      onClick={() => setModal(cat)}
                      className="p-1.5 sm:p-2 text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Icon name="Pencil" size={15} />
                    </button>
                    <button
                      onClick={() => handleRemover(cat)}
                      disabled={removendo === cat.id}
                      className="p-1.5 sm:p-2 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-40"
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
          categoriasExistentes={categorias}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminCategorias;
