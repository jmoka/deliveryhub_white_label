import { useEffect, useState } from 'react';
import { getMinhaEmpresa } from '../services/restauranteService';

// Módulos liberados pelo admin em /admin/empresas (independente do tipo de
// estabelecimento) — controla o que aparece na nav do painel do restaurante.
export function useModulosEmpresa() {
  const [modulos, setModulos] = useState({ moduloDelivery: false, moduloSalao: false, autoAtendimentoHabilitado: false });

  useEffect(() => {
    let ativo = true;
    getMinhaEmpresa()
      .then((d) => {
        if (!ativo) return;
        setModulos({
          moduloDelivery: !!d?.empresa?.modulo_delivery,
          moduloSalao: !!d?.empresa?.modulo_salao,
          autoAtendimentoHabilitado: !!d?.empresa?.auto_atendimento_habilitado,
        });
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  return modulos;
}
