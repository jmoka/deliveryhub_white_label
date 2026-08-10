import { useMinhaEmpresaData } from './useMinhaEmpresaData';

// Logo do estabelecimento — usada no cabeçalho mobile do painel, ao lado do hambúrguer.
export function useMinhaLojaLogo() {
  const data = useMinhaEmpresaData();
  return data?.empresa?.logo_url ?? null;
}
