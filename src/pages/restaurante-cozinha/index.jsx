import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPedidosCozinha, getMinhaEmpresa, renovarTokenCozinha,
  listarImpressoras, getKdsItensRestaurante, marcarItemProntoRestaurante, iniciarPreparoItemRestaurante, voltarStatusItemRestaurante,
} from '../../services/restauranteService';
import {
  getCozinhaToken, setCozinhaToken, clearCozinhaToken, resgatarToken,
  getCozinhaMe, getCozinhaPedidos,
  getKdsImpressoras, getKdsItens, marcarItemPronto, iniciarPreparoItem, voltarStatusItem,
} from '../../services/cozinhaPortalService';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import SalaoItemCard from '../../components/restaurante/SalaoItemCard';
import PedidoDeliveryCard from '../../components/restaurante/PedidoDeliveryCard';
import { montarFilaAgrupadaDelivery } from '../../utils/agruparPedidosDelivery';
import { barcodeValue, getPrinterName, setPrinterName } from '../../utils/printComanda';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import { useNowTick } from '../../hooks/useNowTick';
import { getTermos } from '../../hooks/useTerminologiaEstabelecimento';

// Card de item do salão (não agrupa por mesa/comanda) — mostra mesa e garçom inline,
// ordenado junto com os pedidos de delivery pela ordem de chegada. Cronômetro ao vivo
// (espera/preparo) igual ao painel de Produção.
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
  const vindoDeLinkRef = useRef(false);
  const [modoToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('cozinha_token');
    if (urlToken) {
      setCozinhaToken(urlToken);
      vindoDeLinkRef.current = true;
      window.history.replaceState({}, '', '/restaurante/cozinha');
    }
    return !!getCozinhaToken();
  });

  // Resgata um token novo em troca do que veio na URL — o link original
  // (QR/mensagem) passa a valer só pra esse resgate único (ver F2 da
  // auditoria de segurança).
  useEffect(() => {
    if (!vindoDeLinkRef.current) return;
    vindoDeLinkRef.current = false;
    resgatarToken().then(({ token }) => setCozinhaToken(token)).catch(() => {});
  }, []);
  const [authed, setAuthed] = useState(() => !!getCozinhaToken());
  const [pedidos, setPedidos] = useState([]);
  const [restauranteNome, setRestauranteNome] = useState('');
  const [restauranteId, setRestauranteId] = useState(null);
  const [tipoRestaurante, setTipoRestaurante] = useState(true);
  const termos = getTermos(tipoRestaurante);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [erro, setErro] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [highlighted, setHighlighted] = useState(null);
  const [highlightedSalaoItemId, setHighlightedSalaoItemId] = useState(null);
  const [scanMsg, setScanMsg] = useState(null);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [printerInput, setPrinterInput] = useState('');
  const [printerSaved, setPrinterSaved] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [gerandoLink, setGerandoLink] = useState(false);
  const [impressorasCozinha, setImpressorasCozinha] = useState(null);
  const [itensSalao, setItensSalao] = useState([]);
  const [filtroCanal, setFiltroCanal] = useState('todos'); // 'todos' | 'delivery' | 'salao'
  const [verTodosProntos, setVerTodosProntos] = useState(false);
  const now = useNowTick();
  const scanRef = useRef(null);
  const prevOrderIds = useRef(new Set());
  const firstLoad = useRef(true);
  const prevSalaoItemIds = useRef(new Set());
  const firstLoadSalao = useRef(true);
  const tocarSom = useNotificacaoSonora('cozinha');

  // Chrome pausa a fila do speechSynthesis sozinho depois de ~15s sem falar nada —
  // como a tela da cozinha fica ligada horas entre um pedido e outro, sem esse
  // keep-alive a voz para de sair silenciosamente (só o bipe continua, que é Web Audio).
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const keepAlive = setInterval(() => {
      if (synth.paused) synth.resume();
    }, 10000);
    return () => clearInterval(keepAlive);
  }, []);

  const anunciarNovoPedido = useCallback((qtd) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      const texto = qtd > 1 ? `${qtd} novos pedidos aguardando preparo` : 'Novo pedido aguardando preparo';
      const utter = new SpeechSynthesisUtterance(texto);
      utter.lang = 'pt-BR';
      synth.cancel(); // limpa fila travada/pausada antes de falar de novo
      synth.speak(utter);
    } catch {}
  }, []);

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
        if (novos.length > 0) { tocarSom(); anunciarNovoPedido(novos.length); }
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
      const itens = listas.flat();

      if (!firstLoadSalao.current) {
        const novos = itens.filter((i) => !prevSalaoItemIds.current.has(i.id));
        if (novos.length > 0) { tocarSom(); anunciarNovoPedido(novos.length); }
      }
      prevSalaoItemIds.current = new Set(itens.map((i) => i.id));
      firstLoadSalao.current = false;

      setItensSalao(itens);
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
        .then((d) => {
          nome = d.restaurante?.name ?? '';
          setRestauranteNome(nome);
          setRestauranteId(d.restaurante?.id ?? null);
          setTipoRestaurante(d.restaurante?.tipo_restaurante ?? true);
        })
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
        setTipoRestaurante(d.empresa?.tipo_restaurante ?? true);
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

  // Não limpa scanInput no final de propósito — ele fica ativo como filtro (ver
  // idEscaneado/passaFiltro abaixo), igual Produção/Bar filtram pelo campo de busca.
  // O highlight é só o "pisca" de confirmação de que achou, a lista já filtrada
  // continua mostrando só aquele item até o usuário limpar.
  const buscarPorId = useCallback((rawValue) => {
    const id = parseInt(rawValue.replace(/\D/g, ''));
    if (!id) return;
    const found = pedidos.find((p) => p.id === id);
    const itemSalao = !found ? itensSalao.find((i) => i.numero_comanda === id) : null;
    if (found) {
      setHighlighted(id);
      setScanMsg({ tipo: 'ok', texto: `Pedido #${id} encontrado` });
      setTimeout(() => setHighlighted(null), 2000);
      setTimeout(() => {
        document.getElementById(`order-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    } else if (itemSalao) {
      setHighlightedSalaoItemId(itemSalao.id);
      setScanMsg({ tipo: 'ok', texto: `Comanda #${id} encontrada` });
      setTimeout(() => setHighlightedSalaoItemId(null), 2000);
      setTimeout(() => {
        document.getElementById(`salao-item-${itemSalao.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    } else {
      setScanMsg({ tipo: 'erro', texto: `Pedido/comanda #${id} não está na cozinha agora` });
    }
    scanRef.current?.focus();
  }, [pedidos, itensSalao]);

  const limparScan = () => {
    setScanInput('');
    setHighlighted(null);
    setHighlightedSalaoItemId(null);
    setScanMsg(null);
    scanRef.current?.focus();
  };

  const handleScanKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); buscarPorId(scanInput); }
  };

  // Ações do card de pedido delivery agrupado agem em TODOS os itens desse pedido
  // roteados pra Cozinha de uma vez (Promise.all) — mesmo endpoint por item que o Salão
  // já usa, nunca mexe no status do pedido inteiro direto. Ver PedidoDeliveryCard/
  // montarFilaAgrupadaDelivery, mesmo padrão usado em Produção.
  const iniciarPreparoGrupoDelivery = async (pedidoId, itemIds) => {
    setAtualizando(pedidoId);
    try {
      await Promise.all(itemIds.map((id) => (modoToken ? iniciarPreparoItem(id) : iniciarPreparoItemRestaurante(id))));
      await carregarSalao(impressorasCozinha, modoToken);
    } catch (e) {
      alert(e.message);
    } finally {
      setAtualizando(null);
    }
  };

  const marcarProntoGrupoDelivery = async (pedidoId, itemIds) => {
    setAtualizando(pedidoId);
    try {
      await Promise.all(itemIds.map((id) => (modoToken ? marcarItemPronto(id) : marcarItemProntoRestaurante(id))));
      await carregarSalao(impressorasCozinha, modoToken);
    } catch (e) {
      alert(e.message);
    } finally {
      setAtualizando(null);
    }
  };

  const voltarGrupoDelivery = async (pedidoId, itemIds) => {
    setAtualizando(pedidoId);
    try {
      await Promise.all(itemIds.map((id) => (modoToken ? voltarStatusItem(id) : voltarStatusItemRestaurante(id))));
      await carregarSalao(impressorasCozinha, modoToken);
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

  const iniciarPreparoSalao = async (item) => {
    try {
      if (modoToken) await iniciarPreparoItem(item.id);
      else await iniciarPreparoItemRestaurante(item.id);
      carregarSalao(impressorasCozinha, modoToken);
    } catch (e) {
      alert(e.message);
    }
  };

  const voltarSalao = async (item) => {
    try {
      if (modoToken) await voltarStatusItem(item.id);
      else await voltarStatusItemRestaurante(item.id);
      carregarSalao(impressorasCozinha, modoToken);
    } catch (e) {
      alert(e.message);
    }
  };

  // Card de delivery agrupado por pedido (mesmo padrão de Produção/Bar) + item de salão
  // avulso, na mesma fila ordenada por chegada — bucket vem do status do ITEM na praça
  // (order_items.status), não do orders.status: cada praça só sabe do que é dela, o
  // pedido inteiro só libera pro motoboy quando marcarItemPronto confirma que todas já
  // terminaram. Ver [[project_deliveryhub]] "card de pedido delivery agrupado".
  const itensSalaoProntos = itensSalao
    .filter((i) => i.status === 'pronto' && i.tipo !== 'delivery')
    .sort((a, b) => new Date(b.pronto_em).getTime() - new Date(a.pronto_em).getTime());

  const filaAguardando = montarFilaAgrupadaDelivery(itensSalao.filter((i) => i.status === 'enviado'));
  const filaEmPreparo = montarFilaAgrupadaDelivery(itensSalao.filter((i) => i.status === 'preparando'));

  // Filtro por canal (Todos/Delivery/Salão) + busca, igual Produção e Bar: aceita tanto
  // código de barras/pedido exato quanto texto livre (cliente, mesa, garçom).
  const buscaNormalizada = scanInput.trim().toLowerCase();
  const idEscaneado = /^\d+$/.test(scanInput.trim()) ? parseInt(scanInput.trim(), 10) : null;
  const passaBuscaItem = (item) => {
    if (!buscaNormalizada) return true;
    if (idEscaneado !== null && item.numero_comanda === idEscaneado) return true;
    const alvo = [item.cliente, item.mesa, item.mesa_numero, item.numero_comanda, item.garcom]
      .filter((v) => v !== null && v !== undefined).join(' ').toLowerCase();
    return alvo.includes(buscaNormalizada);
  };
  const passaBuscaEntry = (e) => {
    if (e.tipo === 'salao') return passaBuscaItem(e.item);
    if (!buscaNormalizada) return true;
    if (idEscaneado !== null && e.pedido.id === idEscaneado) return true;
    return (e.pedido.customers?.name ?? '').toLowerCase().includes(buscaNormalizada);
  };
  const passaFiltro = (e) => (filtroCanal === 'todos' || e.tipo === filtroCanal) && passaBuscaEntry(e);
  const aguardandoPreparo = filaAguardando.filter(passaFiltro);
  const emPreparo = filaEmPreparo.filter(passaFiltro);
  const prontosSalao = filtroCanal === 'delivery' ? [] : itensSalaoProntos.filter(passaBuscaItem);
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
              <Icon name={termos.icone} size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">{termos.painelPreparo}</p>
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
                title={`Copiar link de acesso para a ${termos.pracaLower}`}
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
              placeholder="Buscar por cliente, mesa, comanda, garçom ou aponte o leitor..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-[#3A3A3A] outline-none font-mono"
              autoFocus
            />
            {scanInput && (
              <>
                <button onClick={() => buscarPorId(scanInput)}
                  className="flex-shrink-0 px-3 py-1 bg-[#FF441F] text-white text-xs font-bold rounded-lg hover:bg-[#E63A19]">
                  Buscar
                </button>
                <button onClick={limparScan} title="Limpar busca" className="flex-shrink-0 text-[#71717A] hover:text-white">
                  <Icon name="X" size={16} />
                </button>
              </>
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
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">{termos.aguardandoPreparo}</h2>
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
                  <PedidoDeliveryCard key={`d-${entry.pedido.id}`} pedido={entry.pedido} itens={entry.itens} posicao={idx + 1} now={now} bucket="aguardando" tipoRestaurante={tipoRestaurante}
                    atualizando={atualizando} codigoBarras={barcodeValue(entry.pedido.id)} cardId={`order-${entry.pedido.id}`}
                    highlighted={highlighted === entry.pedido.id}
                    onIniciarPreparo={() => iniciarPreparoGrupoDelivery(entry.pedido.id, entry.itemIds)} />
                ) : (
                  <SalaoItemCard key={`s-${entry.item.id}`} item={entry.item} posicao={idx + 1} now={now}
                    onIniciarPreparo={iniciarPreparoSalao} onMarcarPronto={marcarProntoSalao} onVoltar={voltarSalao}
                    highlighted={highlightedSalaoItemId === entry.item.id} />
                )
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">{termos.emPreparo}</h2>
            {emPreparo.length > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{emPreparo.length}</span>
            )}
          </div>
          {emPreparo.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-8 text-center">
              <Icon name={termos.icone} size={32} className="text-[#3A3A3A] mx-auto mb-2" />
              <p className="text-[#71717A] text-sm">Nenhum pedido em preparo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emPreparo.map((entry, idx) => (
                entry.tipo === 'delivery' ? (
                  <PedidoDeliveryCard key={`d-${entry.pedido.id}`} pedido={entry.pedido} itens={entry.itens} posicao={idx + 1} now={now} bucket="preparando" tipoRestaurante={tipoRestaurante}
                    atualizando={atualizando} codigoBarras={barcodeValue(entry.pedido.id)} cardId={`order-${entry.pedido.id}`}
                    highlighted={highlighted === entry.pedido.id}
                    onMarcarPronto={() => marcarProntoGrupoDelivery(entry.pedido.id, entry.itemIds)}
                    onVoltar={() => voltarGrupoDelivery(entry.pedido.id, entry.itemIds)} />
                ) : (
                  <SalaoItemCard key={`s-${entry.item.id}`} item={entry.item} posicao={idx + 1} now={now}
                    onIniciarPreparo={iniciarPreparoSalao} onMarcarPronto={marcarProntoSalao} onVoltar={voltarSalao}
                    highlighted={highlightedSalaoItemId === entry.item.id} />
                )
              ))}
            </div>
          )}
        </div>
      </main>

      {prontosSalao.length > 0 && (
        <div className="px-5 pb-5 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Prontos hoje (clicou errado? desfaz aqui)</h2>
            <span className="ml-auto bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{prontosSalao.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(verTodosProntos ? prontosSalao : prontosSalao.slice(0, 5)).map((item, idx) => (
              <SalaoItemCard key={`p-${item.id}`} item={item} posicao={idx + 1} now={now}
                onIniciarPreparo={iniciarPreparoSalao} onMarcarPronto={marcarProntoSalao} onVoltar={voltarSalao}
                highlighted={highlightedSalaoItemId === item.id} />
            ))}
          </div>
          {prontosSalao.length > 5 && (
            <button onClick={() => setVerTodosProntos((v) => !v)}
              className="mt-3 w-full py-2 text-xs font-bold text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/10">
              {verTodosProntos ? 'Mostrar menos' : `Ver todos (${prontosSalao.length})`}
            </button>
          )}
        </div>
      )}

      {pedidos.length === 0 && itensSalao.length === 0 && !loading && (
        <div className="text-center py-20">
          <Icon name="UtensilsCrossed" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#71717A] text-lg font-semibold">{termos.pracaTranquila}</p>
          <p className="text-[#3A3A3A] text-sm mt-1">Nenhum pedido para preparar agora</p>
        </div>
      )}

      <p className="text-center text-xs text-[#3A3A3A] py-4">Atualiza automaticamente a cada 30 segundos · auto-imprime novos pedidos</p>
    </div>
  );
};

export default RestauranteCozinha;
