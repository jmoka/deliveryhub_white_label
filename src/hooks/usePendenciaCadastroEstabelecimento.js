import { useEffect, useState } from 'react';
import { getMinhaEmpresa, getStatusTelegramEstabelecimento, getStatusWhatsappEstabelecimento } from '../services/restauranteService';

// Pendência permanente de onboarding do estabelecimento — nenhum canal de
// notificação vinculado (Telegram OU WhatsApp já resolve) e/ou pino do
// endereço nunca confirmado no mapa. Usado pelo aviso fixo em RestauranteHeader
// (sem botão de fechar, some sozinho quando resolvido).
export function usePendenciaCadastroEstabelecimento() {
  const [pendencia, setPendencia] = useState(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      getStatusTelegramEstabelecimento().catch(() => null),
      getStatusWhatsappEstabelecimento().catch(() => null),
      getMinhaEmpresa().catch(() => null),
    ]).then(([telegram, whatsapp, empresa]) => {
      if (!ativo) return;
      setPendencia({
        semNotificacao: !telegram?.vinculado && !whatsapp?.vinculado,
        semPino: empresa?.empresa ? (empresa.empresa.lat == null || empresa.empresa.lng == null) : false,
      });
    });
    return () => { ativo = false; };
  }, []);

  return pendencia;
}
