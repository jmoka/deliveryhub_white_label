import { useModulosEmpresa } from './useModulosEmpresa';

// Vocabulário do fluxo de preparo/entrega — "Cozinha" só faz sentido pra Restaurante.
// Farmácia, material de construção etc. usam o mesmo fluxo (confirmar → preparar →
// pronto → chama motoboy), só que com nomes de "embalagem/empacotamento" em vez de
// "cozinha/preparo". Centralizado aqui pra não duplicar a mesma checagem tipoRestaurante
// em cada tela — qualquer tela que mostre esse vocabulário usa esse hook.
const TERMOS_RESTAURANTE = {
  estabelecimento: 'Restaurante',
  painelPreparo: 'Painel da Cozinha',
  praca: 'Cozinha',
  pracaLower: 'cozinha',
  aguardandoPreparo: 'Aguardando Preparo',
  emPreparo: 'Em Preparo',
  iniciarPreparo: 'Iniciar Preparo',
  pronto: 'Pronto',
  pracaTranquila: 'Cozinha tranquila',
  cardapio: 'Cardápio Digital',
  icone: 'ChefHat',
};

const TERMOS_GENERICO = {
  estabelecimento: 'Estabelecimento',
  painelPreparo: 'Painel da Embalagem',
  praca: 'Embalagem',
  pracaLower: 'embalagem',
  aguardandoPreparo: 'Esperando Embalar',
  emPreparo: 'Embalando',
  iniciarPreparo: 'Iniciar Embalagem',
  pronto: 'Pacote pronto',
  pracaTranquila: 'Embalagem tranquila',
  cardapio: 'Catálogo Digital',
  icone: 'Package',
};

export function useTerminologiaEstabelecimento() {
  const modulos = useModulosEmpresa();
  return { ...modulos, termos: modulos.tipoRestaurante ? TERMOS_RESTAURANTE : TERMOS_GENERICO };
}

// Versão pura (sem hook) pra usar em funções que já recebem tipoRestaurante como
// parâmetro (ex: getRestauranteNavLinks) em vez de chamar o hook de novo.
export function getTermos(tipoRestaurante) {
  return tipoRestaurante ? TERMOS_RESTAURANTE : TERMOS_GENERICO;
}
