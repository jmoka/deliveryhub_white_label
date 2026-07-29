import React from 'react';
import Icon from '../../components/AppIcon';

const COLORS = {
  orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400',
  green:  'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  blue:   'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  red:    'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400',
  gray:   'border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5]',
};

const KpiCard = ({ icon, label, value, sub, color = 'gray', onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-xl border p-4 ${COLORS[color]} ${onClick ? 'cursor-pointer hover:brightness-95 transition-[filter]' : ''}`}
  >
    <div className="flex items-center gap-1.5 mb-1">
      <Icon name={icon} size={14} className="opacity-70" />
      <p className="text-xs font-medium opacity-75">{label}</p>
    </div>
    <p className="text-2xl font-black">{value}</p>
    {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
  </div>
);

export default KpiCard;
