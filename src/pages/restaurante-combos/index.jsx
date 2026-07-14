import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMeusCombos, getComboDetalhe, criarCombo, editarCombo, deletarCombo,
  getMeusProdutos,
} from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const EMPTY_FORM = { name: '', description: '', price: '', preco_promo: '', image_url: '', destaque: false, items: [] };

const RestauranteCombos = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [combos, setCombos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(null);

  const carregar = () => {
    setLoading(true);
    Promise.all([getMeusCombos(), getMeusProdutos()])
      .then(([c, p]) => {
        setCombos(c.combos ?? []);
        setProdutos(p.produtos ?? []);
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

  const abrirEditar = async (combo) => {
    try {
      const detalhe = await getComboDetalhe(combo.id);
      setEditando(detalhe);
      setForm({
        name: detalhe.name ?? '',
        description: detalhe.description ?? '',
        price: detalhe.price != null ? String(detalhe.price) : '',
        preco_promo: detalhe.preco_promo != null ? String(detalhe.preco_promo) : '',
        image_url: detalhe.image_url ?? '',
        destaque: detalhe.destaque ?? false,
        items: (detalhe.items ?? []).map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      setShowModal(true);
    } catch (e) {
      alert(e.message);
    }
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditando(null);
    setForm(EMPTY_FORM);
  };

  const addItem = (product_id) => {
    const id = parseInt(product_id);
    if (!id) return;
    setForm((f) => {
      if (f.items.some((i) => i.product_id === id)) return f;
      return { ...f, items: [...f.items, { product_id: id, quantity: 1 }] };
    });
  };

  const removeItem = (product_id) => {
    setForm((f) => ({ ...f, items: f.items.filter((i) => i.product_id !== product_id) }));
  };

  const setQty = (product_id, qty) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((i) => i.product_id === product_id ? { ...i, quantity: Math.max(1, parseInt(qty) || 1) } : i),
    }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { alert('Nome e preço são obrigatórios'); return; }
    if (form.items.length === 0) { alert('Adicione pelo menos 1 produto ao combo'); return; }
    setSalvando(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      preco_promo: form.preco_promo ? parseFloat(form.preco_promo) : null,
      image_url: form.image_url || null,
      destaque: form.destaque,
      items: form.items,
    };
    try {
      if (editando) {
        const atualizado = await editarCombo(editando.id, payload);
        setCombos((prev) => prev.map((c) => (c.id === editando.id ? { ...c, ...atualizado } : c)));
      } else {
        const novo = await criarCombo(payload);
        setCombos((prev) => [...prev, novo]);
      }
      fecharModal();
    } catch (e) {
      alert(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (combo) => {
    if (!window.confirm(`Deletar combo "${combo.name}"?`)) return;
    setDeletando(combo.id);
    try {
      await deletarCombo(combo.id);
      setCombos((prev) => prev.filter((c) => c.id !== combo.id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeletando(null);
    }
  };

  const prodMap = Object.fromEntries(produtos.map((p) => [p.id, p]));
  const produtosSelecionados = new Set(form.items.map((i) => i.product_id));
  const produtosDisponiveis = produtos.filter((p) => !produtosSelecionados.has(p.id));

  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Combos', path: '/restaurante/combos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Entregas', path: '/restaurante/entregas' },
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Config', path: '/restaurante/config' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#18181B]">Combos</h1>
        <nav className="flex gap-1.5 flex-wrap">
          {links.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                l.path === '/restaurante/combos'
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

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#18181B]">
            Combos <span className="text-gray-400 font-normal">({combos.length})</span>
          </h2>
          <button onClick={abrirNovo} className="px-4 py-2 text-sm bg-[#FF441F] text-white rounded-lg hover:bg-[#e03b1a]">
            + Novo combo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : combos.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-400 mb-3">Nenhum combo cadastrado</p>
            <button onClick={abrirNovo} className="text-sm text-[#FF441F] hover:underline">
              Criar primeiro combo →
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {combos.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border p-4 flex gap-3">
                {c.image_url && (
                  <img src={c.image_url} alt={c.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {c.destaque && '⭐ '}{c.name}
                    </p>
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-purple-100 text-purple-700 flex-shrink-0">COMBO</span>
                  </div>
                  {c.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{c.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold text-[#FF441F]">{fmt(c.price)}</p>
                    {c.preco_promo && (
                      <p className="text-xs text-green-600 font-semibold">{fmt(c.preco_promo)} promo</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => abrirEditar(c)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-[#E4E4E7] text-[#27272A] hover:bg-[#F4F4F5]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(c)}
                      disabled={deletando === c.id}
                      className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletando === c.id ? '...' : 'Deletar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal criar / editar combo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#18181B] mb-4">
              {editando ? 'Editar Combo' : 'Novo Combo'}
            </h2>
            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: Combo Família"
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
                  placeholder="O que vem incluso..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço promo (R$)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.preco_promo}
                    onChange={(e) => setForm((f) => ({ ...f, preco_promo: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Opcional"
                  />
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

              {/* Produtos do combo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produtos do combo *
                  <span className="text-xs text-[#71717A] font-normal ml-1">({form.items.length} adicionado{form.items.length !== 1 ? 's' : ''})</span>
                </label>

                {/* Itens já adicionados */}
                {form.items.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {form.items.map((item) => {
                      const prod = prodMap[item.product_id];
                      return (
                        <div key={item.product_id} className="flex items-center gap-2 bg-[#F4F4F5] rounded-lg px-3 py-2">
                          <p className="flex-1 text-sm text-[#18181B] truncate">{prod?.name ?? `Produto #${item.product_id}`}</p>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setQty(item.product_id, item.quantity - 1)}
                              className="w-6 h-6 rounded-full bg-white border text-sm font-bold flex items-center justify-center hover:bg-gray-50">
                              -
                            </button>
                            <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => setQty(item.product_id, item.quantity + 1)}
                              className="w-6 h-6 rounded-full bg-white border text-sm font-bold flex items-center justify-center hover:bg-gray-50">
                              +
                            </button>
                          </div>
                          <button type="button" onClick={() => removeItem(item.product_id)}
                            className="text-red-500 hover:text-red-700 text-sm font-bold ml-1">
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Adicionar produto */}
                {produtosDisponiveis.length > 0 ? (
                  <select
                    onChange={(e) => { addItem(e.target.value); e.target.value = ''; }}
                    defaultValue=""
                    className="w-full border rounded-lg px-3 py-2 text-sm text-[#71717A]"
                  >
                    <option value="" disabled>+ Adicionar produto...</option>
                    {produtosDisponiveis.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-[#71717A]">Todos os produtos já foram adicionados</p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.destaque}
                  onChange={(e) => setForm((f) => ({ ...f, destaque: e.target.checked }))}
                  className="w-4 h-4 accent-[#FF441F]"
                />
                <span className="text-sm text-gray-700">⭐ Destacar combo</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={fecharModal}
                  className="flex-1 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  className="flex-1 py-2 text-sm bg-[#FF441F] text-white rounded-lg hover:bg-[#e03b1a] disabled:opacity-50">
                  {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Criar Combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestauranteCombos;
