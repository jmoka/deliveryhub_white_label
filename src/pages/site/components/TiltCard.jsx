import React, { useRef } from 'react';

// Inclinação 3D controlada pelo mouse (--rx/--ry lidos em .site-tilt, ver site.css).
// max* limita o quanto inclina — cards grandes precisam de menos que ícones pequenos,
// senão o efeito fica exagerado/nauseante em vez de sutil.
const TiltCard = ({ children, className = '', maxTilt = 8, glare = true }) => {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (px - 0.5) * maxTilt * 2;
    const ry = (0.5 - py) * maxTilt * 2;
    el.style.setProperty('--rx', `${rx}deg`);
    el.style.setProperty('--ry', `${ry}deg`);
    if (glare) {
      el.style.setProperty('--glare-x', `${px * 100}%`);
      el.style.setProperty('--glare-y', `${py * 100}%`);
    }
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`site-tilt relative ${className}`}
    >
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.35), transparent 60%)',
          }}
        />
      )}
      <div className="site-tilt-child">{children}</div>
    </div>
  );
};

export default TiltCard;
