import React, { useState, useEffect, useCallback } from 'react';
import {
  getUsuarios, trocarCredenciaisUsuario, getEmpresas, atualizarEmpresa,
  editarUsuario, bloquearUsuario, excluirUsuario, liberarBloqueioLoginUsuario,
} from '../../services/adminService';
import AdminHeader from '../../components/admin/AdminHeader';
import { useAuth } from '../../contexts/AuthContext';
import { formatDuracao } from '../../utils/formatDuracao';
import { ChevronDown } from 'lucide-react';

// Badge com contagem regressiva do bloqueio por tentativas de senha erradas no login
// principal — próprio componente pra ticar a cada segundo sem re-renderizar a tabela
// inteira de usuários.
const BloqueioLoginBadge = ({ bloqueadoAte }) => {
  const [now, setNow] = useState(Date.now());
  const bloqueadoAteMs = new Date(bloqueadoAte).getTime();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (bloqueadoAteMs <= now) return null;

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-mono">
      Bloqueado (login) · {formatDuracao(bloqueadoAteMs - now)}
    </span>
  );
};

const ROLE_LABELS = {
  admin: 'Admin',
  restaurant_owner: 'Dono de restaurante',
  customer: 'Cliente',
  motoboy: 'Motoboy',
};

const ROLE_BADGE_CLASS = {
  admin: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
  restaurant_owner: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  customer: 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300',
  motoboy: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
};

