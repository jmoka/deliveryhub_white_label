import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getFaturaPublica } from '../../services/faturaPagamentoPublicaService';
import { gerarPixPayload, qrCodeUrl } from '../../utils/pixQrCode';
import Icon from '../../components/AppIcon';
import { APP_NAME } from '../../constants/brand';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtData = (v) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—');

const STATUS_LABEL = {
  pendente: 'Aguardando pagamento',
  vencida: 'Vencida',
  paga: 'Paga',
  cancelada: 'Cancelada',
  isenta: 'Isenta',
};

// Página pública (sem login) que o link gerado em /admin/planos (aba Faturas,
// botão "Gerar link Pix") abre — cliente escaneia/copia o Pix e paga. Admin
// ainda confirma o recebimento manualmente ("Marcar paga"), então a página só
// faz polling leve do status público pra virar "Pago!" sozinha quando isso
// acontecer, sem o cliente precisar recarregar.
const FaturaPagamentoPublica = () => {
  const { token } = useParams();
  const [fatura, setFatura] = useState(null);
  const [erro, setErro] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const d = await getFaturaPublica(token);
      setFatura(d);
      setErro(null);
    } catch (err) {
      setErro(err.message ?? 'Link inválido ou expirado.');
    }
  }, [token]);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 8000);
    return () => clearInterval(interval);
  }, [carregar]);

  const pixPayload = fatura?.modo === 'manual' && fatura?.chave_pix
    ? gerarPixPayload({
        chave: fatura.chave_pix,
        nome: fatura.nome_recebedor,
        cidade: null,
        valor: fatura.valor,
        txid: `fat${fatura.id}`,
      })
    : null;

  const copiar = () => {
    if (!pixPayload) return;
    navigator.clipboard?.writeText(pixPayload).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E4E4E7] p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#FF441F] flex items-center justify-center flex-shrink-0">
            <Icon name="Receipt" size={16} className="text-white" />
          </div>
          <span className="font-black text-[#18181B] text-sm">{APP_NAME}</span>
        </div>

        {erro ? (
          <div className="text-center py-6">
            <Icon name="AlertTriangle" size={36} className="text-red-400 mx-auto mb-3" />
            <p className="text-sm text-[#27272A] font-semibold">{erro}</p>
            <p className="text-xs text-[#71717A] mt-1">Peça um link novo pra quem te enviou este.</p>
          </div>
        ) : !fatura ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fatura.status === 'paga' ? (
          <div className="text-center py-6">
            <Icon name="CheckCircle2" size={40} className="text-green-500 mx-auto mb-3" />
            <p className="font-bold text-[#18181B]">Pagamento confirmado!</p>
            <p className="text-sm text-[#71717A] mt-1">Obrigado, {fatura.nome}.</p>
          </div>
        ) : fatura.status === 'cancelada' || fatura.status === 'isenta' ? (
          <div className="text-center py-6">
            <Icon name="Info" size={36} className="text-[#A1A1AA] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#27272A]">
              Esta fatura está {STATUS_LABEL[fatura.status]?.toLowerCase()} — nada a pagar aqui.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#71717A]">Fatura de assinatura</p>
            <p className="font-bold text-[#18181B] text-base">{fatura.nome}</p>
            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-[#71717A]">Vencimento</span>
              <span className="font-semibold text-[#27272A]">{fmtData(fatura.vencimento)}</span>
            </div>
            <p className="text-3xl font-black text-[#FF441F] text-center my-5">{fmt(fatura.valor)}</p>

            {pixPayload ? (
              <div className="space-y-3">
                <img src={qrCodeUrl(pixPayload)} alt="QR Code Pix" className="w-48 h-48 mx-auto rounded-2xl border border-[#E4E4E7] object-contain" />
                <div>
                  <p className="text-xs text-[#71717A] mb-1.5">Código PIX (copia e cola)</p>
                  <div className="bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl p-3 text-xs font-mono text-[#27272A] break-all max-h-24 overflow-y-auto">
                    {pixPayload}
                  </div>
                </div>
                <button onClick={copiar}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    copiado ? 'bg-green-500 text-white' : 'bg-[#FF441F] hover:bg-[#E63A19] text-white'
                  }`}>
                  {copiado ? '✓ Copiado!' : 'Copiar código Pix'}
                </button>
                <p className="text-xs text-[#71717A] text-center">Após o pagamento, a confirmação pode levar alguns minutos.</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <Icon name="Clock" size={32} className="text-[#A1A1AA] mx-auto mb-2" />
                <p className="text-sm text-[#71717A]">Pagamento online ainda não disponível por aqui — fale com quem te enviou este link.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FaturaPagamentoPublica;
