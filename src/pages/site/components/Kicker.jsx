import React from 'react';

// Rótulo pequeno estilo "editorial" (numeração + categoria) usado no topo de
// cada seção — substitui o eyebrow genérico de SaaS por algo com mais
// personalidade de revista/agência.
const Kicker = ({ index, label, tone = 'ink' }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className={`site-kicker text-[11px] ${tone === 'cream' ? 'text-[var(--site-cream-dim)]' : 'text-[var(--site-ink-soft)]'}`}>
      {index && <span className="text-[var(--site-brand)]">{index}</span>}
      {index && ' — '}
      {label}
    </span>
    <span className={`h-px flex-1 max-w-10 ${tone === 'cream' ? 'bg-[var(--site-line-onink)]' : 'bg-[var(--site-line)]'}`} />
  </div>
);

export default Kicker;
