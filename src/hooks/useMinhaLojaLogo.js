import { useEffect, useState } from 'react';
import { getMinhaEmpresa } from '../services/restauranteService';

// Logo do estabelecimento — usada no cabeçalho mobile do painel, ao lado do hambúrguer.
export function useMinhaLojaLogo() {
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    let ativo = true;
    getMinhaEmpresa()
      .then((d) => { if (ativo) setLogoUrl(d?.empresa?.logo_url ?? null); })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  return logoUrl;
}
