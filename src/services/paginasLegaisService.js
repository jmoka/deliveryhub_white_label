import { apiPath } from '../lib/apiUrl';

// Sem autenticação, de propósito — Termos de Uso e Política de Privacidade
// precisam ser lidos por qualquer visitante, inclusive antes de criar conta.
export const getPaginaLegal = async (slug) => {
  const res = await fetch(apiPath(`/api/paginas-legais/${slug}`));
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
};
