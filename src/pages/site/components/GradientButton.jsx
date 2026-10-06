import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const VARIANTS = {
  solid: 'text-white bg-[linear-gradient(100deg,#FF441F,#FF7A00)] shadow-[0_10px_30px_-10px_rgba(255,68,31,0.55)]',
  outline: 'text-[var(--site-ink)] bg-transparent border border-[var(--site-line)] hover:border-[var(--site-ink)]',
  ghost: 'text-[var(--site-ink)] bg-[var(--site-ink)]/[0.04] hover:bg-[var(--site-ink)]/[0.08]',
  onDark: 'text-[var(--site-ink)] bg-[var(--site-cream)] hover:bg-white',
};

// CTA compartilhado do /site — Link quando `to` é passado (navegação interna),
// senão <a> (âncora de seção) ou <button> (onClick). Glow gira só nos variants
// que pedem `glow` (reservado pro CTA principal de cada seção — usar em todo
// botão da página vira ruído visual, não destaque).
const GradientButton = ({
  children,
  to,
  href,
  target,
  onClick,
  variant = 'solid',
  icon = 'ArrowRight',
  glow = false,
  className = '',
  type = 'button',
}) => {
  const classes = `group relative inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold tracking-tight transition-all duration-300 hover:-translate-y-0.5 ${VARIANTS[variant]} ${glow ? 'site-glow-border' : ''} ${className}`;

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {icon && (
        <Icon name={icon} size={16} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </>
  );

  const motionProps = { whileTap: { scale: 0.97 } };

  if (to) {
    return (
      <motion.div {...motionProps} className="inline-block">
        <Link to={to} className={classes}>{content}</Link>
      </motion.div>
    );
  }
  if (href) {
    return (
      <motion.a
        {...motionProps}
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className={classes}
      >
        {content}
      </motion.a>
    );
  }
  return (
    <motion.button {...motionProps} type={type} onClick={onClick} className={classes}>
      {content}
    </motion.button>
  );
};

export default GradientButton;
