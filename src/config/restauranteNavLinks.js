const BASE_LINKS = [
  { label: 'Dashboard', path: '/restaurante', icon: 'LayoutDashboard' },
  { label: 'Relatórios', path: '/restaurante/relatorios', icon: 'BarChart3' },
  { label: 'Delivery', path: '/restaurante/delivery', icon: 'Truck' },
  { label: 'Cozinha', path: '/restaurante/cozinha', icon: 'ChefHat' },
  { label: 'Produtos', path: '/restaurante/produtos', icon: 'Package' },
  { label: 'Combos', path: '/restaurante/combos', icon: 'Boxes' },
  { label: 'Pedidos', path: '/restaurante/pedidos', icon: 'ClipboardList' },
  { label: 'Entregas', path: '/restaurante/entregas', icon: 'Bike' },
  { label: 'Motoboys', path: '/restaurante/motoboys', icon: 'Users' },
  { label: 'Clientes', path: '/restaurante/clientes', icon: 'UserRound' },
  { label: 'Financeiro', path: '/restaurante/financeiro', icon: 'Wallet' },
  { label: 'Caixa', path: '/restaurante/caixa', icon: 'PiggyBank' },
  { label: 'Designer', path: '/restaurante/aparencia', icon: 'Paintbrush' },
  { label: 'Cardápio Digital', path: '/restaurante/cardapio-digital', icon: 'BookOpen' },
  { label: 'Config', path: '/restaurante/config', icon: 'Settings' },
  { label: 'Sessão', path: '/restaurante/sessao', icon: 'Clock' },
];

const COPA_LINKS = [
  { label: 'Produção', path: '/restaurante/producao', icon: 'CookingPot' },
  { label: 'Bar', path: '/restaurante/bar', icon: 'Beer' },
];

const SALAO_LINKS = [
  { label: 'Salão', path: '/restaurante/salao', icon: 'UtensilsCrossed' },
  { label: 'Garçons', path: '/restaurante/garcons', icon: 'Contact' },
  { label: 'Impressoras', path: '/restaurante/impressoras', icon: 'Printer' },
];

export const getRestauranteNavLinks = (tipoRestaurante) => [
  ...BASE_LINKS.slice(0, 4),
  ...(tipoRestaurante ? COPA_LINKS : []),
  ...BASE_LINKS.slice(4),
  ...(tipoRestaurante ? SALAO_LINKS : []),
];
