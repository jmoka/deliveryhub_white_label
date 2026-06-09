import React from 'react';

const VARIANTS = {
  'frete-gratis': 'bg-green-500 text-white',
  promo: 'bg-[#FF441F] text-white',
  novo: 'bg-blue-500 text-white',
  'mais-vendido': 'bg-[#FF7A00] text-white',
  destaque: 'bg-yellow-400 text-yellow-900',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  neutral: 'bg-[#F4F4F5] text-[#71717A]',
};

const Badge = ({ children, variant = 'neutral', className = '' }) => (
  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${VARIANTS[variant] ?? VARIANTS.neutral} ${className}`}>
    {children}
  </span>
);

export default Badge;
