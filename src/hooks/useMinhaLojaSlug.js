import { useEffect, useState } from 'react';
import { getMinhaEmpresa } from '../services/restauranteService';

// Slug do próprio estabelecimento — usado pro link "Loja" na nav do painel,
// que abre o cardápio público (/r/:slug) numa aba nova.
export function useMinhaLojaSlug() {
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    let ativo = true;
    getMinhaEmpresa()
      .then((d) => { if (ativo) setSlug(d?.empresa?.slug ?? null); })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  return slug;
}
