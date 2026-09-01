import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarImpressoras, getKdsItensRestaurante, getKdsSemImpressora, reenviarItemKds, marcarItemProntoRestaurante, reimprimirItemRestaurante, iniciarPreparoItemRestaurante, voltarStatusItemRestaurante, cancelarItemRestaurante, moverItemRestaurante, getMinhaEmpresa, getSalaoComandaDetalhe, editarItemComandaSalao } from '../../services/restauranteService';
import { printTicketSetor } from '../../utils/printComanda';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import { useNowTick } from '../../hooks/useNowTick';
import Icon from '../../components/AppIcon';
import SalaoItemCard from '../../components/restaurante/SalaoItemCard';
import PedidoDeliveryCard from '../../components/restaurante/PedidoDeliveryCard';
import { montarFilaAgrupadaDelivery } from '../../utils/agruparPedidosDelivery';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';
import { getTermos } from '../../hooks/useTerminologiaEstabelecimento';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// Seletor "escolher setor + enviar", reaproveitado no banner de itens sem setor e dentro
// do ComandaModal — recebe só o callback de envio, quem chama decide o que fazer com o
// resultado (imprimir via navegador, recarregar lista, etc).
const ItemReenviarSelect = ({ impressoras, onEnviar, tipoRestaurante = true }) => {
  const termos = getTermos(tipoRestaurante);
  const [impressoraId, setImpressoraId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const enviar = async () => {
    if (!impressoraId) return;
    setEnviando(true);
    setErro(null);
    try {
      await onEnviar(Number(impressoraId));
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <select value={impressoraId} onChange={(e) => setImpressoraId(e.target.value)}
          className="flex-1 bg-[#111111] border border-[#2A2A2A] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#FF441F]">
          <option value="">Escolher setor...</option>
          {impressoras.map((imp) => <option key={imp.id} value={imp.id}>{imp.setor}</option>)}
        </select>
        <button onClick={enviar} disabled={!impressoraId || enviando}
          className="flex-shrink-0 px-3 py-1.5 bg-[#FF441F] text-white text-xs font-bold rounded-lg hover:bg-[#E63A19] disabled:opacity-40">
          {enviando ? 'Enviando...' : `Enviar p/ ${termos.pracaLower}`}
        </button>
      </div>
      {erro && <p className="text-[11px] text-red-400 mt-1">{erro}</p>}
    </div>
  );
};

// Card de um item sem setor no banner de alerta (topo da tela) — produto ficou sem
// impressora configurada e o envio pra cozinha nunca chegou a lugar nenhum.
const ItemSemSetorCard = ({ item, impressoras, onReenviado, tipoRestaurante = true }) => {
  const enviar = async (impressoraId) => {
    const imp = impressoras.find((i) => i.id === impressoraId);
    const res = await reenviarItemKds(item.id, impressoraId);
    if (res.via === 'navegador') {
      printTicketSetor([item], { mesaLabel: item.mesa, cliente_mesa_nome: item.cliente, numero_comanda: item.numero_comanda }, imp?.setor);
    }
    await onReenviado?.();
  };

  return (
    <div className="bg-[#111111] rounded-xl px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-sm font-bold text-white">{item.quantity}x {item.product_name}</p>
        {item.numero_comanda && <span className="text-[10px] text-[#71717A] flex-shrink-0">Comanda #{item.numero_comanda}</span>}
      </div>
      {(item.mesa || item.cliente || item.garcom) && (
        <p className="text-xs text-[#71717A] mb-1.5">{[item.mesa, item.cliente, item.garcom].filter(Boolean).join(' • ')}</p>
      )}
      {item.observacao && <p className="text-xs text-blue-400 mb-1.5">Obs: {item.observacao}</p>}
      <ItemReenviarSelect impressoras={impressoras} onEnviar={enviar} tipoRestaurante={tipoRestaurante} />
    </div>
  );
};

// Clique no card (só itens de Salão, com numero_comanda) abre essa comanda completa —
// mesmo endpoint que o PDV do Salão usa, só leitura aqui (sem ações de pagamento), exceto
// pelo botão de reenviar quando um item ficou sem setor (impressora_id null).
const ComandaModal = ({ orderId, impressoras, onFechar, onItemReenviado, tipoRestaurante = true }) => {
  const termos = getTermos(tipoRestaurante);
  const [comanda, setComanda] = useState(null);
  const [erro, setErro] = useState(null);

  const carregarComanda = useCallback(() => {
    getSalaoComandaDetalhe(orderId).then(setComanda).catch((e) => setErro(e.message));
  }, [orderId]);

  useEffect(() => { carregarComanda(); }, [carregarComanda]);

  const reenviarItemDaComanda = async (itemDaComanda, impressoraId) => {
    const res = await reenviarItemKds(itemDaComanda.id, impressoraId);
    if (res.via === 'navegador') {
      const imp = impressoras.find((i) => i.id === impressoraId);
      printTicketSetor(
        [{ product_name: itemDaComanda.products?.name, quantity: itemDaComanda.quantity, observacao: itemDaComanda.observacao }],
        { mesaLabel: comanda?.mesas ? `Mesa ${comanda.mesas.numero}${comanda.mesas.nome ? ' - ' + comanda.mesas.nome : ''}` : comanda?.cliente_mesa_nome, cliente_mesa_nome: comanda?.cliente_mesa_nome, cliente_mesa_telefone: comanda?.cliente_mesa_telefone, numero_comanda: comanda?.numero_comanda },
        imp?.setor,
      );
    }
    carregarComanda();
    await onItemReenviado?.();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onFechar}>
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A] sticky top-0 bg-[#1A1A1A]">
          <h2 className="text-sm font-black text-white">
            Comanda {comanda?.numero_comanda ? `#${comanda.numero_comanda}` : ''}
          </h2>
          <button onClick={onFechar} className="p-1 text-[#71717A] hover:text-white"><Icon name="X" size={18} /></button>
        </div>
        <div className="p-4">
          {erro && <p className="text-sm text-red-400">{erro}</p>}
          {!comanda && !erro && <p className="text-sm text-[#71717A]">Carregando...</p>}
          {comanda && (
            <>
              <p className="text-xs text-[#71717A] mb-3">
                {comanda.mesas ? `Mesa ${comanda.mesas.numero}${comanda.mesas.nome ? ' - ' + comanda.mesas.nome : ''}` : comanda.cliente_mesa_nome}
                {comanda.garcons?.nome && ` • Garçom: ${comanda.garcons.nome}`}
                {comanda.aberto_por_nome && ` • Aberto por: ${comanda.aberto_por_nome}`}
              </p>
              <div className="space-y-2 mb-3">
                {(comanda.itens ?? []).map((item) => {
                  const semSetor = !item.impressora_id && ['enviado', 'preparando'].includes(item.status);
                  return (
                    <div key={item.id} className="bg-[#111111] rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-white">{item.quantity}x {item.products?.name}</p>
                          {item.observacao && <p className="text-xs text-blue-400">Obs: {item.observacao}</p>}
                        </div>
                        <span className="text-xs text-[#71717A] flex-shrink-0">{fmt(item.quantity * item.unit_price)}</span>
                      </div>
                      {semSetor && (
                        <div className="mt-2 pt-2 border-t border-[#2A2A2A]">
                          <p className="text-[11px] text-yellow-400 font-bold mb-1.5 flex items-center gap-1">
                            <Icon name="AlertTriangle" size={12} /> Não chegou na {termos.pracaLower} — produto sem impressora configurada
                          </p>
                          <ItemReenviarSelect impressoras={impressoras} onEnviar={(impressoraId) => reenviarItemDaComanda(item, impressoraId)} tipoRestaurante={tipoRestaurante} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-[#2A2A2A] pt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-[#71717A] uppercase">Total</span>
                <span className="text-lg font-black text-white">{fmt(comanda.total)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Linha de produção do Salão — visão unificada de TODOS os setores (cozinha, bar,
// salgados...) num painel só, dono acessa direto logado (sem link/token separado, mesmo
// padrão de acesso da tela de Cozinha do delivery). Cada setor é uma impressora
// cadastrada; itens vêm de order_items roteados pra ela (ver GET /restaurante/kds),
// lista PLANA por item (não agrupa por mesa/comanda), com cronômetro de espera/preparo.
const RestauranteProducao = () => {
  const navigate = useNavigate();
  const { tipoRestaurante } = useModulosEmpresa();
  const termos = getTermos(tipoRestaurante);
  const [impressoras, setImpressoras] = useState(null);
  const [itensPorImpressora, setItensPorImpressora] = useState({});
  const [itensSemSetor, setItensSemSetor] = useState([]);
  const [restauranteNome, setRestauranteNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [comandaAbertaId, setComandaAbertaId] = useState(null);
  const now = useNowTick();
  const [filtroCanal, setFiltroCanal] = useState('todos'); // 'todos' | 'delivery' | 'salao'
  const [verTodosEntregues, setVerTodosEntregues] = useState({}); // { [impressoraId]: bool }
  const [busca, setBusca] = useState('');
  const [atualizandoPedido, setAtualizandoPedido] = useState(null);
  const prevItemIds = useRef(new Set());
  const firstLoad = useRef(true);
  const tocarSom = useNotificacaoSonora('cozinha');

  useEffect(() => {
    getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {});
    listarImpressoras().then(setImpressoras).catch((e) => setErro(e.message));
  }, []);

  const carregar = useCallback(async (lista) => {
    try {
      const [resultados, semSetor] = await Promise.all([
        Promise.all(lista.map((imp) => getKdsItensRestaurante(imp.id).then((r) => [imp, r.itens ?? []]))),
        getKdsSemImpressora().then((r) => r.itens ?? []).catch(() => []),
      ]);
      setItensSemSetor(semSetor);
      const porImpressora = {};
      const idsAgora = new Set();
      for (const [imp, itens] of resultados) {
        porImpressora[imp.id] = itens;
        for (const i of itens) idsAgora.add(i.id);
      }

      if (!firstLoad.current) {
        const novos = [...idsAgora].filter((id) => !prevItemIds.current.has(id));
        if (novos.length > 0) tocarSom();
      } else {
        firstLoad.current = false;
      }
      prevItemIds.current = idsAgora;

      setItensPorImpressora(porImpressora);
      setLastUpdate(new Date());
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, [tocarSom]);

  useEffect(() => {
    if (!impressoras) return;
    if (impressoras.length === 0) { setLoading(false); return; }
    carregar(impressoras);
    const interval = setInterval(() => carregar(impressoras), 15000);
    return () => clearInterval(interval);
  }, [impressoras, carregar]);

  const marcarPronto = async (itemId) => {
    await marcarItemProntoRestaurante(itemId);
    carregar(impressoras);
  };

  const iniciarPreparo = async (item) => {
    await iniciarPreparoItemRestaurante(item.id);
    carregar(impressoras);
  };

  const voltarItem = async (item) => {
    await voltarStatusItemRestaurante(item.id);
    carregar(impressoras);
  };

  // Ações do card de pedido agrupado (delivery) agem em TODOS os itens desse pedido
  // roteados pra esse setor de uma vez — mesmo endpoint por item de sempre, só disparado
  // em lote (Promise.all), sem endpoint novo. Não mexe no status do pedido inteiro.
  const iniciarPreparoGrupo = async (pedidoId, itemIds) => {
    setAtualizandoPedido(pedidoId);
    try {
      await Promise.all(itemIds.map((id) => iniciarPreparoItemRestaurante(id)));
      await carregar(impressoras);
    } catch (e) {
      alert(e.message);
    } finally {
      setAtualizandoPedido(null);
    }
  };

  const marcarProntoGrupo = async (pedidoId, itemIds) => {
    setAtualizandoPedido(pedidoId);
    try {
      await Promise.all(itemIds.map((id) => marcarItemProntoRestaurante(id)));
      await carregar(impressoras);
    } catch (e) {
      alert(e.message);
    } finally {
      setAtualizandoPedido(null);
    }
  };

  const voltarGrupo = async (pedidoId, itemIds) => {
    setAtualizandoPedido(pedidoId);
    try {
      await Promise.all(itemIds.map((id) => voltarStatusItemRestaurante(id)));
      await carregar(impressoras);
    } catch (e) {
      alert(e.message);
    } finally {
      setAtualizandoPedido(null);
    }
  };

  const moverItem = async (item, direcao) => {
    try {
      await moverItemRestaurante(item.id, direcao);
      carregar(impressoras);
    } catch (e) {
      alert(e.message);
    }
  };

  const cancelarItem = async (item) => {
    if (!confirm(`Cancelar "${item.product_name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await cancelarItemRestaurante(item.id);
      carregar(impressoras);
    } catch (e) {
      alert(e.message);
    }
  };

  const reimprimir = async (item, setorNome) => {
    try {
      const res = await reimprimirItemRestaurante(item.id);
      if (res.via === 'navegador') {
        printTicketSetor([item], { mesaLabel: item.mesa, cliente_mesa_nome: item.cliente, numero_comanda: item.numero_comanda }, setorNome);
      }
    } catch (e) {
      setErro(e.message);
    }
  };

  const salvarObservacao = async (item, observacao) => {
    try {
      await editarItemComandaSalao(item.order_id, item.id, { observacao });
      carregar(impressoras);
    } catch (e) {
      setErro(e.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const todosItens = Object.values(itensPorImpressora).flat();
  const totalDelivery = todosItens.filter((i) => i.tipo === 'delivery').length;
  const totalSalao = todosItens.filter((i) => i.tipo === 'salao').length;
  const buscaNormalizada = busca.trim().toLowerCase();
  // Leitor de código de barras digita os dígitos zero-padded (ver barcodeValue em
  // printComanda.js) e manda Enter — bate exato no numero_comanda, não por substring
  // (senão "00000042" nunca acharia a comanda #42).
  const numeroComandaEscaneado = /^\d+$/.test(busca.trim()) ? parseInt(busca.trim(), 10) : null;
  const passaBusca = (i) => {
    if (!buscaNormalizada) return true;
    if (numeroComandaEscaneado !== null && i.numero_comanda === numeroComandaEscaneado) return true;
    const alvo = [i.cliente, i.mesa, i.mesa_numero, i.numero_comanda, i.garcom]
      .filter((v) => v !== null && v !== undefined)
      .join(' ')
      .toLowerCase();
    return alvo.includes(buscaNormalizada);
  };
  const passaFiltro = (i) => (filtroCanal === 'todos' || i.tipo === filtroCanal) && passaBusca(i);
  const totalItens = todosItens.filter(passaFiltro).length;
  // Igual à caixa de leitor da Cozinha: verde quando acha a comanda escaneada, vermelho
  // quando não acha — só reage ao código exato, busca por nome/mesa/garçom fica neutra.
  const itemEncontradoBusca = numeroComandaEscaneado !== null && todosItens.some((i) => i.numero_comanda === numeroComandaEscaneado);
  const corBuscaCod = numeroComandaEscaneado === null ? null : itemEncontradoBusca ? 'ok' : 'erro';

  return (
    <div className="min-h-screen bg-[#111111]">
      <header className="bg-[#1A1A1A] border-b border-[#2A2A2A] px-5 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/restaurante')} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF441F] rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="ChefHat" size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">Linha de Produção — Salão</p>
              <p className="text-[#71717A] text-xs">{restauranteNome}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-[#71717A]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {lastUpdate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? '—'}
            </div>
            <button onClick={() => carregar(impressoras ?? [])} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
              <Icon name="RefreshCw" size={16} />
            </button>
          </div>
        </div>

        {/* Busca por cliente, mesa, comanda, garçom ou leitor de código de barras — mesma
            caixa (cor, botão Buscar, texto de confirmação) da Cozinha */}
        <div className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border transition-colors ${
          corBuscaCod === 'ok' ? 'border-green-500 bg-green-900/20' :
          corBuscaCod === 'erro' ? 'border-red-500 bg-red-900/20' :
          'border-[#2A2A2A] bg-[#111111] focus-within:border-[#FF441F]'
        }`}>
          <Icon name="ScanLine" size={16} className={`flex-shrink-0 ${corBuscaCod === 'ok' ? 'text-green-400' : corBuscaCod === 'erro' ? 'text-red-400' : 'text-[#71717A]'}`} />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente, mesa, comanda, garçom ou aponte o leitor..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-[#3A3A3A] outline-none"
          />
          {busca && (
            <>
              <button
                onClick={() => {
                  const alvo = todosItens.find((i) => i.numero_comanda === numeroComandaEscaneado);
                  if (alvo) document.getElementById(`salao-item-${alvo.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="flex-shrink-0 px-3 py-1 bg-[#FF441F] text-white text-xs font-bold rounded-lg hover:bg-[#E63A19]">
                Buscar
              </button>
              <button onClick={() => setBusca('')} className="text-[#71717A] hover:text-white flex-shrink-0">
                <Icon name="X" size={15} />
              </button>
            </>
          )}
        </div>
        {corBuscaCod && (
          <p className={`text-xs font-semibold mt-1.5 ${corBuscaCod === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
            {corBuscaCod === 'ok' ? `Comanda #${numeroComandaEscaneado} encontrada` : `Comanda #${numeroComandaEscaneado} não encontrada`}
          </p>
        )}

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

      {/* Itens enviados que nunca chegaram em setor nenhum — produto sem impressora
          configurada no cadastro. Some sozinho da lista assim que reenviado. */}
      {itensSemSetor.length > 0 && (
        <div className="mx-5 mt-4 bg-yellow-900/20 border border-yellow-600/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="AlertTriangle" size={16} className="text-yellow-400" />
            <h2 className="text-yellow-400 font-bold text-sm">
              {itensSemSetor.length} {itensSemSetor.length === 1 ? 'item não chegou' : 'itens não chegaram'} na {termos.pracaLower} (sem impressora configurada)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {itensSemSetor.map((item) => (
              <ItemSemSetorCard key={item.id} item={item} impressoras={impressoras ?? []} onReenviado={() => carregar(impressoras)} tipoRestaurante={tipoRestaurante} />
            ))}
          </div>
        </div>
      )}

      {impressoras && impressoras.length === 0 ? (
        <div className="text-center py-20 px-5">
          <Icon name="Printer" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#71717A] text-lg font-semibold">Nenhuma impressora cadastrada</p>
          <p className="text-[#3A3A3A] text-sm mt-1">Cada setor ({termos.praca}, Bar, Salgados...) precisa de uma impressora cadastrada com esse setor.</p>
          <button onClick={() => navigate('/restaurante/impressoras')}
            className="mt-4 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
            Ir pra Impressoras
          </button>
        </div>
      ) : (
        <main className="p-5 max-w-6xl mx-auto space-y-8">
          {(impressoras ?? []).map((imp) => {
            const itens = (itensPorImpressora[imp.id] ?? []).filter(passaFiltro);
            const aguardando = montarFilaAgrupadaDelivery(itens.filter((i) => i.status === 'enviado'));
            const preparando = montarFilaAgrupadaDelivery(itens.filter((i) => i.status === 'preparando'));
            const entregues = montarFilaAgrupadaDelivery(itens.filter((i) => i.status === 'pronto'), 'pronto_em');
            return (
              <div key={imp.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  <h2 className="text-white font-bold text-sm uppercase tracking-wider">{imp.setor}</h2>
                  {itens.length > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                      {itens.length}
                    </span>
                  )}
                </div>
                {itens.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-6 text-center mb-2">
                    <p className="text-[#71717A] text-sm">Nenhum item pendente em {imp.setor}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">{termos.aguardandoPreparo}</p>
                      {aguardando.length === 0 ? (
                        <p className="text-xs text-[#71717A]">Nenhum</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                          {aguardando.map((entry, idx) => (
                            entry.tipo === 'delivery' ? (
                              <PedidoDeliveryCard key={`d-${entry.pedido.id}`} pedido={entry.pedido} itens={entry.itens} posicao={idx + 1} now={now} bucket="aguardando" tipoRestaurante={tipoRestaurante}
                                atualizando={atualizandoPedido}
                                onIniciarPreparo={() => iniciarPreparoGrupo(entry.pedido.id, entry.itemIds)} />
                            ) : (
                              <SalaoItemCard key={`s-${entry.item.id}`} item={entry.item} posicao={idx + 1} now={now} tipoRestaurante={tipoRestaurante}
                                ehPrimeiro={idx === 0} ehUltimo={idx === aguardando.length - 1} onMover={moverItem}
                                onReimprimir={(it) => reimprimir(it, imp.setor)} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltarItem} onCancelar={cancelarItem} onAbrirComanda={setComandaAbertaId} onSalvarObservacao={salvarObservacao}
                                highlighted={numeroComandaEscaneado !== null && entry.item.numero_comanda === numeroComandaEscaneado} />
                            )
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">{termos.emPreparo}</p>
                      {preparando.length === 0 ? (
                        <p className="text-xs text-[#71717A]">Nenhum</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                          {preparando.map((entry, idx) => (
                            entry.tipo === 'delivery' ? (
                              <PedidoDeliveryCard key={`d-${entry.pedido.id}`} pedido={entry.pedido} itens={entry.itens} posicao={idx + 1} now={now} bucket="preparando" tipoRestaurante={tipoRestaurante}
                                atualizando={atualizandoPedido}
                                onMarcarPronto={() => marcarProntoGrupo(entry.pedido.id, entry.itemIds)}
                                onVoltar={() => voltarGrupo(entry.pedido.id, entry.itemIds)} />
                            ) : (
                              <SalaoItemCard key={`s-${entry.item.id}`} item={entry.item} posicao={idx + 1} now={now} tipoRestaurante={tipoRestaurante}
                                onReimprimir={(it) => reimprimir(it, imp.setor)} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltarItem} onAbrirComanda={setComandaAbertaId} onSalvarObservacao={salvarObservacao}
                                highlighted={numeroComandaEscaneado !== null && entry.item.numero_comanda === numeroComandaEscaneado} />
                            )
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Entregues hoje</p>
                      {entregues.length === 0 ? (
                        <p className="text-xs text-[#71717A]">Nenhum</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                            {(verTodosEntregues[imp.id] ? entregues : entregues.slice(0, 2)).map((entry, idx) => (
                              entry.tipo === 'delivery' ? (
                                <PedidoDeliveryCard key={`d-${entry.pedido.id}`} pedido={entry.pedido} itens={entry.itens} posicao={idx + 1} now={now} bucket="pronto" tipoRestaurante={tipoRestaurante}
                                  atualizando={atualizandoPedido}
                                  onVoltar={() => voltarGrupo(entry.pedido.id, entry.itemIds)} />
                              ) : (
                                <SalaoItemCard key={`s-${entry.item.id}`} item={entry.item} posicao={idx + 1} now={now} tipoRestaurante={tipoRestaurante}
                                  onReimprimir={(it) => reimprimir(it, imp.setor)} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltarItem} onAbrirComanda={setComandaAbertaId} onSalvarObservacao={salvarObservacao}
                                  highlighted={numeroComandaEscaneado !== null && entry.item.numero_comanda === numeroComandaEscaneado} />
                              )
                            ))}
                          </div>
                          {entregues.length > 2 && (
                            <button onClick={() => setVerTodosEntregues((v) => ({ ...v, [imp.id]: !v[imp.id] }))}
                              className="mt-3 w-full py-2 text-xs font-bold text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/10">
                              {verTodosEntregues[imp.id] ? 'Recolher / fechar a lista' : `Ver todos (${entregues.length})`}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {totalItens === 0 && (
            <div className="text-center py-16">
              <Icon name="UtensilsCrossed" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
              <p className="text-[#71717A] text-lg font-semibold">Tudo tranquilo</p>
              <p className="text-[#3A3A3A] text-sm mt-1">Nenhum item pendente em nenhum setor agora</p>
            </div>
          )}
        </main>
      )}

      <p className="text-center text-xs text-[#3A3A3A] py-4">Atualiza automaticamente a cada 15 segundos</p>

      {comandaAbertaId && (
        <ComandaModal orderId={comandaAbertaId} impressoras={impressoras ?? []} onFechar={() => setComandaAbertaId(null)}
          onItemReenviado={() => carregar(impressoras)} tipoRestaurante={tipoRestaurante} />
      )}
    </div>
  );
};

export default RestauranteProducao;
