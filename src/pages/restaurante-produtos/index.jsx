import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMeusProdutos, criarProduto, toggleProduto,
  getMinhasCategorias, criarCategoria,
} from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const EMPTY_FORM = { name: '', description: '', price: '', image_url: '', category_id: '' };

const RestauranteProdutos = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  const carregar = () => {
    setLoading(true);
    Promise.all([getMeusProdutos(), getMinhasCategorias()])
      .then(([p, c]) => {
        setProdutos(p.produtos ?? []);
        setCategorias(c.categorias ?? []);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const handleToggle = async (produto) => {
    try {
      const atualizado = await toggleProduto(produto.id, !produto.is_active);
      setProdutos((prev) => prev.map((p) => (p.id === produto.id ? { ...p, is_active: atualizado.is_active } : p)));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category_id) {
      alert('Nome, preço e categoria são obrigatórios');
      return;
    }
    setSalvando(true);
    try {
      const novo = await criarProduto({
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        image_url: form.image_url || undefined,
        category_id: parseInt(form.category_id),
      });
      setProdutos((prev) => [...prev, novo]);
      setForm(EMPTY_FORM);
      setShowModal(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleCriarCategoria = async () => {
    if (!novaCategoria.trim()) return;
    setCriandoCategoria(true);
    try {
      const nova = await criarCategoria(novaCategoria.trim());
      setCategorias((prev) => [...prev, nova]);
      setNovaCategoria('');
    } catch (e) {
      alert(e.message);
    } finally {
      setCriandoCategoria(false);
    }
  };

  const catMap = Object.fromEntries(categorias.map((c) => [c.id, c.name]));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
        <nav className="flex gap-3">
          <button onClick={() => navigate('/restaurante')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Dashboard</button>
          <button onClick={() => navigate('/restaurante/produtos')} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg">Produtos</button>
          <button onClick={() => navigate('/restaurante/pedidos')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Pedidos</button>
          <button onClick={() => navigate('/restaurante/config')} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Config</button>
          <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200">Sair</button>
        </nav>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        {erro && <p className="text-red-600 mb-4 text-sm">{erro}</p>}

        {/* Categorias */}
        <section className="bg-white rounded-xl border p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Categorias</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {categorias.map((c) => (
              <span key={c.id} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                {c.name} ({c.total_produtos ?? 0})
              </span>
            ))}
            {categorias.length === 0 && <p className="text-sm text-gray-400">Nenhuma categoria</p>}
          </div>
          <div className="flex gap-2">
            <input
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Nova categoria..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleCriarCategoria()}
            />
            <button
              onClick={handleCriarCategoria}
              disabled={criandoCategoria || !novaCategoria.trim()}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {criandoCategoria ? '...' : 'Adicionar'}
            </button>
          </div>
        </section>

        {/* Produtos */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            Produtos <span className="text-gray-400 font-normal">({produtos.length})</span>
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            + Novo produto
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : produtos.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-400 mb-3">Nenhum produto cadastrado</p>
            <button onClick={() => setShowModal(true)} className="text-sm text-orange-500 hover:underline">
              Criar primeiro produto →
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {produtos.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border p-4 flex gap-3">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 truncate">{p.name}</p>
                    <button
                      onClick={() => handleToggle(p)}
                      className={`flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  {p.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{p.description}</p>}
                  <p className="text-sm font-semibold text-orange-600 mt-1">{fmt(p.price)}</p>
                  <p className="text-xs text-gray-400">{catMap[p.category_id] ?? 'Sem categoria'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal novo produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Produto</h2>
            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Nome do produto"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="mx-2 w-full border rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Selecionar</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da imagem</label>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                  className="flex-1 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestauranteProdutos;
