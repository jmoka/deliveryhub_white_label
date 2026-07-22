import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarEntregas, listarMotoboys, atribuirMotoboy, entregarPedidoProprio } from '../../services/restauranteService';
import { AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import { useSolicitacoesMotoboyCount } from '../../hooks/useSolicitacoesMotoboyCount';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import { useMinhaLojaLogo } from '../../hooks/useMinhaLojaLogo';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';
import { useAuth } from '../../contexts/AuthContext';
import RestauranteSidebar from '../../components/restaurante/RestauranteSidebar';
import MobileMenu from '../../components/restaurante/MobileMenu';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const NavRestaurante = ({ active }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const pendentes = useSolicitacoesMotoboyCount();
  const slugLoja = useMinhaLojaSlug();
  const logoUrl = useMinhaLojaLogo();
  const tipoRestaurante = useTipoRestaurante();
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
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
    { label: 'Cardápio Digital', path: '/restaurante/cardapio-digital' },
    { label: 'Config', path: '/restaurante/config' },
  ];
  return (
    <>
      <div className="md:hidden flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logoUrl
            ? <img src={logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
            : <div className="w-8 h-8 rounded-lg bg-[#FF441F]/10 flex items-center justify-center"><Icon name="UtensilsCrossed" size={16} className="text-[#FF441F]" /></div>}
        </div>
        <button className="p-2 rounded-lg hover:bg-[#F4F4F5] text-[#18181B]" onClick={() => setMenuAberto((v) => !v)}>
          <Icon name={menuAberto ? 'X' : 'Menu'} size={22} />
        </button>
      </div>
      <AnimatePresence>
        {menuAberto && (
          <MobileMenu
            links={links}
            currentPath={active}
            pendentesMotoboy={pendentes}
            slugLoja={slugLoja}
            onNavigate={(path) => { navigate(path); setMenuAberto(false); }}
            onSair={async () => { await signOut(); navigate('/customer-registration-login'); }}
          />
        )}
      </AnimatePresence>
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

const STATUS_LABEL = {
  ready: 'Pronto — aguardando entrega',
  motoboy_collecting: 'Motoboy indo buscar',
  out_for_delivery: 'Saiu para entrega',
};

const STATUS_COLOR = {
  ready: 'bg-purple-100 text-purple-800 border-purple-200',
  motoboy_collecting: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  return `há ${Math.floor(diff / 3600)}h`;
};

const CardEntrega = ({ entrega, motoboys, onAtribuir, onEntregarProprio }) => {
  const [motoboySelecionado, setMotoboySelecionado] = useState('');
  const [processando, setProcessando] = useState(false);

  const semMotoboy = !entrega.motoboy_id;
  const podeAgir = semMotoboy && ['ready', 'out_for_delivery'].includes(entrega.status);

  const mapsMotoboyUrl = entrega.motoboy_lat && entrega.motoboy_lng
    ? `https://www.google.com/maps?q=${entrega.motoboy_lat},${entrega.motoboy_lng}`
    : null;

  const addr = entrega.cliente?.address_json ?? {};
  const enderecoCompleto = [addr.logradouro, addr.numero, addr.bairro, addr.cidade].filter(Boolean).join(', ');
  const mapsClienteUrl = enderecoCompleto
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(enderecoCompleto)}`
    : null;

  const handleAtribuir = async () => {
    if (!motoboySelecionado) return;
    setProcessando(true);
    try { await onAtribuir(entrega.id, Number(motoboySelecionado)); }
    catch (e) { alert(e.message); }
    finally { setProcessando(false); }
  };

  const handleEntregarProprio = async () => {
    if (!confirm(`Marcar pedido #${entrega.id} como entregue pela própria loja?`)) return;
    setProcessando(true);
    try { await onEntregarProprio(entrega.id); }
    catch (e) { alert(e.message); }
    finally { setProcessando(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#18181B]">Pedido #{entrega.id}</p>
          <p className="text-xs text-[#71717A]">{entrega.cliente?.name ?? 'Cliente'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_COLOR[entrega.status]}`}>
            {STATUS_LABEL[entrega.status] ?? entrega.status}
          </span>
          <p className="text-xs font-bold text-[#FF441F] mt-1">{fmt(entrega.total)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#71717A]">
        <Icon name="Clock" size={12} /> {timeAgo(entrega.updated_at ?? entrega.created_at)}
      </div>

      {entrega.motoboy ? (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="Bike" size={15} className="text-indigo-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#18181B] truncate">{entrega.motoboy.name}</p>
              {entrega.motoboy.phone && <p className="text-xs text-[#71717A]">{entrega.motoboy.phone}</p>}
            </div>
          </div>
          {mapsMotoboyUrl && (
            <a href={mapsMotoboyUrl} target="_blank" rel="noreferrer"
              className="flex-shrink-0 px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">
              Ver GPS
            </a>
          )}
        </div>
      ) : entrega.entrega_propria ? (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
          <Icon name="Store" size={15} className="text-green-600" />
          <p className="text-sm font-semibold text-green-700">Entrega própria</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Icon name="AlertTriangle" size={15} className="text-amber-600" />
          <p className="text-sm font-semibold text-amber-700">Aguardando atribuição de motoboy</p>
        </div>
      )}

      {mapsClienteUrl && (
        <a href={mapsClienteUrl} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2 border border-[#E4E4E7] text-[#71717A] text-xs font-semibold rounded-lg hover:bg-[#F4F4F5]">
          <Icon name="MapPin" size={12} /> Ver endereço do cliente
        </a>
      )}

      {podeAgir && (
        <div className="space-y-2 pt-1 border-t border-[#F4F4F5]">
          {motoboys.length > 0 && (
            <div className="flex gap-2">
              <select value={motoboySelecionado} onChange={(e) => setMotoboySelecionado(e.target.value)}
                className="flex-1 border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400">
                <option value="">Atribuir motoboy...</option>
                {motoboys.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <button onClick={handleAtribuir} disabled={!motoboySelecionado || processando}
                className="flex-shrink-0 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                Atribuir
              </button>
            </div>
          )}
          <button onClick={handleEntregarProprio} disabled={processando}
            className="w-full py-2 border-2 border-green-300 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 disabled:opacity-50 flex items-center justify-center gap-1.5">
            <Icon name="Store" size={13} /> Marcar entregue (própria loja)
          </button>
        </div>
      )}
    </div>
  );
};

const RestauranteEntregas = () => {
  const [entregas, setEntregas] = useState([]);
  const [motoboys, setMotoboys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const reload = useCallback(() => {
    Promise.all([listarEntregas(), listarMotoboys().catch(() => ({ motoboys: [] }))])
      .then(([e, m]) => {
        setEntregas(e.entregas ?? []);
        setMotoboys(m.motoboys ?? []);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 15000);
    return () => clearInterval(interval);
  }, [reload]);

  const handleAtribuir = async (pedidoId, motoboyId) => {
    await atribuirMotoboy(pedidoId, motoboyId);
    reload();
  };

  const handleEntregarProprio = async (pedidoId) => {
    await entregarPedidoProprio(pedidoId);
    reload();
  };

  const aguardando = entregas.filter((e) => e.status === 'ready' && !e.motoboy_id && !e.entrega_propria);
  const emAndamento = entregas.filter((e) => e.motoboy_id || e.status !== 'ready');

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5]">
      <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <header className="bg-white border-b border-[#E4E4E7] px-4 sm:px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-[#18181B]">Painel de Entregas</h1>
            <p className="text-sm text-[#71717A]">{entregas.length} entrega(s) em andamento agora</p>
          </div>
          <NavRestaurante active="/restaurante/entregas" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {erro && <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm">{erro}</div>}

        {entregas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-14 text-center">
            <Icon name="Truck" size={44} className="text-[#E4E4E7] mx-auto mb-3" />
            <p className="text-[#27272A] font-bold">Nenhuma entrega em andamento</p>
            <p className="text-sm text-[#71717A] mt-1">Pedidos prontos aparecem aqui automaticamente</p>
          </div>
        ) : (
          <>
            {aguardando.length > 0 && (
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase mb-3 flex items-center gap-1.5">
                  <Icon name="AlertTriangle" size={13} /> Aguardando atribuição ({aguardando.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aguardando.map((e) => (
                    <CardEntrega key={e.id} entrega={e} motoboys={motoboys}
                      onAtribuir={handleAtribuir} onEntregarProprio={handleEntregarProprio} />
                  ))}
                </div>
              </div>
            )}

            {emAndamento.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[#71717A] uppercase mb-3">Em andamento ({emAndamento.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {emAndamento.map((e) => (
                    <CardEntrega key={e.id} entrega={e} motoboys={motoboys}
                      onAtribuir={handleAtribuir} onEntregarProprio={handleEntregarProprio} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-[#A1A1AA]">Atualiza automaticamente a cada 15 segundos</p>
      </main>
    </div>
  );
};

export default RestauranteEntregas;
