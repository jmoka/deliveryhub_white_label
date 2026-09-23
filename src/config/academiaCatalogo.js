// Metadado estrutural da Academia PediuVai — perfis e taxonomia de
// categorias por perfil. Os vídeos em si (título, descrição, url_video,
// quais perfis aparecem) vivem no banco (tabela academia_videos),
// gerenciados pelo admin em /admin/academia — ver src/services/academiaService.js
// (getCatalogoAcademia) e src/services/adminService.js (CRUD/upload).

export const ACADEMIA_PERFIS = [
  { id: 'estabelecimento', label: 'Estabelecimento', icon: 'Store' },
  { id: 'garcom', label: 'Garçom', icon: 'Contact' },
  { id: 'motoboy', label: 'Motoboy', icon: 'Bike' },
  { id: 'cliente', label: 'Cliente', icon: 'ShoppingBag' },
];

export const ACADEMIA_CATEGORIAS = {
  estabelecimento: [
    { slug: 'primeiros-passos', label: 'Primeiros Passos', icon: 'Rocket' },
    { slug: 'produtos-cardapio', label: 'Produtos & Cardápio', icon: 'Package' },
    { slug: 'pedidos-cozinha', label: 'Pedidos & Cozinha', icon: 'ChefHat' },
    { slug: 'delivery-motoboys', label: 'Delivery & Motoboys', icon: 'Bike' },
    { slug: 'salao', label: 'Salão (Mesas, Garçons, Comandas)', icon: 'UtensilsCrossed' },
    { slug: 'caixa-financeiro', label: 'Caixa & Financeiro', icon: 'Wallet' },
    { slug: 'impressoras', label: 'Impressoras & Agente', icon: 'Printer' },
    { slug: 'relatorios', label: 'Relatórios', icon: 'BarChart3' },
  ],
  garcom: [
    { slug: 'comandas-mesas', label: 'Comandas & Mesas', icon: 'Table2' },
    { slug: 'envio-pedidos', label: 'Enviando Pedidos', icon: 'Send' },
    { slug: 'chamada-atendimento', label: 'Chamada & Atendimento', icon: 'Volume2' },
    { slug: 'fechamento', label: 'Fechamento', icon: 'Receipt' },
  ],
  motoboy: [
    { slug: 'cadastro-aprovacao', label: 'Cadastro & Aprovação', icon: 'UserCheck' },
    { slug: 'aceitando-pedidos', label: 'Aceitando Pedidos', icon: 'ClipboardList' },
    { slug: 'coleta-entrega', label: 'Coleta & Entrega', icon: 'PackageCheck' },
    { slug: 'ganhos', label: 'Ganhos', icon: 'Wallet' },
  ],
  cliente: [
    { slug: 'como-pedir', label: 'Como Pedir', icon: 'ShoppingCart' },
    { slug: 'pagamento', label: 'Pagamento', icon: 'CreditCard' },
    { slug: 'acompanhar-pedido', label: 'Acompanhar Pedido', icon: 'MapPin' },
    { slug: 'perfil-enderecos', label: 'Perfil & Endereços', icon: 'UserCircle' },
  ],
};

export const getCategoriaLabel = (perfil, slug) =>
  ACADEMIA_CATEGORIAS[perfil]?.find((c) => c.slug === slug)?.label ?? slug;

// Categoria "sem correspondência" pro perfil sendo exibido (ex: vídeo
// cadastrado com uma categoria que só existe pra outro perfil marcado) —
// evita o vídeo simplesmente desaparecer da tela.
export const CATEGORIA_FALLBACK = { slug: '_outros', label: 'Outros', icon: 'MoreHorizontal' };
