import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMeusProdutos, criarProduto, editarProduto, deletarProduto, toggleProduto,
  getMinhasCategorias, getCategoriasGlobais, criarCategoria, deletarCategoria,
  getTagsPublicas, listarImpressoras,
} from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import ImageUpload from '../../components/ui/ImageUpload';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';
import RestauranteSidebar from '../../components/restaurante/RestauranteSidebar';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const EMPTY_FORM = { name: '', description: '', price: '', preco_promo: '', image_url: '', category_id: '', tags: [], destaque: false, impressora_id: '', quantidade_estoque: '' };

const TagBadge = ({ slug, tagsMap }) => {
  const t = tagsMap[slug];
  if (!t) return <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-gray-100 text-gray-600">{slug}</span>;
  return <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-orange-100 text-orange-700">{t.name}</span>;
};

const RestauranteProdutos = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriasGlobais, setCategoriasGlobais] = useState([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState([]); // tags não-auto do admin
  const [impressoras, setImpressoras] = useState([]);
  const tipoRestaurante = useTipoRestaurante();
  const [novaCategoria, setNovaCategoria] = useState('');
  const [criandoCateg, setCriandoCateg] = useState(false);
  const [deletandoCateg, setDeletandoCateg] = useState(null);
  const [showCategPanel, setShowCategPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(null);
  const [sidebarAberto, setSidebarAberto] = useState(false);

  const carregar = () => {
    setLoading(true);
    Promise.all([getMeusProdutos(), getMinhasCategorias(), getCategoriasGlobais(), getTagsPublicas()])
      .then(([p, mine, global, tagsResp]) => {
        setProdutos(p.produtos ?? []);
        setCategorias(mine.categorias ?? []);
        setCategoriasGlobais(global.categorias ?? []);
        // Só tags manuais (is_auto=false) — restaurante pode atribuir
        setTagsDisponiveis((tagsResp.tags ?? []).filter((t) => !t.is_auto));
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);
  useEffect(() => { if (tipoRestaurante) listarImpressoras().then(setImpressoras).catch(() => {}); }, [tipoRestaurante]);

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
      tags: Array.isArray(p.tags) ? p.tags : [],
      destaque: p.destaque ?? false,
      impressora_id: p.impressora_id != null ? String(p.impressora_id) : '',
      quantidade_estoque: p.quantidade_estoque != null ? String(p.quantidade_estoque) : '0',
    });
    setShowModal(true);
  };

  const handleCriarCategoria = async (e) => {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    setCriandoCateg(true);
    try {
      const nova = await criarCategoria(novaCategoria.trim());
      setCategorias((prev) => [...prev, nova].sort((a, b) => a.name.localeCompare(b.name)));
      setNovaCategoria('');
    } catch (err) {
      alert(err.message);
    } finally {
      setCriandoCateg(false);
    }
  };

  const handleDeletarCategoria = async (cat) => {
    if (!window.confirm(`Deletar categoria "${cat.name}"? Os produtos ligados perderão esta categoria.`)) return;
    setDeletandoCateg(cat.id);
    try {
      await deletarCategoria(cat.id);
      setCategorias((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletandoCateg(null);
    }
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditando(null);
    setForm(EMPTY_FORM);
  };

  const toggleTag = (tag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
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
      tags: form.tags,
      destaque: form.destaque,
      impressora_id: form.impressora_id ? parseInt(form.impressora_id) : null,
      quantidade_estoque: form.quantidade_estoque !== '' ? parseInt(form.quantidade_estoque) : 0,
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

  const catMap = Object.fromEntries(
    [...categorias, ...categoriasGlobais].map((c) => [c.id, c.name])
  );
  const tagsMap = Object.fromEntries(tagsDisponiveis.map((t) => [t.slug, t]));
  // Identifica se alguma tag de promoção está ativa (slug contém 'promo')
  const temPromo = form.tags.some((s) => s.includes('promo'));

  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Relatórios', path: '/restaurante/relatorios' },
    { label: 'Delivery', path: '/restaurante/delivery' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Combos', path: '/restaurante/combos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Entregas', path: '/restaurante/entregas' },
    ...(tipoRestaurante ? [
      { label: 'Salão', path: '/restaurante/salao' },
      { label: 'Garçons', path: '/restaurante/garcons' },
      { label: 'Impressoras', path: '/restaurante/impressoras' },
    ] : []),
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  const slugLoja = useMinhaLojaSlug();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#18181B]">Produtos</h1>
        <nav className="md:hidden flex gap-1.5 flex-wrap">
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
          {slugLoja && (
            <button onClick={() => window.open(`/r/${slugLoja}`, '_blank')}
              className="px-3 py-2 text-sm font-semibold rounded-lg text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 flex items-center gap-1.5">
              <Icon name="ExternalLink" size={14} /> Loja
            </button>
          )}
          <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
            Sair
          </button>
        </nav>
        <button onClick={() => setSidebarAberto(true)}
          className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#27272A] hover:bg-[#F4F4F5] border border-[#E4E4E7]">
          <Icon name="Menu" size={18} /> Menu
        </button>
      </header>

      <RestauranteSidebar
        open={sidebarAberto}
        onClose={() => setSidebarAberto(false)}
        links={links}
        activePath="/restaurante/produtos"
        slugLoja={slugLoja}
        onSair={async () => { await signOut(); navigate('/customer-registration-login'); }}
      />

      <main className="p-6 max-w-4xl mx-auto">
        {erro && <p className="text-red-600 mb-4 text-sm">{erro}</p>}

        {/* Painel de categorias do restaurante */}
        <div className="bg-white rounded-xl border border-[#E4E4E7] mb-5">
          <button
            type="button"
            onClick={() => setShowCategPanel((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#18181B] text-sm">Minhas Categorias</span>
              <span className="text-xs text-[#71717A] bg-[#F4F4F5] px-2 py-0.5 rounded-full">{categorias.length}</span>
            </div>
            <span className="text-[#71717A] text-xs">{showCategPanel ? '▲' : '▼'}</span>
          </button>

          {showCategPanel && (
            <div className="px-5 pb-4 border-t border-[#F4F4F5]">
              {/* Criar nova */}
              <form onSubmit={handleCriarCategoria} className="flex gap-2 mt-3 mb-4">
                <input
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  placeholder="Nome da nova categoria..."
                  className="flex-1 border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
                />
                <button
                  type="submit"
                  disabled={criandoCateg || !novaCategoria.trim()}
                  className="px-4 py-2 text-sm bg-[#FF441F] text-white rounded-lg hover:bg-[#e03b1a] disabled:opacity-50"
                >
                  {criandoCateg ? '...' : '+ Criar'}
                </button>
              </form>

              {categorias.length === 0 ? (
                <p className="text-xs text-[#71717A]">Nenhuma categoria própria. Crie acima ou use as globais da plataforma.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categorias.map((c) => (
                    <div key={c.id} className="flex items-center gap-1.5 bg-[#F4F4F5] rounded-full px-3 py-1.5">
                      <span className="text-sm text-[#27272A]">{c.name}</span>
                      {c.total_produtos > 0 && (
                        <span className="text-[10px] text-[#71717A]">({c.total_produtos})</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletarCategoria(c)}
                        disabled={deletandoCateg === c.id}
                        className="text-[#A1A1AA] hover:text-red-500 text-sm leading-none disabled:opacity-40"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
                    <button
                      onClick={() => handleToggle(p)}
                      className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  {p.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{p.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold text-[#FF441F]">{fmt(p.price)}</p>
                    {p.tags?.includes('promo') && p.preco_promo && (
                      <p className="text-xs text-green-600 font-semibold">{fmt(p.preco_promo)} promo</p>
                    )}
                  </div>
                  {Array.isArray(p.tags) && p.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {p.tags.map((t) => <TagBadge key={t} slug={t} tagsMap={tagsMap} />)}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{catMap[p.category_id] ?? 'Sem categoria'}</p>
                  <p className={`text-xs mt-0.5 ${(p.quantidade_estoque ?? 0) <= 0 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    Estoque: {p.quantidade_estoque ?? 0}
                  </p>
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
              <div className="grid grid-cols-3 gap-3">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                  <input
                    type="number" min="0" step="1"
                    value={form.quantidade_estoque}
                    onChange={(e) => setForm((f) => ({ ...f, quantidade_estoque: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="0"
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
                    {categorias.length > 0 && (
                      <optgroup label="Minhas categorias">
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {categoriasGlobais.length > 0 && (
                      <optgroup label="Categorias da plataforma">
                        {categoriasGlobais.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>
              {tipoRestaurante && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impressora / setor</label>
                  <select
                    value={form.impressora_id}
                    onChange={(e) => setForm((f) => ({ ...f, impressora_id: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Sem impressora</option>
                    {impressoras.map((imp) => (
                      <option key={imp.id} value={imp.id}>{imp.nome} ({imp.setor})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do produto</label>
                <ImageUpload
                  value={form.image_url}
                  onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                  folder="produtos"
                  aspect="square"
                />
              </div>

              {/* Tags — multi-seleção (carregadas da API) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags / Carrosseis (pode marcar várias)</label>
                {tagsDisponiveis.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nenhuma tag disponível. O admin precisa criar tags primeiro.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tagsDisponiveis.map((t) => (
                      <button
                        key={t.slug}
                        type="button"
                        onClick={() => toggleTag(t.slug)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          form.tags.includes(t.slug)
                            ? 'bg-[#FF441F] text-white border-[#FF441F]'
                            : 'bg-white text-[#71717A] border-[#E4E4E7] hover:border-[#FF441F]'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Preço promo — só aparece se tag promo ativa */}
              {temPromo && (
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
