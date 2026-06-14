import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTags, criarTag, atualizarTag, removerTag } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

const AdminNav = ({ active }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const links = [
    { label: 'Dashboard',    path: '/admin' },
    { label: 'Empresas',     path: '/admin/empresas' },
    { label: 'Categorias',   path: '/admin/categorias' },
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

const slugify = (text) =>
  text.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const EMPTY = { name: '', slug: '', descricao: '', is_auto: false, ordem: 0, ativo: true };

const Modal = ({ tag, onClose, onSave }) => {
  const [form, setForm] = useState(
    tag
      ? { name: tag.name, slug: tag.slug, descricao: tag.descricao ?? '', is_auto: tag.is_auto, ordem: tag.ordem, ativo: tag.ativo }
      : { ...EMPTY }
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const isEdicao = !!tag;

  const set = (k, v) => setForm((f) => {
    const next = { ...f, [k]: v };
    // Auto-preenche slug ao digitar nome (só criação)
    if (k === 'name' && !isEdicao) next.slug = slugify(v);
    return next;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        descricao: form.descricao.trim() || null,
        is_auto: form.is_auto,
        ordem: Number(form.ordem) || 0,
      };
      if (isEdicao) {
        await atualizarTag(tag.id, { ...body, ativo: form.ativo });
      } else {
        await criarTag(body);
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
      <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-5">
          {isEdicao ? 'Editar Tag' : 'Nova Tag'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Em Promoção" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Slug *</label>
            <input required value={form.slug} onChange={(e) => set('slug', e.target.value)}
              disabled={isEdicao}
              className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="em_promocao" />
            {!isEdicao && (
              <p className="text-xs text-gray-400 mt-1">
                Identificador único. Não pode ser alterado depois de criado.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
            <input value={form.descricao} onChange={(e) => set('descricao', e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Breve descrição do carrossel" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ordem</label>
              <input type="number" min="0" value={form.ordem} onChange={(e) => set('ordem', e.target.value)}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_auto} onChange={(e) => set('is_auto', e.target.checked)}
                  disabled={isEdicao}
                  className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-gray-700">Automático</span>
              </label>
              {isEdicao && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>
              )}
            </div>
          </div>

          {form.is_auto && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Tags automáticas são calculadas pelo sistema (ex: mais vendidos por volume de vendas). O restaurante não pode atribuir manualmente.
            </p>
          )}

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

const AdminTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modal, setModal] = useState(null); // null | 'nova' | tag_obj
  const [removendo, setRemovendo] = useState(null);

  const carregar = useCallback(() => {
    setLoading(true);
    getTags()
      .then((d) => setTags(d.tags ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleToggle = async (tag) => {
    try {
      await atualizarTag(tag.id, { ativo: !tag.ativo });
      setTags((prev) => prev.map((t) => t.id === tag.id ? { ...t, ativo: !t.ativo } : t));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRemover = async (tag) => {
    if (!window.confirm(`Remover a tag "${tag.name}"? O carrossel correspondente deixará de aparecer no catálogo.`)) return;
    setRemovendo(tag.id);
    try {
      await removerTag(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
    } catch (e) {
      alert(e.message);
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tags do Catálogo</h1>
          <p className="text-sm text-gray-500">Cada tag ativa gera um carrossel no catálogo do restaurante</p>
        </div>
        <AdminNav active="/admin/tags" />
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{tags.length} tag(s)</p>
          <button onClick={() => setModal('nova')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2">
            <Icon name="Plus" size={16} /> Nova Tag
          </button>
        </div>

        {erro && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg px-4 py-3">{erro}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tags.length === 0 ? (
          <div className="bg-white rounded-2xl border p-14 text-center">
            <Icon name="Tag" size={44} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">Nenhuma tag cadastrada</p>
            <button onClick={() => setModal('nova')}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              Criar primeira tag
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {[...tags].sort((a, b) => a.ordem - b.ordem || a.name.localeCompare(b.name)).map((tag) => (
                <motion.div key={tag.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 group transition-all ${
                    tag.ativo ? 'border-gray-100 hover:shadow-md' : 'border-dashed border-gray-200 opacity-60'
                  }`}
                >
                  {/* Ordem */}
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                    {tag.ordem}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{tag.name}</span>
                      <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{tag.slug}</span>
                      {tag.is_auto && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                          Auto
                        </span>
                      )}
                      {!tag.ativo && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          Inativa
                        </span>
                      )}
                    </div>
                    {tag.descricao && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{tag.descricao}</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => handleToggle(tag)}
                      title={tag.ativo ? 'Desativar' : 'Ativar'}
                      className={`p-2 rounded-lg transition-colors ${
                        tag.ativo
                          ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}>
                      <Icon name={tag.ativo ? 'EyeOff' : 'Eye'} size={15} />
                    </button>
                    <button onClick={() => setModal(tag)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar">
                      <Icon name="Pencil" size={15} />
                    </button>
                    <button onClick={() => handleRemover(tag)} disabled={removendo === tag.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Remover">
                      <Icon name="Trash2" size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm font-semibold text-blue-800 mb-1">Como funciona</p>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Cada tag ativa gera um carrossel no catálogo do restaurante</li>
            <li>Tags <strong>automáticas</strong> são calculadas pelo sistema (ex: mais vendidos por volume de pedidos)</li>
            <li>Tags <strong>manuais</strong> são atribuídas pelo restaurante a produtos individuais no cadastro de produtos</li>
            <li>A ordem define a sequência dos carrosseis no catálogo</li>
          </ul>
        </div>
      </main>

      {modal && (
        <Modal
          tag={modal === 'nova' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminTags;
