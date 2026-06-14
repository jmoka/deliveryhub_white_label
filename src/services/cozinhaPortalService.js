const API = '/api/cozinha-portal';
const TOKEN_KEY = 'cozinha_access_token';

export const getCozinhaToken = () => localStorage.getItem(TOKEN_KEY);
export const setCozinhaToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearCozinhaToken = () => localStorage.removeItem(TOKEN_KEY);

async function cozinhaFetch(path, options = {}) {
  const token = getCozinhaToken();
  if (!token) throw new Error('Token de cozinha não encontrado. Use o link recebido do restaurante.');

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-cozinha-token': token,
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }

  return isJson ? res.json() : {};
}

export const getCozinhaMe = () => cozinhaFetch('/me');
export const getCozinhaPedidos = () => cozinhaFetch('/pedidos');
export const atualizarStatusCozinhaPortal = (pedidoId, status) =>
  cozinhaFetch(`/pedidos/${pedidoId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
