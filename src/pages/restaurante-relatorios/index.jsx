import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useTipoRestaurante } from '../../hooks/useTipoRestaurante';
import { useMinhaLojaSlug } from '../../hooks/useMinhaLojaSlug';
import RestauranteSidebar from '../../components/restaurante/RestauranteSidebar';

const LINKS = [
  { label: 'Dashboard', path: '/restaurante' },
  { label: 'Delivery', path: '/restaurante/delivery' },
  { label: 'Produtos', path: '/restaurante/produtos' },
  { label: 'Pedidos', path: '/restaurante/pedidos' },
  { label: 'Entregas', path: '/restaurante/entregas' },
  { label: 'Motoboys', path: '/restaurante/motoboys' },
  { label: 'Clientes', path: '/restaurante/clientes' },
  { label: 'Financeiro', path: '/restaurante/financeiro' },
  { label: 'Relatórios', path: '/restaurante/relatorios' },
  { label: 'Designer', path: '/restaurante/aparencia' },
  { label: 'Config', path: '/restaurante/config' },
];

const SALAO_LINKS = [
  { label: 'Salão', path: '/restaurante/salao' },
  { label: 'Garçons', path: '/restaurante/garcons' },
  { label: 'Impressoras', path: '/restaurante/impressoras' },
];

const RELATORIOS = [
  {
    id: 'garcom',
    path: '/restaurante/relatorios/garcom',
    icon: 'Users',
    titulo: 'Garçom',
    descricao: 'Vendas, comissão, gorjeta e comandas por garçom.',
    cor: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    id: 'financeiro',
    path: '/restaurante/relatorios/financeiro',
    icon: 'DollarSign',
    titulo: 'Financeiro',
    descricao: 'Vendas, comissões, gorjetas e fluxo de caixa detalhado.',
    cor: 'text-green-600 bg-green-50 border-green-200',
  },
  {
    id: 'produtos',
    path: '/restaurante/relatorios/produtos',
    icon: 'Package',
    titulo: 'Produtos',
    descricao: 'Lista de produtos, sem estoque, ativos e bloqueados.',
    cor: 'text-purple-600 bg-purple-50 border-purple-200',
  },
];

const RestauranteRelatorios = () => {
  const navigate = useNavigate();
  const tipoRestaurante = useTipoRestaurante();
  const slugLoja = useMinhaLojaSlug();
  const links = [...LINKS, ...(tipoRestaurante ? SALAO_LINKS : [])];
  const [sidebarAberto, setSidebarAberto] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#18181B]">Relatórios</h1>
        <button onClick={() => setSidebarAberto(true)}
          className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#27272A] hover:bg-[#F4F4F5] border border-[#E4E4E7]">
          <Icon name="Menu" size={18} /> Menu
        </button>
        <button onClick={() => navigate('/restaurante')} className="md:hidden flex items-center gap-1.5 text-sm text-[#71717A]">
          <Icon name="ChevronLeft" size={16} /> Voltar
        </button>
      </header>

      <RestauranteSidebar
        open={sidebarAberto}
        onClose={() => setSidebarAberto(false)}
        links={links}
        activePath="/restaurante/relatorios"
        slugLoja={slugLoja}
      />

      <main className="p-6 max-w-4xl mx-auto">
        <p className="text-sm text-[#71717A] mb-5">Escolha um relatório — cada um tem filtro por período e opção de impressão.</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {RELATORIOS.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(r.path)}
              className="text-left bg-white rounded-2xl border border-[#E4E4E7] p-5 hover:border-[#FF441F]/40 hover:shadow-sm transition-all"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${r.cor}`}>
                <Icon name={r.icon} size={18} />
              </div>
              <p className="font-bold text-[#18181B] mb-1">{r.titulo}</p>
              <p className="text-xs text-[#71717A]">{r.descricao}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RestauranteRelatorios;
