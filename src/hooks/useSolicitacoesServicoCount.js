import { useEffect, useState } from 'react';
import { contarSolicitacoesServicoPendentes } from '../services/restauranteService';

// Contador de solicitações de orçamento de serviço pendentes — mostra um aviso
// (badge) no link "Serviços" da navegação do painel do restaurante.
export function useSolicitacoesServicoCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      contarSolicitacoesServicoPendentes()
        .then((r) => { if (ativo) setCount(r?.count ?? 0); })
        .catch(() => {});

    carregar();
    const interval = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(interval); };
  }, []);

  return count;
}
