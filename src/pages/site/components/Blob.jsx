import React from 'react';

const TONES = {
  brand: 'linear-gradient(135deg, #FF441F, #FF7A00)',
  gold: 'linear-gradient(135deg, #FFC24B, #FF7A00)',
  ink: 'linear-gradient(135deg, #2A241C, #14110D)',
};

// Mancha de gradiente desfocada, só decorativa (ver .site-blob no site.css) —
// sempre atrás do conteúdo (z-index baixo é responsabilidade de quem posiciona).
const Blob = ({ size = 420, tone = 'brand', opacity = 0.35, className = '', style = {} }) => (
  <div
    className={`site-blob ${className}`}
    style={{
      width: size,
      height: size,
      background: TONES[tone] ?? TONES.brand,
      opacity,
      ...style,
    }}
  />
);

export default Blob;
