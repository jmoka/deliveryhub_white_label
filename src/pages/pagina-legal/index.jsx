import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPaginaLegal } from '../../services/paginasLegaisService';
import { parsePaginaLegal } from '../../utils/paginaLegal';
import Icon from '../../components/AppIcon';
import { APP_NAME } from '../../constants/brand';

const fmtData = (v) =>
  v ? new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

// Renderiza Termos de Uso / Política de Privacidade — mesmo componente pras
// duas rotas (só muda o slug), conteúdo vem do backend (editável pelo admin
// em /admin/paginas-legais) e é parseado por src/utils/paginaLegal.js.
const PaginaLegal = ({ slug }) => {
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    setPagina(null);
    setErro(null);
    getPaginaLegal(slug)
      .then((d) => { if (ativo) setPagina(d); })
      .catch((e) => { if (ativo) setErro(e.message ?? 'Não foi possível carregar esta página.'); });
    return () => { ativo = false; };
  }, [slug]);

  const blocos = pagina ? parsePaginaLegal(pagina.conteudo) : [];

  return (
    <div className="min-h-screen bg-white dark:bg-[#18181B]">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border-b border-[#E4E4E7] dark:border-[#3F3F46]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }}
            className="p-2 -ml-2 hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46] rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#27272A] dark:hover:text-[#F4F4F5] transition-colors"
            aria-label="Voltar"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
            <img src="/assets/images/icon-192.png" alt={APP_NAME} className="w-full h-full object-contain" />
          </div>
          <span className="font-black text-[#18181B] dark:text-[#F4F4F5] text-sm">{APP_NAME}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {erro ? (
          <div className="text-center py-16">
            <Icon name="AlertTriangle" size={36} className="text-red-400 mx-auto mb-3" />
            <p className="text-sm text-[#27272A] dark:text-[#F4F4F5] font-semibold">{erro}</p>
          </div>
        ) : !pagina ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 w-2/3 bg-[#F4F4F5] dark:bg-[#27272A] rounded" />
            <div className="h-4 w-full bg-[#F4F4F5] dark:bg-[#27272A] rounded" />
            <div className="h-4 w-full bg-[#F4F4F5] dark:bg-[#27272A] rounded" />
            <div className="h-4 w-3/4 bg-[#F4F4F5] dark:bg-[#27272A] rounded" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-[#18181B] dark:text-[#F4F4F5] mb-1">{pagina.titulo}</h1>
            {pagina.atualizado_em && (
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-6">
                Última atualização: {fmtData(pagina.atualizado_em)}
              </p>
            )}
            <div className="space-y-4">
              {blocos.map((bloco, i) => {
                if (bloco.tipo === 'h2') {
                  return (
                    <h2 key={i} className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] mt-6 mb-1">
                      {bloco.texto}
                    </h2>
                  );
                }
                if (bloco.tipo === 'ul') {
                  return (
                    <ul key={i} className="list-disc pl-5 space-y-1 text-sm text-[#3F3F46] dark:text-[#D4D4D8] leading-relaxed">
                      {bloco.itens.map((item, j) => <li key={j}>{item}</li>)}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="text-sm text-[#3F3F46] dark:text-[#D4D4D8] leading-relaxed">
                    {bloco.texto}
                  </p>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PaginaLegal;
