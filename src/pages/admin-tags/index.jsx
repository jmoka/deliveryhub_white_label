import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTags, criarTag, atualizarTag, removerTag } from '../../services/adminService';
import Icon from '../../components/AppIcon';
import AdminHeader from '../../components/admin/AdminHeader';

const slugify = (text) =>
  text.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

/* ── Normaliza nome pra comparar sem acento/maiúscula ───────────── */
const normalizarNome = (s) =>
  (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

const EMPTY = { name: '', slug: '', descricao: '', is_auto: false, ordem: 0, ativo: true };

const Modal = ({ tag, tagsExistentes, onClose, onSave }) => {
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

    const nomeNormalizado = normalizarNome(form.name);
    const duplicada = (tagsExistentes ?? []).find(
      (t) => t.id !== tag?.id && normalizarNome(t.name) === nomeNormalizado
    );
    if (duplicada) {
      setErro(`Já existe uma tag chamada "${duplicada.name}"`);
      return;
    }

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
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-5">
          {isEdicao ? 'Editar Tag' : 'Nova Tag'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Nome *</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Em Promoção" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Slug *</label>
            <input required value={form.slug} onChange={(e) => set('slug', e.target.value)}
              disabled={isEdicao}
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-zinc-800 disabled:text-gray-400 dark:disabled:text-zinc-500"
              placeholder="em_promocao" />
            {!isEdicao && (
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                Identificador único. Não pode ser alterado depois de criado.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Descrição</label>
            <input value={form.descricao} onChange={(e) => set('descricao', e.target.value)}
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Breve descrição do carrossel" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Ordem</label>
              <input type="number" min="0" value={form.ordem} onChange={(e) => set('ordem', e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_auto} onChange={(e) => set('is_auto', e.target.checked)}
                  disabled={isEdicao}
                  className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-gray-700 dark:text-zinc-300">Automático</span>
              </label>
              {isEdicao && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-zinc-300">Ativo</span>
                </label>
              )}
            </div>
          </div>

          {form.is_auto && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
              Tags automáticas são calculadas pelo sistema (ex: mais vendidos por volume de vendas). O restaurante não pode atribuir manualmente.
            </p>
          )}

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

const AdminTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modal, setModal] = useState(null); // null | 'nova' | tag_obj
  const [removendo, setRemovendo] = useState(null);
  const [busca, setBusca] = useState('');

  const tagsFiltradas = tags.filter((t) => normalizarNome(t.name).includes(normalizarNome(busca)));

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
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/tags" title="Tags do Catálogo" subtitle="Cada tag ativa gera um carrossel no catálogo do restaurante" />

      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 dark:text-zinc-400">{tags.length} tag(s)</p>
          <button onClick={() => setModal('nova')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2">
            <Icon name="Plus" size={16} /> Nova Tag
          </button>
        </div>

        <div className="relative mb-6">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar tag já cadastrada..."
            className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {erro && <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{erro}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tags.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-14 text-center">
            <Icon name="Tag" size={44} className="text-gray-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-zinc-500 mb-4">Nenhuma tag cadastrada</p>
            <button onClick={() => setModal('nova')}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              Criar primeira tag
            </button>
          </div>
        ) : tagsFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-10 text-center">
            <Icon name="SearchX" size={36} className="text-gray-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-zinc-500">Nenhuma tag encontrada para "{busca}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {[...tagsFiltradas].sort((a, b) => a.ordem - b.ordem || a.name.localeCompare(b.name)).map((tag) => (
                <motion.div key={tag.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`bg-white dark:bg-zinc-800 rounded-2xl border px-5 py-4 flex items-center gap-4 group transition-all ${
                    tag.ativo ? 'border-gray-100 dark:border-zinc-700 hover:shadow-md' : 'border-dashed border-gray-200 dark:border-zinc-700 opacity-60'
                  }`}
                >
                  {/* Ordem */}
                  <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-zinc-400 flex-shrink-0">
                    {tag.ordem}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-zinc-100">{tag.name}</span>
                      <span className="text-xs font-mono text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 rounded">{tag.slug}</span>
                      {tag.is_auto && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                          Auto
                        </span>
                      )}
                      {!tag.ativo && (
                        <span className="text-xs bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                          Inativa
                        </span>
                      )}
                    </div>
                    {tag.descricao && (
                      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{tag.descricao}</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => handleToggle(tag)}
                      title={tag.ativo ? 'Desativar' : 'Ativar'}
                      className={`p-2 rounded-lg transition-colors ${
                        tag.ativo
                          ? 'text-gray-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-gray-400 dark:text-zinc-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40'
                      }`}>
                      <Icon name={tag.ativo ? 'EyeOff' : 'Eye'} size={15} />
                    </button>
                    <button onClick={() => setModal(tag)}
                      className="p-2 text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                      title="Editar">
                      <Icon name="Pencil" size={15} />
                    </button>
                    <button onClick={() => handleRemover(tag)} disabled={removendo === tag.id}
                      className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-40"
                      title="Remover">
                      <Icon name="Trash2" size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Como funciona</p>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
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
          tagsExistentes={tags}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminTags;
