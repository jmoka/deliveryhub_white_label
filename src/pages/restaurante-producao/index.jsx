import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarImpressoras, getKdsItensRestaurante, marcarItemProntoRestaurante, reimprimirGrupoRestaurante, iniciarPreparoGrupoRestaurante, getMinhaEmpresa } from '../../services/restauranteService';
import { printTicketSetor } from '../../utils/printComanda';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import Icon from '../../components/AppIcon';

const GrupoCard = ({ g, onReimprimir, onIniciarPreparo, onMarcarPronto }) => (
  <div className={`bg-[#1A1A1A] border rounded-2xl p-4 ${g.status === 'aguardando' ? 'border-blue-500/40' : 'border-[#2A2A2A]'}`}>
    <div className="flex items-center justify-between mb-1">
      <p className="text-sm font-bold text-white">{g.mesa ?? 'Avulsa'}</p>
      <button onClick={() => onReimprimir(g)}
        className="text-[10px] font-bold text-orange-400 border border-orange-500/40 rounded-lg px-2 py-1 hover:bg-orange-500/10 flex items-center gap-1">
        <Icon name="Printer" size={11} /> Reimpressão
      </button>
    </div>
    {g.cliente && <p className="text-xs text-[#71717A] mb-2">{g.cliente}</p>}
    <div className="space-y-2 mt-2">
      {g.itens.map((item) => (
        <div key={item.id} className="flex items-center justify-between bg-[#111111] rounded-xl px-3 py-2">
          <span className="text-sm text-white">{item.quantity}x {item.product_name}</span>
          {g.status === 'preparando' && (
            <button onClick={() => onMarcarPronto(item.id)}
              className="text-xs font-bold text-emerald-400 border border-emerald-500/40 rounded-lg px-2 py-1 hover:bg-emerald-500/10">
              Pronto
            </button>
          )}
        </div>
      ))}
    </div>
    {g.status === 'aguardando' && (
      <button onClick={() => onIniciarPreparo(g)}
        className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
        <Icon name="ChefHat" size={13} /> Iniciar Preparo
      </button>
    )}
  </div>
);

// Linha de produção do Salão — visão unificada de TODOS os setores (cozinha, bar,
// salgados...) num painel só, dono acessa direto logado (sem link/token separado, mesmo
// padrão de acesso da tela de Cozinha do delivery). Cada setor é uma impressora
// cadastrada; itens vêm de order_items roteados pra ela (ver GET /restaurante/kds).
const RestauranteProducao = () => {
  const navigate = useNavigate();
  const [impressoras, setImpressoras] = useState(null);
  const [gruposPorImpressora, setGruposPorImpressora] = useState({});
  const [restauranteNome, setRestauranteNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
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
        lista.map((imp) => getKdsItensRestaurante(imp.id).then((r) => [imp, r.grupos ?? []])),
      );
      const porImpressora = {};
      const idsAgora = new Set();
      for (const [imp, grupos] of resultados) {
        porImpressora[imp.id] = grupos.map((g) => ({ ...g, impressora_id: imp.id }));
        for (const g of grupos) for (const i of g.itens) idsAgora.add(i.id);
      }

      if (!firstLoad.current) {
        const novos = [...idsAgora].filter((id) => !prevItemIds.current.has(id));
        if (novos.length > 0) tocarSom();
      } else {
        firstLoad.current = false;
      }
      prevItemIds.current = idsAgora;

      setGruposPorImpressora(porImpressora);
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

  const iniciarPreparo = async (grupo) => {
    await iniciarPreparoGrupoRestaurante(grupo.order_id, grupo.impressora_id);
    carregar(impressoras);
  };

  const reimprimir = async (grupo, setorNome) => {
    try {
      const res = await reimprimirGrupoRestaurante(grupo.order_id, grupo.impressora_id);
      if (res.via === 'navegador') {
        printTicketSetor(grupo.itens, { mesaLabel: grupo.mesa, cliente_mesa_nome: grupo.cliente }, setorNome);
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

  const totalItens = Object.values(gruposPorImpressora).reduce((s, gs) => s + gs.reduce((s2, g) => s2 + g.itens.length, 0), 0);

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
            const grupos = gruposPorImpressora[imp.id] ?? [];
            const aguardando = grupos.filter((g) => g.status === 'aguardando');
            const preparando = grupos.filter((g) => g.status === 'preparando');
            return (
              <div key={imp.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  <h2 className="text-white font-bold text-sm uppercase tracking-wider">{imp.setor}</h2>
                  {grupos.length > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                      {grupos.reduce((s, g) => s + g.itens.length, 0)}
                    </span>
                  )}
                </div>
                {grupos.length === 0 ? (
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
                          {aguardando.map((g) => (
                            <GrupoCard key={`${g.impressora_id}-${g.order_id}`} g={g}
                              onReimprimir={(gr) => reimprimir(gr, imp.setor)} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} />
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
                          {preparando.map((g) => (
                            <GrupoCard key={`${g.impressora_id}-${g.order_id}`} g={g}
                              onReimprimir={(gr) => reimprimir(gr, imp.setor)} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} />
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
