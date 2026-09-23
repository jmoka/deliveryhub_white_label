import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME } from '../../constants/brand';
import { ACADEMIA_PERFIS, ACADEMIA_CATEGORIAS, CATEGORIA_FALLBACK } from '../../config/academiaCatalogo';
import { useAcademiaProgresso } from '../../hooks/useAcademiaProgresso';
import { getCatalogoAcademia } from '../../services/academiaService';
import VideoCard from './components/VideoCard';
import VideoModal from './components/VideoModal';

const ROLE_PARA_PERFIL = {
  restaurant_owner: 'estabelecimento',
  motoboy: 'motoboy',
  customer: 'cliente',
};

// Garçom não tem conta Supabase individual (login é por chave da mesa/turno,
// ver garcom.guard.ts) — sem identidade estável de servidor, não há como
// persistir "já assisti" com sentido, então esse perfil só navega o catálogo.
const PERFIS_SEM_PROGRESSO = ['garcom'];

// Hub público de tutoriais em vídeo — não fica atrás de nenhum guard: também
// funciona como vitrine pra quem ainda não é cliente/motoboy/estabelecimento
// decidir se quer se cadastrar, vendo como o painel funciona na prática.
// Quando aberto com ?travado=1 (a partir do próprio painel logado de cada
// perfil), esconde as abas e trava no perfil daquela pessoa.
const Academia = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const perfilPadrao = ROLE_PARA_PERFIL[userProfile?.role] ?? 'estabelecimento';
  const travado = searchParams.get('travado') === '1';
  const perfilAtivo = searchParams.get('perfil') || perfilPadrao;
  const categoriaFoco = searchParams.get('categoria');
  const permiteProgresso = !PERFIS_SEM_PROGRESSO.includes(perfilAtivo);

  const [busca, setBusca] = useState('');
  const [videoAberto, setVideoAberto] = useState(null);
  const [categoriaExpandida, setCategoriaExpandida] = useState(categoriaFoco || null);
  const [videos, setVideos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const { jaAssistiu, marcarAssistido } = useAcademiaProgresso(perfilAtivo);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    getCatalogoAcademia(perfilAtivo)
      .then((r) => setVideos(r?.videos ?? []))
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [perfilAtivo]);

  useEffect(() => {
    if (categoriaFoco) {
      setCategoriaExpandida(categoriaFoco);
      const el = document.getElementById(`categoria-${categoriaFoco}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [categoriaFoco, perfilAtivo]);

  const trocarPerfil = (perfilId) => {
    setBusca('');
    setSearchParams({ perfil: perfilId });
  };

  const categorias = ACADEMIA_CATEGORIAS[perfilAtivo] ?? [];

  const buscaNormalizada = busca.trim().toLowerCase();
  const videosFiltrados = buscaNormalizada
    ? videos.filter((v) =>
        v.titulo.toLowerCase().includes(buscaNormalizada) ||
        v.descricao?.toLowerCase().includes(buscaNormalizada))
    : videos;

  // Vídeo cadastrado com uma categoria que não existe pra esse perfil (ex:
  // marcado em 2 perfis com taxonomias diferentes) cai no fallback "Outros"
  // em vez de simplesmente sumir.
  const categoriaDoVideo = (v) => categorias.some((c) => c.slug === v.categoria) ? v.categoria : CATEGORIA_FALLBACK.slug;
  const categoriasComFallback = useMemo(() => {
    const temOutros = videos.some((v) => categoriaDoVideo(v) === CATEGORIA_FALLBACK.slug);
    return temOutros ? [...categorias, CATEGORIA_FALLBACK] : categorias;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, perfilAtivo]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0B]">
      <header className="sticky top-0 z-30 bg-white dark:bg-[#18181B] border-b border-[#E4E4E7] dark:border-[#3F3F46]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#FF441F]/10 flex items-center justify-center flex-shrink-0">
              <Icon name="GraduationCap" size={18} className="text-[#FF441F]" />
            </div>
            <div className="min-w-0 text-left">
              <p className="font-bold text-[#18181B] dark:text-[#F4F4F5] leading-tight truncate">Academia {APP_NAME}</p>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-tight">Aprenda a usar o painel, passo a passo</p>
            </div>
          </button>
          <button onClick={() => navigate(-1)} className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            <Icon name="ArrowLeft" size={16} /> Voltar
          </button>
        </div>

        {/* Abas por perfil — escondidas em modo travado (entrada a partir do próprio painel logado) */}
        {!travado && (
          <div className="max-w-5xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto">
            {ACADEMIA_PERFIS.map((p) => (
              <button
                key={p.id}
                onClick={() => trocarPerfil(p.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  perfilAtivo === p.id
                    ? 'border-[#FF441F] text-[#FF441F]'
                    : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                }`}
              >
                <Icon name={p.icon} size={15} /> {p.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="relative mb-6">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar um tutorial..."
            aria-label="Buscar tutorial"
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FF441F] focus:border-transparent"
          />
        </div>

        {carregando ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#FF441F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : erro ? (
          <p className="text-sm text-red-600 dark:text-red-400 text-center py-10">{erro}</p>
        ) : busca ? (
          videosFiltrados.length === 0 ? (
            <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhum tutorial encontrado para "{busca}".</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videosFiltrados.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  categoriaIcon={categoriasComFallback.find((c) => c.slug === categoriaDoVideo(v))?.icon}
                  assistido={permiteProgresso && jaAssistiu(v.id)}
                  permiteProgresso={permiteProgresso}
                  onClick={() => setVideoAberto(v)}
                />
              ))}
            </div>
          )
        ) : videos.length === 0 ? (
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] text-center py-10">Nenhum tutorial publicado ainda para este painel.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {categoriasComFallback.map((cat) => {
              const videosCat = videos.filter((v) => categoriaDoVideo(v) === cat.slug);
              if (videosCat.length === 0) return null;
              const aberta = categoriaExpandida === cat.slug;
              return (
                <section key={cat.slug} id={`categoria-${cat.slug}`} className="bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#3F3F46] rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setCategoriaExpandida(aberta ? null : cat.slug)}
                    aria-expanded={aberta}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <span className="flex items-center gap-2.5 font-bold text-[#18181B] dark:text-[#F4F4F5]">
                      <Icon name={cat.icon} size={17} className="text-[#FF441F]" />
                      {cat.label}
                      <span className="text-xs font-normal text-[#A1A1AA]">({videosCat.length})</span>
                    </span>
                    <Icon name={aberta ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-[#71717A] dark:text-[#A1A1AA]" />
                  </button>
                  {aberta && (
                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videosCat.map((v) => (
                        <VideoCard
                          key={v.id}
                          video={v}
                          categoriaIcon={cat.icon}
                          assistido={permiteProgresso && jaAssistiu(v.id)}
                          permiteProgresso={permiteProgresso}
                          onClick={() => setVideoAberto(v)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {videoAberto && (
          <VideoModal
            video={videoAberto}
            assistido={permiteProgresso && jaAssistiu(videoAberto.id)}
            permiteProgresso={permiteProgresso}
            onClose={() => setVideoAberto(null)}
            onMarcarAssistido={marcarAssistido}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Academia;
