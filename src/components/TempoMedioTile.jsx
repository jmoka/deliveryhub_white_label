import React from 'react';
import { formatDuracao } from '../utils/formatDuracao';

const TempoMedioTile = ({ label, segundos }) => (
  <div className="bg-white dark:bg-[#27272A] rounded-xl border border-[#E4E4E7] dark:border-[#3F3F46] p-2 text-center">
    <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{label}</p>
    <p className="text-base font-black text-[#18181B] dark:text-[#F4F4F5]">
      {segundos != null ? formatDuracao(segundos * 1000) : '—'}
    </p>
  </div>
);

export default TempoMedioTile;
