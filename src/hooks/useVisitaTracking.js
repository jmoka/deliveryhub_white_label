import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiPath } from '../lib/apiUrl';

const API = apiPath('/api');
const CHAVE_SESSAO = 'visita_id';
const INTERVALO_HEARTBEAT_MS = 20_000;

// Uma visita = uma sessão de navegador (não uma por troca de rota) — por
// isso só registra uma vez por aba (sessionStorage), nunca em /admin/*
// (admin usando o próprio painel não é "visita" de analytics).
export default function useVisitaTracking() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (sessionStorage.getItem(CHAVE_SESSAO)) return;

    fetch(`${API}/visitas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path_inicial: pathname, referrer: document.referrer || undefined }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id) sessionStorage.setItem(CHAVE_SESSAO, String(data.id));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const enviarHeartbeat = () => {
      const id = sessionStorage.getItem(CHAVE_SESSAO);
      if (!id || document.visibilityState !== 'visible') return;
      navigator.sendBeacon?.(`${API}/visitas/${id}/heartbeat`, new Blob([], { type: 'application/json' }));
    };

    const intervalo = setInterval(enviarHeartbeat, INTERVALO_HEARTBEAT_MS);
    document.addEventListener('visibilitychange', enviarHeartbeat);
    window.addEventListener('pagehide', enviarHeartbeat);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', enviarHeartbeat);
      window.removeEventListener('pagehide', enviarHeartbeat);
    };
  }, []);
}
