import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getAcompanhamento, solicitarConferencia } from '../../services/mesaAcompanharService';
import { formatDuracao } from '../../utils/formatDuracao';
import { useNowTick } from '../../hooks/useNowTick';
import Icon from '../../components/AppIcon';
import TempoMedioTile from '../../components/TempoMedioTile';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const STATUS_ITEM_LABEL = { pendente: 'Anotado', enviado: 'Em preparo', pronto: 'Pronto' };
const PAGAMENTO_LABEL = { pix: 'PIX', credit_card: 'Cartão crédito', debit_card: 'Cartão débito', cash: 'Dinheiro' };
const STATUS_COMANDA_LABEL = {
  aberta: 'Em andamento',
  fechada_garcom: 'Aguardando pagamento no caixa',
  paga: 'Pago — obrigado!',
  canceled: 'Cancelada',
};

const MesaAcompanhar = () => {
  const { token } = useParams();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [solicitando, setSolicitando] = useState(false);
  const [msgSolicitacao, setMsgSolicitacao] = useState(null);
  const now = useNowTick();

  const carregar = useCallback(async () => {
    try {
      const d = await getAcompanhamento(token);
      setDados(d);
      setErro(null);
    } catch (err) {
      setErro(err.message ?? 'Não foi possível carregar.');
    }
  }, [token]);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 15000);
    return () => clearInterval(interval);
  }, [carregar]);

  const conferenciaSolicitada = !!dados?.conferencia_solicitada_em;

  const handleSolicitar = async () => {
    setSolicitando(true);
    setMsgSolicitacao(null);
    try {
      const res = await solicitarConferencia(token);
      if (res?.ok) {
        setMsgSolicitacao({ tipo: 'ok', texto: 'Solicitação enviada! O garçom já foi avisado.' });
        await carregar();
      } else {
        setMsgSolicitacao({ tipo: 'erro', texto: 'Não foi possível solicitar agora, chame o garçom.' });
      }
    } catch {
      setMsgSolicitacao({ tipo: 'erro', texto: 'Não foi possível solicitar agora, chame o garçom.' });
    } finally {
      setSolicitando(false);
    }
  };

  if (erro) return <div className="min-h-screen flex items-center justify-center p-6 text-sm text-red-600">{erro}</div>;
  if (!dados) return <div className="min-h-screen flex items-center justify-center text-sm text-[#71717A]">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#F4F4F5] p-4 flex flex-col items-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-4 mt-4">
          <div className="w-14 h-14 bg-[#FF441F]/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Icon name="UtensilsCrossed" size={26} className="text-[#FF441F]" />
          </div>
          <h1 className="text-lg font-black text-[#18181B]">{dados.restaurante}</h1>
          <p className="text-sm text-[#71717A]">
            {dados.mesa}{dados.mesa && dados.numero_comanda ? ' — ' : ''}{dados.numero_comanda ? `Comanda #${dados.numero_comanda}` : ''}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-3 text-center">
          <p className="text-xs text-[#71717A]">Status</p>
          <p className="text-base font-bold text-[#18181B]">{STATUS_COMANDA_LABEL[dados.status] ?? dados.status}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <TempoMedioTile label="Espera média" segundos={dados.tempoMedioEsperaSegundos} />
          <TempoMedioTile label="Preparo médio" segundos={dados.tempoMedioPreparoSegundos} />
          <TempoMedioTile label="Total médio" segundos={dados.tempoMedioGeralSegundos} />
        </div>

        <div className="space-y-2">
          {dados.itens.map((item, i) => {
            const enviadoEm = item.enviado_em ? new Date(item.enviado_em).getTime() : null;
            const tempoPreparo = enviadoEm ? now - enviadoEm : null;
            return (
              <div key={i} className="bg-white rounded-xl border border-[#E4E4E7] p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#18181B]">{item.quantity}x {item.product_name}</span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                    item.status === 'pronto' ? 'bg-emerald-100 text-emerald-700' : item.status === 'enviado' ? 'bg-orange-100 text-orange-700' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {STATUS_ITEM_LABEL[item.status] ?? item.status}
                  </span>
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">{fmt(item.unit_price)} un. · {fmt(item.subtotal)}</p>
                {item.posicao_fila && (
                  <p className="text-[11px] text-[#71717A] mt-1">
                    {item.posicao_fila}º {item.status === 'preparando' ? 'em preparo' : 'na fila pra entrar em preparo'}
                  </p>
                )}
                {enviadoEm && item.status !== 'pronto' && (
                  <p className="text-[11px] text-[#71717A] font-mono mt-1 flex items-center gap-1">
                    <Icon name="Clock" size={11} /> preparando há {formatDuracao(tempoPreparo)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mt-3 space-y-1.5">
          <div className="flex justify-between text-sm text-[#71717A]">
            <span>Subtotal</span><span>{fmt(dados.subtotal)}</span>
          </div>
          {dados.desconto > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Desconto</span><span>-{fmt(dados.desconto)}</span>
            </div>
          )}
          {dados.acrescimo > 0 && (
            <div className="flex justify-between text-sm text-[#71717A]">
              <span>Acréscimo</span><span>{fmt(dados.acrescimo)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-[#71717A]">
            <span>
              Gorjeta {dados.gorjeta_percentual ? `(${dados.gorjeta_percentual}%)` : ''}
              {dados.gorjeta_estimativa && <span className="text-[10px]"> · estimativa</span>}
            </span>
            <span>{fmt(dados.gorjeta)}</span>
          </div>
          {dados.taxa_cartao_total > 0 && (
            <div className="flex justify-between text-sm text-[#71717A]">
              <span>Taxa cartão</span><span>{fmt(dados.taxa_cartao_total)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-[#18181B] pt-1.5 border-t border-[#E4E4E7]">
            <span>Total</span><span>{fmt(dados.total)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-[#18181B]">
            <span>Falta pagar</span><span>{fmt(dados.saldo)}</span>
          </div>
        </div>

        {dados.pagamentos?.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mt-3 space-y-1.5">
            <p className="text-xs text-[#71717A] mb-1">Pagamentos já feitos</p>
            {dados.pagamentos.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#18181B]">{PAGAMENTO_LABEL[p.forma_pagamento] ?? p.forma_pagamento}</span>
                <span className="text-[#18181B]">
                  {fmt(p.valor)}
                  {p.taxa_cartao_valor > 0 && <span className="text-[#71717A]"> (+{fmt(p.taxa_cartao_valor)} taxa)</span>}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold text-[#18181B] pt-1.5 border-t border-[#E4E4E7]">
              <span>Total pago</span><span>{fmt(dados.total_pago)}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSolicitar}
          disabled={solicitando || conferenciaSolicitada}
          className="w-full mt-3 bg-white border border-[#E4E4E7] rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium text-[#18181B] disabled:opacity-60"
        >
          <Icon name={conferenciaSolicitada ? 'BellRing' : 'Bell'} size={16} />
          {conferenciaSolicitada
            ? 'Conferência solicitada — aguarde o garçom'
            : (solicitando ? 'Enviando...' : 'Solicitar conferência')}
        </button>
        {msgSolicitacao && (
          <p className={`text-xs text-center mt-2 ${msgSolicitacao.tipo === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
            {msgSolicitacao.texto}
          </p>
        )}
      </div>
    </div>
  );
};

export default MesaAcompanhar;
