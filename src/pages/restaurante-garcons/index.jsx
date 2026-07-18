import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listarGarcons, criarGarcom, atualizarGarcom, removerGarcom,
  listarMesas, criarMesa, removerMesa, criarMesasEmLote,
} from '../../services/restauranteService';
import Icon from '../../components/AppIcon';
import { useSolicitacoesMotoboyCount } from '../../hooks/useSolicitacoesMotoboyCount';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';
import RestauranteSidebar from '../../components/restaurante/RestauranteSidebar';

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const pendentes = useSolicitacoesMotoboyCount();
  const slugLoja = useMinhaLojaSlug();
  const tipoRestaurante = useTipoRestaurante();
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const links = [
    { label: 'Dashboard', path: '/restaurante' },
    { label: 'Relatórios', path: '/restaurante/relatorios' },
    { label: 'Delivery', path: '/restaurante/delivery' },
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
    <>
      <nav className="md:hidden flex gap-1.5 flex-wrap">
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
      <button onClick={() => setSidebarAberto(true)}
        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#27272A] hover:bg-[#F4F4F5] border border-[#E4E4E7]">
        <Icon name="Menu" size={18} /> Menu
      </button>
      <RestauranteSidebar
        open={sidebarAberto}
        onClose={() => setSidebarAberto(false)}
        links={links}
        activePath={active}
        pendentesMotoboy={pendentes}
        slugLoja={slugLoja}
      />
    </>
  );
};

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
    <form onSubmit={submit} className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-4 flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[140px]">
        <label className="text-xs text-[#71717A]">Nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} required
          className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="text-xs text-[#71717A]">Telefone</label>
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)}
          className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="text-xs text-[#71717A]">Senha inicial</label>
        <input value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={4}
          className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
      </div>
      {erro && <p className="text-xs text-red-600 w-full">{erro}</p>}
      <button type="submit" disabled={salvando}
        className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl disabled:opacity-50">
        {salvando ? 'Criando...' : 'Criar garçom'}
      </button>
    </form>
  );
};

