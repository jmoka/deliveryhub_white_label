import React from 'react';
import Icon from '../AppIcon';
import { formatDuracao } from '../../utils/formatDuracao';

// Card de item de salão/setor (KDS) — usado tanto na tela unificada da Cozinha
// quanto na tela de setor por impressora (bar, salgados...), pra ficarem sempre idênticas.
const SalaoItemCard = ({ item, posicao, now, onReimprimir, onIniciarPreparo, onMarcarPronto, onVoltar, highlighted = false }) => {
  const enviadoEm = new Date(item.enviado_em).getTime();
  const preparandoEm = item.preparando_em ? new Date(item.preparando_em).getTime() : null;
  const tempoEspera = (preparandoEm ?? now) - enviadoEm;
  const tempoPreparo = preparandoEm ? now - preparandoEm : 0;
  const tempoTotal = now - enviadoEm;

  return (
  <div id={`salao-item-${item.id}`} className={`rounded-2xl border-2 overflow-hidden bg-purple-950/20 transition-all duration-300 ${
    highlighted
      ? 'border-yellow-400 ring-2 ring-yellow-400/60 shadow-xl shadow-yellow-300/20 scale-[1.02]'
      : item.garcom_nao_entregou ? 'border-red-500 ring-1 ring-red-500/40' : posicao === 1 ? 'border-yellow-400/70 ring-1 ring-yellow-400/30' : 'border-purple-300'
  }`}>
    {item.garcom && (
      <div className="bg-white px-4 py-2">
        <p className="text-center text-lg font-black text-[#18181B] uppercase tracking-wide">{item.garcom}</p>
      </div>
    )}
    <div className="p-4">
    <div className="flex items-start justify-between mb-1 gap-2">
      <div className="flex items-start gap-2">
        <span className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-black mt-0.5 ${posicao === 1 ? 'bg-yellow-400 text-black' : 'bg-purple-900/50 text-white'}`}>
          {posicao}
        </span>
        <div className="leading-tight">
          <p className="text-xl font-black text-white">Quantidade: {item.quantity}</p>
          <p className="text-lg font-bold text-white">Produto: {item.product_name} <span className="text-purple-300 font-normal text-xs">· Salão</span></p>
        </div>
      </div>
      {onReimprimir && (
        <button onClick={() => onReimprimir(item)}
          className="text-[10px] font-bold text-orange-400 border border-orange-500/40 rounded-lg px-2 py-1 hover:bg-orange-500/10 flex items-center gap-1 flex-shrink-0">
          <Icon name="Printer" size={11} /> Reimpressão
        </button>
      )}
    </div>
    {posicao === 1 && <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide mb-1">Próximo da fila</p>}
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
    {item.observacao && <p className="text-sm font-bold text-white bg-blue-600 rounded px-1.5 py-0.5 mb-1 animate-pulse">Obs: {item.observacao}</p>}
    <div className="flex items-center gap-2 text-base font-bold text-yellow-400 mb-2">
      <Icon name="MapPin" size={14} />
      <span>{item.mesa && item.cliente ? `${item.mesa} • ${item.cliente}` : item.mesa ?? item.cliente ?? 'Avulsa'}</span>
      {item.numero_comanda && <span className="text-[11px] font-normal text-purple-300/80">#{item.numero_comanda}</span>}
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
          className="flex-shrink-0 px-3 py-2 bg-purple-900/40 hover:bg-purple-900/60 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
          <Icon name="Undo2" size={13} /> Voltar
        </button>
      )}
      {item.status === 'enviado' && (
        <button onClick={() => onIniciarPreparo(item)}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
          <Icon name="ChefHat" size={13} /> Iniciar Preparo
        </button>
      )}
      {item.status === 'preparando' && (
        <button onClick={() => onMarcarPronto(item.id)}
          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
          <Icon name="Check" size={13} /> Pronto
        </button>
      )}
      {item.status === 'pronto' && (
        <div className="flex-1 py-2 bg-emerald-900/40 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
          <Icon name="Check" size={13} /> Pronto
        </div>
      )}
    </div>
    </div>
  </div>
  );
};

export default SalaoItemCard;
