import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMeusProdutos, criarProduto, editarProduto, deletarProduto, toggleProduto,
  getMinhasCategorias, getCategoriasGlobais, criarCategoria, deletarCategoria,
  getTagsPublicas, listarImpressoras, getAparencia, updateAparencia, importarProdutos,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import ImageUpload from '../../components/ui/ImageUpload';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const EMPTY_FORM = { name: '', description: '', price: '', preco_promo: '', image_url: '', category_id: '', tags: [], destaque: false, impressora_id: '', quantidade_estoque: '', preco_custo: '', quantidade_minima: '' };

const JSON_FORMATO_EXEMPLO = JSON.stringify([
  {
    name: 'X-Burger',
    description: 'Pão, hambúrguer, queijo e salada',
    price: 25.90,
    category: 'Lanches',
    preco_promo: null,
    image_url: null,
    quantidade_estoque: 0,
    preco_custo: 0,
    quantidade_minima: 0,
    destaque: false,
    tags: [],
  },
  {
    name: 'Coca-Cola 350ml',
    price: 6.5,
    category: 'Bebidas',
  },
], null, 2);

const TagBadge = ({ slug, tagsMap }) => {
  const t = tagsMap[slug];
  if (!t) return <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-gray-100 dark:bg-gray-950/40 text-gray-600 dark:text-gray-400">{slug}</span>;
  return <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400">{t.name}</span>;
};

