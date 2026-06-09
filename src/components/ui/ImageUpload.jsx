import React, { useState, useRef } from 'react';
import { uploadImagem } from '../../services/restauranteService';
import Icon from '../AppIcon';

const MAX_MB = 5;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/gif';

/**
 * Props:
 *  value      — URL atual da imagem
 *  onChange   — (url: string) => void
 *  folder     — subpasta no bucket ('logos' | 'banners' | 'carrossel' | 'fundos')
 *  aspect     — proporção do preview: 'square' | 'wide' | 'banner'
 *  placeholder — texto no input URL
 */
const ImageUpload = ({ value, onChange, folder = 'geral', aspect = 'wide', placeholder = 'https://...' }) => {
  const [tab, setTab] = useState('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [erro, setErro] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const previewH = aspect === 'square' ? 'h-32 w-32' : aspect === 'banner' ? 'h-32 w-full' : 'h-24 w-full';

  const upload = async (file) => {
    setErro(null);
    if (!file.type.startsWith('image/')) { setErro('Apenas imagens (JPG, PNG, WEBP)'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setErro(`Máximo ${MAX_MB}MB`); return; }

    setUploading(true);
    setProgress(20);
    try {
      setProgress(50);
      const result = await uploadImagem(file, folder);
      setProgress(100);
      onChange(result.url);
    } catch (e) {
      setErro(e.message ?? 'Erro no upload');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleFile = (e) => { const f = e.target.files?.[0]; if (f) upload(f); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); };
  const handleUrlConfirm = () => { const u = urlInput.trim(); if (u) { onChange(u); setUrlInput(''); } };

  // ── Com imagem: preview + trocar/remover ─────────────────────────
  if (value) {
    return (
      <div className="space-y-2">
        <div className={`relative rounded-xl overflow-hidden border border-[#E4E4E7] bg-[#F4F4F5] ${previewH}`}>
          <img src={value} alt="" onError={(e) => (e.target.style.display = 'none')}
            className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange('')}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors">
            <Icon name="X" size={13} />
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E4E4E7] rounded-lg text-xs font-semibold text-[#27272A] hover:bg-[#F4F4F5] disabled:opacity-50 transition-colors">
            {uploading
              ? <div className="w-3 h-3 border-2 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
              : <Icon name="Upload" size={12} />}
            Trocar arquivo
          </button>
          <button type="button" onClick={() => { setTab('url'); onChange(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E4E4E7] rounded-lg text-xs font-semibold text-[#71717A] hover:bg-[#F4F4F5] transition-colors">
            <Icon name="Link" size={12} /> Usar URL
          </button>
          <input ref={fileRef} type="file" accept={ACCEPT} onChange={handleFile} className="hidden" />
        </div>
        {uploading && (
          <div className="w-full h-1.5 bg-[#F4F4F5] rounded-full overflow-hidden">
            <div className="h-full bg-[#FF441F] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
        {erro && <p className="text-xs text-red-500">{erro}</p>}
      </div>
    );
  }

  // ── Sem imagem: tabs upload/url ───────────────────────────────────
  return (
    <div className="space-y-2">
      <div className="flex gap-1 bg-[#F4F4F5] p-1 rounded-xl w-fit">
        {[['upload', 'Upload'], ['url', 'Link URL']].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${tab === k ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A] hover:text-[#27272A]'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`cursor-pointer rounded-xl border-2 border-dashed transition-all p-6 text-center ${
              dragOver ? 'border-[#FF441F] bg-[#FFF4F1]' : 'border-[#E4E4E7] hover:border-[#FF441F]/40 hover:bg-[#FAFAFA]'
            } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#71717A]">Enviando...</p>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 bg-[#FF441F]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon name="Upload" size={18} className="text-[#FF441F]" />
                </div>
                <p className="text-sm font-semibold text-[#18181B]">Arraste ou clique para enviar</p>
                <p className="text-xs text-[#71717A] mt-0.5">JPG, PNG, WEBP · máx {MAX_MB}MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept={ACCEPT} onChange={handleFile} className="hidden" />
          {uploading && (
            <div className="w-full h-1.5 bg-[#F4F4F5] rounded-full overflow-hidden">
              <div className="h-full bg-[#FF441F] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
        </>
      )}

      {tab === 'url' && (
        <div className="flex gap-2">
          <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlConfirm())}
            placeholder={placeholder}
            className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          <button type="button" onClick={handleUrlConfirm} disabled={!urlInput.trim()}
            className="px-4 py-2 bg-[#FF441F] text-white text-xs font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-40 transition-colors whitespace-nowrap">
            Usar URL
          </button>
        </div>
      )}

      {erro && <p className="text-xs text-red-500">{erro}</p>}
    </div>
  );
};

export default ImageUpload;
