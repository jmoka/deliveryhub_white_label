import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarImpressoras, getKdsItensRestaurante, marcarItemProntoRestaurante, reimprimirItemRestaurante, iniciarPreparoItemRestaurante, getMinhaEmpresa } from '../../services/restauranteService';
import { printTicketSetor } from '../../utils/printComanda';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import Icon from '../../components/AppIcon';

const formatDuracao = (ms) => {
  if (ms < 0) ms = 0;
  const totalSeg = Math.floor(ms / 1000);
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
};

// Card por item (não por mesa/comanda) com cronômetro ao vivo — mostra há quanto tempo
// o item chegou (aguardando) e, quando em preparo, há quanto tempo está preparando,
// pra dar visibilidade do tempo total gasto até ficar pronto.
const ItemCard = ({ item, now, onReimprimir, onIniciarPreparo, onMarcarPronto }) => {
  const enviadoEm = new Date(item.enviado_em).getTime();
  const preparandoEm = item.preparando_em ? new Date(item.preparando_em).getTime() : null;
  const tempoEspera = (preparandoEm ?? now) - enviadoEm;
  const tempoPreparo = preparandoEm ? now - preparandoEm : 0;
  const tempoTotal = now - enviadoEm;

  return (
    <div className={`bg-[#1A1A1A] border rounded-2xl p-4 ${item.status === 'enviado' ? 'border-blue-500/40' : 'border-[#2A2A2A]'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-white">{item.quantity}x {item.product_name}</span>
        <button onClick={() => onReimprimir(item)}
          className="text-[10px] font-bold text-orange-400 border border-orange-500/40 rounded-lg px-2 py-1 hover:bg-orange-500/10 flex items-center gap-1 flex-shrink-0">
          <Icon name="Printer" size={11} /> Reimpressão
        </button>
      </div>
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
  const [now, setNow] = useState(Date.now());
  const prevItemIds = useRef(new Set());
  const firstLoad = useRef(true);
  const tocarSom = useNotificacaoSonora('cozinha');

  useEffect(() => {
    getMinhaEmpresa().then((d) => setRestauranteNome(d.empresa?.name ?? '')).catch(() => {});
    listarImpressoras().then(setImpressoras).catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
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

  const reimprimir = async (item, setorNome) => {
    try {
      const res = await reimprimirItemRestaurante(item.id);
      if (res.via === 'navegador') {
        printTicketSetor([item], { mesaLabel: item.mesa, cliente_mesa_nome: item.cliente }, setorNome);
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

  const totalItens = Object.values(itensPorImpressora).reduce((s, itens) => s + itens.length, 0);

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
            const itens = itensPorImpressora[imp.id] ?? [];
            const aguardando = itens.filter((i) => i.status === 'enviado');
            const preparando = itens.filter((i) => i.status === 'preparando');
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Aguardando Preparo</p>
                      {aguardando.length === 0 ? (
                        <p className="text-xs text-[#71717A]">Nenhum</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {aguardando.map((item) => (
                            <ItemCard key={item.id} item={item} now={now}
                              onReimprimir={(it) => reimprimir(it, imp.setor)} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">Em Preparo</p>
                      {preparando.length === 0 ? (
                        <p className="text-xs text-[#71717A]">Nenhum</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {preparando.map((item) => (
                            <ItemCard key={item.id} item={item} now={now}
                              onReimprimir={(it) => reimprimir(it, imp.setor)} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} />
                          ))}
                        </div>
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
    </div>
  );
};

export default RestauranteProducao;
