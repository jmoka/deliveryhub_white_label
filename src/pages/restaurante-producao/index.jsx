import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarImpressoras, getKdsItensRestaurante, marcarItemProntoRestaurante, reimprimirItemRestaurante, iniciarPreparoItemRestaurante, voltarStatusItemRestaurante, cancelarItemRestaurante, moverItemRestaurante, getMinhaEmpresa, getSalaoComandaDetalhe, editarItemComandaSalao } from '../../services/restauranteService';
import { printTicketSetor } from '../../utils/printComanda';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import { useNowTick } from '../../hooks/useNowTick';
import Icon from '../../components/AppIcon';
import SalaoItemCard from '../../components/restaurante/SalaoItemCard';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// Clique no card (só itens de Salão, com numero_comanda) abre essa comanda completa —
// mesmo endpoint que o PDV do Salão usa, só leitura aqui (sem ações de pagamento).
const ComandaModal = ({ orderId, onFechar }) => {
  const [comanda, setComanda] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    getSalaoComandaDetalhe(orderId).then(setComanda).catch((e) => setErro(e.message));
  }, [orderId]);

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
                {(comanda.itens ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 bg-[#111111] rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-bold text-white">{item.quantity}x {item.products?.name}</p>
                      {item.observacao && <p className="text-xs text-blue-400">Obs: {item.observacao}</p>}
                    </div>
                    <span className="text-xs text-[#71717A]">{fmt(item.quantity * item.unit_price)}</span>
                  </div>
                ))}
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
  const [impressoras, setImpressoras] = useState(null);
  const [itensPorImpressora, setItensPorImpressora] = useState({});
  const [restauranteNome, setRestauranteNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [comandaAbertaId, setComandaAbertaId] = useState(null);
  const now = useNowTick();
  const [filtroCanal, setFiltroCanal] = useState('todos'); // 'todos' | 'delivery' | 'salao'
  const [verTodosEntregues, setVerTodosEntregues] = useState({}); // { [impressoraId]: bool }
  const [busca, setBusca] = useState('');
  const prevItemIds = useRef(new Set());
  const firstLoad = useRef(true);
  const tocarSom = useNotificacaoSonora('cozinha');

  useEffect(() => {
    getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {});
    listarImpressoras().then(setImpressoras).catch((e) => setErro(e.message));
  }, []);

  const carregar = useCallback(async (lista) => {
    try {
      const resultados = await Promise.all(
        lista.map((imp) => getKdsItensRestaurante(imp.id).then((r) => [imp, r.itens ?? []])),
      );
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

      {impressoras && impressoras.length === 0 ? (
        <div className="text-center py-20 px-5">
          <Icon name="Printer" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#71717A] text-lg font-semibold">Nenhuma impressora cadastrada</p>
          <p className="text-[#3A3A3A] text-sm mt-1">Cada setor (Cozinha, Bar, Salgados...) precisa de uma impressora cadastrada com esse setor.</p>
          <button onClick={() => navigate('/restaurante/impressoras')}
            className="mt-4 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
            Ir pra Impressoras
          </button>
        </div>
      ) : (
        <main className="p-5 max-w-6xl mx-auto space-y-8">
          {(impressoras ?? []).map((imp) => {
            const itens = (itensPorImpressora[imp.id] ?? []).filter(passaFiltro);
            const aguardando = itens.filter((i) => i.status === 'enviado');
            const preparando = itens.filter((i) => i.status === 'preparando');
            const entregues = itens
              .filter((i) => i.status === 'pronto')
              .sort((a, b) => new Date(b.pronto_em).getTime() - new Date(a.pronto_em).getTime());
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
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Aguardando Preparo</p>
                      {aguardando.length === 0 ? (
                        <p className="text-xs text-[#71717A]">Nenhum</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                          {aguardando.map((item, idx) => (
                            <SalaoItemCard key={item.id} item={item} posicao={idx + 1} now={now}
                              ehPrimeiro={idx === 0} ehUltimo={idx === aguardando.length - 1} onMover={moverItem}
                              onReimprimir={(it) => reimprimir(it, imp.setor)} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltarItem} onCancelar={cancelarItem} onAbrirComanda={setComandaAbertaId} onSalvarObservacao={salvarObservacao}
                              highlighted={numeroComandaEscaneado !== null && item.numero_comanda === numeroComandaEscaneado} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">Em Preparo</p>
                      {preparando.length === 0 ? (
                        <p className="text-xs text-[#71717A]">Nenhum</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                          {preparando.map((item, idx) => (
                            <SalaoItemCard key={item.id} item={item} posicao={idx + 1} now={now}
                              onReimprimir={(it) => reimprimir(it, imp.setor)} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltarItem} onAbrirComanda={setComandaAbertaId} onSalvarObservacao={salvarObservacao}
                              highlighted={numeroComandaEscaneado !== null && item.numero_comanda === numeroComandaEscaneado} />
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
                            {(verTodosEntregues[imp.id] ? entregues : entregues.slice(0, 2)).map((item, idx) => (
                              <SalaoItemCard key={item.id} item={item} posicao={idx + 1} now={now}
                                onReimprimir={(it) => reimprimir(it, imp.setor)} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltarItem} onAbrirComanda={setComandaAbertaId} onSalvarObservacao={salvarObservacao}
                                highlighted={numeroComandaEscaneado !== null && item.numero_comanda === numeroComandaEscaneado} />
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

      {comandaAbertaId && <ComandaModal orderId={comandaAbertaId} onFechar={() => setComandaAbertaId(null)} />}
    </div>
  );
};

export default RestauranteProducao;
