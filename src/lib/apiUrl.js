// Base do backend (server_delivery). Em dev, vazio = usa o proxy do Vite (/api -> VPS,
// com rewrite que remove o prefixo /api antes de encaminhar).
// Em produção (build), sem proxy, VITE_API_URL aponta direto pro backend — e como o
// backend não tem prefixo /api nas rotas, removemos /api do path aqui também.
export const API_URL = import.meta.env.VITE_API_URL ?? '';

export function apiPath(path) {
  return API_URL ? `${API_URL}${path.replace(/^\/api/, '')}` : path;
}
