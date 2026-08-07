import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmpresas, criarEmpresa, atualizarEmpresa, removerEmpresa, bloquearEmpresa, atenderSolicitacaoDominio, recusarSolicitacaoDominio, getPlataformaConfig } from '../../services/adminService';
import { getAssinaturas } from '../../services/planosService';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalMode, LocalModeBanner } from '../../contexts/LocalModeContext';
import { ThemeToggle } from '../../contexts/ThemeContext';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const AdminNav = ({ active }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const links = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Empresas', path: '/admin/empresas' },
    { label: 'Categorias', path: '/admin/categorias' },
    { label: 'Tipos',      path: '/admin/tipos-estabelecimento' },
    { label: 'Tags',       path: '/admin/tags' },
    { label: 'Comissões', path: '/admin/comissoes' },
    { label: 'Planos', path: '/admin/planos' },
    { label: 'Configurações', path: '/admin/configuracoes' },
  ];
  return (
    <nav className="flex gap-3 items-center">
      {links.map((l) => (
        <button
          key={l.path}
          onClick={() => navigate(l.path)}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            active === l.path ? 'text-white bg-blue-600' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
          }`}
        >
          {l.label}
        </button>
      ))}
      <button
        onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900"
      >
        Sair
      </button>
      <ThemeToggle inline />
    </nav>
  );
};

const Modal = ({ empresa, comissaoPadrao, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: empresa?.name ?? '',
    address: empresa?.address ?? '',
    comissao_pct: empresa?.comissao_pct ?? null,
    user_id: empresa?.user_id ?? '',
    modulo_delivery: empresa?.modulo_delivery ?? true,
    modulo_salao: empresa?.modulo_salao ?? false,
  });
  const [salvando, setSalvando] = useState(false);
  const usaPadraoGlobal = form.comissao_pct === null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      if (empresa) {
        await atualizarEmpresa(empresa.id, form);
      } else {
        await criarEmpresa(form);
      }
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-zinc-100">{empresa ? 'Editar Empresa' : 'Nova Empresa'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Nome *</label>
            <input
              required
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Endereço</label>
            <input
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Comissão plataforma (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              disabled={usaPadraoGlobal}
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-zinc-800 disabled:text-gray-400 dark:disabled:text-zinc-500"
              value={usaPadraoGlobal ? '' : form.comissao_pct}
              placeholder={usaPadraoGlobal ? `${comissaoPadrao}%` : ''}
              onChange={(e) => setForm({ ...form, comissao_pct: parseFloat(e.target.value) })}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={usaPadraoGlobal}
                onChange={(e) => setForm({ ...form, comissao_pct: e.target.checked ? null : comissaoPadrao })}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                Usar padrão global da plataforma ({comissaoPadrao}%)
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              UUID do dono (restaurant_owner)
            </label>
            <input
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value.trim() })}
            />
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
              UUID do usuário cadastrado como restaurant_owner. Deixe vazio se não houver dono ainda.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Módulos liberados</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.modulo_delivery}
                  onChange={(e) => setForm({ ...form, modulo_delivery: e.target.checked })}
                />
                Delivery
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.modulo_salao}
                  onChange={(e) => setForm({ ...form, modulo_salao: e.target.checked })}
                />
                Salão (mesas/comandas/garçons)
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminEmpresas = () => {
  const navigate = useNavigate();
  const { isLocalMode, localRestaurantId } = useLocalMode() ?? {};
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modal, setModal] = useState(null); // null | 'novo' | empresa_obj
  const [comissaoPadrao, setComissaoPadrao] = useState(5);
  const [assinaturas, setAssinaturas] = useState([]);

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await getEmpresas();
      let lista = data.empresas ?? [];
      // Modo local: restringe a 1 restaurante
      if (isLocalMode && localRestaurantId) {
        lista = lista.filter((e) => e.id === localRestaurantId);
      }
      setEmpresas(lista);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    getPlataformaConfig().then((d) => setComissaoPadrao(d.comissao_padrao_pct ?? 5)).catch(() => {});
    getAssinaturas().then((d) => setAssinaturas(d.assinaturas ?? [])).catch(() => {});
  }, []);

  const handleRemover = async (empresa) => {
    if (!confirm(`Remover "${empresa.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await removerEmpresa(empresa.id);
      carregar();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleBloquear = async (empresa) => {
    const acao = empresa.bloqueado ? 'desbloquear' : 'bloquear';
    if (!confirm(`${acao.charAt(0).toUpperCase() + acao.slice(1)} "${empresa.name}"?`)) return;
    try {
      await bloquearEmpresa(empresa.id, !empresa.bloqueado);
      carregar();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAtenderDominio = async (empresa) => {
    if (!confirm(`Aprovar domínio "${empresa.custom_domain}" de "${empresa.name}"? Só confirme depois de adicionar o domínio no painel do EasyPanel.`)) return;
    try {
      await atenderSolicitacaoDominio(empresa.id);
      carregar();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRecusarDominio = async (empresa) => {
    const motivo = prompt(`Motivo da recusa do domínio "${empresa.custom_domain}" (${empresa.name}):`);
    if (motivo === null) return;
    try {
      await recusarSolicitacaoDominio(empresa.id, motivo);
      carregar();
    } catch (e) {
      alert(e.message);
    }
  };

  const solicitacoesDominio = empresas.filter((e) => e.custom_domain_status === 'pendente');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <LocalModeBanner />
      <header className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Painel Dev-Admin</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Gestão de Empresas</p>
        </div>
        <AdminNav active="/admin/empresas" />
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            Empresas <span className="text-gray-400 dark:text-zinc-500 font-normal text-sm">({empresas.length})</span>
            {solicitacoesDominio.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 align-middle">
                {solicitacoesDominio.length} solicitação(ões) de domínio pendente(s)
              </span>
            )}
          </h2>
          {!isLocalMode && (
            <button
              onClick={() => setModal('novo')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              + Nova Empresa
            </button>
          )}
        </div>

        {solicitacoesDominio.length > 0 && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3">Solicitações de domínio personalizado</h3>
            <div className="space-y-2">
              {solicitacoesDominio.map((e) => (
                <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-zinc-800 rounded-lg border border-amber-200 dark:border-amber-900 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{e.name}</p>
                    <p className="text-xs font-mono text-amber-700 dark:text-amber-400">{e.custom_domain}</p>
                    {e.custom_domain_solicitado_em && (
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                        Solicitado em {new Date(e.custom_domain_solicitado_em).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/empresas/${e.id}`)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900"
                    >
                      Ver empresa
                    </button>
                    <button
                      onClick={() => handleAtenderDominio(e)}
                      className="px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg border border-green-200 dark:border-green-900"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleRecusarDominio(e)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {erro && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {erro} — verifique se o backend está rodando.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-x-auto">
            {empresas.length === 0 ? (
              <div className="p-12 text-center text-gray-400 dark:text-zinc-500">
                <p className="text-lg">Nenhuma empresa cadastrada</p>
                <button
                  onClick={() => setModal('novo')}
                  className="mt-3 text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Cadastrar primeira empresa
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50">
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400 hidden sm:table-cell">ID</th>
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Nome</th>
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400 hidden lg:table-cell">Slug / Link</th>
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400 hidden md:table-cell">Endereço</th>
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Status</th>
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400 hidden lg:table-cell">Módulos</th>
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400 hidden lg:table-cell">Domínio</th>
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400 hidden lg:table-cell">Plano</th>
                    <th className="px-2 sm:px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400 hidden md:table-cell">Comissão</th>
                    <th className="px-2 sm:px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400 hidden lg:table-cell">Cadastro</th>
                    <th className="px-2 sm:px-4 py-3 w-px whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((e) => (
                    <tr key={e.id} className="border-b border-gray-200 dark:border-zinc-700 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
                      <td className="px-2 sm:px-4 py-3 text-gray-400 dark:text-zinc-500 hidden sm:table-cell">#{e.id}</td>
                      <td className="px-2 sm:px-4 py-3 font-medium text-gray-900 dark:text-zinc-100 max-w-[120px] sm:max-w-none truncate">{e.name}</td>
                      <td className="px-2 sm:px-4 py-3 hidden lg:table-cell">
                        {e.slug ? (
                          <a
                            href={`/r/${e.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono"
                          >
                            /r/{e.slug}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-gray-500 dark:text-zinc-400 hidden md:table-cell max-w-xs truncate">
                        {e.address ?? '—'}
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        {e.bloqueado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Ativo
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 hidden lg:table-cell">
                        <div className="flex gap-1">
                          {e.modulo_delivery && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">Delivery</span>
                          )}
                          {e.modulo_salao && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400">Salão</span>
                          )}
                          {!e.modulo_delivery && !e.modulo_salao && (
                            <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 hidden lg:table-cell">
                        {e.custom_domain_status === 'pendente' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-mono">
                            {e.custom_domain} (pendente)
                          </span>
                        ) : e.custom_domain_status === 'recusado' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-mono">
                            {e.custom_domain} (recusado)
                          </span>
                        ) : e.custom_domain ? (
                          <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono">{e.custom_domain}</span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 hidden lg:table-cell">
                        {(() => {
                          const assinatura = assinaturas.find((a) => a.restaurant_id === e.id);
                          if (!assinatura) return <span className="text-xs text-gray-400 dark:text-zinc-500">Sem plano</span>;
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">{assinatura.planos?.nome}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                assinatura.status === 'ativa' ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                                : assinatura.status === 'trial' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                                : 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400'
                              }`}>
                                {assinatura.status === 'ativa' ? 'Ativa' : assinatura.status === 'trial' ? 'Trial' : 'Cancelada'}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400">
                          {e.comissao_pct ?? comissaoPadrao}%{e.comissao_pct == null && <span className="opacity-60"> (padrão)</span>}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right text-gray-400 dark:text-zinc-500 text-xs hidden lg:table-cell">
                        {new Date(e.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-2 sm:px-4 py-3 w-px whitespace-nowrap">
                        <div className="flex gap-1 sm:gap-2 justify-end">
                          <button
                            onClick={() => navigate(`/admin/empresas/${e.id}`)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => setModal(e)}
                            className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleBloquear(e)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg ${
                              e.bloqueado
                                ? 'text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40'
                                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                            }`}
                          >
                            {e.bloqueado ? 'Desbloquear' : 'Bloquear'}
                          </button>
                          {!isLocalMode && (
                            <button
                              onClick={() => handleRemover(e)}
                              className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {modal && (
        <Modal
          empresa={modal === 'novo' ? null : modal}
          comissaoPadrao={comissaoPadrao}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminEmpresas;
