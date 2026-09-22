import { apiPath } from '../lib/apiUrl';

// Sem autenticação, de propósito — página que o cliente abre a partir do link
// que o admin manda (WhatsApp etc.), sem precisar logar.
export const getFaturaPublica = async (token) => {
  const res = await fetch(apiPath(`/api/fatura-pagamento/${token}`));
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
};