const RestauranteProdutos = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriasGlobais, setCategoriasGlobais] = useState([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState([]); // tags não-auto do admin
  const [impressoras, setImpressoras] = useState([]);
  const { moduloSalao } = useModulosEmpresa();
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
  const [adicionandoCarrossel, setAdicionandoCarrossel] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroEstoque, setFiltroEstoque] = useState('todos');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFormatoModal, setShowFormatoModal] = useState(false);
  const [jsonImport, setJsonImport] = useState('');
  const [erroImport, setErroImport] = useState(null);
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState(null);
  const [copiadoFormato, setCopiadoFormato] = useState(false);
  const [viewMode, setViewMode] = useState('cards');
  const [editCell, setEditCell] = useState(null); // { id, campo }
  const [editValue, setEditValue] = useState('');
  const [salvandoCell, setSalvandoCell] = useState(null); // `${id}-${campo}`

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
  useEffect(() => { if (moduloSalao) listarImpressoras().then(setImpressoras).catch(() => {}); }, [moduloSalao]);

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
      preco_custo: p.preco_custo != null ? String(p.preco_custo) : '',
      quantidade_minima: p.quantidade_minima != null ? String(p.quantidade_minima) : '0',
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

  const abrirImportModal = () => {
    setJsonImport('');
    setErroImport(null);
    setResultadoImport(null);
    setShowImportModal(true);
  };

  const fecharImportModal = () => {
    setShowImportModal(false);
    if (resultadoImport?.importados > 0) carregar();
  };

  const handleArquivoJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonImport(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  const copiarFormato = () => {
    navigator.clipboard?.writeText(JSON_FORMATO_EXEMPLO);
    setCopiadoFormato(true);
    setTimeout(() => setCopiadoFormato(false), 2000);
  };

  const handleImportar = async () => {
    setErroImport(null);
    let lista;
    try {
      lista = JSON.parse(jsonImport);
    } catch {
      setErroImport('JSON inválido. Confira o formato (veja o link "Ver formato padrão do JSON").');
      return;
    }
    if (!Array.isArray(lista) || lista.length === 0) {
      setErroImport('O JSON precisa ser uma lista com pelo menos um produto.');
      return;
    }
    setImportando(true);
    try {
      const resultado = await importarProdutos(lista);
      setResultadoImport(resultado);
    } catch (err) {
      setErroImport(err.message);
    } finally {
      setImportando(false);
    }
  };

  // Edição rápida de célula na visão em tabela (Preço, Estoque, Categoria, etc.)
  const CAMPOS_NUMERICOS = ['price', 'preco_promo', 'quantidade_estoque', 'quantidade_minima', 'preco_custo'];

  const iniciarEdicaoCelula = (produto, campo) => {
    if (salvandoCell) return;
    const valor = produto[campo];
    setEditValue(valor != null ? String(valor) : '');
    setEditCell({ id: produto.id, campo });
  };

  const cancelarEdicaoCelula = () => setEditCell(null);

  const salvarEdicaoCelula = async (produto, campo, valorForcado) => {
    const bruto = valorForcado !== undefined ? valorForcado : editValue;
    const valorOriginal = produto[campo];
    let novoValor;

    if (campo === 'name') {
      novoValor = bruto.trim();
      if (!novoValor) { cancelarEdicaoCelula(); return; }
    } else if (campo === 'category_id') {
      novoValor = bruto ? parseInt(bruto) : null;
      if (!novoValor) { cancelarEdicaoCelula(); return; }
    } else if (CAMPOS_NUMERICOS.includes(campo)) {
      if (String(bruto).trim() === '') {
        novoValor = campo === 'price' ? valorOriginal : (campo === 'preco_promo' ? null : 0);
      } else {
        const n = parseFloat(String(bruto).replace(',', '.'));
        if (Number.isNaN(n)) { cancelarEdicaoCelula(); return; }
        novoValor = n;
      }
    } else {
      novoValor = bruto;
    }

    if (String(valorOriginal ?? '') === String(novoValor ?? '')) { cancelarEdicaoCelula(); return; }

    const key = `${produto.id}-${campo}`;
    setSalvandoCell(key);
    try {
      const atualizado = await editarProduto(produto.id, { [campo]: novoValor });
      setProdutos((prev) => prev.map((p) => (p.id === produto.id ? atualizado : p)));
    } catch (e) {
      alert(e.message);
    } finally {
      setSalvandoCell(null);
      setEditCell(null);
    }
  };

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelarEdicaoCelula(); }
  };

  const toggleDestaqueCell = async (produto) => {
    const key = `${produto.id}-destaque`;
    setSalvandoCell(key);
    try {
      const atualizado = await editarProduto(produto.id, { destaque: !produto.destaque });
      setProdutos((prev) => prev.map((p) => (p.id === produto.id ? atualizado : p)));
    } catch (e) {
      alert(e.message);
    } finally {
      setSalvandoCell(null);
    }
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

  const handleAdicionarAoCarrossel = async (produto) => {
    if (!produto.image_url) return;
    setAdicionandoCarrossel(produto.id);
    try {
      const aparencia = await getAparencia();
      const atual = aparencia?.carousel_images ?? [];
      if (atual.includes(produto.image_url)) {
        alert('Essa imagem já está no carrossel.');
        return;
      }
      await updateAparencia({ carousel_images: [...atual, produto.image_url] });
      alert('Imagem adicionada ao carrossel!');
    } catch (e) {
      alert(e.message ?? 'Não foi possível adicionar ao carrossel.');
    } finally {
      setAdicionandoCarrossel(null);
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
      preco_custo: form.preco_custo !== '' ? parseFloat(form.preco_custo) : 0,
      quantidade_minima: form.quantidade_minima !== '' ? parseInt(form.quantidade_minima) : 0,
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

  // Célula editável genérica (texto/número) da visão em tabela
  const renderEditableCell = (produto, campo, { numero = false, align = 'left', formatar } = {}) => {
    const emEdicao = editCell?.id === produto.id && editCell?.campo === campo;
    const salvando = salvandoCell === `${produto.id}-${campo}`;
    const valorAtual = produto[campo];

    if (emEdicao) {
      return (
        <input
          autoFocus
          type={numero ? 'number' : 'text'}
          step={numero ? '0.01' : undefined}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={() => salvarEdicaoCelula(produto, campo)}
          onKeyDown={handleCellKeyDown}
          className={`w-full min-w-0 border border-[#FF441F] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded px-1.5 py-1 text-xs ${align === 'right' ? 'text-right' : ''}`}
        />
      );
    }

    return (
      <button
        type="button"
        onClick={() => iniciarEdicaoCelula(produto, campo)}
        disabled={!!salvandoCell}
        title="Clique para editar"
        className={`w-full px-1.5 py-1 rounded hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] text-xs ${align === 'right' ? 'text-right' : 'text-left'} ${salvando ? 'opacity-40' : ''}`}
      >
        {salvando ? '...' : formatar ? formatar(valorAtual) : (valorAtual != null ? valorAtual : '—')}
      </button>
    );
  };

  const renderCategoriaCell = (produto) => {
    const emEdicao = editCell?.id === produto.id && editCell?.campo === 'category_id';
    const salvando = salvandoCell === `${produto.id}-category_id`;

    if (emEdicao) {
      return (
        <select
          autoFocus
          value={editValue}
          onChange={(e) => { setEditValue(e.target.value); salvarEdicaoCelula(produto, 'category_id', e.target.value); }}
          onBlur={cancelarEdicaoCelula}
          className="w-full min-w-0 border border-[#FF441F] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded px-1 py-1 text-xs"
        >
          {categorias.length > 0 && (
            <optgroup label="Minhas categorias">
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          )}
          {categoriasGlobais.length > 0 && (
            <optgroup label="Categorias da plataforma">
              {categoriasGlobais.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          )}
        </select>
      );
    }

    return (
      <button
        type="button"
        onClick={() => iniciarEdicaoCelula(produto, 'category_id')}
        disabled={!!salvandoCell}
        title="Clique para editar"
        className={`w-full px-1.5 py-1 rounded hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] text-xs text-left ${salvando ? 'opacity-40' : ''}`}
      >
        {salvando ? '...' : (catMap[produto.category_id] ?? 'Sem categoria')}
      </button>
    );
  };

  const produtosFiltrados = produtos.filter((p) => {
    if (busca.trim() && !p.name.toLowerCase().includes(busca.trim().toLowerCase())) return false;
    if (filtroCategoria && String(p.category_id) !== filtroCategoria) return false;
    if (filtroStatus === 'ativos' && !p.is_active) return false;
    if (filtroStatus === 'inativos' && p.is_active) return false;
    if (filtroEstoque === 'sem_estoque' && (p.quantidade_estoque ?? 0) > 0) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/produtos" title="Produtos" />

      <main className={`p-6 mx-auto ${viewMode === 'tabela' ? 'max-w-[85%]' : 'max-w-4xl'}`}>
        {erro && <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{erro}</p>}

        {/* Painel de categorias do restaurante */}
        <div className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] mb-5">
          <button
            type="button"
            onClick={() => setShowCategPanel((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] text-sm">Minhas Categorias</span>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] bg-[#F4F4F5] dark:bg-[#3F3F46] px-2 py-0.5 rounded-full">{categorias.length}</span>
            </div>
            <span className="text-[#71717A] dark:text-[#A1A1AA] text-xs">{showCategPanel ? '▲' : '▼'}</span>
          </button>

          {showCategPanel && (
            <div className="px-5 pb-4 border-t border-[#F4F4F5] dark:border-[#3F3F46]">
              {/* Criar nova */}
              <form onSubmit={handleCriarCategoria} className="flex gap-2 mt-3 mb-4">
                <input
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  placeholder="Nome da nova categoria..."
                  className="flex-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
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
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Nenhuma categoria própria. Crie acima ou use as globais da plataforma.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categorias.map((c) => (
                    <div key={c.id} className="flex items-center gap-1.5 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-full px-3 py-1.5">
                      <span className="text-sm text-[#27272A] dark:text-[#F4F4F5]">{c.name}</span>
                      {c.total_produtos > 0 && (
                        <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">({c.total_produtos})</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletarCategoria(c)}
                        disabled={deletandoCateg === c.id}
                        className="text-[#A1A1AA] hover:text-red-500 dark:hover:text-red-400 text-sm leading-none disabled:opacity-40"
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

        <div className="flex items-start justify-between flex-wrap mb-4 gap-3">
          <div className="flex items-center flex-wrap gap-3 pt-2">
            <h2 className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">
              Produtos <span className="text-gray-400 font-normal">({produtosFiltrados.length}{produtosFiltrados.length !== produtos.length ? ` de ${produtos.length}` : ''})</span>
            </h2>
            <div className="flex border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'cards' ? 'bg-[#FF441F] text-white' : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]'}`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tabela')}
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'tabela' ? 'bg-[#FF441F] text-white' : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]'}`}
              >
                Tabela
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={abrirImportModal}
                className="px-4 py-2 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]"
              >
                Importar produtos (JSON)
              </button>
              <button
                onClick={abrirNovo}
                className="px-4 py-2 text-sm bg-[#FF441F] text-white rounded-lg hover:bg-[#e03b1a]"
              >
                + Novo produto
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowFormatoModal(true)}
              className="text-xs text-[#FF441F] hover:underline mt-1"
            >
              Ver formato padrão do JSON
            </button>
          </div>
        </div>

        {/* Filtros de consulta */}
        {produtos.length > 0 && (
          <div className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-3 mb-4 flex flex-col sm:flex-row gap-2">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome..."
              className="flex-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
            />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas categorias</option>
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
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
            >
              <option value="todos">Todos status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
            <select
              value={filtroEstoque}
              onChange={(e) => setFiltroEstoque(e.target.value)}
              className="border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
            >
              <option value="todos">Todo estoque</option>
              <option value="sem_estoque">Sem estoque</option>
            </select>
            {(busca || filtroCategoria || filtroStatus !== 'todos' || filtroEstoque !== 'todos') && (
              <button
                type="button"
                onClick={() => { setBusca(''); setFiltroCategoria(''); setFiltroStatus('todos'); setFiltroEstoque('todos'); }}
                className="px-3 py-2 text-sm text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5] whitespace-nowrap"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : produtos.length === 0 ? (
          <div className="bg-white dark:bg-[#27272A] rounded-xl border p-12 text-center">
            <p className="text-gray-400 mb-3">Nenhum produto cadastrado</p>
            <button onClick={abrirNovo} className="text-sm text-[#FF441F] hover:underline">
              Criar primeiro produto →
            </button>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-[#27272A] rounded-xl border p-12 text-center">
            <p className="text-gray-400">Nenhum produto encontrado com esse filtro</p>
          </div>
        ) : viewMode === 'tabela' ? (
          <div className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] overflow-x-auto">
            <p className="text-[11px] text-gray-400 px-3 pt-2">Clique em uma célula pra editar direto na lista. Enter ou clicar fora salva, Esc cancela.</p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E4E7] dark:border-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]">
                  <th className="text-left font-medium px-2 py-2 whitespace-nowrap">Produto</th>
                  <th className="text-left font-medium px-2 py-2 whitespace-nowrap">Categoria</th>
                  <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Preço</th>
                  <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Preço promo</th>
                  <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Custo</th>
                  <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Estoque</th>
                  <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Estoque mín.</th>
                  <th className="text-center font-medium px-2 py-2 whitespace-nowrap">⭐</th>
                  <th className="text-center font-medium px-2 py-2 whitespace-nowrap">Status</th>
                  <th className="text-center font-medium px-2 py-2 whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((p) => (
                  <tr key={p.id} className="border-b border-[#F4F4F5] dark:border-[#3F3F46] last:border-0 hover:bg-[#FAFAFA] dark:hover:bg-[#18181B]/50">
                    <td className="px-2 py-1 min-w-[160px]">{renderEditableCell(p, 'name')}</td>
                    <td className="px-2 py-1 min-w-[140px]">{renderCategoriaCell(p)}</td>
                    <td className="px-2 py-1 min-w-[90px]">{renderEditableCell(p, 'price', { numero: true, align: 'right', formatar: fmt })}</td>
                    <td className="px-2 py-1 min-w-[90px]">{renderEditableCell(p, 'preco_promo', { numero: true, align: 'right', formatar: (v) => (v != null ? fmt(v) : '—') })}</td>
                    <td className="px-2 py-1 min-w-[90px]">{renderEditableCell(p, 'preco_custo', { numero: true, align: 'right', formatar: fmt })}</td>
                    <td className="px-2 py-1 min-w-[70px]">{renderEditableCell(p, 'quantidade_estoque', { numero: true, align: 'right' })}</td>
                    <td className="px-2 py-1 min-w-[70px]">{renderEditableCell(p, 'quantidade_minima', { numero: true, align: 'right' })}</td>
                    <td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => toggleDestaqueCell(p)}
                        disabled={salvandoCell === `${p.id}-destaque`}
                        className="text-sm"
                        title="Destacar produto"
                      >
                        {p.destaque ? '⭐' : '☆'}
                      </button>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => handleToggle(p)}
                        className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                          p.is_active ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {p.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-2 py-1 text-center whitespace-nowrap">
                      <button onClick={() => abrirEditar(p)} title="Editar completo (imagem, tags, descrição)" className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#FF441F] px-1">
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeletar(p)}
                        disabled={deletando === p.id}
                        title="Deletar"
                        className="text-[#71717A] dark:text-[#A1A1AA] hover:text-red-500 dark:hover:text-red-400 px-1 disabled:opacity-50"
                      >
                        {deletando === p.id ? '...' : '🗑'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {produtosFiltrados.map((p) => (
              <div key={p.id} className="bg-white dark:bg-[#27272A] rounded-xl border p-4 flex gap-3">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-400 truncate">{p.name}</p>
                      {p.destaque && <span className="text-xs">⭐</span>}
                    </div>
                    <button
                      onClick={() => handleToggle(p)}
                      className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                        p.is_active ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  {p.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{p.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold text-[#FF441F]">{fmt(p.price)}</p>
                    {p.tags?.includes('promo') && p.preco_promo && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold">{fmt(p.preco_promo)} promo</p>
                    )}
                  </div>
                  {Array.isArray(p.tags) && p.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {p.tags.map((t) => <TagBadge key={t} slug={t} tagsMap={tagsMap} />)}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{catMap[p.category_id] ?? 'Sem categoria'}</p>
                  <p className={`text-xs mt-0.5 ${(p.quantidade_estoque ?? 0) <= 0 ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-400'}`}>
                    Estoque: {p.quantidade_estoque ?? 0}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleAdicionarAoCarrossel(p)}
                      disabled={!p.image_url || adicionandoCarrossel === p.id}
                      title={!p.image_url ? 'Produto sem imagem cadastrada' : 'Adicionar imagem ao carrossel da vitrine'}
                      className="text-xs px-2.5 py-1 rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] disabled:opacity-40"
                    >
                      {adicionandoCarrossel === p.id ? '...' : 'Carrossel'}
                    </button>
                    <button
                      onClick={() => handleDeletar(p)}
                      disabled={deletando === p.id}
                      className="text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
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
          <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] mb-4">
              {editando ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                  placeholder="Nome do produto"
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
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Preço (R$) *</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Estoque</label>
                  <input
                    type="number" min="0" step="1"
                    value={form.quantidade_estoque}
                    onChange={(e) => setForm((f) => ({ ...f, quantidade_estoque: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Categoria *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Preço de custo (R$)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.preco_custo}
                    onChange={(e) => setForm((f) => ({ ...f, preco_custo: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Estoque mínimo</label>
                  <input
                    type="number" min="0" step="1"
                    value={form.quantidade_minima}
                    onChange={(e) => setForm((f) => ({ ...f, quantidade_minima: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              {moduloSalao && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Impressora / setor</label>
                  <select
                    value={form.impressora_id}
                    onChange={(e) => setForm((f) => ({ ...f, impressora_id: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Sem impressora</option>
                    {impressoras.map((imp) => (
                      <option key={imp.id} value={imp.id}>{imp.nome} ({imp.setor})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Imagem do produto</label>
                <ImageUpload
                  value={form.image_url}
                  onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                  folder="produtos"
                  aspect="square"
                />
              </div>

              {/* Tags — multi-seleção (carregadas da API) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Tags / Carrosseis (pode marcar várias)</label>
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
                            : 'bg-white dark:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] border-[#E4E4E7] dark:border-[#3F3F46] hover:border-[#FF441F]'
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Preço promocional (R$)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.preco_promo}
                    onChange={(e) => setForm((f) => ({ ...f, preco_promo: e.target.value }))}
                    className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-sm"
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
                <span className="text-sm text-gray-700 dark:text-gray-400">⭐ Destacar produto</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 py-2 text-sm border rounded-lg text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950/40"
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

      {/* Modal formato padrão do JSON */}
      {showFormatoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] mb-2">Formato padrão do JSON</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Envie uma lista de produtos. Só <strong>name</strong>, <strong>price</strong> e <strong>category</strong> são obrigatórios — o resto é opcional.
              Se a categoria não existir ainda, ela é criada automaticamente. Produtos com nome igual a um já cadastrado
              (não importa maiúscula/minúscula) são ignorados na importação.
            </p>
            <pre className="bg-[#F4F4F5] dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] text-xs rounded-lg p-3 overflow-x-auto whitespace-pre">{JSON_FORMATO_EXEMPLO}</pre>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowFormatoModal(false)}
                className="flex-1 py-2 text-sm border rounded-lg text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950/40"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={copiarFormato}
                className="flex-1 py-2 text-sm bg-[#FF441F] text-white rounded-lg hover:bg-[#e03b1a]"
              >
                {copiadoFormato ? 'Copiado!' : 'Copiar exemplo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#27272A] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] mb-4">Importar produtos (JSON)</h2>

            {!resultadoImport ? (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Arquivo .json</label>
                  <input type="file" accept=".json,application/json" onChange={handleArquivoJson}
                    className="w-full text-sm text-gray-600 dark:text-gray-400" />
                </div>
                <p className="text-xs text-gray-400 mb-1">ou cole o JSON abaixo:</p>
                <textarea
                  value={jsonImport}
                  onChange={(e) => setJsonImport(e.target.value)}
                  rows={10}
                  placeholder="Cole aqui a lista de produtos em JSON..."
                  className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-3 py-2 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowFormatoModal(true)}
                  className="text-xs text-[#FF441F] hover:underline mt-1"
                >
                  Ver formato padrão do JSON
                </button>
                {erroImport && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{erroImport}</p>}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={fecharImportModal}
                    className="flex-1 py-2 text-sm border rounded-lg text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950/40"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleImportar}
                    disabled={importando || !jsonImport.trim()}
                    className="flex-1 py-2 text-sm bg-[#FF441F] text-white rounded-lg hover:bg-[#e03b1a] disabled:opacity-50"
                  >
                    {importando ? 'Importando...' : 'Importar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[#18181B] dark:text-[#F4F4F5] mb-3">
                  <strong className="text-green-600 dark:text-green-400">{resultadoImport.importados}</strong> de {resultadoImport.total} produto(s) importado(s).
                </p>
                {resultadoImport.nomes_importados.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">Importados:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                      {resultadoImport.nomes_importados.map((n) => <li key={n}>{n}</li>)}
                    </ul>
                  </div>
                )}
                {resultadoImport.ignorados.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Não importados ({resultadoImport.ignorados.length}):</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                      {resultadoImport.ignorados.map((i, idx) => <li key={idx}>{i.name} — {i.motivo}</li>)}
                    </ul>
                  </div>
                )}
                <button
                  type="button"
                  onClick={fecharImportModal}
                  className="w-full py-2 text-sm bg-[#FF441F] text-white rounded-lg hover:bg-[#e03b1a] mt-2"
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestauranteProdutos;
