import React, { useState, useEffect, useCallback } from 'react';
import {
  listarGarcons, criarGarcom, atualizarGarcom, removerGarcom, forcarLogoutGarcom,
} from '../../services/restauranteService';
import { getLocalUrls } from '../../utils/mesaAcompanharUrl';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

const NovoGarcomForm = ({ onCriado }) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await criarGarcom({ nome, telefone, senha });
      setNome(''); setTelefone(''); setSenha('');
      onCriado();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4 mb-4 flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[140px]">
        <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} required
          className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Telefone</label>
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)}
          className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Senha inicial</label>
        <input value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={4}
          className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm" />
      </div>
      {erro && <p className="text-xs text-red-600 dark:text-red-400 w-full">{erro}</p>}
      <button type="submit" disabled={salvando}
        className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl disabled:opacity-50">
        {salvando ? 'Criando...' : 'Criar garçom'}
      </button>
    </form>
  );
};

const GarcomCard = ({ garcom, onMudou }) => {
  const [copiado, setCopiado] = useState(false);
  const [modo, setModo] = useState('online'); // 'online' | 'local'
  const urls = getLocalUrls(`/garcom/${garcom.login_key}`);
  const link = modo === 'local' && urls.lan ? urls.lan : urls.principal;

  const copiarLink = () => {
    navigator.clipboard?.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const togglePermissao = async (chave) => {
    // pagamento_parcial é default ligado (undefined = true) — as outras são default desligado.
    const atual = chave === 'pagamento_parcial' ? garcom.permissoes?.[chave] !== false : !!garcom.permissoes?.[chave];
    await atualizarGarcom(garcom.id, { permissoes: { ...garcom.permissoes, [chave]: !atual } });
    onMudou();
  };

  const toggleAtivo = async () => {
    await atualizarGarcom(garcom.id, { ativo: !garcom.ativo });
    onMudou();
  };

  const remover = async () => {
    if (!window.confirm(`Remover ${garcom.nome}?`)) return;
    await removerGarcom(garcom.id);
    onMudou();
  };

  const forcarLogout = async () => {
    if (!window.confirm(`Encerrar a sessão de ${garcom.nome} no dispositivo onde está logado, pra liberar login em outro?`)) return;
    await forcarLogoutGarcom(garcom.id);
    onMudou();
  };

  return (
    <div className="bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-[#18181B] dark:text-[#F4F4F5]">{garcom.nome}</p>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{garcom.telefone}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${garcom.ativo ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400'}`}>
            {garcom.ativo ? 'Ativo' : 'Desativado'}
          </span>
          {garcom.sessao_ativa && (
            <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
              Logado em 1 dispositivo
            </span>
          )}
        </div>
      </div>

      {urls.lan && (
        <div className="flex gap-2 mt-3">
          <button onClick={() => setModo('online')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold ${modo === 'online' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
            ONLINE
          </button>
          <button onClick={() => setModo('local')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold ${modo === 'local' ? 'bg-[#FF441F] text-white' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#71717A] dark:text-[#A1A1AA]'}`}>
            LOCAL
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 mt-2 bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-xl px-3 py-2">
        <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] truncate flex-1">{link}</span>
        <button onClick={copiarLink} className="text-xs font-bold text-[#FF441F]">{copiado ? 'Copiado!' : 'Copiar'}</button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {/* Default ligado (diferente de futuras permissões) — pagamento parcial já era
            permitido sem restrição antes dessa permissão existir, então só desativa quem
            o dono desmarcar. Toggles de desconto/cancelar/acréscimo foram removidos daqui
            porque o garçom nunca teve essas ações na tela dele — eram vestigiais. */}
        <button onClick={() => togglePermissao('pagamento_parcial')}
          className={`text-[10px] px-2 py-1 rounded-full font-medium border ${
            garcom.permissoes?.pagamento_parcial !== false ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#A1A1AA] border-[#E4E4E7] dark:border-[#3F3F46]'
          }`}>
          Pagamento parcial
        </button>
      </div>

      {garcom.sessao_ativa && (
        <button onClick={forcarLogout} className="w-full mt-3 py-1.5 text-xs border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 font-medium">
          Forçar logout (liberar outro dispositivo)
        </button>
      )}

      <div className="flex gap-2 mt-3">
        <button onClick={toggleAtivo} className="flex-1 py-1.5 text-xs border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
          {garcom.ativo ? 'Desativar' : 'Ativar'}
        </button>
        <button onClick={remover} className="flex-1 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40">
          Remover
        </button>
      </div>
    </div>
  );
};

const RestauranteGarcons = () => {
  const [garcons, setGarcons] = useState([]);

  const carregar = useCallback(() => listarGarcons().then(setGarcons), []);
  useEffect(() => { carregar(); }, [carregar]);

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/garcons" title="Garçons" onRefresh={carregar} />
      <div className="max-w-5xl mx-auto p-4">
        <NovoGarcomForm onCriado={carregar} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {garcons.map((g) => <GarcomCard key={g.id} garcom={g} onMudou={carregar} />)}
          {garcons.length === 0 && <p className="text-sm text-[#A1A1AA]">Nenhum garçom cadastrado.</p>}
        </div>
      </div>
    </div>
  );
};

export default RestauranteGarcons;
