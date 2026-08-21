import { apiPath } from '../lib/apiUrl';
import { supabase } from '../lib/supabase';

const API = apiPath('/api/motoboy/auth');

async function bearerToken() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');
  return token;
}

async function postJson(path, body, extraHeaders = {}) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
  return data;
}

// Conta já foi criada client-side via supabase.auth.signUp() — aqui só completa
// o cadastro (docs, telefone), vinculado à conta pelo Bearer token da sessão.
export const completarCadastroMotoboy = async (dados) => {
  const token = await bearerToken();
  return postJson('/completar-cadastro', dados, { Authorization: `Bearer ${token}` });
};

// Converte um File (input de upload) pra data URL base64, formato aceito pelo backend.
export const arquivoParaBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
