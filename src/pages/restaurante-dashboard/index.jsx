import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getMinhaEmpresa, getCaixa, abrirCaixa, fecharCaixa,
  adicionarSaida, buscarPedidoDetalhe, atualizarStatusPedido, toggleStatusRestaurante,
  listarMotoboys, atribuirMotoboy,
} from '../../services/restauranteService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import PedidoDetalhe from './PedidoDetalhe';
import SaidaModal from './SaidaModal';
import FecharCaixaModal from './FecharCaixaModal';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS_LABELS = {
  pending:          { label: 'Recebido',   color: 'bg-yellow-100 text-yellow-800' },
  confirmed:        { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  preparing:        { label: 'Em Preparo', color: 'bg-orange-100 text-orange-800' },
  ready:            { label: 'Pronto',     color: 'bg-purple-100 text-purple-800' },
  out_for_delivery: { label: 'Em entrega', color: 'bg-indigo-100 text-indigo-800' },
  delivered:        { label: 'Entregue',   color: 'bg-green-100 text-green-800' },
  canceled:         { label: 'Cancelado',  color: 'bg-red-100 text-red-800' },
};

const KpiCard = ({ icon, label, value, sub, color = 'gray' }) => {
  const colors = { orange: 'border-orange-200 bg-orange-50 text-orange-700', green: 'border-green-200 bg-green-50 text-green-700', blue: 'border-blue-200 bg-blue-50 text-blue-700', red: 'border-red-200 bg-red-50 text-red-700', gray: 'border-[#E4E4E7] bg-white text-[#18181B]' };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name={icon} size={14} className="opacity-70" />
        <p className="text-xs font-medium opacity-75">{label}</p>
      </div>
      <p className="text-2xl font-black">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
};

const LINKS = [
  { label: 'Dashboard', path: '/restaurante' },
  { label: 'Cozinha', path: '/restaurante/cozinha' },
  { label: 'Produtos', path: '/restaurante/produtos' },
  { label: 'Pedidos', path: '/restaurante/pedidos' },
  { label: 'Motoboys', path: '/restaurante/motoboys' },
  { label: 'Clientes', path: '/restaurante/clientes' },
  { label: 'Designer', path: '/restaurante/aparencia' },
  { label: 'Config', path: '/restaurante/config' },
];

const RestauranteDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [empresa, setEmpresa] = useState(null);
  const [statusAberto, setStatusAberto] = useState(true);
  const [caixa, setCaixa] = useState(null);
  const [valorInicial, setValorInicial] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState(null);
  const [pedidoDetalhe, setPedidoDetalhe] = useState(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [atualizando, setAtualizando] = useState(null);

  const [showSaida, setShowSaida] = useState(false);
  const [salvandoSaida, setSalvandoSaida] = useState(false);
  const [showFechar, setShowFechar] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [fechamento, setFechamento] = useState(null);
  const [motoboys, setMotoboys] = useState([]);

  const carregar = async () => {
    try {
      const [emp, caixaData, mbData] = await Promise.all([
        getMinhaEmpresa(), getCaixa(), listarMotoboys().catch(() => ({ motoboys: [] })),
      ]);
      setEmpresa(emp.empresa);
      setStatusAberto(caixaData.status_restaurante);
      setCaixa(caixaData);
      setMotoboys(mbData.motoboys ?? []);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  const recarregarCaixa = async () => {
    try {
      const data = await getCaixa();
      setCaixa(data);
    } catch { /* silent */ }
  };

  useEffect(() => { carregar(); }, []);

  // Auto-refresh pedidos quando caixa aberto
  useEffect(() => {
    if (!caixa?.aberto) return;
    const id = setInterval(recarregarCaixa, 30000);
    return () => clearInterval(id);
  }, [caixa?.aberto]);

  const handleToggleStatus = async (novoStatus) => {
    setStatusAberto(novoStatus);
    try { await toggleStatusRestaurante(novoStatus); } catch { setStatusAberto(!novoStatus); }
  };

  const handleAbrirCaixa = async () => {
    try {
      const data = await abrirCaixa(valorInicial ? parseFloat(valorInicial) : 0);
      setCaixa(data);
      setValorInicial('');
    } catch (e) { alert(e.message); }
  };

  const handleSelecionarPedido = async (id) => {
    if (pedidoSelecionadoId === id) { setPedidoSelecionadoId(null); setPedidoDetalhe(null); return; }
    setPedidoSelecionadoId(id);
    setPedidoDetalhe(null);
    setLoadingDetalhe(true);
    try {
      const d = await buscarPedidoDetalhe(id);
      setPedidoDetalhe(d);
    } catch (e) { alert(e.message); } finally { setLoadingDetalhe(false); }
  };

  const handleAvancarStatus = async (pedido, novoStatus) => {
    setAtualizando(pedido.id);
    try {
      await atualizarStatusPedido(pedido.id, novoStatus);
      const [novoCaixa, novoDetalhe] = await Promise.all([getCaixa(), buscarPedidoDetalhe(pedido.id)]);
      setCaixa(novoCaixa);
      setPedidoDetalhe(novoDetalhe);
    } catch (e) { alert(e.message); } finally { setAtualizando(null); }
  };

  const handleAtribuirMotoboy = async (pedidoId, motoboyId) => {
    try {
      await atribuirMotoboy(pedidoId, motoboyId);
      const [novoCaixa, novoDetalhe] = await Promise.all([getCaixa(), buscarPedidoDetalhe(pedidoId)]);
      setCaixa(novoCaixa);
      setPedidoDetalhe(novoDetalhe);
    } catch (e) { alert(e.message); }
  };

  const handleAdicionarSaida = async (dados) => {
    setSalvandoSaida(true);
    try {
      await adicionarSaida(dados);
      const novoCaixa = await getCaixa();
      setCaixa(novoCaixa);
      setShowSaida(false);
    } catch (e) { alert(e.message); } finally { setSalvandoSaida(false); }
  };

  const handleFecharCaixa = async () => {
    setFechando(true);
    try {
      const res = await fecharCaixa();
      setFechamento(res);
      setCaixa({ ...caixa, aberto: false, pedidos: [], resumo: null });
      setShowFechar(false);
      setPedidoSelecionadoId(null); setPedidoDetalhe(null);
    } catch (e) { alert(e.message); } finally { setFechando(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <p className="text-red-600 text-sm">{erro}</p>
    </div>
  );

  const r = caixa?.resumo;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#18181B]">{empresa?.name ?? 'Meu Restaurante'}</h1>
          <p className="text-sm text-[#71717A]">Painel Operacional</p>
        </div>
        <nav className="flex gap-1.5 flex-wrap items-center">
          {LINKS.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${l.path === '/restaurante' ? 'text-white bg-[#FF441F] shadow-sm shadow-[#FF441F]/30' : 'text-[#27272A] hover:bg-[#F4F4F5]'}`}>
              {l.label}
            </button>
          ))}
          <button onClick={async () => { await signOut(); navigate('/customer-registration-login'); }}
            className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200">Sair</button>
        </nav>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-5">

        {/* Fechamento anterior */}
        {fechamento && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-800">Caixa fechado com sucesso</p>
              <p className="text-xs text-green-600">Vendas: {fmt(fechamento.resumo?.total_vendas)} · Saldo: {fmt(fechamento.resumo?.saldo)}</p>
            </div>
            <button onClick={() => setFechamento(null)} className="text-green-400 hover:text-green-600 p-1"><Icon name="X" size={16} /></button>
          </motion.div>
        )}

        {/* Status restaurante */}
        <motion.div animate={{ borderColor: statusAberto ? '#22C55E' : '#EF4444' }}
          className={`rounded-2xl border-2 p-4 flex items-center justify-between ${statusAberto ? 'bg-green-50' : 'bg-red-50'}`}>
          <div>
            <p className="font-black text-[#18181B]">{statusAberto ? '🟢 Restaurante ABERTO' : '🔴 Restaurante FECHADO'}</p>
            <p className="text-xs text-[#71717A] mt-0.5">{statusAberto ? 'Clientes podem fazer pedidos agora.' : 'Pedidos pausados.'}</p>
          </div>
          <button type="button" onClick={() => handleToggleStatus(!statusAberto)}
            className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${statusAberto ? 'bg-green-500' : 'bg-red-400'}`}>
            <span className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${statusAberto ? 'left-8' : 'left-1.5'}`} />
          </button>
        </motion.div>

        {/* Caixa — fechado */}
        {!caixa?.aberto && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Wallet" size={18} className="text-[#FF441F]" />
              <h2 className="font-bold text-[#18181B]">Caixa</h2>
              <span className="ml-auto text-xs bg-[#F4F4F5] text-[#71717A] px-2 py-0.5 rounded-full font-medium">Fechado</span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#71717A] mb-1">Valor inicial (R$)</label>
                <input type="number" min="0" step="0.01" value={valorInicial}
                  onChange={(e) => setValorInicial(e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
              </div>
              <div className="flex items-end">
                <button onClick={handleAbrirCaixa}
                  className="px-5 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] transition-colors whitespace-nowrap">
                  Abrir caixa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Caixa — aberto */}
        {caixa?.aberto && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard icon="TrendingUp" label="Vendas" value={fmt(r?.total_vendas)} sub={`${r?.entregues ?? 0} entregues`} color="green" />
              <KpiCard icon="Clock" label="Em andamento" value={r?.em_andamento ?? 0} sub={`${r?.cancelados ?? 0} cancelados`} color="blue" />
              <KpiCard icon="ArrowDownLeft" label="Saídas" value={fmt(r?.total_saidas)} sub={`${caixa?.saidas?.length ?? 0} registros`} color="red" />
              <KpiCard icon="Wallet" label="Saldo caixa" value={fmt(r?.saldo)} sub={`Inicial: ${fmt(caixa.valor_inicial)}`} color="orange" />
            </div>

            {/* Barra caixa */}
            <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#18181B]">Caixa aberto</p>
                  <p className="text-xs text-[#71717A]">Desde {new Date(caixa.aberto_em).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setShowSaida(true)}
                  className="px-3 py-1.5 text-xs font-semibold border border-[#E4E4E7] rounded-lg text-[#27272A] hover:bg-[#F4F4F5] flex items-center gap-1">
                  <Icon name="ArrowDownLeft" size={13} /> Saída
                </button>
                <button onClick={() => setShowFechar(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1">
                  <Icon name="Lock" size={13} /> Fechar caixa
                </button>
              </div>
            </div>

            {/* Pedidos do caixa + detalhe */}
            <div className={`grid gap-4 ${pedidoDetalhe || loadingDetalhe ? 'md:grid-cols-[1fr_340px]' : 'grid-cols-1'}`}>
              <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-[#18181B] flex items-center gap-2">
                    <Icon name="ShoppingBag" size={16} className="text-[#FF441F]" />
                    Pedidos da sessão
                    <span className="text-xs font-normal text-[#71717A]">({caixa.pedidos?.length ?? 0})</span>
                  </h2>
                </div>

                {(caixa.pedidos?.length ?? 0) === 0 ? (
                  <p className="text-sm text-[#71717A] text-center py-8">Nenhum pedido nesta sessão ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {caixa.pedidos.map((p) => {
                      const sl = STATUS_LABELS[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-700' };
                      const selected = pedidoSelecionadoId === p.id;
                      const clienteNome = p.customers?.name ?? null;
                      const isAtivo = ['pending', 'confirmed', 'ready', 'out_for_delivery'].includes(p.status);
                      return (
                        <button key={p.id} onClick={() => handleSelecionarPedido(p.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${selected ? 'border-[#FF441F] bg-[#FFF4F1]' : 'border-[#F4F4F5] hover:border-[#E4E4E7] hover:bg-[#FAFAFA]'}`}>
                          {/* Status bar lateral */}
                          <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                            p.status === 'pending' ? 'bg-yellow-400' :
                            p.status === 'confirmed' ? 'bg-blue-400' :
                            p.status === 'preparing' ? 'bg-orange-400' :
                            p.status === 'ready' ? 'bg-purple-400' :
                            p.status === 'out_for_delivery' ? 'bg-indigo-400' :
                            p.status === 'delivered' ? 'bg-green-400' : 'bg-red-300'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-bold text-[#18181B]">#{p.id}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${sl.color}`}>{sl.label}</span>
                              {isAtivo && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-auto flex-shrink-0" />}
                            </div>
                            {clienteNome && (
                              <p className="text-xs font-semibold text-[#27272A] truncate">{clienteNome}</p>
                            )}
                            <p className="text-xs text-[#71717A]">{fmt(p.total)} · {p.payment_method === 'cash' ? 'Dinheiro' : p.payment_method === 'pix' ? 'PIX' : 'Cartão'}</p>
                          </div>
                          <p className="text-xs text-[#71717A] flex-shrink-0 tabular-nums">
                            {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detalhe do pedido */}
              <AnimatePresence>
                {loadingDetalhe && (
                  <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 flex items-center justify-center">
                    <div className="w-6 h-6 border-3 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {pedidoDetalhe && !loadingDetalhe && (
                  <PedidoDetalhe
                    detalhe={pedidoDetalhe}
                    onAvancar={handleAvancarStatus}
                    atualizando={atualizando}
                    onClose={() => { setPedidoSelecionadoId(null); setPedidoDetalhe(null); }}
                    motoboys={motoboys}
                    onAtribuir={handleAtribuirMotoboy}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Saídas */}
            {(caixa.saidas?.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5">
                <h2 className="font-bold text-[#18181B] mb-3 flex items-center gap-2">
                  <Icon name="ArrowDownLeft" size={16} className="text-red-500" /> Saídas registradas
                </h2>
                <div className="space-y-2">
                  {caixa.saidas.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-[#F4F4F5] last:border-0">
                      <div>
                        <p className="font-medium text-[#18181B]">{s.descricao}</p>
                        <p className="text-xs text-[#71717A]">{new Date(s.criado_em).toLocaleString('pt-BR')}</p>
                      </div>
                      <p className="font-bold text-red-500">- {fmt(s.valor)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showSaida && (
        <SaidaModal
          onConfirmar={handleAdicionarSaida}
          onFechar={() => setShowSaida(false)}
          salvando={salvandoSaida}
        />
      )}

      {showFechar && (
        <FecharCaixaModal
          resumo={caixa?.resumo}
          aberto_em={caixa?.aberto_em}
          onConfirmar={handleFecharCaixa}
          onCancelar={() => setShowFechar(false)}
          fechando={fechando}
        />
      )}
    </div>
  );
};

export default RestauranteDashboard;
