import React, { useState, useEffect } from 'react';
import { getPaginasLegaisAdmin, atualizarPaginaLegal } from '../../services/adminService';
import { parsePaginaLegal } from '../../utils/paginaLegal';
import AdminHeader from '../../components/admin/AdminHeader';
import Icon from '../../components/AppIcon';

const ABAS = [
  { slug: 'termos-de-uso', label: 'Termos de Uso' },
  { slug: 'politica-privacidade', label: 'Política de Privacidade' },
];

const fmtDataHora = (v) => (v ? new Date(v).toLocaleString('pt-BR') : '—');

const AdminPaginasLegais = () => {
  const [paginas, setPaginas] = useState({});
  const [abaAtiva, setAbaAtiva] = useState('termos-de-uso');
  const [rascunho, setRascunho] = useState({ titulo: '', conteudo: '' });
  const [preview, setPreview] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      const lista = await getPaginasLegaisAdmin();
      setPaginas(Object.fromEntries(lista.map((p) => [p.slug, p])));
      setErro(null);
    } catch (e) {
      setErro(e.message ?? 'Erro ao carregar páginas.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    const atual = paginas[abaAtiva];
    if (atual) setRascunho({ titulo: atual.titulo, conteudo: atual.conteudo });
    setPreview(false);
    setSucesso(false);
  }, [abaAtiva, paginas]);

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      const atualizado = await atualizarPaginaLegal(abaAtiva, rascunho);
      setPaginas((p) => ({ ...p, [abaAtiva]: atualizado }));
      setSucesso(true);
    } catch (e) {
      setErro(e.message ?? 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const paginaAtual = paginas[abaAtiva];
  const blocosPreview = preview ? parsePaginaLegal(rascunho.conteudo) : [];
  const alterado = paginaAtual && (rascunho.titulo !== paginaAtual.titulo || rascunho.conteudo !== paginaAtual.conteudo);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader
        active="/admin/paginas-legais"
        title="Páginas legais"
        subtitle="Termos de Uso e Política de Privacidade exibidos no cadastro e no app"
      />

      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex gap-1.5 mb-6">
          {ABAS.map((aba) => (
            <button
              key={aba.slug}
              onClick={() => setAbaAtiva(aba.slug)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                abaAtiva === aba.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>

        {erro && (
          <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">
            {erro}
          </p>
        )}
        {sucesso && (
          <p className="text-green-700 dark:text-green-400 text-sm mb-4 bg-green-50 dark:bg-green-950/30 rounded-lg px-4 py-3">
            Salvo com sucesso.
          </p>
        )}

        {carregando ? (
          <p className="text-sm text-gray-500 dark:text-zinc-400">Carregando...</p>
        ) : (
          <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Última atualização: {fmtDataHora(paginaAtual?.atualizado_em)}
              </p>
              <button
                onClick={() => setPreview((p) => !p)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Icon name={preview ? 'Pencil' : 'Eye'} size={14} />
                {preview ? 'Voltar a editar' : 'Pré-visualizar'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">Título</label>
              <input
                value={rascunho.titulo}
                onChange={(e) => setRascunho((r) => ({ ...r, titulo: e.target.value }))}
                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {preview ? (
              <div className="border border-gray-200 dark:border-zinc-700 rounded-xl p-4 max-h-[60vh] overflow-y-auto space-y-3">
                {blocosPreview.map((bloco, i) => {
                  if (bloco.tipo === 'h2') {
                    return (
                      <h2 key={i} className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-4">
                        {bloco.texto}
                      </h2>
                    );
                  }
                  if (bloco.tipo === 'ul') {
                    return (
                      <ul key={i} className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-zinc-300">
                        {bloco.itens.map((item, j) => <li key={j}>{item}</li>)}
                      </ul>
                    );
                  }
                  return (
                    <p key={i} className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
                      {bloco.texto}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  Conteúdo — linhas com "## " viram título de seção, linhas com "- " viram item de lista, linha em branco separa parágrafos
                </label>
                <textarea
                  value={rascunho.conteudo}
                  onChange={(e) => setRascunho((r) => ({ ...r, conteudo: e.target.value }))}
                  rows={26}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              onClick={salvar}
              disabled={salvando || !alterado}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Icon name="Save" size={16} /> {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPaginasLegais;
