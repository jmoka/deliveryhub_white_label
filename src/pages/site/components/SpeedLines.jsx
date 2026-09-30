import React from 'react';

// Risquinhos de velocidade — motivo recorrente do mascote/ícone real da marca
// (ver public/assets/images), recriado em CSS puro (ver .site-speedlines no
// site.css) pra reforçar "rápido" em qualquer seção sem precisar de imagem.
const SpeedLines = ({ animate = true, className = '' }) => (
  <div className={`site-speedlines ${animate ? 'site-speedlines-anim' : ''} ${className}`}>
    <span />
    <span />
    <span />
  </div>
);

export default SpeedLines;
