import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarImpressoras, getKdsItensRestaurante, marcarItemProntoRestaurante, reimprimirItemRestaurante, iniciarPreparoItemRestaurante, voltarStatusItemRestaurante, getMinhaEmpresa } from '../../services/restauranteService';
import { printTicketSetor } from '../../utils/printComanda';
import { formatDuracao } from '../../utils/formatDuracao';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import { useNowTick } from '../../hooks/useNowTick';
import Icon from '../../components/AppIcon';

// Card por item (não por mesa/comanda) — pedido explícito: cada prato tem sua própria
// ação de Liberado pra Motoboy/Reimpressão/Entregue, ordenados por ordem de chegada.
// `posicao` numera a fila (1º = próximo a sair) pra equipe saber quem vem primeiro.
// Cronômetro ao vivo (espera/preparo) igual ao painel de Produção.
//
// Alerta de motoboy (só item de delivery, com pedido já despachado): pisca amarelo em
// trânsito, verde quando entregou, vermelho se o motoboy registrou ocorrência — dados
// vêm do pedido (orders.status/motoboy_lat/lng/delivery_occurrence) via getKdsSetor.
const AlertaMotoboy = ({ item }) => {
  if (item.tipo !== 'delivery') return null;
  const temOcorrencia = item.delivery_occurrence === 'pendente';
  const entregue = item.pedido_status === 'delivered';
  const emTransito = item.pedido_status === 'out_for_delivery' || item.pedido_status === 'motoboy_collecting';
  const temMapa = item.motoboy_lat != null && item.motoboy_lng != null;

  if (!temOcorrencia && !entregue && !emTransito && !temMapa) return null;

  const cor = temOcorrencia ? 'bg-red-500' : entregue ? 'bg-emerald-500' : emTransito ? 'bg-yellow-400' : null;
  const label = temOcorrencia ? 'Ocorrência do motoboy' : entregue ? 'Entregue' : emTransito ? 'Motoboy em trânsito' : '';

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {cor && <span className={`w-2.5 h-2.5 rounded-full ${cor} animate-pulse`} title={label} />}
      {temMapa && (
        <a href={`https://www.google.com/maps?q=${item.motoboy_lat},${item.motoboy_lng}`} target="_blank" rel="noopener noreferrer"
          className="p-1 text-[#71717A] hover:text-white rounded-md hover:bg-[#2A2A2A]" title="Localizar motoboy no mapa">
          <Icon name="MapPin" size={13} />
        </a>
      )}
    </div>
  );
};

