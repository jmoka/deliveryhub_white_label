import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import RestauranteHeader from '../../components/restaurante/RestauranteHeader';

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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <RestauranteHeader active="/restaurante/relatorios" title="Relatórios" />

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
