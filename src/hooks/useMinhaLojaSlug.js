import { useMinhaEmpresaData } from './useMinhaEmpresaData';

// Slug do próprio estabelecimento — usado pro link "Loja" na nav do painel,
// que abre o cardápio público (/r/:slug) numa aba nova.
export function useMinhaLojaSlug() {
  const data = useMinhaEmpresaData();
  return data?.empresa?.slug ?? null;
}
