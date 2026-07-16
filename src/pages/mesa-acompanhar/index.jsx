import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getAcompanhamento } from '../../services/mesaAcompanharService';
import { formatDuracao } from '../../utils/formatDuracao';
import { useNowTick } from '../../hooks/useNowTick';
import Icon from '../../components/AppIcon';

const STATUS_ITEM_LABEL = { pendente: 'Anotado', enviado: 'Em preparo', pronto: 'Pronto' };
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
          {dados.mesa && <p className="text-sm text-[#71717A]">{dados.mesa}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 mb-3 text-center">
          <p className="text-xs text-[#71717A]">Status</p>
          <p className="text-base font-bold text-[#18181B]">{STATUS_COMANDA_LABEL[dados.status] ?? dados.status}</p>
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
                {enviadoEm && item.status !== 'pronto' && (
                  <p className="text-[11px] text-[#71717A] font-mono mt-1 flex items-center gap-1">
                    <Icon name="Clock" size={11} /> preparando há {formatDuracao(tempoPreparo)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MesaAcompanhar;