const VincularModal = ({ usuario, empresas, onClose, onSave }) => {
  const [restaurantId, setRestaurantId] = useState(usuario.restaurante?.id ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantId) return;
    setSalvando(true);
    setErro(null);
    try {
      await atualizarEmpresa(restaurantId, { user_id: usuario.id });
      onSave();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-zinc-100">Vincular a restaurante</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">{usuario.name || usuario.email}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Restaurante</label>
            <select
              required
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
            >
              <option value="" disabled>Selecione...</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.name}{e.user_id && e.user_id !== usuario.id ? ' (já tem dono)' : ''}</option>
              ))}
            </select>
          </div>

          {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Vincular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CredenciaisModal = ({ usuario, onClose, onSave }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email && !senha) {
      setErro('Informe email e/ou senha.');
      return;
    }
    if (senha && senha.length < 8) {
      setErro('Senha deve ter no mínimo 8 caracteres.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await trocarCredenciaisUsuario(usuario.id, {
        email: email.trim() || undefined,
        senha: senha || undefined,
      });
      onSave();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-zinc-100">Trocar email/senha</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
          {usuario.name || usuario.email} — uso de suporte manual. A troca é aplicada imediatamente, sem exigir confirmação por email.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Novo email</label>
            <input
              type="email"
              placeholder={usuario.email}
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Nova senha</label>
            <input
              type="password"
              minLength={8}
              placeholder="Deixe em branco pra não trocar"
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditarModal = ({ usuario, onClose, onSave }) => {
  const [name, setName] = useState(usuario.name ?? '');
  const [role, setRole] = useState(usuario.role);
  const [phone, setPhone] = useState(usuario.phone_e164 ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await editarUsuario(usuario.id, { name, role, phone_e164: phone });
      onSave();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-zinc-100">Editar usuário</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">{usuario.email}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Nome</label>
            <input
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Telefone</label>
            <input
              placeholder="+5511999999999"
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Papel</label>
            <select
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {Object.entries(ROLE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Mudar o papel altera o que o usuário pode acessar no sistema.</p>
          </div>

          {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Card de usuário, reaproveitado nas duas visões (mesmo padrão do
// EmpresaCard em admin-empresas) — mesmas ações da linha da tabela.
const UsuarioCard = ({ usuario: u, currentUserId, processando, onVincular, onDesvincular, onCredenciais, onEditar, onLiberarLogin, onBloquear, onExcluir }) => (
  <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 flex flex-col gap-3">
    <div className="min-w-0">
      <p className="font-semibold text-gray-900 dark:text-zinc-100 truncate">
        {u.name || <span className="text-gray-400 dark:text-zinc-500 font-normal">—</span>}
      </p>
      <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{u.email}</p>
    </div>

    <div className="flex flex-wrap items-center gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_CLASS[u.role] ?? ROLE_BADGE_CLASS.customer}`}>
        {ROLE_LABELS[u.role] ?? u.role}
      </span>
      {u.bloqueado && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
          Bloqueado
        </span>
      )}
      {u.bloqueado_login_ate && <BloqueioLoginBadge bloqueadoAte={u.bloqueado_login_ate} />}
    </div>

    {u.restaurante ? (
      <a href={`/r/${u.restaurante.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline w-fit">
        {u.restaurante.name}
      </a>
    ) : (
      <span className="text-xs text-gray-400 dark:text-zinc-500">Sem restaurante vinculado</span>
    )}

    <p className="text-xs text-gray-400 dark:text-zinc-500">
      Cadastro em {new Date(u.created_at).toLocaleDateString('pt-BR')}
    </p>

    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100 dark:border-zinc-700">
      <button onClick={onVincular} className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900">
        {u.restaurante ? 'Trocar vínculo' : 'Vincular'}
      </button>
      {u.restaurante && (
        <button onClick={onDesvincular} className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900">
          Desvincular
        </button>
      )}
      <button onClick={onCredenciais} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-700">
        Email/senha
      </button>
      <button onClick={onEditar} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-700">
        Editar
      </button>
      {u.bloqueado_login_ate && (
        <button onClick={onLiberarLogin} disabled={processando === u.id}
          className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900 disabled:opacity-50">
          Liberar login
        </button>
      )}
      {u.id !== currentUserId && (
        <button onClick={onBloquear} disabled={processando === u.id}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-50 ${
            u.bloqueado
              ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              : 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}>
          {u.bloqueado ? 'Desbloquear' : 'Bloquear'}
        </button>
      )}
      {u.id !== currentUserId && (
        <button onClick={onExcluir} disabled={processando === u.id}
          className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900 disabled:opacity-50">
          Excluir
        </button>
      )}
    </div>
  </div>
);

const LIMIT = 50;

const AdminUsuarios = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [modalVincular, setModalVincular] = useState(null);
  const [modalCredenciais, setModalCredenciais] = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [processando, setProcessando] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'lista'

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsuarios({ busca: busca || undefined, role: role || undefined, page, limit: LIMIT });
      setUsuarios(data.usuarios ?? []);
      setTotal(data.total ?? 0);
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, [busca, role, page]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { getEmpresas().then((d) => setEmpresas(d.empresas ?? [])).catch(() => {}); }, []);

  const handleDesvincular = async (usuario) => {
    if (!confirm(`Desvincular "${usuario.name || usuario.email}" de "${usuario.restaurante.name}"?`)) return;
    try {
      await atualizarEmpresa(usuario.restaurante.id, { user_id: null });
      carregar();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleBloquear = async (usuario) => {
    const acao = usuario.bloqueado ? 'Desbloquear' : 'Bloquear';
    if (!confirm(`${acao} "${usuario.name || usuario.email}"?${!usuario.bloqueado ? ' O usuário não vai mais conseguir fazer login.' : ''}`)) return;
    setProcessando(usuario.id);
    try {
      await bloquearUsuario(usuario.id, !usuario.bloqueado);
      carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessando(null);
    }
  };

  const handleLiberarBloqueioLogin = async (usuario) => {
    setProcessando(usuario.id);
    try {
      await liberarBloqueioLoginUsuario(usuario.id);
      carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessando(null);
    }
  };

  const handleExcluir = async (usuario) => {
    if (!confirm(`Excluir "${usuario.name || usuario.email}" permanentemente? Essa ação não pode ser desfeita.`)) return;
    setProcessando(usuario.id);
    try {
      await excluirUsuario(usuario.id);
      carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessando(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <AdminHeader active="/admin/usuarios" title="Painel Dev-Admin" subtitle="Gestão de Usuários" />

      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
              Usuários <span className="text-gray-400 dark:text-zinc-500 font-normal text-sm">({total})</span>
            </h2>
            <div className="flex border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'lista' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
              >
                Lista
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-6">
          <input
            placeholder="Buscar por nome ou email..."
            className="w-full sm:w-64 min-w-0 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={busca}
            onChange={(e) => { setPage(1); setBusca(e.target.value); }}
          />
          <div className="relative w-full sm:w-auto sm:max-w-[220px] min-w-0">
            <select
              className="w-full min-w-0 max-w-full appearance-none border border-gray-300 dark:border-zinc-700 rounded-lg pl-3 pr-8 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={role}
              onChange={(e) => { setPage(1); setRole(e.target.value); }}
            >
              <option value="">Todos os papéis</option>
              {Object.entries(ROLE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          {(busca || role) && (
            <button
              onClick={() => { setPage(1); setBusca(''); setRole(''); }}
              className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 self-start"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {erro && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {erro} — verifique se o backend está rodando.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
            <div className="p-12 text-center text-gray-400 dark:text-zinc-500">
              <p className="text-lg">Nenhum usuário encontrado</p>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {usuarios.map((u) => (
              <UsuarioCard
                key={u.id}
                usuario={u}
                currentUserId={user?.id}
                processando={processando}
                onVincular={() => setModalVincular(u)}
                onDesvincular={() => handleDesvincular(u)}
                onCredenciais={() => setModalCredenciais(u)}
                onEditar={() => setModalEditar(u)}
                onLiberarLogin={() => handleLiberarBloqueioLogin(u)}
                onBloquear={() => handleBloquear(u)}
                onExcluir={() => handleExcluir(u)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50">
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Nome</th>
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400 hidden sm:table-cell">Email</th>
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400">Papel</th>
                    <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-600 dark:text-zinc-400 hidden md:table-cell">Restaurante vinculado</th>
                    <th className="px-2 sm:px-4 py-3 text-right font-medium text-gray-600 dark:text-zinc-400 hidden lg:table-cell">Cadastro</th>
                    <th className="px-2 sm:px-4 py-3 w-px whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-gray-200 dark:border-zinc-700 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-700/40">
                      <td className="px-2 sm:px-4 py-3 font-medium text-gray-900 dark:text-zinc-100 max-w-[140px] truncate">
                        {u.name || <span className="text-gray-400 dark:text-zinc-500 font-normal">—</span>}
                        <p className="text-xs text-gray-400 dark:text-zinc-500 font-normal sm:hidden truncate">{u.email}</p>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-gray-500 dark:text-zinc-400 hidden sm:table-cell max-w-xs truncate">{u.email}</td>
                      <td className="px-2 sm:px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_CLASS[u.role] ?? ROLE_BADGE_CLASS.customer}`}>
                            {ROLE_LABELS[u.role] ?? u.role}
                          </span>
                          {u.bloqueado && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                              Bloqueado
                            </span>
                          )}
                          {u.bloqueado_login_ate && <BloqueioLoginBadge bloqueadoAte={u.bloqueado_login_ate} />}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 hidden md:table-cell">
                        {u.restaurante ? (
                          <a href={`/r/${u.restaurante.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                            {u.restaurante.name}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right text-gray-400 dark:text-zinc-500 text-xs hidden lg:table-cell">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-2 sm:px-4 py-3 w-px whitespace-nowrap">
                        <div className="flex gap-1 sm:gap-2 justify-end">
                          <button onClick={() => setModalVincular(u)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg">
                            {u.restaurante ? 'Trocar vínculo' : 'Vincular'}
                          </button>
                          {u.restaurante && (
                            <button onClick={() => handleDesvincular(u)}
                              className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg">
                              Desvincular
                            </button>
                          )}
                          <button onClick={() => setModalCredenciais(u)}
                            className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg">
                            Email/senha
                          </button>
                          <button onClick={() => setModalEditar(u)}
                            className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg">
                            Editar
                          </button>
                          {u.bloqueado_login_ate && (
                            <button onClick={() => handleLiberarBloqueioLogin(u)} disabled={processando === u.id}
                              className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-50">
                              Liberar login
                            </button>
                          )}
                          {u.id !== user?.id && (
                            <button onClick={() => handleBloquear(u)} disabled={processando === u.id}
                              className={`px-3 py-1 text-xs font-medium rounded-lg disabled:opacity-50 ${
                                u.bloqueado
                                  ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              }`}>
                              {u.bloqueado ? 'Desbloquear' : 'Bloquear'}
                            </button>
                          )}
                          {u.id !== user?.id && (
                            <button onClick={() => handleExcluir(u)} disabled={processando === u.id}
                              className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-50">
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-40">
              Anterior
            </button>
            <span className="text-sm text-gray-500 dark:text-zinc-400">Página {page} de {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-40">
              Próxima
            </button>
          </div>
        )}
      </main>

      {modalVincular && (
        <VincularModal
          usuario={modalVincular}
          empresas={empresas}
          onClose={() => setModalVincular(null)}
          onSave={() => { setModalVincular(null); carregar(); }}
        />
      )}
      {modalCredenciais && (
        <CredenciaisModal
          usuario={modalCredenciais}
          onClose={() => setModalCredenciais(null)}
          onSave={() => { setModalCredenciais(null); carregar(); alert('Credenciais atualizadas com sucesso.'); }}
        />
      )}
      {modalEditar && (
        <EditarModal
          usuario={modalEditar}
          onClose={() => setModalEditar(null)}
          onSave={() => { setModalEditar(null); carregar(); }}
        />
      )}
    </div>
  );
};

export default AdminUsuarios;