const ItemCard = ({ item, posicao, now, onReimprimir, onIniciarPreparo, onMarcarPronto, onVoltar }) => {
  const enviadoEm = new Date(item.enviado_em).getTime();
  const preparandoEm = item.preparando_em ? new Date(item.preparando_em).getTime() : null;
  const tempoEspera = (preparandoEm ?? now) - enviadoEm;
  const tempoPreparo = preparandoEm ? now - preparandoEm : 0;
  const tempoTotal = now - enviadoEm;

  return (
  <div className={`bg-[#1A1A1A] border rounded-2xl p-4 relative ${posicao === 1 ? 'border-yellow-400/70 ring-1 ring-yellow-400/30' : item.status === 'enviado' ? 'border-blue-500/40' : 'border-[#2A2A2A]'}`}>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-black ${posicao === 1 ? 'bg-yellow-400 text-black' : 'bg-[#2A2A2A] text-white'}`}>
          {posicao}
        </span>
        <span className="text-sm font-bold text-white">{item.quantity}x {item.product_name}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <AlertaMotoboy item={item} />
        <button onClick={() => onReimprimir(item)}
          className="text-[10px] font-bold text-orange-400 border border-orange-500/40 rounded-lg px-2 py-1 hover:bg-orange-500/10 flex items-center gap-1">
          <Icon name="Printer" size={11} /> Reimpressão
        </button>
      </div>
    </div>
    {posicao === 1 && <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide mb-1">Próximo da fila</p>}
    {item.observacao && <p className="text-xs text-amber-400 mb-1">Obs: {item.observacao}</p>}
    <div className="flex items-center gap-2 text-xs text-[#71717A] mb-2">
      <Icon name="MapPin" size={12} />
      <span>{item.mesa ?? item.cliente ?? (item.tipo === 'delivery' ? `Pedido #${item.order_id}` : 'Avulsa')}</span>
      {item.garcom && (
        <>
          <span className="text-[#3A3A3A]">•</span>
          <Icon name="User" size={12} />
          <span>{item.garcom}</span>
        </>
      )}
      <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.tipo === 'delivery' ? 'bg-sky-500/20 text-sky-400' : 'bg-purple-500/20 text-purple-300'}`}>
        {item.tipo === 'delivery' ? 'Delivery' : 'Salão'}
      </span>
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
    <div className="flex gap-2">
      {item.status !== 'enviado' && (
        <button onClick={() => onVoltar(item)} title="Desfazer — clicou errado"
          className="flex-shrink-0 px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
          <Icon name="Undo2" size={13} /> Voltar
        </button>
      )}
      {item.status === 'enviado' && (
        <button onClick={() => onIniciarPreparo(item)}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
          <Icon name="ChefHat" size={13} /> Liberado pra Motoboy
        </button>
      )}
      {item.status === 'preparando' && (
        <button onClick={() => onMarcarPronto(item.id)}
          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
          <Icon name="Check" size={13} /> Entregue
        </button>
      )}
      {item.status === 'pronto' && (
        <div className="flex-1 py-2 bg-emerald-900/40 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
          <Icon name="Check" size={13} /> Entregue
        </div>
      )}
    </div>
  </div>
  );
};

// Painel de pedidos do Bar/Copa — mesmo padrão de acesso da tela de Cozinha (dono já
// logado, sem link/token separado), lista PLANA de itens por setor de impressora (não
// agrupa por mesa/comanda — cada prato tem seu próprio ritmo e ação). Coexiste com
// /restaurante/producao (visão unificada de todos os setores) — essa aqui é só o Bar.
const RestauranteBar = () => {
  const navigate = useNavigate();
  const [impressorasBar, setImpressorasBar] = useState(null);
  const [itens, setItens] = useState([]);
  const [restauranteNome, setRestauranteNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filtroCanal, setFiltroCanal] = useState('todos'); // 'todos' | 'delivery' | 'salao'
  const now = useNowTick();
  const prevItemIds = useRef(new Set());
  const firstLoad = useRef(true);
  const tocarSom = useNotificacaoSonora('cozinha');

  useEffect(() => {
    getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {});
    listarImpressoras()
      .then((lista) => setImpressorasBar((lista ?? []).filter((i) => (i.setor ?? '').toLowerCase().includes('bar'))))
      .catch((e) => setErro(e.message));
  }, []);

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

  const reimprimir = async (item) => {
    try {
      const res = await reimprimirItemRestaurante(item.id);
      if (res.via === 'navegador') {
        printTicketSetor([item], { mesaLabel: item.mesa, cliente_mesa_nome: item.cliente }, 'Bar');
      }
    } catch (e) {
      setErro(e.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const itensFiltrados = itens.filter((i) => filtroCanal === 'todos' || i.tipo === filtroCanal);
  const aguardando = itensFiltrados.filter((i) => i.status === 'enviado');
  const preparando = itensFiltrados.filter((i) => i.status === 'preparando');
  const prontosRecentes = itensFiltrados.filter((i) => i.status === 'pronto');
  const totalDelivery = itens.filter((i) => i.tipo === 'delivery').length;
  const totalSalao = itens.filter((i) => i.tipo === 'salao').length;

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
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-[#71717A]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {lastUpdate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? '—'}
            </div>
            <button onClick={() => carregar(impressorasBar ?? [])} className="p-2 text-[#71717A] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
              <Icon name="RefreshCw" size={16} />
            </button>
          </div>
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

      {impressorasBar && impressorasBar.length === 0 ? (
        <div className="text-center py-20 px-5">
          <Icon name="Printer" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
          <p className="text-[#71717A] text-lg font-semibold">Nenhuma impressora de setor "Bar" cadastrada</p>
          <p className="text-[#3A3A3A] text-sm mt-1">Cadastre uma impressora com o setor "Bar" na tela de Impressoras.</p>
          <button onClick={() => navigate('/restaurante/impressoras')}
            className="mt-4 px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19]">
            Ir pra Impressoras
          </button>
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
                {aguardando.map((item, idx) => (
                  <ItemCard key={item.id} item={item} posicao={idx + 1} now={now} onReimprimir={reimprimir} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar} />
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
                {preparando.map((item, idx) => (
                  <ItemCard key={item.id} item={item} posicao={idx + 1} now={now} onReimprimir={reimprimir} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar} />
                ))}
              </div>
            )}
          </div>

          {prontosRecentes.length > 0 && (
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <h2 className="text-white font-bold text-sm uppercase tracking-wider">Entregues recentemente (clicou errado? desfaz aqui)</h2>
                <span className="ml-auto bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{prontosRecentes.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prontosRecentes.map((item, idx) => (
                  <ItemCard key={item.id} item={item} posicao={idx + 1} now={now} onReimprimir={reimprimir} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} onVoltar={voltar} />
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      <p className="text-center text-xs text-[#3A3A3A] py-4">Atualiza automaticamente a cada 15 segundos</p>
    </div>
  );
};

export default RestauranteBar;
