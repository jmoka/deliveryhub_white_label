import { useEffect, useState } from 'react';
import { getMotoboysAdmin } from '../services/adminService';

// Contador de motoboys aguardando aprovação da plataforma — usado pra mostrar
// um badge no link "Motoboys" da navegação do admin, mesmo padrão do
// useSolicitacoesMotoboyCount do painel do restaurante.
export function useMotoboysPendentesAdmin() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      getMotoboysAdmin('pendente')
        .then((lista) => { if (ativo) setCount(Array.isArray(lista) ? lista.length : 0); })
        .catch(() => {});

    carregar();
    const interval = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(interval); };
  }, []);

  return count;
}
