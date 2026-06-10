import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMeusProdutos, criarProduto, editarProduto, deletarProduto, toggleProduto,
  getCategoriasGlobais,
} from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const EMPTY_FORM = { name: '', description: '', price: '', preco_promo: '', image_url: '', category_id: '', tipo: 'normal', destaque: false };

const RestauranteProdutos = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(null);

  const carregar = () => {
    setLoading(true);
    Promise.all([getMeusProdutos(), getCategoriasGlobais()])
      .then(([p, c]) => {
        setProdutos(p.produtos ?? []);
        setCategorias(c.categorias ?? []);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const abrirEditar = (p) => {
    setEditando(p);
    setForm({
      name: p.name ?? '',
      description: p.description ?? '',
      price: p.price != null ? String(p.price) : '',
      preco_promo: p.preco_promo != null ? String(p.preco_promo) : '',
      image_url: p.image_url ?? '',
      category_id: p.category_id != null ? String(p.category_id) : '',
      tipo: p.tipo ?? 'normal',
      destaque: p.destaque ?? false,
    });
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditando(null);
    setForm(EMPTY_FORM);
  };

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
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      preco_promo: form.preco_promo ? parseFloat(form.preco_promo) : null,
      image_url: form.image_url || null,
      category_id: parseInt(form.category_id),
      tipo: form.tipo,
      destaque: form.destaque,
    };
    try {
      if (editando) {
        const atualizado = await editarProduto(editando.id, payload);
        setProdutos((prev) => prev.map((p) => (p.id === editando.id ? atualizado : p)));
      } else {
        const novo = await criarProduto(payload);
        setProdutos((prev) => [...prev, novo]);
      }
      fecharModal();
    } catch (e) {
      alert(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (produto) => {
    if (!window.confirm(`Deletar "${produto.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeletando(produto.id);
    try {
      await deletarProduto(produto.id);
      setProdutos((prev) => prev.filter((p) => p.id !== produto.id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeletando(null);
    }
  };

  const catMap = Object.fromEntries(categorias.map((c) => [c.id, c.name]));

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
        <h1 className="text-xl font-bold text-[#18181B]">Produtos</h1>
        <nav className="flex gap-1.5 flex-wrap">
          {links.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                l.path === '/restaurante/produtos'
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

      <main className="p-6 max-w-4xl mx-auto">
        {erro && <p className="text-red-600 mb-4 text-sm">{erro}</p>}

        {/* Categorias globais */}
        <section className="bg-white rounded-xl border border-[#E4E4E7] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#18181B]">Categorias da plataforma</h2>
            <p className="text-xs text-[#71717A]">Gerenciadas pelo admin</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <span key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${c.color_primary ?? '#FF441F'}, ${c.color_secondary ?? '#FF7A00'})` }}>
                <span className="text-xs">{c.icon_name}</span>
                {c.name}
              </span>
            ))}
            {categorias.length === 0 && <p className="text-sm text-[#71717A]">Nenhuma categoria cadastrada</p>}
          </div>
        </section>

        {/* Produtos */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#18181B]">
            Produtos <span className="text-gray-400 font-normal">({produtos.length})</span>
          </h2>
          <button
            onClick={abrirNovo}
            className="px-4 py-2 text-sm bg-[#FF441F] text-white rounded-lg hover:bg-[#e03b1a]"
          >
            + Novo produto
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : produtos.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-400 mb-3">Nenhum produto cadastrado</p>
            <button onClick={abrirNovo} className="text-sm text-[#FF441F] hover:underline">
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
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{p.name}</p>
                      {p.destaque && <span className="text-xs">⭐</span>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {p.tipo !== 'normal' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                          p.tipo === 'promo' ? 'bg-green-100 text-green-700'
                          : p.tipo === 'combo' ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {p.tipo === 'promo' ? 'PROMO' : p.tipo === 'combo' ? 'COMBO' : 'TOP'}
                        </span>
                      )}
                      <button
                        onClick={() => handleToggle(p)}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                  </div>
                  {p.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{p.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold text-[#FF441F]">{fmt(p.price)}</p>
                    {p.tipo === 'promo' && p.preco_promo && (
                      <p className="text-xs text-green-600 font-semibold">{fmt(p.preco_promo)} promo</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{catMap[p.category_id] ?? 'Sem categoria'}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-[#E4E4E7] text-[#27272A] hover:bg-[#F4F4F5]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(p)}
                      disabled={deletando === p.id}
                      className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletando === p.id ? '...' : 'Deletar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal criar / editar produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#18181B] mb-4">
              {editando ? 'Editar Produto' : 'Novo Produto'}
            </h2>
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
                    className="w-full border rounded-lg px-3 py-2 text-sm"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="mais_vendido">Mais Vendido</option>
                  <option value="promo">Promoção</option>
                  <option value="combo">Combo</option>
                </select>
              </div>
              {form.tipo === 'promo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço promocional (R$)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.preco_promo}
                    onChange={(e) => setForm((f) => ({ ...f, preco_promo: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Preço com desconto"
                  />
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.destaque}
                  onChange={(e) => setForm((f) => ({ ...f, destaque: e.target.checked }))}
                  className="w-4 h-4 accent-[#FF441F]"
                />
                <span className="text-sm text-gray-700">⭐ Destacar produto</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2 text-sm bg-[#FF441F] text-white rounded-lg hover:bg-[#e03b1a] disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Criar Produto'}
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
