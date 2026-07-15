import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarImpressoras, getKdsItensRestaurante, marcarItemProntoRestaurante, reimprimirGrupoRestaurante, getMinhaEmpresa } from '../../services/restauranteService';
import { printTicketSetor } from '../../utils/printComanda';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import Icon from '../../components/AppIcon';

// Painel de pedidos do Bar/Copa — mesmo padrão de acesso da tela de Cozinha (dono já
// logado, sem link/token separado), só que mostra itens por setor de impressora em vez
// de pedidos inteiros de delivery (ver GET /restaurante/kds no backend).
const RestauranteBar = () => {
  const navigate = useNavigate();
  const [impressorasBar, setImpressorasBar] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [restauranteNome, setRestauranteNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
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
        impressoras.map((imp) => getKdsItensRestaurante(imp.id).then((r) => (r.grupos ?? []).map((g) => ({ ...g, impressora_id: imp.id })))),
      );
      const todosGrupos = listas.flat();

      if (!firstLoad.current) {
        const idsAgora = new Set();
        for (const g of todosGrupos) for (const i of g.itens) idsAgora.add(i.id);
        const novos = [...idsAgora].filter((id) => !prevItemIds.current.has(id));
        if (novos.length > 0) tocarSom();
        prevItemIds.current = idsAgora;
      } else {
        const idsAgora = new Set();
        for (const g of todosGrupos) for (const i of g.itens) idsAgora.add(i.id);
        prevItemIds.current = idsAgora;
        firstLoad.current = false;
      }

      setGrupos(todosGrupos);
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

  const reimprimir = async (grupo) => {
    try {
      const res = await reimprimirGrupoRestaurante(grupo.order_id, grupo.impressora_id);
      if (res.via === 'navegador') {
        printTicketSetor(grupo.itens, { mesaLabel: grupo.mesa, cliente_mesa_nome: grupo.cliente }, 'Bar');
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
        <main className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {grupos.map((g) => (
            <div key={`${g.impressora_id}-${g.order_id}`} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-white">{g.mesa ?? 'Avulsa'}</p>
                <button onClick={() => reimprimir(g)}
                  className="text-[10px] font-bold text-orange-400 border border-orange-500/40 rounded-lg px-2 py-1 hover:bg-orange-500/10 flex items-center gap-1">
                  <Icon name="Printer" size={11} /> Reimpressão
                </button>
              </div>
              {g.cliente && <p className="text-xs text-[#71717A] mb-2">{g.cliente}</p>}
              <div className="space-y-2 mt-2">
                {g.itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-[#111111] rounded-xl px-3 py-2">
                    <span className="text-sm text-white">{item.quantity}x {item.product_name}</span>
                    <button onClick={() => marcarPronto(item.id)}
                      className="text-xs font-bold text-emerald-400 border border-emerald-500/40 rounded-lg px-2 py-1 hover:bg-emerald-500/10">
                      Pronto
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {grupos.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Icon name="Martini" size={48} className="text-[#2A2A2A] mx-auto mb-4" />
              <p className="text-[#71717A] text-lg font-semibold">Bar tranquilo</p>
              <p className="text-[#3A3A3A] text-sm mt-1">Nenhum item pendente agora</p>
            </div>
          )}
        </main>
      )}

      <p className="text-center text-xs text-[#3A3A3A] py-4">Atualiza automaticamente a cada 15 segundos</p>
    </div>
  );
};

export default RestauranteBar;
