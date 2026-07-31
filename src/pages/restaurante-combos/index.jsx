import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMeusCombos, getComboDetalhe, criarCombo, editarCombo, deletarCombo,
  getMeusProdutos,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const EMPTY_FORM = { name: '', description: '', image_url: '', destaque: false, items: [] };

const RestauranteCombos = () => {
  const navigate = useNavigate();
  const [combos, setCombos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(null);
  const [alternando, setAlternando] = useState(null);
  const [buscaProduto, setBuscaProduto] = useState('');

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
    setBuscaProduto('');
    setShowModal(true);
  };

  const abrirEditar = async (combo) => {
    try {
      const detalhe = await getComboDetalhe(combo.id);
      setEditando(detalhe);
      setForm({
        name: detalhe.name ?? '',
        description: detalhe.description ?? '',
        image_url: detalhe.image_url ?? '',
        destaque: detalhe.destaque ?? false,
        items: (detalhe.items ?? []).map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          preco_no_combo: i.preco_no_combo ?? i.products?.price ?? 0,
        })),
      });
      setBuscaProduto('');
      setShowModal(true);
    } catch (e) {
      alert(e.message);
    }
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditando(null);
    setForm(EMPTY_FORM);
    setBuscaProduto('');
  };

  const addItem = (product_id) => {
    const id = parseInt(product_id);
    if (!id) return;
    const prod = prodMap[id];
    setForm((f) => {
      if (f.items.some((i) => i.product_id === id)) return f;
      // Preço no combo começa igual ao preço real — o dono abaixa se quiser dar desconto.
      return { ...f, items: [...f.items, { product_id: id, quantity: 1, preco_no_combo: prod?.price ?? 0 }] };
    });
    setBuscaProduto('');
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

  const setPrecoNoCombo = (product_id, valor) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((i) => i.product_id === product_id ? { ...i, preco_no_combo: Math.max(0, parseFloat(valor) || 0) } : i),
    }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.name) { alert('Nome é obrigatório'); return; }
    if (form.items.length === 0) { alert('Adicione pelo menos 1 produto ao combo'); return; }
    setSalvando(true);
    const payload = {
      name: form.name,
      description: form.description || null,
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

  const toggleAtivo = async (combo) => {
    setAlternando(combo.id);
    try {
      const atualizado = await editarCombo(combo.id, { is_active: !combo.is_active });
      setCombos((prev) => prev.map((c) => (c.id === combo.id ? { ...c, ...atualizado } : c)));
    } catch (e) {
      alert(e.message);
    } finally {
      setAlternando(null);
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
  const produtosFiltrados = produtosDisponiveis.filter((p) =>
    p.name.toLowerCase().includes(buscaProduto.trim().toLowerCase())
  );

  // Preço (R$) = soma do preço real de tabela; Preço promo (R$) = soma do que o
  // dono decidiu cobrar por cada produto dentro do combo — nenhum dos dois é
  // digitado direto, os dois vêm 100% dos itens selecionados.
  const precoTotalCalculado = form.items.reduce((acc, i) => acc + (prodMap[i.product_id]?.price ?? 0) * i.quantity, 0);
  const precoPromoCalculado = form.items.reduce((acc, i) => acc + (i.preco_no_combo ?? 0) * i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/combos" title="Combos" />

      <main className="p-6 max-w-4xl mx-auto">
        {erro && <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{erro}</p>}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">
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
          <div className="bg-white dark:bg-[#27272A] rounded-xl border p-12 text-center">
            <p className="text-gray-400 mb-3">Nenhum combo cadastrado</p>
            <button onClick={abrirNovo} className="text-sm text-[#FF441F] hover:underline">
              Criar primeiro combo →
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {combos.map((c) => (
              <div key={c.id} className="bg-white dark:bg-[#27272A] rounded-xl border p-4 flex gap-3">
                {c.image_url && (
                  <img src={c.image_url} alt={c.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-400 truncate">
                      {c.destaque && '⭐ '}{c.name}
                    </p>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400">COMBO</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.is_active ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400'}`}>
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  {c.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{c.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold text-[#FF441F]">{fmt(c.price)}</p>
                    {c.preco_promo != null && c.preco_promo !== c.price && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold">{fmt(c.preco_promo)} promo</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => toggleAtivo(c)}
                      disabled={alternando === c.id}
                      className="text-xs px-2.5 py-1 rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-50"
                    >
                      {alternando === c.id ? '...' : c.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => abrirEditar(c)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(c)}
                      disabled={deletando === c.id}
                      className="text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
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
          <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] mb-4">
              {editando ? 'Editar Combo' : 'Novo Combo'}
            </h2>
            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: Combo Família"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="O que vem incluso..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Preço (R$)</label>
                  <div className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm font-semibold">
                    {fmt(precoTotalCalculado)}
                  </div>
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Soma do preço real dos produtos</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Preço promo (R$)</label>
                  <div className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-[#F4F4F5] dark:bg-[#3F3F46] text-green-600 dark:text-green-400 rounded-lg px-3 py-2 text-sm font-semibold">
                    {fmt(precoPromoCalculado)}
                  </div>
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Soma do valor por produto abaixo</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">URL da imagem</label>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>

              {/* Produtos do combo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                  Produtos do combo *
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-normal ml-1">({form.items.length} adicionado{form.items.length !== 1 ? 's' : ''})</span>
                </label>

                {/* Itens já adicionados */}
                {form.items.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {form.items.map((item) => {
                      const prod = prodMap[item.product_id];
                      return (
                        <div key={item.product_id} className="bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-lg px-3 py-2 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <p className="flex-1 text-sm text-[#18181B] dark:text-[#F4F4F5] truncate">{prod?.name ?? `Produto #${item.product_id}`}</p>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => setQty(item.product_id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-white dark:bg-[#27272A] border text-sm font-bold flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-950/40">
                                -
                              </button>
                              <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                              <button type="button" onClick={() => setQty(item.product_id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full bg-white dark:bg-[#27272A] border text-sm font-bold flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-950/40">
                                +
                              </button>
                            </div>
                            <button type="button" onClick={() => removeItem(item.product_id)}
                              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400 text-sm font-bold ml-1">
                              ×
                            </button>
                          </div>
                          <div className="flex items-center gap-2 pl-0.5">
                            <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] flex-shrink-0">
                              Preço real: {fmt(prod?.price)} un.
                            </span>
                            <span className="text-[#71717A] dark:text-[#A1A1AA]">·</span>
                            <label className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 flex-shrink-0">
                              Cobrar no combo:
                              <input
                                type="number" min="0" step="0.01"
                                value={item.preco_no_combo}
                                onChange={(e) => setPrecoNoCombo(item.product_id, e.target.value)}
                                className="w-20 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded px-1.5 py-0.5 text-xs"
                              />
                              un.
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Adicionar produto */}
                {produtosDisponiveis.length > 0 ? (
                  <div className="relative">
                    <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
                    <input
                      type="text"
                      value={buscaProduto}
                      onChange={(e) => setBuscaProduto(e.target.value)}
                      placeholder="Buscar produto para adicionar..."
                      className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] rounded-lg pl-9 pr-3 py-2 text-sm text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:border-[#FF441F]"
                    />
                    {buscaProduto.trim() && (
                      <div className="mt-1 max-h-48 overflow-y-auto border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg bg-white dark:bg-[#18181B] divide-y divide-[#E4E4E7] dark:divide-[#3F3F46]">
                        {produtosFiltrados.length > 0 ? produtosFiltrados.map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => addItem(p.id)}
                            className="w-full text-left px-3 py-2 text-sm text-[#18181B] dark:text-[#F4F4F5] hover:bg-gray-50 dark:hover:bg-gray-950/40"
                          >
                            {p.name} — {fmt(p.price)}
                          </button>
                        )) : (
                          <p className="px-3 py-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">Nenhum produto encontrado</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Todos os produtos já foram adicionados</p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.destaque}
                  onChange={(e) => setForm((f) => ({ ...f, destaque: e.target.checked }))}
                  className="w-4 h-4 accent-[#FF441F]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-400">⭐ Destacar combo</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={fecharModal}
                  className="flex-1 py-2 text-sm border rounded-lg text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950/40">
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
