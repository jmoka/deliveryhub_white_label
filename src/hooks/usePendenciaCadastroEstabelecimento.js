import { useEffect, useState } from 'react';
import { getMinhaEmpresa, getStatusTelegramEstabelecimento } from '../services/restauranteService';

// Pendência permanente de onboarding do estabelecimento — Telegram não
// vinculado e/ou pino do endereço nunca confirmado no mapa. Usado pelo aviso
// fixo em RestauranteHeader (sem botão de fechar, some sozinho quando resolvido).
export function usePendenciaCadastroEstabelecimento() {
  const [pendencia, setPendencia] = useState(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      getStatusTelegramEstabelecimento().catch(() => null),
      getMinhaEmpresa().catch(() => null),
    ]).then(([telegram, empresa]) => {
      if (!ativo) return;
      setPendencia({
        semTelegram: !telegram?.vinculado,
        semPino: empresa?.empresa ? (empresa.empresa.lat == null || empresa.empresa.lng == null) : false,
      });
    });
    return () => { ativo = false; };
  }, []);

  return pendencia;
}
