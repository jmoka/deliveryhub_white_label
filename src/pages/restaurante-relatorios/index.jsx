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
    cor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'motoboy',
    path: '/restaurante/relatorios/motoboy',
    icon: 'Bike',
    titulo: 'Motoboy',
    descricao: 'Entregas, comissão e repasse por motoboy.',
    cor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'financeiro',
    path: '/restaurante/relatorios/financeiro',
    icon: 'DollarSign',
    titulo: 'Financeiro',
    descricao: 'Vendas, comissões, gorjetas e fluxo de caixa detalhado.',
    cor: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800',
  },
  {
    id: 'produtos',
    path: '/restaurante/relatorios/produtos',
    icon: 'Package',
    titulo: 'Produtos',
    descricao: 'Lista de produtos, sem estoque, ativos e bloqueados.',
    cor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
  },
];

const RestauranteRelatorios = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#18181B]">
      <RestauranteHeader active="/restaurante/relatorios" title="Conferências" />

      <main className="p-6 max-w-4xl mx-auto">
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] mb-5">Escolha um relatório — cada um tem filtro por período e opção de impressão.</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {RELATORIOS.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(r.path)}
              className="text-left bg-white dark:bg-[#27272A] rounded-2xl border border-[#E4E4E7] dark:border-[#3F3F46] p-5 hover:border-[#FF441F]/40 hover:shadow-sm transition-all"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${r.cor}`}>
                <Icon name={r.icon} size={18} />
              </div>
              <p className="font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">{r.titulo}</p>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{r.descricao}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RestauranteRelatorios;
