import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAcademiaProgresso, marcarAcademiaAssistido } from '../services/academiaService';

const ROLE_PARA_PERFIL = {
  restaurant_owner: 'estabelecimento',
  motoboy: 'motoboy',
  customer: 'cliente',
};

const CHAVE_ANONIMO = 'academia_progresso_anonimo';

const lerAnonimo = () => {
  try { return JSON.parse(localStorage.getItem(CHAVE_ANONIMO) ?? '{}'); } catch { return {}; }
};

const gravarAnonimo = (progresso) => {
  try { localStorage.setItem(CHAVE_ANONIMO, JSON.stringify(progresso)); } catch { /* localStorage indisponível — sem persistência, sem erro visível ao usuário */ }
};

// Progresso ("já assisti") da Academia. Perfil de quem está vendo a página é
// deduzido do role da conta logada; visitante sem login usa localStorage —
// assim sempre há feedback de status (heurística 1 de Nielsen), mesmo pra
// quem ainda não se cadastrou.
export const useAcademiaProgresso = (perfilAtivo) => {
  const { user, userProfile } = useAuth();
  const [progresso, setProgresso] = useState({});

  const perfilDaConta = userProfile?.role ? ROLE_PARA_PERFIL[userProfile.role] : null;
  const autenticadoNessePerfil = Boolean(user?.id) && perfilDaConta === perfilAtivo;

  useEffect(() => {
    if (!autenticadoNessePerfil) { setProgresso(lerAnonimo()); return; }
    getAcademiaProgresso(perfilAtivo)
      .then((r) => setProgresso(r?.assistidos ?? {}))
      .catch(() => setProgresso({}));
  }, [autenticadoNessePerfil, perfilAtivo]);

  const marcarAssistido = useCallback((videoId) => {
    setProgresso((prev) => {
      const next = { ...prev, [videoId]: new Date().toISOString() };
      if (autenticadoNessePerfil) {
        marcarAcademiaAssistido(perfilAtivo, videoId).catch(() => {});
      } else {
        gravarAnonimo(next);
      }
      return next;
    });
  }, [autenticadoNessePerfil, perfilAtivo]);

  const jaAssistiu = useCallback((videoId) => Boolean(progresso[videoId]), [progresso]);

  return { jaAssistiu, marcarAssistido };
};
