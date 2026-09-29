import React from 'react';
import { motion } from 'framer-motion';

// Reaproveitado em toda página do /site pra entrada em scroll consistente —
// nunca reanima ao rolar de volta (once: true), senão fica "piscando" pra
// quem rola pra cima e pra baixo explorando a página.
const RevealOnScroll = ({
  children,
  delay = 0,
  y = 28,
  duration = 0.7,
  className = '',
  as: Tag = motion.div,
  once = true,
  amount = 0.25,
}) => (
  <Tag
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once, amount }}
    transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </Tag>
);

export default RevealOnScroll;
