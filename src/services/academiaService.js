import { supabase } from '../lib/supabase';
import { apiPath } from '../lib/apiUrl';

// Progresso de "já assisti" da Academia PediuVai — um endpoint por perfil
// (cada um atrás do guard já usado pelas outras rotas desse perfil), mesmo
// padrão de escopo do favoritos-menu. Só chama a API quando há sessão
// Supabase ativa; visitante anônimo usa localStorage (ver useAcademiaProgresso).
const BASE_POR_PERFIL = {
  estabelecimento: apiPath('/api/restaurante/academia/progresso'),
  motoboy: apiPath('/api/motoboy/academia/progresso'),
  cliente: apiPath('/api/perfil/academia/progresso'),
};

async function apiFetch(perfil, options = {}) {
  const { data } = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const token = data?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const res = await fetch(BASE_POR_PERFIL[perfil], {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }
  return isJson ? res.json() : {};
}

export const getAcademiaProgresso = (perfil) => apiFetch(perfil);
export const marcarAcademiaAssistido = (perfil, videoId) =>
  apiFetch(perfil, { method: 'PATCH', body: JSON.stringify({ video_id: videoId }) });

// Catálogo público (tabela academia_videos, gerenciada pelo admin) — sem
// autenticação, qualquer visitante pode navegar os tutoriais.
export const getCatalogoAcademia = async (perfil) => {
  const qs = perfil ? `?perfil=${encodeURIComponent(perfil)}` : '';
  const res = await fetch(`${apiPath('/api/academia/catalogo')}${qs}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};
