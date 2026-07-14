import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listarImpressoras, criarImpressora, atualizarImpressora, removerImpressora,
  getImpressorasDetectadas, gerarTokenAgente, getStatusAgente,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import { useSolicitacoesMotoboyCount } from '../../hooks/useSolicitacoesMotoboyCount';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const pendentes = useSolicitacoesMotoboyCount();
  const slugLoja = useMinhaLojaSlug();
  const tipoRestaurante = useTipoRestaurante();
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Produtos', path: '/restaurante/produtos' },
    { label: 'Pedidos', path: '/restaurante/pedidos' },
    { label: 'Entregas', path: '/restaurante/entregas' },
    { label: 'Motoboys', path: '/restaurante/motoboys' },
    ...(tipoRestaurante ? [
      { label: 'Salão', path: '/restaurante/salao' },
      { label: 'Garçons', path: '/restaurante/garcons' },
      { label: 'Impressoras', path: '/restaurante/impressoras' },
    ] : []),
    { label: 'Clientes', path: '/restaurante/clientes' },
    { label: 'Designer', path: '/restaurante/aparencia' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <nav className="flex gap-1.5 flex-wrap">
      {links.map((l) => (
        <button key={l.path} onClick={() => navigate(l.path)}
          className={`relative px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            active === l.path ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30' : 'text-[#27272A] hover:bg-[#F4F4F5]'
          }`}>
          {l.label}
          {l.path === '/restaurante/motoboys' && pendentes > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
              {pendentes}
            </span>
          )}
        </button>
      ))}
      {slugLoja && (
        <button onClick={() => window.open(`/r/${slugLoja}`, '_blank')}
          className="px-3 py-2 text-sm font-semibold rounded-lg text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 flex items-center gap-1.5">
          <Icon name="ExternalLink" size={14} /> Loja
        </button>
      )}
    </nav>
  );
};

