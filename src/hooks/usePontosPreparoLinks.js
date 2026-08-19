import { useEffect, useState } from 'react';
import { listarImpressoras } from '../services/restauranteService';

// Impressora marcada como "ponto de preparo" (ver /restaurante/pontos-preparo)
// vira automaticamente uma entrada no menu lateral + tela dedicada — sem precisar
// codar uma página nova pra cada nome novo (Churrasqueira, Drinks etc).
export function usePontosPreparoLinks() {
  const [links, setLinks] = useState([]);

  useEffect(() => {
    let ativo = true;
    listarImpressoras()
      .then((lista) => {
        if (!ativo) return;
        setLinks(
          (lista ?? [])
            .filter((i) => i.ponto_preparo && i.ativo)
            .map((i) => ({ label: i.nome, path: `/restaurante/ponto-preparo/${i.id}`, icon: i.icone || 'ChefHat' })),
        );
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  return links;
}
