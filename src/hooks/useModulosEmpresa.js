import { useMinhaEmpresaData } from './useMinhaEmpresaData';

// Módulos liberados pelo admin em /admin/empresas (independente do tipo de
// estabelecimento) — controla o que aparece na nav do painel do restaurante.
export function useModulosEmpresa() {
  const data = useMinhaEmpresaData();
  return {
    moduloDelivery: !!data?.empresa?.modulo_delivery,
    moduloSalao: !!data?.empresa?.modulo_salao,
    autoAtendimentoHabilitado: !!data?.empresa?.auto_atendimento_habilitado,
  };
}
