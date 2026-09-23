import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getVideosAcademiaAdmin, criarVideoAcademia, atualizarVideoAcademia,
  removerVideoAcademia, uploadVideoAcademia,
} from '../../services/adminService';
import { ACADEMIA_PERFIS, ACADEMIA_CATEGORIAS, getCategoriaLabel } from '../../config/academiaCatalogo';
import Icon from '../../components/AppIcon';
import AdminHeader from '../../components/admin/AdminHeader';

const normalizar = (s) => (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

const fmtDuracao = (seg) => {
  if (!seg) return null;
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const perfilInfo = (id) => ACADEMIA_PERFIS.find((p) => p.id === id);

const EMPTY = { titulo: '', descricao: '', categoria: '', perfis: [], url_video: '', duracao_seg: null, ordem: 0, ativo: true };

const Modal = ({ video, onClose, onSave }) => {
  const [form, setForm] = useState(
    video
      ? { titulo: video.titulo, descricao: video.descricao ?? '', categoria: video.categoria, perfis: video.perfis ?? [], url_video: video.url_video, duracao_seg: video.duracao_seg, ordem: video.ordem, ativo: video.ativo }
      : { ...EMPTY }
  );
  const [modoVideo, setModoVideo] = useState('url'); // 'url' | 'upload'
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const videoProbeRef = useRef(null);
  const isEdicao = !!video;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const togglePerfil = (perfilId) => {
    setForm((f) => {
      const perfis = f.perfis.includes(perfilId) ? f.perfis.filter((p) => p !== perfilId) : [...f.perfis, perfilId];
      // Categoria escolhida pode não existir mais nos perfis marcados — limpa se ficou inválida.
      const categoriasValidas = perfis.flatMap((p) => (ACADEMIA_CATEGORIAS[p] ?? []).map((c) => c.slug));
      const categoria = categoriasValidas.includes(f.categoria) ? f.categoria : '';
      return { ...f, perfis, categoria };
    });
  };

  // Autodetecta duração assim que a URL do vídeo fica disponível (upload ou
  // colada manualmente) — usuário ainda pode corrigir o campo depois.
  const autodetectarDuracao = (url) => {
    if (!url) return;
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      if (Number.isFinite(el.duration)) set('duracao_seg', Math.round(el.duration));
    };
    el.src = url;
    videoProbeRef.current = el;
  };

  useEffect(() => () => { if (videoProbeRef.current) videoProbeRef.current.src = ''; }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setEnviando(true);
    setErro(null);
    try {
      const { url } = await uploadVideoAcademia(file);
      set('url_video', url);
      autodetectarDuracao(url);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.categoria || form.perfis.length === 0 || !form.url_video.trim()) {
      setErro('Preencha título, categoria, ao menos um painel e o vídeo.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const body = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        categoria: form.categoria,
        perfis: form.perfis,
        url_video: form.url_video.trim(),
        duracao_seg: form.duracao_seg ? Number(form.duracao_seg) : null,
        ordem: Number(form.ordem) || 0,
      };
      if (isEdicao) {
        await atualizarVideoAcademia(video.id, { ...body, ativo: form.ativo });
      } else {
        await criarVideoAcademia(body);
      }
      onSave();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const categoriasDisponiveis = form.perfis.map((p) => ({ perfil: perfilInfo(p), opcoes: ACADEMIA_CATEGORIAS[p] ?? [] }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-lg p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-5">
          {isEdicao ? 'Editar Vídeo' : 'Novo Vídeo'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Título *</label>
            <input required value={form.titulo} onChange={(e) => set('titulo', e.target.value)}
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Como cadastrar seu estabelecimento" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Descrição</label>
            <input value={form.descricao} onChange={(e) => set('descricao', e.target.value)}
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Breve resumo do que o vídeo ensina" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Aparece em (painéis) *</label>
            <div className="flex flex-wrap gap-2">
              {ACADEMIA_PERFIS.map((p) => (
                <label key={p.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer select-none border ${
                    form.perfis.includes(p.id)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'
                  }`}>
                  <input type="checkbox" className="sr-only" checked={form.perfis.includes(p.id)} onChange={() => togglePerfil(p.id)} />
                  <Icon name={p.icon} size={13} /> {p.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Categoria *</label>
            <select required value={form.categoria} onChange={(e) => set('categoria', e.target.value)}
              disabled={form.perfis.length === 0}
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-zinc-800 disabled:text-gray-400">
              <option value="">{form.perfis.length === 0 ? 'Marque um painel primeiro' : 'Selecione...'}</option>
              {categoriasDisponiveis.map(({ perfil, opcoes }) => (
                <optgroup key={perfil.id} label={perfil.label}>
                  {opcoes.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Vídeo *</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setModoVideo('url')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${modoVideo === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300'}`}>
                URL manual
              </button>
              <button type="button" onClick={() => setModoVideo('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${modoVideo === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300'}`}>
                Enviar arquivo
              </button>
            </div>
            {modoVideo === 'url' ? (
              <input value={form.url_video} onChange={(e) => set('url_video', e.target.value)}
                onBlur={(e) => autodetectarDuracao(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://teusite.top/pediuvai/videos/..." />
            ) : (
              <div>
                <input type="file" accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => handleUpload(e.target.files?.[0])} disabled={enviando}
                  className="w-full text-sm text-gray-600 dark:text-zinc-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 dark:file:bg-blue-950/40 file:text-blue-700 dark:file:text-blue-400 file:text-sm file:font-semibold" />
                {enviando && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">Enviando vídeo...</p>}
                {form.url_video && !enviando && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 truncate">Enviado: {form.url_video}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Duração (seg)</label>
              <input type="number" min="0" value={form.duracao_seg ?? ''} onChange={(e) => set('duracao_seg', e.target.value ? Number(e.target.value) : null)}
                placeholder="Auto"
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Ordem</label>
              <input type="number" min="0" value={form.ordem} onChange={(e) => set('ordem', e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {isEdicao && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600" />
              <span className="text-sm text-gray-700 dark:text-zinc-300">Ativo (visível no catálogo)</span>
            </label>
          )}

          {erro && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
              Cancelar
            </button>
            <button type="submit" disabled={salvando || enviando}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminAcademia = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modal, setModal] = useState(null); // null | 'novo' | video_obj
  const [removendo, setRemovendo] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('todos');

  const carregar = useCallback(() => {
    setLoading(true);
    getVideosAcademiaAdmin()
      .then((d) => setVideos(d.videos ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const videosFiltrados = videos
    .filter((v) => filtroPerfil === 'todos' || v.perfis?.includes(filtroPerfil))
    .filter((v) => normalizar(v.titulo).includes(normalizar(busca)));

  const handleToggle = async (video) => {
    try {
      await atualizarVideoAcademia(video.id, { ativo: !video.ativo });
      setVideos((prev) => prev.map((v) => v.id === video.id ? { ...v, ativo: !v.ativo } : v));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRemover = async (video) => {
    if (!window.confirm(`Remover o vídeo "${video.titulo}"? Ele some de todos os painéis onde aparece.`)) return;
    setRemovendo(video.id);
    try {
      await removerVideoAcademia(video.id);
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch (e) {
      alert(e.message);
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/academia" title="Academia" subtitle="Vídeos tutoriais exibidos em /academia" />

      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-sm text-gray-500 dark:text-zinc-400">{videos.length} vídeo(s)</p>
          <button onClick={() => setModal('novo')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2">
            <Icon name="Plus" size={16} /> Novo Vídeo
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar vídeo por título..."
              className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            <button onClick={() => setFiltroPerfil('todos')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${filtroPerfil === 'todos' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300'}`}>
              Todos
            </button>
            {ACADEMIA_PERFIS.map((p) => (
              <button key={p.id} onClick={() => setFiltroPerfil(p.id)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${filtroPerfil === p.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300'}`}>
                <Icon name={p.icon} size={12} /> {p.label}
              </button>
            ))}
          </div>
        </div>

        {erro && <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{erro}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-14 text-center">
            <Icon name="GraduationCap" size={44} className="text-gray-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-zinc-500 mb-4">Nenhum vídeo cadastrado</p>
            <button onClick={() => setModal('novo')}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              Criar primeiro vídeo
            </button>
          </div>
        ) : videosFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-10 text-center">
            <Icon name="SearchX" size={36} className="text-gray-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-zinc-500">Nenhum vídeo encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {[...videosFiltrados].sort((a, b) => a.categoria.localeCompare(b.categoria) || a.ordem - b.ordem).map((video) => (
                <motion.div key={video.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`bg-white dark:bg-zinc-800 rounded-2xl border px-5 py-4 flex items-center gap-4 group transition-all ${
                    video.ativo ? 'border-gray-100 dark:border-zinc-700 hover:shadow-md' : 'border-dashed border-gray-200 dark:border-zinc-700 opacity-60'
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-zinc-400 flex-shrink-0">
                    {video.ordem}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-zinc-100">{video.titulo}</span>
                      {fmtDuracao(video.duracao_seg) && (
                        <span className="text-xs font-mono text-gray-400 dark:text-zinc-500">{fmtDuracao(video.duracao_seg)}</span>
                      )}
                      {!video.ativo && (
                        <span className="text-xs bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-full">Inativo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {(video.perfis ?? []).map((pid) => {
                        const p = perfilInfo(pid);
                        if (!p) return null;
                        return (
                          <span key={pid} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                            <Icon name={p.icon} size={10} /> {p.label}
                          </span>
                        );
                      })}
                      <span className="text-xs font-mono text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 rounded">
                        {getCategoriaLabel(video.perfis?.[0], video.categoria)}
                      </span>
                    </div>
                    {video.descricao && (
                      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 truncate">{video.descricao}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => handleToggle(video)}
                      title={video.ativo ? 'Desativar' : 'Ativar'}
                      className={`p-2 rounded-lg transition-colors ${
                        video.ativo
                          ? 'text-gray-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-gray-400 dark:text-zinc-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40'
                      }`}>
                      <Icon name={video.ativo ? 'EyeOff' : 'Eye'} size={15} />
                    </button>
                    <button onClick={() => setModal(video)}
                      className="p-2 text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                      title="Editar">
                      <Icon name="Pencil" size={15} />
                    </button>
                    <button onClick={() => handleRemover(video)} disabled={removendo === video.id}
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
      </main>

      {modal && (
        <Modal
          video={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminAcademia;
