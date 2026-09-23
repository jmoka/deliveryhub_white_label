import React from 'react';
import Icon from './AppIcon';

// Ícone de ajuda pra colar ao lado do título de uma tela do painel do
// estabelecimento — abre a categoria correspondente da Academia em nova aba
// (não navega pra fora da tela em que o dono está trabalhando). `categoria`
// é o slug definido em src/config/academiaCatalogo.js (ACADEMIA_CATEGORIAS.estabelecimento).
const AjudaContextual = ({ categoria, perfil = 'estabelecimento', className = '' }) => (
  <a
    href={`/academia?perfil=${perfil}&categoria=${categoria}`}
    target="_blank"
    rel="noopener noreferrer"
    title="Ver tutoriais desta tela"
    aria-label="Ver tutoriais desta tela"
    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[#71717A] dark:text-[#A1A1AA] hover:text-[#FF441F] hover:bg-[#FF441F]/10 transition-colors flex-shrink-0 ${className}`}
  >
    <Icon name="CircleHelp" size={16} />
  </a>
);

export default AjudaContextual;
