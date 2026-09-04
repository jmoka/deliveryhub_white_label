const BASE_LINKS = [
  { label: 'Dashboard', path: '/restaurante', icon: 'LayoutDashboard' },
  { label: 'Conferências', path: '/restaurante/relatorios', icon: 'BarChart3' },
  { label: 'Produtos', path: '/restaurante/produtos', icon: 'Package' },
  { label: 'Clientes', path: '/restaurante/clientes', icon: 'UserRound' },
  { label: 'Financeiro', path: '/restaurante/financeiro', icon: 'Wallet' },
  { label: 'Caixa', path: '/restaurante/caixa', icon: 'PiggyBank' },
  { label: 'Designer', path: '/restaurante/aparencia', icon: 'Paintbrush' },
  { label: 'Cardápio Digital', path: '/restaurante/cardapio-digital', icon: 'BookOpen' },
  { label: 'Plano', path: '/restaurante/plano', icon: 'CreditCard' },
  { label: 'Sessão', path: '/restaurante/sessao', icon: 'Clock' },
];

// Servem tanto Delivery quanto Salão — só somem se a empresa não tem NENHUM módulo ativo.
const COMPARTILHADO_LINKS = [
  { label: 'Cozinha', path: '/restaurante/cozinha', icon: 'ChefHat' },
  { label: 'Combos', path: '/restaurante/combos', icon: 'Boxes' },
  { label: 'Pedidos', path: '/restaurante/pedidos', icon: 'ClipboardList' },
];

// "Cozinha"/"Cardápio Digital" só fazem sentido pra Restaurante — farmácia, material de
// construção etc. usam "Embalagem"/"Catálogo Digital" no menu (ver useTerminologiaEstabelecimento).
const relabelarParaTipo = (links, tipoRestaurante) => {
  if (tipoRestaurante) return links;
  return links.map((l) => {
    if (l.path === '/restaurante/cozinha') return { ...l, label: 'Embalagem', icon: 'Package' };
    if (l.path === '/restaurante/cardapio-digital') return { ...l, label: 'Catálogo Digital' };
    return l;
  });
};

const DELIVERY_LINKS = [
  { label: 'Delivery', path: '/restaurante/delivery', icon: 'Truck' },
  { label: 'Entregas', path: '/restaurante/entregas', icon: 'Bike' },
  { label: 'Motoboys', path: '/restaurante/motoboys', icon: 'Users' },
  { label: 'Impulsionar', path: '/restaurante/impulsionar', icon: 'Rocket' },
];

const COPA_LINKS = [
  { label: 'Produção', path: '/restaurante/producao', icon: 'CookingPot' },
  { label: 'Bar', path: '/restaurante/bar', icon: 'Beer' },
];

const SALAO_LINKS = [
  { label: 'Salão', path: '/restaurante/salao', icon: 'UtensilsCrossed' },
  { label: 'Venda Balcão', path: '/restaurante/venda-balcao', icon: 'ShoppingCart' },
  { label: 'Chamada', path: '/restaurante/chamada', icon: 'Volume2' },
  { label: 'Garçons', path: '/restaurante/garcons', icon: 'Contact' },
  { label: 'Mesas', path: '/restaurante/mesas', icon: 'Table2' },
  { label: 'Impressoras', path: '/restaurante/impressoras', icon: 'Printer' },
];

const SERVICOS_LINKS = [
  { label: 'Serviços', path: '/restaurante/servicos', icon: 'Wrench' },
];

// Pontos de preparo customizados (Churrasqueira, Drinks...) usam o mesmo requisito de
// visibilidade da Cozinha — precisam de algum módulo ativo pra fazer sentido no menu.
const PONTOS_PREPARO_CADASTRO = { label: 'Pontos de Preparo', path: '/restaurante/pontos-preparo', icon: 'LayoutGrid' };

// Estabelecimento tipo ≠ Restaurante (farmácia, material de construção...) chama
// o entregador de "Entregadores" no menu, em vez de "Motoboys" (termo mais
// específico de delivery de comida).
export const getRestauranteNavLinks = (moduloDelivery, moduloSalao, moduloServicos, pontosPreparo = [], tipoRestaurante = true) => {
  const temAlgumModulo = moduloDelivery || moduloSalao;
  const deliveryLinks = tipoRestaurante
    ? DELIVERY_LINKS
    : DELIVERY_LINKS.map((l) => (l.path === '/restaurante/motoboys' ? { ...l, label: 'Entregadores' } : l));
  const links = relabelarParaTipo([
    ...BASE_LINKS.slice(0, 2), // Dashboard, Relatórios
    ...(moduloDelivery ? deliveryLinks.slice(0, 1) : []), // Delivery
    ...(temAlgumModulo ? COMPARTILHADO_LINKS.slice(0, 1) : []), // Cozinha
    ...(temAlgumModulo ? [PONTOS_PREPARO_CADASTRO, ...pontosPreparo] : []), // Cadastro + pontos criados
    ...(moduloSalao ? COPA_LINKS : []), // Produção, Bar
    ...BASE_LINKS.slice(2, 3), // Produtos
    ...(temAlgumModulo ? COMPARTILHADO_LINKS.slice(1) : []), // Combos, Pedidos
    ...(moduloDelivery ? deliveryLinks.slice(1) : []), // Entregas, Motoboys/Entregadores
    ...BASE_LINKS.slice(3), // Clientes...Sessão
    ...(moduloSalao ? SALAO_LINKS : []), // Salão, Garçons, Impressoras
    ...(moduloServicos ? SERVICOS_LINKS : []), // Serviços (orçamento)
  ], tipoRestaurante);
  // Menu lateral em ordem alfabética (pedido do usuário) — a ordem acima só
  // controla quais links entram conforme os módulos ativos. Dashboard fica
  // fixo no topo, fora da ordenação.
  const [dashboard, resto] = [links.find((l) => l.path === '/restaurante'), links.filter((l) => l.path !== '/restaurante')];
  resto.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  return dashboard ? [dashboard, ...resto] : resto;
};
