import React from 'react';
import { Link } from 'react-router-dom';

// Wordmark tipográfico (Fraunces) em vez do mascote/ícone do app — o app-icon
// (capacete, moto, "PEDIUVAI" 3D) é ótimo como ícone de app, mas destoa total
// da direção editorial pedida pro /site ("nada de cara de SaaS, nada mecânico").
// Se um dia a marca ganhar um logotipo próprio pro institucional, troca aqui.
const SiteLogo = ({ dark = false, className = '' }) => (
  <Link to="/site" className={`site-display inline-flex items-baseline gap-0.5 text-2xl font-semibold leading-none ${className}`}>
    <span className={dark ? 'text-white' : 'text-[var(--site-ink)]'}>Pediu</span>
    <span className="site-gradient-text italic">Vai</span>
    <span className="text-[var(--site-brand)]">.</span>
  </Link>
);

export default SiteLogo;
