const BASE_LINKS = [
  { label: 'Dashboard', path: '/restaurante', icon: 'LayoutDashboard' },
  { label: 'Relatórios', path: '/restaurante/relatorios', icon: 'BarChart3' },
  { label: 'Produtos', path: '/restaurante/produtos', icon: 'Package' },
  { label: 'Clientes', path: '/restaurante/clientes', icon: 'UserRound' },
  { label: 'Financeiro', path: '/restaurante/financeiro', icon: 'Wallet' },
  { label: 'Caixa', path: '/restaurante/caixa', icon: 'PiggyBank' },
  { label: 'Designer', path: '/restaurante/aparencia', icon: 'Paintbrush' },
  { label: 'Cardápio Digital', path: '/restaurante/cardapio-digital', icon: 'BookOpen' },
  { label: 'Config', path: '/restaurante/config', icon: 'Settings' },
  { label: 'Sessão', path: '/restaurante/sessao', icon: 'Clock' },
];

// Servem tanto Delivery quanto Salão — só somem se a empresa não tem NENHUM módulo ativo.
const COMPARTILHADO_LINKS = [
  { label: 'Cozinha', path: '/restaurante/cozinha', icon: 'ChefHat' },
  { label: 'Combos', path: '/restaurante/combos', icon: 'Boxes' },
  { label: 'Pedidos', path: '/restaurante/pedidos', icon: 'ClipboardList' },
];

const DELIVERY_LINKS = [
  { label: 'Delivery', path: '/restaurante/delivery', icon: 'Truck' },
  { label: 'Entregas', path: '/restaurante/entregas', icon: 'Bike' },
  { label: 'Motoboys', path: '/restaurante/motoboys', icon: 'Users' },
];

const COPA_LINKS = [
  { label: 'Produção', path: '/restaurante/producao', icon: 'CookingPot' },
  { label: 'Bar', path: '/restaurante/bar', icon: 'Beer' },
];

const SALAO_LINKS = [
  { label: 'Salão', path: '/restaurante/salao', icon: 'UtensilsCrossed' },
  { label: 'Chamada', path: '/restaurante/chamada', icon: 'Volume2' },
  { label: 'Garçons', path: '/restaurante/garcons', icon: 'Contact' },
  { label: 'Impressoras', path: '/restaurante/impressoras', icon: 'Printer' },
];

export const getRestauranteNavLinks = (moduloDelivery, moduloSalao) => {
  const temAlgumModulo = moduloDelivery || moduloSalao;
  return [
    ...BASE_LINKS.slice(0, 2), // Dashboard, Relatórios
    ...(moduloDelivery ? DELIVERY_LINKS.slice(0, 1) : []), // Delivery
    ...(temAlgumModulo ? COMPARTILHADO_LINKS.slice(0, 1) : []), // Cozinha
    ...(moduloSalao ? COPA_LINKS : []), // Produção, Bar
    ...BASE_LINKS.slice(2, 3), // Produtos
    ...(temAlgumModulo ? COMPARTILHADO_LINKS.slice(1) : []), // Combos, Pedidos
    ...(moduloDelivery ? DELIVERY_LINKS.slice(1) : []), // Entregas, Motoboys
    ...BASE_LINKS.slice(3), // Clientes...Sessão
    ...(moduloSalao ? SALAO_LINKS : []), // Salão, Garçons, Impressoras
  ];
};
