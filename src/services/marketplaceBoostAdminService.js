import { supabase } from '../lib/supabase';
import { apiPath } from '../lib/apiUrl';

const API = apiPath('/api');

async function apiFetch(path, options = {}) {
  const sessionResult = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const token = sessionResult?.data?.session?.access_token;

  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    if (isJson) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message ?? `HTTP ${res.status}`);
    }
    throw new Error(`HTTP ${res.status} — backend indisponível`);
  }

  if (!isJson) {
    throw new Error('Resposta inválida do servidor. Verifique se o backend está rodando na porta 3002.');
  }

  return res.json();
}

// Carrosséis vendáveis — dinâmico ('combos' + qualquer tag ativa de tags_catalogo)
export const getCarrosseisBoost = () => apiFetch('/marketplace-boost/carrosseis');

// Admin — vagas pagas por carrossel do marketplace
export const getVagasBoost = () => apiFetch('/marketplace-boost/vagas');
export const salvarVagasBoost = (data) =>
  apiFetch('/marketplace-boost/vagas', { method: 'PUT', body: JSON.stringify(data) });

// Admin — CRUD de pacotes de destaque
export const getPacotesBoostAdmin = () => apiFetch('/marketplace-boost/pacotes');
export const criarPacoteBoost = (data) =>
  apiFetch('/marketplace-boost/pacotes', { method: 'POST', body: JSON.stringify(data) });
export const atualizarPacoteBoost = (id, data) =>
  apiFetch(`/marketplace-boost/pacotes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const removerPacoteBoost = (id) =>
  apiFetch(`/marketplace-boost/pacotes/${id}`, { method: 'DELETE' });
