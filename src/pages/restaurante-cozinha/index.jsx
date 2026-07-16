import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPedidosCozinha, atualizarStatusPedido, getMinhaEmpresa, renovarTokenCozinha,
  listarImpressoras, getKdsItensRestaurante, marcarItemProntoRestaurante, reimprimirItemRestaurante, iniciarPreparoItemRestaurante,
} from '../../services/restauranteService';
import {
  getCozinhaToken, setCozinhaToken, clearCozinhaToken,
  getCozinhaMe, getCozinhaPedidos, atualizarStatusCozinhaPortal,
  getKdsImpressoras, getKdsItens, marcarItemPronto, reimprimirItem, iniciarPreparoItem,
} from '../../services/cozinhaPortalService';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import { barcodeValue, getPrinterName, setPrinterName, printTicketSetor } from '../../utils/printComanda';
import { formatDuracao } from '../../utils/formatDuracao';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import { useNowTick } from '../../hooks/useNowTick';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão', debit_card: 'Débito', cash: 'Dinheiro' };

const STATUS_INFO = {
  confirmed: { label: 'Aguardando Preparo', next: 'preparing', nextLabel: 'Iniciar Preparo', nextIcon: 'ChefHat', prev: 'pending', prevLabel: 'Pendente', color: 'border-blue-300 bg-blue-50', badge: 'bg-blue-100 text-blue-800', btnColor: 'bg-orange-500 hover:bg-orange-600' },
  preparing: { label: 'Em Preparo', next: 'ready', nextLabel: 'Marcar Pronto', nextIcon: 'Package', prev: 'confirmed', prevLabel: 'Ag. Preparo', color: 'border-orange-300 bg-orange-50', badge: 'bg-orange-100 text-orange-800', btnColor: 'bg-purple-600 hover:bg-purple-700' },
};