const GarcomCard = ({ garcom, onMudou }) => {
  const [copiado, setCopiado] = useState(false);
  const link = `${window.location.origin}/garcom/${garcom.login_key}`;

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

  return (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-[#18181B]">{garcom.nome}</p>
          <p className="text-xs text-[#71717A]">{garcom.telefone}</p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${garcom.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
          {garcom.ativo ? 'Ativo' : 'Desativado'}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3 bg-[#F4F4F5] rounded-xl px-3 py-2">
        <span className="text-xs font-mono text-[#71717A] truncate flex-1">{link}</span>
        <button onClick={copiarLink} className="text-xs font-bold text-[#FF441F]">{copiado ? 'Copiado!' : 'Copiar'}</button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {/* Default ligado (diferente de futuras permissões) — pagamento parcial já era
            permitido sem restrição antes dessa permissão existir, então só desativa quem
            o dono desmarcar. Toggles de desconto/cancelar/acréscimo foram removidos daqui
            porque o garçom nunca teve essas ações na tela dele — eram vestigiais. */}
        <button onClick={() => togglePermissao('pagamento_parcial')}
          className={`text-[10px] px-2 py-1 rounded-full font-medium border ${
            garcom.permissoes?.pagamento_parcial !== false ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-[#F4F4F5] text-[#A1A1AA] border-[#E4E4E7]'
          }`}>
          Pagamento parcial
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={toggleAtivo} className="flex-1 py-1.5 text-xs border border-[#E4E4E7] rounded-lg text-[#71717A] hover:bg-[#F4F4F5]">
          {garcom.ativo ? 'Desativar' : 'Ativar'}
        </button>
        <button onClick={remover} className="flex-1 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
          Remover
        </button>
      </div>
    </div>
  );
};

const MesasTab = () => {
  const [mesas, setMesas] = useState([]);
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState(null);

  const [loteDe, setLoteDe] = useState('');
  const [loteAte, setLoteAte] = useState('');
  const [loteErro, setLoteErro] = useState(null);
  const [loteSalvando, setLoteSalvando] = useState(false);
  const [loteResultado, setLoteResultado] = useState(null);

  const carregar = useCallback(() => listarMesas().then(setMesas), []);
  useEffect(() => { carregar(); }, [carregar]);

  const criar = async (e) => {
    e.preventDefault();
    setErro(null);
    try {
      await criarMesa({ numero: Number(numero), nome: nome || undefined });
      setNumero(''); setNome('');
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const criarLote = async (e) => {
    e.preventDefault();
    setLoteErro(null);
    setLoteResultado(null);
    setLoteSalvando(true);
    try {
      const resultado = await criarMesasEmLote(Number(loteDe), Number(loteAte));
      setLoteResultado(resultado);
      setLoteDe(''); setLoteAte('');
      carregar();
    } catch (err) {
      setLoteErro(err.message);
    } finally {
      setLoteSalvando(false);
    }
  };

  const remover = async (id) => {
    if (!window.confirm('Remover esta mesa?')) return;
    try {
      await removerMesa(id);
      carregar();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <form onSubmit={criar} className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-[#71717A]">Número</label>
          <input type="number" value={numero} onChange={(e) => setNumero(e.target.value)} required
            className="w-24 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-[#71717A]">Nome (opcional)</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)}
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
        </div>
        {erro && <p className="text-xs text-red-600 w-full">{erro}</p>}
        <button type="submit" className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl">Adicionar mesa</button>
      </form>

      <form onSubmit={criarLote} className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-4">
        <p className="text-xs font-semibold text-[#71717A] mb-2">Criar várias de uma vez (mesas fixas numeradas)</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-[#71717A]">De</label>
            <input type="number" value={loteDe} onChange={(e) => setLoteDe(e.target.value)} required
              className="w-24 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#71717A]">Até</label>
            <input type="number" value={loteAte} onChange={(e) => setLoteAte(e.target.value)} required
              className="w-24 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={loteSalvando}
            className="px-4 py-2 bg-zinc-800 text-white text-sm font-bold rounded-xl disabled:opacity-50">
            {loteSalvando ? 'Criando...' : 'Criar mesas'}
          </button>
        </div>
        {loteErro && <p className="text-xs text-red-600 mt-2">{loteErro}</p>}
        {loteResultado && (
          <p className="text-xs text-emerald-700 mt-2">
            {loteResultado.criadas} mesa(s) criada(s){loteResultado.ja_existiam > 0 ? `, ${loteResultado.ja_existiam} já existiam (puladas)` : ''}.
          </p>
        )}
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {mesas.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-[#E4E4E7] p-3 text-center">
            <p className="text-lg font-black text-[#18181B]">{m.numero}</p>
            {m.nome && <p className="text-xs text-[#71717A]">{m.nome}</p>}
            <p className="text-[10px] text-[#A1A1AA] mt-1">{m.status}</p>
            {m.status === 'livre' && (
              <button onClick={() => remover(m.id)} className="text-[10px] text-red-500 mt-1">Remover</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const RestauranteGarcons = () => {
  const [garcons, setGarcons] = useState([]);
  const [aba, setAba] = useState('garcons');

  const carregar = useCallback(() => listarGarcons().then(setGarcons), []);
  useEffect(() => { carregar(); }, [carregar]);

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <div className="bg-white border-b border-[#E4E4E7] p-4">
        <NavRestaurante active="/restaurante/garcons" />
      </div>
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setAba('garcons')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${aba === 'garcons' ? 'bg-[#FF441F] text-white' : 'bg-white text-[#71717A] border border-[#E4E4E7]'}`}>
            Garçons
          </button>
          <button onClick={() => setAba('mesas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${aba === 'mesas' ? 'bg-[#FF441F] text-white' : 'bg-white text-[#71717A] border border-[#E4E4E7]'}`}>
            Mesas
          </button>
        </div>

        {aba === 'garcons' ? (
          <>
            <NovoGarcomForm onCriado={carregar} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {garcons.map((g) => <GarcomCard key={g.id} garcom={g} onMudou={carregar} />)}
              {garcons.length === 0 && <p className="text-sm text-[#A1A1AA]">Nenhum garçom cadastrado.</p>}
            </div>
          </>
        ) : <MesasTab />}
      </div>
    </div>
  );
};

export default RestauranteGarcons;
