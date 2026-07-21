import { apiPath } from '../lib/apiUrl';

export const getAcompanhamento = async (token) => {
  const res = await fetch(`${apiPath('/api/mesa-acompanhar')}/${token}`);
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
  return data;
};

export const solicitarConferencia = async (token) => {
  const res = await fetch(`${apiPath('/api/mesa-acompanhar')}/${token}/solicitar-conferencia`, { method: 'POST' });
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
  return data;
};
