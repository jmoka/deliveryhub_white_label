import { useEffect, useState } from 'react';
import { contarSolicitacoesMotoboyPendentes, contarSolicitacoesRepassePendentes } from '../services/restauranteService';

// Contador de solicitações de motoboy pendentes (afiliação + repasse) — usado pra mostrar
// um aviso (badge) no link "Motoboys" da navegação do painel do restaurante.
export function useSolicitacoesMotoboyCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      Promise.all([
        contarSolicitacoesMotoboyPendentes().catch(() => ({ count: 0 })),
        contarSolicitacoesRepassePendentes().catch(() => ({ count: 0 })),
      ]).then(([afiliacao, repasse]) => {
        if (ativo) setCount((afiliacao?.count ?? 0) + (repasse?.count ?? 0));
      });

    carregar();
    const interval = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(interval); };
  }, []);

  return count;
}
