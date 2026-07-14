import { useEffect, useState } from 'react';
import { getMinhaEmpresa } from '../services/restauranteService';

// Só estabelecimentos do tipo "Restaurante" veem o módulo Salão (mesas/comandas/garçons)
// na nav do painel — farmácia, material de construção etc não usam esse fluxo.
export function useTipoRestaurante() {
  const [tipoRestaurante, setTipoRestaurante] = useState(false);

  useEffect(() => {
    let ativo = true;
    getMinhaEmpresa()
      .then((d) => { if (ativo) setTipoRestaurante(!!d?.empresa?.tipo_restaurante); })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  return tipoRestaurante;
}
