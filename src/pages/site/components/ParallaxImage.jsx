import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Fundo com paralaxe real — a arte do mascote (ver public/assets/images),
// ampliada e bem translúcida, rolando mais devagar que o conteúdo. Escopado
// no próprio container (useScroll com target), não fixo na página inteira:
// mais seguro em mobile (position:fixed some com a barra de endereço some/
// aparece) e nunca compete com leitura nas seções creme — só entra nas
// seções escuras, que já têm contraste de sobra pra imagem ficar sutil.
const ParallaxImage = ({ src = '/assets/images/ico_pediuvai.png', range = 70, opacity = 0.07, className = '' }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.img
        src={src}
        alt=""
        style={{ y, opacity }}
        className="absolute left-1/2 top-1/2 w-[130%] max-w-none -translate-x-1/2 -translate-y-1/2 blur-[2px] select-none"
      />
    </div>
  );
};

export default ParallaxImage;
