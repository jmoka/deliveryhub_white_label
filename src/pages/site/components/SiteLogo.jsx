import React from 'react';
import { Link } from 'react-router-dom';

// Ícone real do app (ver public/assets/images) + wordmark em CSS — mantém o
// reconhecimento visual da marca sem herdar o bisel 3D/plaquinha do PNG em
// tamanho de header. Peso/inclinação do texto ecoam o wordmark real.
const SiteLogo = ({ dark = false, className = '' }) => (
  <Link to="/site" className={`inline-flex items-center gap-2 ${className}`}>
    <img src="/assets/images/icon-192.png" alt="" className="w-8 h-8 rounded-xl flex-shrink-0" />
    <span className="site-display inline-flex items-baseline gap-0.5 text-2xl leading-none">
      <span className={dark ? 'text-white' : 'text-[var(--site-ink)]'}>Pediu</span>
      <span className="site-gradient-text italic">Vai</span>
    </span>
  </Link>
);

export default SiteLogo;