const OrderCard = ({ pedido, posicao, now, onAvancar, onVoltar, atualizando, restauranteNome, highlighted }) => {
  const si = STATUS_INFO[pedido.status];
  const isAtualizando = atualizando === pedido.id;
  const tempoDecorrido = now - new Date(pedido.created_at).getTime();
  const minutos = Math.floor(tempoDecorrido / 60000);
  const isHighlighted = highlighted === pedido.id;

  return (
    <div
      id={`order-${pedido.id}`}
      className={`rounded-2xl border-2 overflow-hidden flex flex-col transition-all duration-300 ${
        isHighlighted
          ? 'border-yellow-400 bg-yellow-50 shadow-xl shadow-yellow-300/40 scale-[1.02]'
          : posicao === 1
          ? 'border-yellow-400 bg-white'
          : si?.color ?? 'border-gray-200 bg-white'
      }`}
    >
      {isHighlighted && (
        <div className="bg-yellow-400 px-4 py-1.5 flex items-center gap-2">
          <Icon name="ScanLine" size={14} className="text-yellow-900" />
          <p className="text-xs font-black text-yellow-900 uppercase tracking-wide">Pedido encontrado via leitura</p>
        </div>
      )}
      {!isHighlighted && posicao === 1 && (
        <div className="bg-yellow-400 px-4 py-1 flex items-center gap-1.5">
          <p className="text-[10px] font-black text-yellow-900 uppercase tracking-wide">Próximo da fila</p>
        </div>
      )}

      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-black ${posicao === 1 ? 'bg-yellow-400 text-black' : 'bg-[#E4E4E7] text-[#27272A]'}`}>
              {posicao}
            </span>
            <p className="text-2xl font-black text-[#18181B]">#{pedido.id}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${si?.badge}`}>{si?.label}</span>
          </div>
          {pedido.customers?.name && (
            <p className="text-sm font-semibold text-[#27272A]">{pedido.customers.name}</p>
          )}
          <p className="text-xs text-[#71717A] mt-0.5 flex items-center gap-1">
            <Icon name="Clock" size={11} />
            {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            <span className={`ml-1 font-semibold font-mono ${minutos > 15 ? 'text-red-500' : minutos > 8 ? 'text-orange-500' : 'text-green-600'}`}>
              · {formatDuracao(tempoDecorrido)}
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <div className="flex items-center justify-center gap-1 px-2 py-1 bg-[#F4F4F5] rounded-lg">
            <Icon name="Barcode" size={11} className="text-[#71717A]" />
            <span className="text-[10px] font-mono text-[#71717A]">{barcodeValue(pedido.id)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-white mx-3 rounded-xl mb-3 border border-[#E4E4E7] flex-1">
        <div className="space-y-2">
          {(pedido.itens ?? []).map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="w-7 h-7 bg-[#FF441F] text-white font-black text-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.quantity}
              </span>
              <p className="text-sm font-semibold text-[#18181B] leading-tight">{item.product_name ?? `Produto #${item.product_id}`}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F4F4F5]">
          <span className="text-xs text-[#71717A]">{PAYMENT_LABELS[pedido.payment_method] ?? pedido.payment_method}</span>
          <span className="text-sm font-black text-[#FF441F]">{fmt(pedido.total)}</span>
        </div>
      </div>

      <div className="px-3 pb-3 flex gap-2">
        <button
          disabled={isAtualizando}
          onClick={() => onVoltar(pedido.id, si?.prev)}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-[#E4E4E7] rounded-xl text-xs font-bold text-[#71717A] hover:bg-[#F4F4F5] disabled:opacity-40 transition-colors"
        >
          <Icon name="ArrowLeft" size={13} />
          {si?.prevLabel}
        </button>
        <button
          disabled={isAtualizando}
          onClick={() => onAvancar(pedido.id, si?.next)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-black rounded-xl disabled:opacity-50 transition-colors shadow-md ${si?.btnColor}`}
        >
          {isAtualizando ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Icon name={si?.nextIcon ?? 'ArrowRight'} size={15} />
              {si?.nextLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Card de item do salão (não agrupa por mesa/comanda) — mostra mesa e garçom inline,
// ordenado junto com os pedidos de delivery pela ordem de chegada. Cronômetro ao vivo
// (espera/preparo) igual ao painel de Produção.
const SalaoItemCard = ({ item, posicao, now, onReimprimir, onIniciarPreparo, onMarcarPronto }) => {
  const enviadoEm = new Date(item.enviado_em).getTime();
  const preparandoEm = item.preparando_em ? new Date(item.preparando_em).getTime() : null;
  const tempoEspera = (preparandoEm ?? now) - enviadoEm;
  const tempoPreparo = preparandoEm ? now - preparandoEm : 0;
  const tempoTotal = now - enviadoEm;

  return (
  <div className={`rounded-2xl border-2 p-4 ${posicao === 1 ? 'border-yellow-400/70 bg-purple-950/20 ring-1 ring-yellow-400/30' : 'border-purple-300 bg-purple-950/20'}`}>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-black ${posicao === 1 ? 'bg-yellow-400 text-black' : 'bg-purple-900/50 text-white'}`}>
          {posicao}
        </span>
        <span className="text-sm font-bold text-white">{item.quantity}x {item.product_name} <span className="text-purple-300 font-normal text-xs">· Salão</span></span>
      </div>
      <button onClick={() => onReimprimir(item)}
        className="text-[10px] font-bold text-orange-400 border border-orange-500/40 rounded-lg px-2 py-1 hover:bg-orange-500/10 flex items-center gap-1 flex-shrink-0">
        <Icon name="Printer" size={11} /> Reimpressão
      </button>
    </div>
    {posicao === 1 && <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide mb-1">Próximo da fila</p>}
    {item.observacao && <p className="text-xs text-amber-400 mb-1">Obs: {item.observacao}</p>}
    <div className="flex items-center gap-2 text-xs text-[#71717A] mb-2">
      <Icon name="MapPin" size={12} />
      <span>{item.mesa ?? item.cliente ?? 'Avulsa'}</span>
      {item.garcom && (
        <>
          <span className="text-[#3A3A3A]">•</span>
          <Icon name="User" size={12} />
          <span>{item.garcom}</span>
        </>
      )}
    </div>
    <div className="flex items-center gap-3 text-[11px] font-mono mb-3">
      <span className="flex items-center gap-1 text-blue-400">
        <Icon name="Clock" size={11} /> espera {formatDuracao(tempoEspera)}
      </span>
      {item.status === 'preparando' && (
        <span className="flex items-center gap-1 text-orange-400">
          <Icon name="Flame" size={11} /> preparo {formatDuracao(tempoPreparo)}
        </span>
      )}
      <span className="ml-auto text-[#71717A]">total {formatDuracao(tempoTotal)}</span>
    </div>
    {item.status === 'enviado' ? (
      <button onClick={() => onIniciarPreparo(item)}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
        <Icon name="ChefHat" size={13} /> Iniciar Preparo
      </button>
    ) : (
      <button onClick={() => onMarcarPronto(item.id)}
        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
        <Icon name="Check" size={13} /> Pronto
      </button>
    )}
  </div>
  );
};

// Login screen para acesso via token (sem conta de dono)
const CozinhaLogin = ({ onLogin }) => {
  const [token, setToken] = useState('');
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    setCozinhaToken(token.trim());
    try {
      await getCozinhaMe();
      onLogin();
    } catch {
      clearCozinhaToken();
      setErro('Link inválido. Solicite um novo link ao restaurante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#2A2A2A] p-6 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="ChefHat" size={28} className="text-orange-400" />
          </div>
          <h1 className="text-lg font-black text-white">Painel da Cozinha</h1>
          <p className="text-sm text-[#71717A] mt-1">Cole o token recebido do restaurante</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token de acesso..."
            required
            className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-3 py-3 text-sm font-mono text-white focus:outline-none focus:border-orange-500"
          />
          {erro && <p className="text-xs text-red-400">{erro}</p>}
          <button type="submit" disabled={loading || !token.trim()}
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 text-sm">
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

const RestauranteCozinha = () => {
  const navigate = useNavigate();

  // Detecta modo token sincronamente — antes da primeira renderização
  const [modoToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('cozinha_token');
    if (urlToken) {
      setCozinhaToken(urlToken);
      window.history.replaceState({}, '', '/restaurante/cozinha');
    }
    return !!getCozinhaToken();
  });
  const [authed, setAuthed] = useState(() => !!getCozinhaToken());
  const [pedidos, setPedidos] = useState([]);
  const [restauranteNome, setRestauranteNome] = useState('');
  const [restauranteId, setRestauranteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [erro, setErro] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [highlighted, setHighlighted] = useState(null);
  const [scanMsg, setScanMsg] = useState(null);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [printerInput, setPrinterInput] = useState('');
  const [printerSaved, setPrinterSaved] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [gerandoLink, setGerandoLink] = useState(false);
  const [impressorasCozinha, setImpressorasCozinha] = useState(null);
  const [itensSalao, setItensSalao] = useState([]);
  const [filtroCanal, setFiltroCanal] = useState('todos'); // 'todos' | 'delivery' | 'salao'
  const now = useNowTick();
  const scanRef = useRef(null);
  const prevOrderIds = useRef(new Set());
  const firstLoad = useRef(true);
  const tocarSom = useNotificacaoSonora('cozinha');

  const copiarLinkCozinha = async () => {
    setGerandoLink(true);
    try {
      const { cozinha_token } = await renovarTokenCozinha();
      const base = window.location.origin;
      const texto = `${base}/restaurante/cozinha?cozinha_token=${cozinha_token}`;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
      } else {
        const el = document.createElement('textarea');
        el.value = texto; el.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(el); el.focus(); el.select();
        document.execCommand('copy'); document.body.removeChild(el);
      }
      setCopiadoLink(true);
      setTimeout(() => setCopiadoLink(false), 2500);
    } catch (e) {
      alert('Erro ao gerar link: ' + e.message);
    } finally {
      setGerandoLink(false);
    }
  };

  const handleSavePrinter = () => {
    setPrinterName(printerInput.trim());
    setPrinterSaved(true);
    setTimeout(() => setPrinterSaved(false), 2000);
  };

  const carregar = useCallback(async (currentRestauranteNome, usarToken = false) => {
    try {
      const data = usarToken ? await getCozinhaPedidos() : await getPedidosCozinha();
      const newPedidos = data.pedidos ?? [];

      if (!firstLoad.current) {
        const novos = newPedidos.filter((p) => !prevOrderIds.current.has(p.id));
        if (novos.length > 0) tocarSom();
      }

      prevOrderIds.current = new Set(newPedidos.map((p) => p.id));
      firstLoad.current = false;
      setPedidos(newPedidos);
      setLastUpdate(new Date());
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Itens de comanda do salão roteados pra impressora(s) de setor "Cozinha" — mesmo
  // padrão do painel de Produção/Bar, só que embutido aqui pra dar visão única.
  const carregarSalao = useCallback(async (impressoras, usarToken = false) => {
    if (!impressoras?.length) { setItensSalao([]); return; }
    try {
      const getItens = usarToken ? getKdsItens : getKdsItensRestaurante;
      const listas = await Promise.all(
        impressoras.map((imp) => getItens(imp.id).then((r) => r.itens ?? [])),
      );
      setItensSalao(listas.flat());
    } catch {
      // silencioso — não quebra a tela principal de delivery por causa do salão
    }
  }, []);

  useEffect(() => {
    if (modoToken && !authed) return;

    let nome = '';
    const getImpressoras = modoToken ? getKdsImpressoras : listarImpressoras;
    getImpressoras()
      .then((lista) => setImpressorasCozinha((lista ?? []).filter((i) => (i.setor ?? '').toLowerCase().includes('cozinha'))))
      .catch(() => setImpressorasCozinha([]));

    if (modoToken) {
      getCozinhaMe()
        .then((d) => { nome = d.restaurante?.name ?? ''; setRestauranteNome(nome); setRestauranteId(d.restaurante?.id ?? null); })
        .catch(() => {});
      carregar(nome, true);
      const id = setInterval(() => carregar(nome, true), 30000);
      return () => clearInterval(id);
    }

    getMinhaEmpresa()
      .then((d) => {
        nome = d.empresa?.name ?? '';
        setRestauranteNome(nome);
        setRestauranteId(d.empresa?.id ?? null);
      })
      .catch(() => {});

    carregar(nome);
    const id = setInterval(() => carregar(nome), 30000);
    return () => clearInterval(id);
  }, [carregar, modoToken, authed]);

  useEffect(() => {
    if (!impressorasCozinha) return;
    carregarSalao(impressorasCozinha, modoToken);
    const id = setInterval(() => carregarSalao(impressorasCozinha, modoToken), 15000);
    return () => clearInterval(id);
  }, [impressorasCozinha, modoToken, carregarSalao]);

  // Realtime: recarrega cozinha quando pedido muda de status
  useEffect(() => {
    if (!restauranteId) return;
    const channel = supabase
      .channel(`cozinha-${restauranteId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restauranteId}`,
      }, () => carregar(restauranteNome))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [restauranteId, carregar, restauranteNome]);

  useEffect(() => {
    const saved = getPrinterName();
    setPrinterInput(saved);
  }, []);

  const buscarPorId = useCallback((rawValue) => {
    const id = parseInt(rawValue.replace(/\D/g, ''));
    if (!id) return;
    const found = pedidos.find((p) => p.id === id);
    if (found) {
      setHighlighted(id);
      setScanMsg({ tipo: 'ok', texto: `Pedido #${id} encontrado` });
      setTimeout(() => { setHighlighted(null); setScanMsg(null); }, 4000);
      setTimeout(() => {
        document.getElementById(`order-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    } else {
      setScanMsg({ tipo: 'erro', texto: `Pedido #${id} não está na cozinha agora` });
      setTimeout(() => setScanMsg(null), 3000);
    }
    setScanInput('');
    scanRef.current?.focus();
  }, [pedidos]);

  const handleScanKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); buscarPorId(scanInput); }
  };

  const handleAvancar = async (pedidoId, novoStatus) => {
    setAtualizando(pedidoId);
    try {
      if (modoToken) {
        await atualizarStatusCozinhaPortal(pedidoId, novoStatus);
        await carregar(restauranteNome, true);
      } else {
        await atualizarStatusPedido(pedidoId, novoStatus);
        await carregar(restauranteNome);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setAtualizando(null);
    }
  };

  const marcarProntoSalao = async (itemId) => {
    try {
      if (modoToken) await marcarItemPronto(itemId);
      else await marcarItemProntoRestaurante(itemId);
      carregarSalao(impressorasCozinha, modoToken);
    } catch (e) {
      alert(e.message);
    }
  };

  const reimprimirSalao = async (item) => {
    try {
      const res = modoToken ? await reimprimirItem(item.id) : await reimprimirItemRestaurante(item.id);
      if (res.via === 'navegador') {
        printTicketSetor([item], { mesaLabel: item.mesa, cliente_mesa_nome: item.cliente }, 'Cozinha');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const iniciarPreparoSalao = async (item) => {
    try {
      if (modoToken) await iniciarPreparoItem(item.id);
      else await iniciarPreparoItemRestaurante(item.id);
      carregarSalao(impressorasCozinha, modoToken);
    } catch (e) {
      alert(e.message);
    }
  };

  // Só mostra pedido delivery aqui se ele tiver item roteado pra impressora de setor
  // "Cozinha" — antes mostrava TODO pedido delivery independente do produto, por isso
  // Bar/Cozinha ficavam misturados. Roteamento vem do produto (config em /produtos).
  const idsDeliveryRoteadosParaCozinha = new Set(
    itensSalao.filter((i) => i.tipo === 'delivery').map((i) => i.order_id),
  );
  const confirmados = pedidos.filter((p) => p.status === 'confirmed' && idsDeliveryRoteadosParaCozinha.has(p.id));
  const preparando = pedidos.filter((p) => p.status === 'preparing' && idsDeliveryRoteadosParaCozinha.has(p.id));
  const itensSalaoAguardando = itensSalao.filter((i) => i.status === 'enviado');
  const itensSalaoPreparando = itensSalao.filter((i) => i.status === 'preparando');

  // Junta delivery + salão numa fila só por coluna, ordenada por quem chegou primeiro.
  const filaAguardando = [
    ...confirmados.map((p) => ({ tipo: 'delivery', ts: new Date(p.created_at).getTime(), pedido: p })),
    ...itensSalaoAguardando.map((i) => ({ tipo: 'salao', ts: new Date(i.enviado_em).getTime(), item: i })),
  ].sort((a, b) => a.ts - b.ts);

  const filaEmPreparo = [
    ...preparando.map((p) => ({ tipo: 'delivery', ts: new Date(p.created_at).getTime(), pedido: p })),
    ...itensSalaoPreparando.map((i) => ({ tipo: 'salao', ts: new Date(i.enviado_em).getTime(), item: i })),
  ].sort((a, b) => a.ts - b.ts);

  // Filtro por canal (Todos/Delivery/Salão) aplicado só na exibição — posição na fila
  // é recalculada sobre a lista já filtrada.
  const passaFiltro = (e) => filtroCanal === 'todos' || e.tipo === filtroCanal;
  const aguardandoPreparo = filaAguardando.filter(passaFiltro);
  const emPreparo = filaEmPreparo.filter(passaFiltro);
  const totalDelivery = filaAguardando.filter((e) => e.tipo === 'delivery').length + filaEmPreparo.filter((e) => e.tipo === 'delivery').length;
  const totalSalao = filaAguardando.filter((e) => e.tipo === 'salao').length + filaEmPreparo.filter((e) => e.tipo === 'salao').length;

  // Modo token: mostrar login se não autenticado
  if (modoToken && !authed) {
    return <CozinhaLogin onLogin={() => setAuthed(true)} />;
  }

  if (loading) return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111111]">
      <header className="bg-[#1A1A1A] border-b border-[#2A2A2A] px-5 py-3">
        <div className="flex items-center gap-4 mb-3">
          {modoToken ? (
            <button onClick={() => { clearCozinhaToken(); window.location.reload(); }}
              className="p-2 text-[#71717A] hover:text-red-400 rounded-lg hover:bg-[#2A2A2A]" title="Sair">
              <Icon name="LogOut" size={18} />
            </button>
          ) : (
            <button onClick={() => navigate('/restaurante')} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
              <Icon name="ArrowLeft" size={18} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF441F] rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="ChefHat" size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">Painel da Cozinha</p>
              <p className="text-[#71717A] text-xs">{restauranteNome}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-[#71717A]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {lastUpdate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? '—'}
            </div>
            {/* Botão copiar link — só para o dono, não no modo token */}
            {!modoToken && (
              <button
                onClick={copiarLinkCozinha}
                disabled={gerandoLink}
                title="Copiar link de acesso para a cozinha"
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${copiadoLink ? 'text-green-400 bg-green-400/10' : 'text-[#71717A] hover:text-white hover:bg-[#2A2A2A]'}`}
              >
                <Icon name={gerandoLink ? 'Loader2' : copiadoLink ? 'Check' : 'Link'} size={16}
                  className={gerandoLink ? 'animate-spin' : ''} />
              </button>
            )}
            <button onClick={() => { setShowPrinterSettings((v) => !v); setPrinterInput(getPrinterName()); }}
              className={`p-2 rounded-lg transition-colors ${showPrinterSettings ? 'text-[#FF441F] bg-[#FF441F]/10' : 'text-[#71717A] hover:text-white hover:bg-[#2A2A2A]'}`}
              title="Configurar impressora">
              <Icon name="Printer" size={16} />
            </button>
            <button onClick={() => carregar(restauranteNome)} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
              <Icon name="RefreshCw" size={16} />
            </button>
          </div>
        </div>

        {/* Printer settings inline bar */}
        {showPrinterSettings && (
          <div className="mb-3 flex items-center gap-3 bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3">
            <Icon name="Printer" size={15} className="text-[#FF441F] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[#71717A] mb-1">Nome da impressora padrão (como aparece no Windows/Mac)</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={printerInput}
                  onChange={(e) => setPrinterInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePrinter()}
                  placeholder="Ex: EPSON TM-T20, HP LaserJet..."
                  className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[#3A3A3A] outline-none focus:border-[#FF441F]"
                />
                <button onClick={handleSavePrinter}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${printerSaved ? 'bg-green-600 text-white' : 'bg-[#FF441F] text-white hover:bg-[#E63A19]'}`}>
                  {printerSaved ? '✓ Salvo' : 'Salvar'}
                </button>
                {getPrinterName() && (
                  <button onClick={() => { setPrinterName(''); setPrinterInput(''); }}
                    className="px-3 py-1.5 text-xs font-bold bg-[#2A2A2A] text-[#71717A] hover:text-white rounded-lg">
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scanner / barcode reader input */}
        <div className="flex items-center gap-3">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
            scanMsg?.tipo === 'ok' ? 'border-green-500 bg-green-900/20' :
            scanMsg?.tipo === 'erro' ? 'border-red-500 bg-red-900/20' :
            'border-[#2A2A2A] bg-[#111111] focus-within:border-[#FF441F]'
          }`}>
            <Icon name="ScanLine" size={16} className={scanMsg?.tipo === 'ok' ? 'text-green-400' : scanMsg?.tipo === 'erro' ? 'text-red-400' : 'text-[#71717A]'} />
            <input
              ref={scanRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleScanKey}
              placeholder="Aponte o leitor ou digite o nº do pedido..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-[#3A3A3A] outline-none font-mono"
              autoFocus
            />
            {scanInput && (
              <button onClick={() => buscarPorId(scanInput)}
                className="flex-shrink-0 px-3 py-1 bg-[#FF441F] text-white text-xs font-bold rounded-lg hover:bg-[#E63A19]">
                Buscar
              </button>
            )}
          </div>
          {scanMsg && (
            <p className={`text-xs font-semibold flex-shrink-0 ${scanMsg.tipo === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
              {scanMsg.texto}
            </p>
          )}
        </div>

        {/* Filtro de canal — Todos/Delivery/Salão */}
        <div className="flex items-center gap-2 mt-3">
          {[
            { key: 'todos', label: 'Todos', count: totalDelivery + totalSalao },
            { key: 'delivery', label: 'Delivery', count: totalDelivery },
            { key: 'salao', label: 'Salão', count: totalSalao },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltroCanal(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filtroCanal === f.key
                  ? 'bg-[#FF441F] text-white'
                  : 'bg-[#111111] text-[#71717A] border border-[#2A2A2A] hover:text-white'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filtroCanal === f.key ? 'bg-white/20' : 'bg-[#2A2A2A]'}`}>{f.count}</span>
            </button>
          ))}
        </div>
      </header>

      {erro && (
        <div className="mx-5 mt-4 bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-400">{erro}</div>
      )}

      <main className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Aguardando Preparo</h2>
            {aguardandoPreparo.length > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{aguardandoPreparo.length}</span>
            )}
          </div>
          {aguardandoPreparo.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-8 text-center">
              <Icon name="CheckCircle" size={32} className="text-[#3A3A3A] mx-auto mb-2" />
              <p className="text-[#71717A] text-sm">Nenhum pedido aguardando</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aguardandoPreparo.map((entry, idx) => (
                entry.tipo === 'delivery' ? (
                  <OrderCard key={`d-${entry.pedido.id}`} pedido={entry.pedido} posicao={idx + 1} now={now} onAvancar={handleAvancar} onVoltar={handleAvancar}
                    atualizando={atualizando} restauranteNome={restauranteNome} highlighted={highlighted} />
                ) : (
                  <SalaoItemCard key={`s-${entry.item.id}`} item={entry.item} posicao={idx + 1} now={now}
                    onReimprimir={reimprimirSalao} onIniciarPreparo={iniciarPreparoSalao} onMarcarPronto={marcarProntoSalao} />
                )
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Em Preparo</h2>
            {emPreparo.length > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{emPreparo.length}</span>
            )}
          </div>
          {emPreparo.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-8 text-center">
              <Icon name="ChefHat" size={32} className="text-[#3A3A3A] mx-auto mb-2" />
              <p className="text-[#71717A] text-sm">Nenhum pedido em preparo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emPreparo.map((entry, idx) => (
                entry.tipo === 'delivery' ? (
                  <OrderCard key={`d-${entry.pedido.id}`} pedido={entry.pedido} posicao={idx + 1} now={now} onAvancar={handleAvancar} onVoltar={handleAvancar}
                    atualizando={atualizando} restauranteNome={restauranteNome} highlighted={highlighted} />
                ) : (
                  <SalaoItemCard key={`s-${entry.item.id}`} item={entry.item} posicao={idx + 1} now={now}
                    onReimprimir={reimprimirSalao} onIniciarPreparo={iniciarPreparoSalao} onMarcarPronto={marcarProntoSalao} />
                )
              ))}
            </div>
          )}
        </div>
      </main>

      {pedidos.length === 0 && itensSalao.length === 0 && !loading && (
        <div className="text-center py-20">
          <Icon name="UtensilsCrossed" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#71717A] text-lg font-semibold">Cozinha tranquila</p>
          <p className="text-[#3A3A3A] text-sm mt-1">Nenhum pedido para preparar agora</p>
        </div>
      )}

      <p className="text-center text-xs text-[#3A3A3A] py-4">Atualiza automaticamente a cada 30 segundos · auto-imprime novos pedidos</p>
    </div>
  );
};

export default RestauranteCozinha;
