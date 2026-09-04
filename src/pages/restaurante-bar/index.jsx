import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarImpressoras, atualizarImpressora, getKdsItensRestaurante, marcarItemProntoRestaurante, iniciarPreparoItemRestaurante, voltarStatusItemRestaurante, getMinhaEmpresa } from '../../services/restauranteService';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import { useNowTick } from '../../hooks/useNowTick';
import Icon from '../../components/AppIcon';
import SalaoItemCard from '../../components/restaurante/SalaoItemCard';
import PedidoDeliveryCard from '../../components/restaurante/PedidoDeliveryCard';
import { montarFilaAgrupadaDelivery } from '../../utils/agruparPedidosDelivery';
import { barcodeValue, printTesteImpressora } from '../../utils/printComanda';
import { useModulosEmpresa } from '../../hooks/useModulosEmpresa';
import { getTermos } from '../../hooks/useTerminologiaEstabelecimento';

// Painel de pedidos do Bar/Copa — mesmo padrão de acesso da tela de Cozinha (dono já
// logado, sem link/token separado), lista PLANA de itens por setor de impressora (não
// agrupa por mesa/comanda — cada prato tem seu próprio ritmo e ação). Coexiste com
// /restaurante/producao (visão unificada de todos os setores) — essa aqui é só o Bar.
const RestauranteBar = () => {
  const navigate = useNavigate();
  const { tipoRestaurante } = useModulosEmpresa();
  const termos = getTermos(tipoRestaurante);
  const [impressorasBar, setImpressorasBar] = useState(null);
  const [todasImpressoras, setTodasImpressoras] = useState([]);
  const [impressoraSelecionada, setImpressoraSelecionada] = useState('');
  const [definindoImpressora, setDefinindoImpressora] = useState(false);
  const [showConfigImpressora, setShowConfigImpressora] = useState(false);
  const [impressoraDefinida, setImpressoraDefinida] = useState(null); // { nome, setor } | null — confirmação visual após "Definir"
  const [itens, setItens] = useState([]);
  const [restauranteNome, setRestauranteNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filtroCanal, setFiltroCanal] = useState('todos'); // 'todos' | 'delivery' | 'salao'
  const [busca, setBusca] = useState('');
  const [verTodosEntregues, setVerTodosEntregues] = useState(false);
  const [atualizando, setAtualizando] = useState(null);
  const now = useNowTick();
  const prevItemIds = useRef(new Set());
  const firstLoad = useRef(true);
  const tocarSom = useNotificacaoSonora('cozinha');

  const carregarImpressoras = useCallback(() => {
    listarImpressoras()
      .then((lista) => {
        setTodasImpressoras(lista ?? []);
        setImpressorasBar((lista ?? []).filter((i) => (i.setor ?? '').toLowerCase().includes('bar')));
      })
      .catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {});
    carregarImpressoras();
  }, [carregarImpressoras]);

  // Dono escolhe explicitamente qual impressora é o Bar — grava o setor certo nela
  // (o filtro acima é por texto, então digitar "Bar" errado deixava a tela pra
  // sempre vazia sem nenhum aviso). Mesmo padrão da tela de Cozinha.
  const handleDefinirImpressoraBar = async () => {
    if (!impressoraSelecionada) return;
    setDefinindoImpressora(true);
    try {
      const nomeEscolhida = todasImpressoras.find((i) => String(i.id) === impressoraSelecionada)?.nome ?? '';
      await atualizarImpressora(Number(impressoraSelecionada), { setor: 'Bar' });
      setImpressoraSelecionada('');
      setImpressoraDefinida({ nome: nomeEscolhida, setor: 'Bar' });
      carregarImpressoras();
    } catch (e) {
      alert(e.message);
    } finally {
      setDefinindoImpressora(false);
    }
  };

  const carregar = useCallback(async (impressoras) => {
    try {
      const listas = await Promise.all(
        impressoras.map((imp) => getKdsItensRestaurante(imp.id).then((r) => r.itens ?? [])),
      );
      const todosItens = listas.flat().sort((a, b) => new Date(a.enviado_em).getTime() - new Date(b.enviado_em).getTime());

      const idsAgora = new Set(todosItens.map((i) => i.id));
      if (!firstLoad.current) {
        const novos = [...idsAgora].filter((id) => !prevItemIds.current.has(id));
        if (novos.length > 0) tocarSom();
      } else {
        firstLoad.current = false;
      }
      prevItemIds.current = idsAgora;

      setItens(todosItens);
      setLastUpdate(new Date());
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, [tocarSom]);

  useEffect(() => {
    if (!impressorasBar) return;
    if (impressorasBar.length === 0) { setLoading(false); return; }
    carregar(impressorasBar);
    const interval = setInterval(() => carregar(impressorasBar), 15000);
    return () => clearInterval(interval);
  }, [impressorasBar, carregar]);

  const marcarPronto = async (itemId) => {
    await marcarItemProntoRestaurante(itemId);
    carregar(impressorasBar);
  };

  const iniciarPreparo = async (item) => {
    await iniciarPreparoItemRestaurante(item.id);
    carregar(impressorasBar);
  };

  const voltar = async (item) => {
    try {
      await voltarStatusItemRestaurante(item.id);
      carregar(impressorasBar);
    } catch (e) {
      setErro(e.message);
    }
  };

  // Ações do card de pedido delivery agrupado agem em TODOS os itens desse pedido nesse
  // setor de uma vez — mesmo padrão de Cozinha/Produção, sem endpoint novo.
  const iniciarPreparoGrupo = async (pedidoId, itemIds) => {
    setAtualizando(pedidoId);
    try {
      await Promise.all(itemIds.map((id) => iniciarPreparoItemRestaurante(id)));
      await carregar(impressorasBar);
    } catch (e) {
      setErro(e.message);
    } finally {
      setAtualizando(null);
    }
  };

  const marcarProntoGrupo = async (pedidoId, itemIds) => {
    setAtualizando(pedidoId);
    try {
      await Promise.all(itemIds.map((id) => marcarItemProntoRestaurante(id)));
      await carregar(impressorasBar);
    } catch (e) {
      setErro(e.message);
    } finally {
      setAtualizando(null);
    }
  };

  const voltarGrupo = async (pedidoId, itemIds) => {
    setAtualizando(pedidoId);
    try {
      await Promise.all(itemIds.map((id) => voltarStatusItemRestaurante(id)));
      await carregar(impressorasBar);
    } catch (e) {
      setErro(e.message);
    } finally {
      setAtualizando(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

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
  const itensFiltrados = itens.filter((i) => (filtroCanal === 'todos' || i.tipo === filtroCanal) && passaBusca(i));
  const aguardando = montarFilaAgrupadaDelivery(itensFiltrados.filter((i) => i.status === 'enviado'));
  const preparando = montarFilaAgrupadaDelivery(itensFiltrados.filter((i) => i.status === 'preparando'));
  const prontosRecentes = montarFilaAgrupadaDelivery(itensFiltrados.filter((i) => i.status === 'pronto'), 'pronto_em');
  const totalDelivery = itens.filter((i) => i.tipo === 'delivery').length;
  const totalSalao = itens.filter((i) => i.tipo === 'salao').length;
  // Igual à caixa de leitor da Cozinha: verde quando acha a comanda escaneada, vermelho
  // quando não acha — só reage ao código exato, busca por nome/mesa/garçom fica neutra.
  const itemEncontradoBusca = numeroComandaEscaneado !== null && itens.some((i) => i.numero_comanda === numeroComandaEscaneado);
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
              <Icon name="Martini" size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">Painel do Bar</p>
              <p className="text-[#71717A] text-xs">{restauranteNome}</p>
            </div>
          </div>

          {/* Deixa claro qual impressora alimenta essa tela — Bar e Cozinha são visualmente
              quase idênticas, fácil confundir qual painel está configurado com qual impressora. */}
          {impressorasBar && (
            impressorasBar.length > 0 ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-900/30 border border-green-700 text-green-400">
                <Icon name="Printer" size={12} />
                {impressorasBar.map((i) => i.nome).join(', ')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-900/30 border border-red-700 text-red-400">
                <Icon name="AlertTriangle" size={12} />
                Sem impressora conectada
              </span>
            )
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-[#71717A]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {lastUpdate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? '—'}
            </div>
            <button onClick={() => { setShowConfigImpressora((v) => !v); setImpressoraSelecionada(''); }}
              className={`p-2 rounded-lg transition-colors ${showConfigImpressora ? 'text-[#FF441F] bg-[#FF441F]/10' : 'text-[#71717A] hover:text-white hover:bg-[#2A2A2A]'}`}
              title="Configurar impressora do Bar">
              <Icon name="Printer" size={16} />
            </button>
            <button onClick={() => carregar(impressorasBar ?? [])} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
              <Icon name="RefreshCw" size={16} />
            </button>
          </div>
        </div>

        {showConfigImpressora && (
          <div className="mt-3 bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3">
            <p className="text-xs text-[#71717A] mb-1">Qual impressora recebe os pedidos do Bar?</p>
            <div className="flex gap-2">
              <select
                value={impressoraSelecionada}
                onChange={(e) => setImpressoraSelecionada(e.target.value)}
                className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#FF441F]"
              >
                <option value="">Selecione uma impressora...</option>
                {todasImpressoras.map((i) => (
                  <option key={i.id} value={i.id}>{i.nome}{i.setor ? ` (setor atual: ${i.setor})` : ' (sem setor)'}</option>
                ))}
              </select>
              <button onClick={handleDefinirImpressoraBar} disabled={!impressoraSelecionada || definindoImpressora}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#FF441F] text-white hover:bg-[#E63A19] disabled:opacity-50 transition-colors">
                {definindoImpressora ? '...' : 'Definir'}
              </button>
            </div>
            <p className="text-[10px] text-[#71717A] mt-1">Marca essa impressora com o setor "Bar" — produtos configurados com ela passam a aparecer aqui.</p>
            {impressoraDefinida && (
              <div className="mt-2 flex items-center gap-2 bg-green-900/20 border border-green-700 rounded-lg px-3 py-2">
                <Icon name="CheckCircle2" size={14} className="text-green-400 flex-shrink-0" />
                <p className="text-xs text-green-400 flex-1">
                  "{impressoraDefinida.nome}" definida como <strong>{impressoraDefinida.setor}</strong>.
                </p>
                <button
                  onClick={() => printTesteImpressora(impressoraDefinida.nome, impressoraDefinida.setor, restauranteNome)}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors">
                  <Icon name="Printer" size={11} /> Imprimir teste
                </button>
              </div>
            )}
          </div>
        )}

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
                  const alvo = itens.find((i) => i.numero_comanda === numeroComandaEscaneado);
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

      {impressorasBar && impressorasBar.length === 0 ? (
        <div className="text-center py-20 px-5">
          <Icon name="Printer" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#71717A] text-lg font-semibold">Nenhuma impressora de setor "Bar" cadastrada</p>
          {todasImpressoras.length > 0 ? (
            <div className="max-w-sm mx-auto mt-4 text-left bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
              <p className="text-[#71717A] text-xs mb-2">Você já tem impressora cadastrada — só falta marcar qual delas é o Bar:</p>
              <div className="flex gap-2">
                <select
                  value={impressoraSelecionada}
                  onChange={(e) => setImpressoraSelecionada(e.target.value)}
                  className="flex-1 bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#FF441F]"
                >
                  <option value="">Selecione uma impressora...</option>
                  {todasImpressoras.map((i) => (
                    <option key={i.id} value={i.id}>{i.nome}{i.setor ? ` (setor atual: ${i.setor})` : ' (sem setor)'}</option>
                  ))}
                </select>
                <button onClick={handleDefinirImpressoraBar} disabled={!impressoraSelecionada || definindoImpressora}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#FF441F] text-white hover:bg-[#E63A19] disabled:opacity-50 transition-colors">
                  {definindoImpressora ? '...' : 'Definir'}
                </button>
              </div>
              {impressoraDefinida && (
                <div className="mt-2 flex items-center gap-2 bg-green-900/20 border border-green-700 rounded-lg px-3 py-2">
                  <Icon name="CheckCircle2" size={14} className="text-green-400 flex-shrink-0" />
                  <p className="text-xs text-green-400 flex-1">
                    "{impressoraDefinida.nome}" definida como <strong>{impressoraDefinida.setor}</strong>.
                  </p>
                  <button
                    onClick={() => printTesteImpressora(impressoraDefinida.nome, impressoraDefinida.setor, restauranteNome)}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors">
                    <Icon name="Printer" size={11} /> Imprimir teste
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-[#3A3A3A] text-sm mt-1">Cadastre uma impressora com o setor "Bar" na tela de Impressoras.</p>
              <button onClick={() => navigate('/restaurante/impressoras')}
                className="mt-4 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
                Ir pra Impressoras
              </button>
            </>
          )}
        </div>
      ) : (
        <main className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Aguardando Motoboy</h2>
              {aguardando.length > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{aguardando.length}</span>
              )}
            </div>
            {aguardando.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-8 text-center">
                <Icon name="CheckCircle" size={32} className="text-[#3A3A3A] mx-auto mb-2" />
                <p className="text-[#71717A] text-sm">Nenhum pedido aguardando</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aguardando.map((entry, idx) => (
                  entry.tipo === 'delivery' ? (
                    <PedidoDeliveryCard key={`d-${entry.pedido.id}`} pedido={entry.pedido} itens={entry.itens} posicao={idx + 1} now={now} bucket="aguardando" tipoRestaurante={tipoRestaurante}
                      atualizando={atualizando} codigoBarras={barcodeValue(entry.pedido.id)} cardId={`order-${entry.pedido.id}`}
                      onIniciarPreparo={() => iniciarPreparoGrupo(entry.pedido.id, entry.itemIds)} />
                  ) : (
                    <SalaoItemCard key={`s-${entry.item.id}`} item={entry.item} posicao={idx + 1} now={now} tipoRestaurante={tipoRestaurante} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar}
                      highlighted={numeroComandaEscaneado !== null && entry.item.numero_comanda === numeroComandaEscaneado} />
                  )
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Entregue pra Motoboy</h2>
              {preparando.length > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{preparando.length}</span>
              )}
            </div>
            {preparando.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[#2A2A2A] p-8 text-center">
                <Icon name="Martini" size={32} className="text-[#3A3A3A] mx-auto mb-2" />
                <p className="text-[#71717A] text-sm">Nenhum item em preparo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {preparando.map((entry, idx) => (
                  entry.tipo === 'delivery' ? (
                    <PedidoDeliveryCard key={`d-${entry.pedido.id}`} pedido={entry.pedido} itens={entry.itens} posicao={idx + 1} now={now} bucket="preparando" tipoRestaurante={tipoRestaurante}
                      atualizando={atualizando} codigoBarras={barcodeValue(entry.pedido.id)} cardId={`order-${entry.pedido.id}`}
                      onMarcarPronto={() => marcarProntoGrupo(entry.pedido.id, entry.itemIds)}
                      onVoltar={() => voltarGrupo(entry.pedido.id, entry.itemIds)} />
                  ) : (
                    <SalaoItemCard key={`s-${entry.item.id}`} item={entry.item} posicao={idx + 1} now={now} tipoRestaurante={tipoRestaurante} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar}
                      highlighted={numeroComandaEscaneado !== null && entry.item.numero_comanda === numeroComandaEscaneado} />
                  )
                ))}
              </div>
            )}
          </div>

          {prontosRecentes.length > 0 && (
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <h2 className="text-white font-bold text-sm uppercase tracking-wider">Entregues hoje (clicou errado? desfaz aqui)</h2>
                <span className="ml-auto bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{prontosRecentes.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(verTodosEntregues ? prontosRecentes : prontosRecentes.slice(0, 2)).map((entry, idx) => (
                  entry.tipo === 'delivery' ? (
                    <PedidoDeliveryCard key={`d-${entry.pedido.id}`} pedido={entry.pedido} itens={entry.itens} posicao={idx + 1} now={now} bucket="pronto" tipoRestaurante={tipoRestaurante}
                      atualizando={atualizando} codigoBarras={barcodeValue(entry.pedido.id)} cardId={`order-${entry.pedido.id}`}
                      onVoltar={() => voltarGrupo(entry.pedido.id, entry.itemIds)} />
                  ) : (
                    <SalaoItemCard key={`s-${entry.item.id}`} item={entry.item} posicao={idx + 1} now={now} tipoRestaurante={tipoRestaurante} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar}
                      highlighted={numeroComandaEscaneado !== null && entry.item.numero_comanda === numeroComandaEscaneado} />
                  )
                ))}
              </div>
              {prontosRecentes.length > 2 && (
                <button onClick={() => setVerTodosEntregues((v) => !v)}
                  className="mt-3 w-full py-2 text-xs font-bold text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/10">
                  {verTodosEntregues ? 'Recolher / fechar a lista' : `Ver todos (${prontosRecentes.length})`}
                </button>
              )}
            </div>
          )}
        </main>
      )}

      <p className="text-center text-xs text-[#3A3A3A] py-4">Atualiza automaticamente a cada 15 segundos</p>
    </div>
  );
};

export default RestauranteBar;
