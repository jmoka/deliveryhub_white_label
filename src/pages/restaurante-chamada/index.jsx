import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFilaChamadaBalcao, marcarChamadaBalcao, marcarItemBalcaoEntregue } from '../../services/restauranteService';
import { useNotificacaoSonora } from '../../hooks/useNotificacaoSonora';
import { useNowTick } from '../../hooks/useNowTick';
import Icon from '../../components/AppIcon';

const CICLO_MS = 7000;
const MAX_CHAMADOS = 5;

// Painel de chamada da Venda Balcão — fica ligado numa TV/tablet no salão. Chama 1
// comanda por vez (a mais antiga ainda com chamado_count < 5), bipa+pisca a cada 7s.
// Depois de 5 chamados sem confirmação, sai do destaque e cai na lista lateral
// "Aguardando entregar" (silenciosa) até o operador marcar os itens como entregues.
// Item pode ser marcado entregue a qualquer momento (ex: bebida que o cliente já
// levou na hora), sem precisar esperar o resto do pedido — a comanda só some da
// fila quando TODOS os itens dela estiverem entregues.
const RestauranteChamada = () => {
  const [fila, setFila] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState(null);
  const [flash, setFlash] = useState(false);
  const now = useNowTick();
  const tocarSom = useNotificacaoSonora('chamada');
  const chamandoRef = useRef(false);
  const filaRef = useRef([]);

  const carregar = useCallback(async () => {
    try {
      const { fila: nova } = await getFilaChamadaBalcao();
      const idsNovos = new Set(nova.map((p) => p.order_id));
      const anterior = filaRef.current;
      const saidosInfo = anterior.filter((p) => !idsNovos.has(p.order_id));
      if (saidosInfo.length && anterior.length) {
        setHistorico((h) => [...saidosInfo.map((p) => ({ ...p, entregue_em: Date.now() })), ...h].slice(0, 15));
      }
      filaRef.current = nova;
      setFila(nova);
      setErro(null);
    } catch (err) {
      setErro(err.message);
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 5000);
    return () => clearInterval(id);
  }, [carregar]);

  const filaVisivel = fila.filter((p) => p.itens.length > 0);
  const central = filaVisivel.find((p) => p.chamado_count < MAX_CHAMADOS) ?? null;
  const aguardando = filaVisivel.filter((p) => p.chamado_count >= MAX_CHAMADOS);
  const naFila = filaVisivel.filter((p) => p.chamado_count < MAX_CHAMADOS && p.order_id !== central?.order_id).length;

  // Ciclo de 7s: dispara bipe+pisca e registra a chamada no servidor (sobrevive a
  // reload da TV, já que o contador/última chamada ficam persistidos na comanda).
  useEffect(() => {
    if (!central || chamandoRef.current) return;
    const ultima = central.ultima_chamada_em ? new Date(central.ultima_chamada_em).getTime() : null;
    const devido = ultima === null || now - ultima >= CICLO_MS;
    if (!devido) return;

    chamandoRef.current = true;
    tocarSom();
    setFlash(true);
    setTimeout(() => setFlash(false), 700);

    marcarChamadaBalcao(central.order_id)
      .then(() => {
        const atualizada = filaRef.current.map((p) => p.order_id === central.order_id
          ? { ...p, chamado_count: p.chamado_count + 1, ultima_chamada_em: new Date().toISOString() }
          : p);
        filaRef.current = atualizada;
        setFila(atualizada);
      })
      .catch(() => {})
      .finally(() => { chamandoRef.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, central?.order_id, central?.ultima_chamada_em]);

  const marcarEntregue = async (orderId, itemId) => {
    try {
      await marcarItemBalcaoEntregue(orderId, itemId);
      const atualizada = filaRef.current.map((p) => p.order_id !== orderId ? p : { ...p, itens: p.itens.filter((i) => i.id !== itemId) });
      filaRef.current = atualizada;
      setFila(atualizada);
    } catch (err) {
      setErro(err.message);
    }
  };

  const ItensLista = ({ pedido, tamanho = 'sm' }) => (
    <div className="space-y-1.5">
      {pedido.itens.map((item) => (
        <div key={item.id} className={`flex items-center justify-between gap-2 bg-black/20 rounded-lg px-2.5 py-1.5 ${tamanho === 'lg' ? 'text-base' : 'text-xs'}`}>
          <span className="font-bold text-white">{item.quantity}x {item.product_name}</span>
          <button onClick={() => marcarEntregue(pedido.order_id, item.id)}
            className="flex-shrink-0 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1">
            <Icon name="Check" size={11} /> Entregue
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1A1A1A] p-4 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-white uppercase flex items-center gap-2">
          <Icon name="Volume2" size={22} className="text-orange-400" /> Chamada — Balcão
        </h1>
        {naFila > 0 && <span className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA]">+{naFila} na fila</span>}
      </div>
      {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Destaque central — 1 comanda por vez, pisca contínuo + flash no bipe */}
        <div className="flex-1 flex items-center justify-center">
          {central ? (
            <div className={`w-full max-w-xl rounded-3xl border-4 p-8 text-center transition-colors animate-pulse ${flash ? 'bg-yellow-400/20 border-yellow-400 dark:border-yellow-800' : 'bg-[#232323] border-orange-500/60'}`}>
              <p className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-2">Pedido pronto</p>
              <p className="text-4xl font-black text-white mb-1">{central.cliente}</p>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-5">Chamado {central.chamado_count}/{MAX_CHAMADOS}</p>
              <ItensLista pedido={central} tamanho="lg" />
            </div>
          ) : (
            <p className="text-[#71717A] dark:text-[#A1A1AA] text-sm">Nenhum pedido de balcão aguardando.</p>
          )}
        </div>

        {/* Lateral — Aguardando entregar (silencioso) + Entregue (histórico) */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 max-h-[80vh]">
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-xs font-black text-white uppercase tracking-wide mb-2">Aguardando entregar ({aguardando.length})</h2>
            <div className="space-y-2">
              {aguardando.map((p) => (
                <div key={p.order_id} className="bg-[#232323] border border-[#2A2A2A] rounded-xl p-3">
                  <p className="text-sm font-bold text-white mb-1.5">{p.cliente}</p>
                  <ItensLista pedido={p} />
                </div>
              ))}
              {aguardando.length === 0 && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Vazio.</p>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-xs font-black text-white uppercase tracking-wide mb-2">Entregue</h2>
            <div className="space-y-1.5">
              {historico.map((p, idx) => (
                <div key={`${p.order_id}-${idx}`} className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA] bg-[#1F1F1F] rounded-lg px-2.5 py-1.5">
                  <Icon name="Check" size={12} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-white font-bold">{p.cliente}</span>
                </div>
              ))}
              {historico.length === 0 && <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Nada ainda.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestauranteChamada;
