import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import { formatDuracao } from '../../utils/formatDuracao';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão', debit_card: 'Débito', cash: 'Dinheiro' };

// Alerta de motoboy (só item de delivery, com pedido já despachado) — pisca amarelo em
// trânsito, verde quando entregou, vermelho se o motoboy registrou ocorrência. Dados vêm
// do pedido (orders.status/motoboy_lat/lng/delivery_occurrence) via getKdsSetor.
const AlertaMotoboy = ({ item }) => {
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
          className="p-1 text-[#71717A] hover:text-[#18181B] dark:hover:text-white rounded-md hover:bg-[#F4F4F5] dark:hover:bg-[#2A2A2A]" title="Localizar motoboy no mapa">
          <Icon name="MapPin" size={13} />
        </a>
      )}
    </div>
  );
};

// Card de item por praça de preparo (Cozinha unificada/Bar/Produção/pontos de preparo
// customizáveis) — mesmo componente em TODAS as telas, pra nunca mais divergir estilo
// nem rótulo entre elas. Item de delivery usa o mesmo visual claro da Cozinha (fácil de
// bater o olho e identificar); item de salão mantém o tema escuro já usado. Ação é
// sempre por ITEM (não pelo pedido inteiro) — cada praça só controla o que é dela; o
// pedido de delivery só vira "pronto" pro motoboy quando todas as praças envolvidas
// já marcaram seus itens (ver marcarItemPronto no backend).
const SalaoItemCard = ({
  item, posicao, now, onReimprimir, onIniciarPreparo, onMarcarPronto, onVoltar, onCancelar,
  onMover, ehPrimeiro, ehUltimo, onAbrirComanda, onSalvarObservacao, highlighted = false,
}) => {
  const enviadoEm = new Date(item.enviado_em).getTime();
  const preparandoEm = item.preparando_em ? new Date(item.preparando_em).getTime() : null;
  const tempoEspera = (preparandoEm ?? now) - enviadoEm;
  const tempoPreparo = preparandoEm ? now - preparandoEm : 0;
  const tempoTotal = now - enviadoEm;
  const ehDelivery = item.tipo === 'delivery';
  const podeAbrirComanda = !ehDelivery && !!item.numero_comanda && !!onAbrirComanda;
  const podeEditarObs = !ehDelivery && !!onSalvarObservacao;

  const [editandoObs, setEditandoObs] = useState(false);
  const [obsInput, setObsInput] = useState(item.observacao ?? '');
  useEffect(() => { if (!editandoObs) setObsInput(item.observacao ?? ''); }, [item.observacao, editandoObs]);
  const salvarObs = () => { onSalvarObservacao(item, obsInput); setEditandoObs(false); };

  const acoes = (
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      {item.status !== 'enviado' && (
        <button onClick={() => onVoltar(item)} title="Desfazer — clicou errado"
          className={`flex-shrink-0 px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 ${ehDelivery ? 'bg-[#F4F4F5] dark:bg-[#3F3F46] hover:bg-[#E4E4E7] dark:hover:bg-[#2A2A2A] text-[#71717A] dark:text-[#A1A1AA]' : 'bg-purple-900/40 hover:bg-purple-900/60 text-white'}`}>
          <Icon name="Undo2" size={13} /> Voltar
        </button>
      )}
      {item.status === 'enviado' ? (
        <>
          {onCancelar && (
            <button onClick={() => onCancelar(item)} title="Cancelar item"
              className={`flex-shrink-0 px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 ${ehDelivery ? 'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400' : 'bg-red-900/40 hover:bg-red-900/60 text-red-400'}`}>
              <Icon name="X" size={13} /> Cancelar
            </button>
          )}
          <button onClick={() => onIniciarPreparo(item)}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
            <Icon name="ChefHat" size={13} /> Iniciar Preparo
          </button>
        </>
      ) : item.status === 'pronto' ? (
        <div className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 ${ehDelivery ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
          <Icon name="Check" size={13} /> {item.entregue_garcom ? 'Entregue pelo garçom' : 'Pronto'}
        </div>
      ) : (
        <button onClick={() => onMarcarPronto(item.id)}
          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
          <Icon name="Check" size={13} /> Pronto
        </button>
      )}
    </div>
  );

  const localLabel = ehDelivery
    ? (item.cliente ? `Pedido #${item.order_id} • ${item.cliente}` : `Pedido #${item.order_id}`)
    : (item.mesa && item.cliente ? `${item.mesa} • ${item.cliente}` : item.mesa ?? item.cliente ?? 'Avulsa');

  return (
    <div
      id={`salao-item-${item.id}`}
      onClick={podeAbrirComanda ? () => onAbrirComanda(item.order_id) : undefined}
      title={podeAbrirComanda ? 'Ver comanda completa' : undefined}
      className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${podeAbrirComanda ? 'cursor-pointer' : ''} ${
        ehDelivery
          ? `bg-white dark:bg-[#27272A] ${podeAbrirComanda ? 'hover:border-[#FF441F]/60' : ''} ${
              highlighted ? 'border-yellow-400 ring-2 ring-yellow-400/60 shadow-xl shadow-yellow-300/40 scale-[1.02]'
                : item.garcom_nao_entregou ? 'border-red-500 ring-1 ring-red-500/40'
                : posicao === 1 ? 'border-yellow-400 ring-1 ring-yellow-400/30'
                : 'border-[#E4E4E7] dark:border-[#3F3F46]'
            }`
          : `bg-purple-950/20 ${
              highlighted ? 'border-yellow-400 ring-2 ring-yellow-400/60 shadow-xl shadow-yellow-300/20 scale-[1.02]'
                : item.garcom_nao_entregou ? 'border-red-500 ring-1 ring-red-500/40'
                : posicao === 1 ? 'border-yellow-400/70 ring-1 ring-yellow-400/30'
                : 'border-purple-300'
            }`
      }`}>
      {item.garcom && (
        <div className="bg-white px-4 py-2">
          <p className="text-center text-lg font-black text-[#18181B] uppercase tracking-wide">{item.garcom}</p>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1 gap-2">
          <div className="flex items-start gap-2">
            <span className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-black mt-0.5 ${
              posicao === 1 ? 'bg-yellow-400 text-black' : ehDelivery ? 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#18181B] dark:text-white' : 'bg-purple-900/50 text-white'
            }`}>
              {posicao}
            </span>
            {item.status === 'enviado' && onMover && (
              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => onMover(item, 'cima')} disabled={ehPrimeiro} title="Adiantar — subir na fila"
                  className={`w-5 h-4 flex items-center justify-center rounded disabled:opacity-20 ${ehDelivery ? 'text-[#A1A1AA] enabled:hover:text-[#18181B] dark:enabled:hover:text-white enabled:hover:bg-[#F4F4F5] dark:enabled:hover:bg-[#2A2A2A]' : 'text-[#71717A] enabled:hover:text-white enabled:hover:bg-[#2A2A2A]'}`}>
                  <Icon name="ChevronUp" size={13} />
                </button>
                <button onClick={() => onMover(item, 'baixo')} disabled={ehUltimo} title="Atrasar — descer na fila"
                  className={`w-5 h-4 flex items-center justify-center rounded disabled:opacity-20 ${ehDelivery ? 'text-[#A1A1AA] enabled:hover:text-[#18181B] dark:enabled:hover:text-white enabled:hover:bg-[#F4F4F5] dark:enabled:hover:bg-[#2A2A2A]' : 'text-[#71717A] enabled:hover:text-white enabled:hover:bg-[#2A2A2A]'}`}>
                  <Icon name="ChevronDown" size={13} />
                </button>
              </div>
            )}
            <div className="leading-tight">
              <p className={`text-xl font-black ${ehDelivery ? 'text-[#18181B] dark:text-[#F4F4F5]' : 'text-white'}`}>Quantidade: {item.quantity}</p>
              <p className={`text-lg font-bold ${ehDelivery ? 'text-[#18181B] dark:text-[#F4F4F5]' : 'text-white'}`}>
                Produto: {item.product_name}
                {!ehDelivery && <span className="text-purple-300 font-normal text-xs"> · Salão</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {ehDelivery && <AlertaMotoboy item={item} />}
            {onReimprimir && (
              <button onClick={(e) => { e.stopPropagation(); onReimprimir(item); }}
                className="text-[10px] font-bold text-orange-500 dark:text-orange-400 border border-orange-300 dark:border-orange-500/40 rounded-lg px-2 py-1 hover:bg-orange-50 dark:hover:bg-orange-500/10 flex items-center gap-1 flex-shrink-0">
                <Icon name="Printer" size={11} /> Reimpressão
              </button>
            )}
          </div>
        </div>

        {posicao === 1 && (
          <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${ehDelivery ? 'text-orange-600 dark:text-yellow-400' : 'text-yellow-400'}`}>Próximo da fila</p>
        )}
        {item.garcom_nao_entregou && (
          <p className="text-sm font-bold text-white bg-red-600 rounded px-1.5 py-0.5 mb-1 animate-pulse">
            Esse pedido não foi entregue — garçom não entregou
          </p>
        )}
        {item.is_auto_atendimento && (
          <p className="text-sm font-bold text-white bg-pink-600 rounded px-1.5 py-0.5 mb-1">
            Auto Atendimento — Mesa {item.mesa_numero ?? '?'}
          </p>
        )}
        {item.garcom_indo_buscar && (
          <p className={`text-sm font-bold text-white rounded px-1.5 py-0.5 mb-1 ${item.entregue_garcom ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            {item.entregue_garcom ? 'Já entregue pelo garçom' : 'Garçom vindo buscar'}
          </p>
        )}

        {editandoObs ? (
          <div className="flex items-center gap-1.5 mb-1" onClick={(e) => e.stopPropagation()}>
            <input value={obsInput} onChange={(e) => setObsInput(e.target.value)} autoFocus
              placeholder="Observação..."
              className="flex-1 text-xs bg-[#F4F4F5] dark:bg-[#111111] border border-[#E4E4E7] dark:border-[#3A3A3A] rounded-lg px-2 py-1 text-[#18181B] dark:text-white focus:outline-none focus:border-[#FF441F]" />
            <button onClick={salvarObs} className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Salvar</button>
            <button onClick={() => setEditandoObs(false)} className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Cancelar</button>
          </div>
        ) : item.observacao ? (
          <p onClick={podeEditarObs ? (e) => { e.stopPropagation(); setEditandoObs(true); } : undefined}
            className={`text-sm font-bold text-white bg-blue-600 rounded px-1.5 py-0.5 mb-1 animate-pulse ${podeEditarObs ? 'cursor-pointer' : ''}`}>
            Obs: {item.observacao}
          </p>
        ) : podeEditarObs ? (
          <button onClick={(e) => { e.stopPropagation(); setEditandoObs(true); }}
            className="flex items-center gap-1 mb-1 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white">
            <Icon name="MessageSquare" size={11} /> Adicionar observação
          </button>
        ) : null}

        <div className={`flex items-center gap-2 text-base font-bold mb-2 ${ehDelivery ? 'text-[#FF441F]' : 'text-yellow-400'}`}>
          <Icon name="MapPin" size={14} />
          <span className={ehDelivery ? 'text-sm' : ''}>{localLabel}</span>
          {item.numero_comanda && (
            <>
              <span className={ehDelivery ? 'text-[#A1A1AA]' : 'text-[#71717A]'}>•</span>
              <span>Comanda #{item.numero_comanda}</span>
            </>
          )}
          <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold ${ehDelivery ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400' : 'bg-purple-500/20 text-purple-300'}`}>
            {ehDelivery ? 'Delivery' : 'Salão'}
          </span>
        </div>

        {ehDelivery && (item.pedido_total != null || item.pedido_payment_method) && (
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#F4F4F5] dark:border-[#3F3F46] text-xs">
            <span className="text-[#71717A] dark:text-[#A1A1AA]">{PAYMENT_LABELS[item.pedido_payment_method] ?? item.pedido_payment_method}</span>
            {item.pedido_total != null && <span className="font-black text-[#FF441F]">{fmt(item.pedido_total)}</span>}
          </div>
        )}

        <div className={`flex items-center gap-3 text-[11px] font-mono mb-3 ${ehDelivery ? 'text-[#71717A] dark:text-[#A1A1AA]' : ''}`}>
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Icon name="Clock" size={11} /> espera {formatDuracao(tempoEspera)}
          </span>
          {item.status === 'preparando' && (
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <Icon name="Flame" size={11} /> preparo {formatDuracao(tempoPreparo)}
            </span>
          )}
          <span className={`ml-auto ${ehDelivery ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>total {formatDuracao(tempoTotal)}</span>
        </div>

        {acoes}
      </div>
    </div>
  );
};

export default SalaoItemCard;
