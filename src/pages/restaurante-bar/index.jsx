import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarImpressoras, getKdsItensRestaurante, marcarItemProntoRestaurante, reimprimirItemRestaurante, iniciarPreparoItemRestaurante, getMinhaEmpresa } from '../../services/restauranteService';
import { printTicketSetor } from '../../utils/printComanda';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import Icon from '../../components/AppIcon';

// Card por item (não por mesa/comanda) — pedido explícito: cada prato tem sua própria
// ação de Iniciar Preparo/Reimpressão/Pronto, ordenados por ordem de chegada. `posicao`
// numera a fila (1º = próximo a sair) pra equipe saber quem vem primeiro.
const ItemCard = ({ item, posicao, onReimprimir, onIniciarPreparo, onMarcarPronto }) => (
  <div className={`bg-[#1A1A1A] border rounded-2xl p-4 relative ${posicao === 1 ? 'border-yellow-400/70 ring-1 ring-yellow-400/30' : item.status === 'enviado' ? 'border-blue-500/40' : 'border-[#2A2A2A]'}`}>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-black ${posicao === 1 ? 'bg-yellow-400 text-black' : 'bg-[#2A2A2A] text-white'}`}>
          {posicao}
        </span>
        <span className="text-sm font-bold text-white">{item.quantity}x {item.product_name}</span>
      </div>
      <button onClick={() => onReimprimir(item)}
        className="text-[10px] font-bold text-orange-400 border border-orange-500/40 rounded-lg px-2 py-1 hover:bg-orange-500/10 flex items-center gap-1 flex-shrink-0">
        <Icon name="Printer" size={11} /> Reimpressão
      </button>
    </div>
    {posicao === 1 && <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide mb-1">Próximo da fila</p>}
    {item.observacao && <p className="text-xs text-amber-400 mb-1">Obs: {item.observacao}</p>}
    <div className="flex items-center gap-2 text-xs text-[#71717A] mb-3">
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

  const aguardando = itens.filter((i) => i.status === 'enviado');
  const preparando = itens.filter((i) => i.status === 'preparando');

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
        <main className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Aguardando Preparo</h2>
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
                  <ItemCard key={item.id} item={item} posicao={idx + 1} onReimprimir={reimprimir} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Em Preparo</h2>
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
                  <ItemCard key={item.id} item={item} posicao={idx + 1} onReimprimir={reimprimir} onIniciarPreparo={iniciarPreparo} onMarcarPronto={marcarPronto} />
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      <p className="text-center text-xs text-[#3A3A3A] py-4">Atualiza automaticamente a cada 15 segundos</p>
    </div>
  );
};

export default RestauranteBar;
