import React from 'react';
import Icon from '../../components/AppIcon';

const COLORS = {
  orange: 'border-orange-200 bg-orange-50 text-orange-700',
  green:  'border-green-200 bg-green-50 text-green-700',
  blue:   'border-blue-200 bg-blue-50 text-blue-700',
  red:    'border-red-200 bg-red-50 text-red-700',
  gray:   'border-[#E4E4E7] bg-white text-[#18181B]',
};

const KpiCard = ({ icon, label, value, sub, color = 'gray' }) => (
  <div className={`rounded-xl border p-4 ${COLORS[color]}`}>
    <div className="flex items-center gap-1.5 mb-1">
      <Icon name={icon} size={14} className="opacity-70" />
      <p className="text-xs font-medium opacity-75">{label}</p>
    </div>
    <p className="text-2xl font-black">{value}</p>
    {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
  </div>
);

export default KpiCard;
