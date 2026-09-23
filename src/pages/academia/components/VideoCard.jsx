import React from 'react';
import Icon from '../../../components/AppIcon';

const fmtDuracao = (seg) => {
  if (!seg) return null;
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const VideoCard = ({ video, categoriaIcon, assistido, permiteProgresso = true, onClick }) => (
  <button
    onClick={onClick}
    className="text-left bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF441F] focus-visible:ring-offset-2"
  >
    <div className="relative aspect-video bg-[#F4F4F5] dark:bg-[#27272A] flex items-center justify-center">
      <Icon name={categoriaIcon || 'PlayCircle'} size={32} className="text-[#A1A1AA] dark:text-[#71717A]" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
        <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center">
          <Icon name="Play" size={20} className="text-[#FF441F] ml-0.5" />
        </div>
      </div>
      {permiteProgresso && assistido && (
        <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full">
          <Icon name="Check" size={11} /> Assistido
        </span>
      )}
      {fmtDuracao(video.duracao_seg) && (
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-semibold rounded">
          {fmtDuracao(video.duracao_seg)}
        </span>
      )}
    </div>
    <div className="p-3">
      <p className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] line-clamp-2">{video.titulo}</p>
      {video.descricao && (
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 line-clamp-2">{video.descricao}</p>
      )}
    </div>
  </button>
);

export default VideoCard;
