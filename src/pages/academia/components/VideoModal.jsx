import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

// Modal do player — fecha em Esc ou clique fora (controle e liberdade,
// heurística 3 de Nielsen). Marca "assistido" automaticamente ao terminar o
// vídeo e também oferece um botão manual, já que onEnded nem sempre dispara
// (usuário fecha antes do fim, autoplay bloqueado etc.). `permiteProgresso`
// é false pro perfil Garçom (sem identidade estável de servidor — ver
// pages/academia/index.jsx) — esconde a marcação, só reproduz.
const VideoModal = ({ video, assistido, permiteProgresso = true, onClose, onMarcarAssistido }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    videoRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.titulo}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white dark:bg-[#18181B] rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E4E7] dark:border-[#3F3F46]">
          <div className="min-w-0">
            <p className="font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">{video.titulo}</p>
            {video.descricao && (
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">{video.descricao}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar vídeo"
            className="p-1.5 rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] flex-shrink-0 ml-3"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <video
          ref={videoRef}
          key={video.id}
          controls
          autoPlay
          className="w-full aspect-video bg-black"
          onEnded={() => permiteProgresso && onMarcarAssistido(video.id)}
        >
          <source src={video.url_video} type="video/mp4" />
          Seu navegador não suporta reprodução de vídeo.
        </video>

        {permiteProgresso && (
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {assistido ? 'Você já assistiu este vídeo.' : 'Assista até o fim para marcar como concluído automaticamente.'}
            </p>
            {!assistido && (
              <button
                onClick={() => onMarcarAssistido(video.id)}
                className="text-xs font-semibold text-[#FF441F] hover:underline flex-shrink-0 ml-3"
              >
                Marcar como assistido
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VideoModal;