const AgenteImpressaoPanel = () => {
  const [status, setStatus] = useState(null);
  const [token, setToken] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const carregarStatus = useCallback(() => getStatusAgente().then(setStatus).catch(() => {}), []);
  useEffect(() => {
    carregarStatus();
    const interval = setInterval(carregarStatus, 15000);
    return () => clearInterval(interval);
  }, [carregarStatus]);

  const gerar = async () => {
    setGerando(true);
    try {
      const { token } = await gerarTokenAgente();
      setToken(token);
      carregarStatus();
    } finally {
      setGerando(false);
    }
  };

  const copiar = () => {
    navigator.clipboard?.writeText(token);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-[#18181B]">Agente de impressão local</p>
        {status && (
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${status.online ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
            {status.online ? 'Online' : status.pareado ? 'Offline' : 'Não pareado'}
          </span>
        )}
      </div>
      <p className="text-xs text-[#71717A] mb-3">
        Baixe e rode o agente no PC das impressoras — ele detecta e imprime as comandas automaticamente.
        <a href="https://github.com/jmoka/deliveryhub_white_label/tree/main/print-agent" target="_blank" rel="noreferrer" className="text-[#FF441F] font-semibold ml-1">Ver instruções</a>
      </p>
      <button onClick={gerar} disabled={gerando}
        className="px-4 py-2 bg-zinc-800 text-white text-sm font-bold rounded-xl disabled:opacity-50">
        {gerando ? 'Gerando...' : 'Gerar token de pareamento'}
      </button>
      {token && (
        <div className="flex items-center gap-2 mt-3 bg-[#F4F4F5] rounded-xl px-3 py-2">
          <span className="text-xs font-mono text-[#71717A] truncate flex-1">{token}</span>
          <button onClick={copiar} className="text-xs font-bold text-[#FF441F]">{copiado ? 'Copiado!' : 'Copiar'}</button>
        </div>
      )}
    </div>
  );
};

const RestauranteImpressoras = () => {
  const [impressoras, setImpressoras] = useState([]);
  const [detectadas, setDetectadas] = useState([]);
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [tipoConexao, setTipoConexao] = useState('rede');
  const [endereco, setEndereco] = useState('');
  const [nomeSistema, setNomeSistema] = useState('');
  const [erro, setErro] = useState(null);

  const carregar = useCallback(() => {
    listarImpressoras().then(setImpressoras);
    getImpressorasDetectadas().then(setDetectadas).catch(() => {});
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const criar = async (e) => {
    e.preventDefault();
    setErro(null);
    try {
      await criarImpressora({
        nome, setor, tipo_conexao: tipoConexao,
        endereco: endereco || undefined,
        nome_sistema: nomeSistema || undefined,
      });
      setNome(''); setSetor(''); setEndereco(''); setNomeSistema('');
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const toggleAtiva = async (imp) => {
    await atualizarImpressora(imp.id, { ativo: !imp.ativo });
    carregar();
  };

  const vincularDetectada = async (id, nomeSistema) => {
    await atualizarImpressora(id, { nome_sistema: nomeSistema || null });
    carregar();
  };

  const remover = async (id) => {
    if (!window.confirm('Remover esta impressora?')) return;
    await removerImpressora(id);
    carregar();
  };

  const linkKds = (imp) => `${window.location.origin}/restaurante/kds?impressora_id=${imp.id}&setor=${encodeURIComponent(imp.setor)}`;

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <div className="bg-white border-b border-[#E4E4E7] p-4">
        <NavRestaurante active="/restaurante/impressoras" />
      </div>
      <div className="max-w-4xl mx-auto p-4">
        <AgenteImpressaoPanel />

        <form onSubmit={criar} className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-4 flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-[#71717A]">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Impressora Bar"
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-[#71717A]">Setor</label>
            <input value={setor} onChange={(e) => setSetor(e.target.value)} required placeholder="Ex: bar, cozinha, salgados"
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#71717A]">Conexão</label>
            <select value={tipoConexao} onChange={(e) => setTipoConexao(e.target.value)}
              className="border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm">
              <option value="rede">Rede</option>
              <option value="local">Local (USB)</option>
            </select>
          </div>
          {detectadas.length > 0 ? (
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-[#71717A]">Impressora detectada pelo agente</label>
              <select value={nomeSistema} onChange={(e) => setNomeSistema(e.target.value)}
                className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm">
                <option value="">Nenhuma (manual/rede)</option>
                {detectadas.map((d) => (
                  <option key={d.id} value={d.nome_sistema}>{d.nome_sistema}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs text-[#71717A]">Endereço (IP ou nome)</label>
              <input value={endereco} onChange={(e) => setEndereco(e.target.value)}
                className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
            </div>
          )}
          {erro && <p className="text-xs text-red-600 w-full">{erro}</p>}
          <button type="submit" className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl">Adicionar</button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {impressoras.map((imp) => (
            <div key={imp.id} className="bg-white rounded-2xl border border-[#E4E4E7] p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-[#18181B]">{imp.nome}</p>
                  <p className="text-xs text-[#71717A]">Setor: {imp.setor} · {imp.tipo_conexao}</p>
                  {imp.nome_sistema
                    ? <p className="text-xs text-emerald-700">🖨 {imp.nome_sistema} (agente)</p>
                    : imp.endereco && <p className="text-xs text-[#A1A1AA]">{imp.endereco}</p>}
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${imp.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                  {imp.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              {detectadas.length > 0 && (
                <div className="mt-3">
                  <label className="text-xs text-[#71717A]">Vincular impressora detectada</label>
                  <select value={imp.nome_sistema ?? ''} onChange={(e) => vincularDetectada(imp.id, e.target.value)}
                    className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm mt-1">
                    <option value="">Nenhuma (manual/rede)</option>
                    {detectadas.map((d) => (
                      <option key={d.id} value={d.nome_sistema}>{d.nome_sistema}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 bg-[#F4F4F5] rounded-xl px-3 py-2">
                <span className="text-xs font-mono text-[#71717A] truncate flex-1">{linkKds(imp)}</span>
                <button onClick={() => navigator.clipboard?.writeText(linkKds(imp))} className="text-xs font-bold text-[#FF441F]">Copiar</button>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggleAtiva(imp)} className="flex-1 py-1.5 text-xs border border-[#E4E4E7] rounded-lg text-[#71717A] hover:bg-[#F4F4F5]">
                  {imp.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => remover(imp.id)} className="flex-1 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                  Remover
                </button>
              </div>
            </div>
          ))}
          {impressoras.length === 0 && <p className="text-sm text-[#A1A1AA]">Nenhuma impressora cadastrada.</p>}
        </div>
      </div>
    </div>
  );
};

export default RestauranteImpressoras;
