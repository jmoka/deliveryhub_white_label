import { useEffect, useState } from 'react';
import { contarSolicitacoesMotoboyPendentes } from '../services/restauranteService';

// Contador de solicitações de motoboy pendentes — usado pra mostrar um aviso
// (badge) no link "Motoboys" da navegação do painel do restaurante.
export function useSolicitacoesMotoboyCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      contarSolicitacoesMotoboyPendentes()
        .then((d) => { if (ativo) setCount(d.count ?? 0); })
        .catch(() => {});

    carregar();
    const interval = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(interval); };
  }, []);

  return count;
}
