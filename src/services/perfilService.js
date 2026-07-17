import { supabase } from '../lib/supabase';
import { apiPath } from '../lib/apiUrl';

async function apiFetch(options = {}) {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const token = session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login.');

  const res = await fetch(apiPath('/api/perfil'), {
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

export async function uploadFoto(file) {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const token = session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login.');

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${apiPath('/api/perfil')}/foto`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}
