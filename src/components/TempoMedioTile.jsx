import React from 'react';
import { formatDuracao } from '../utils/formatDuracao';

const TempoMedioTile = ({ label, segundos }) => (
  <div className="bg-white rounded-xl border border-[#E4E4E7] p-2 text-center">
    <p className="text-[10px] text-[#71717A]">{label}</p>
    <p className="text-base font-black text-[#18181B]">
      {segundos != null ? formatDuracao(segundos * 1000) : '—'}
    </p>
  </div>
);

export default TempoMedioTile;
