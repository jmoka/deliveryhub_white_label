import { createClient } from '@supabase/supabase-js';

// Em dev, se VITE_SUPABASE_URL apontar pro Supabase local (127.0.0.1/localhost),
// usa window.location.origin — o Vite proxeia /rest/v1, /auth/v1, /storage/v1,
// /realtime/v1 pro Supabase local, permitindo acesso via qualquer IP na rede
// (LAN, Cloudflare Tunnel) sem mudar .env.
// Se VITE_SUPABASE_URL apontar pra um Supabase remoto (Cloud ou VPS), usa a URL
// direto — não existe proxy pra endereço externo.
const isLocalSupabaseUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(
  import.meta.env.VITE_SUPABASE_URL ?? ''
);

const supabaseUrl = (import.meta.env.DEV && isLocalSupabaseUrl)
  ? window.location.origin
  : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
});
