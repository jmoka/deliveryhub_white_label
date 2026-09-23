const RAW_LINKS = [
  { label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard' },
  { label: 'Empresas', path: '/admin/empresas', icon: 'Store' },
  { label: 'Usuários', path: '/admin/usuarios', icon: 'Users' },
  { label: 'Categorias', path: '/admin/categorias', icon: 'FolderTree' },
  { label: 'Tipos', path: '/admin/tipos-estabelecimento', icon: 'Building2' },
  { label: 'Tags', path: '/admin/tags', icon: 'Tags' },
  { label: 'Academia', path: '/admin/academia', icon: 'GraduationCap' },
  { label: 'Comissões', path: '/admin/comissoes', icon: 'Percent' },
  { label: 'Motoboys', path: '/admin/motoboys', icon: 'Bike' },
  { label: 'Planos', path: '/admin/planos', icon: 'CreditCard' },
  { label: 'Marketplace', path: '/admin/marketplace-boost', icon: 'Megaphone' },
  { label: 'Aparência', path: '/admin/aparencia', icon: 'Palette' },
];

// Menu lateral em ordem alfabética, Dashboard fixo no topo — Configurações e
// Meu Perfil saem da lista e viram botões próprios no rodapé do sidebar/topbar
// (mesmo padrão de restauranteNavLinks.js / RestauranteSidebar.jsx).
const [dashboard, ...resto] = RAW_LINKS;
resto.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

export const ADMIN_NAV_LINKS = [dashboard, ...resto];
