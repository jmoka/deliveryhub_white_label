import { supabase } from '../lib/supabase';

async function apiFetch(options = {}) {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const token = session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login.');

  const res = await fetch('/api/perfil', {
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

export const getPerfil = () => apiFetch();
export const updatePerfil = (data) =>
  apiFetch({ method: 'PATCH', body: JSON.stringify(data) });
