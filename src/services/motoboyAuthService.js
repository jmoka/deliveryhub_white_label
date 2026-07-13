import { apiPath } from '../lib/apiUrl';
import { supabase } from '../lib/supabase';

const API = apiPath('/api/motoboy/auth');
const TOKEN_KEY = 'motoboy_access_token';

export const getMotoboyToken = () => localStorage.getItem(TOKEN_KEY);
export const setMotoboyToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearMotoboyToken = () => localStorage.removeItem(TOKEN_KEY);

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

// Se o usuário já estiver logado como cliente, manda o token da sessão junto —
// o backend usa isso pra vincular a conta e promover o role pra 'motoboy'.
async function comTokenClienteLogado(dados) {
  const sessionResult = await supabase.auth.getSession().catch(() => ({ data: {} }));
  const supabase_access_token = sessionResult?.data?.session?.access_token;
  return supabase_access_token ? { ...dados, supabase_access_token } : dados;
}

export const cadastro = async (dados) => postJson('/cadastro', await comTokenClienteLogado(dados));

export const login = (identificador, password) => postJson('/login', { identificador, password });

// Motoboys antigos (link/token pré-login-por-senha) — completa o cadastro usando o token legado.
export const completarCadastro = async (dados) => {
  const tokenLegado = getMotoboyToken();
  if (!tokenLegado) throw new Error('Token de acesso não encontrado. Use o link recebido do restaurante.');
  return postJson('/completar-cadastro', await comTokenClienteLogado(dados), { 'x-motoboy-token': tokenLegado });
};

// Converte um File (input de upload) pra data URL base64, formato aceito pelo backend.
export const arquivoParaBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
