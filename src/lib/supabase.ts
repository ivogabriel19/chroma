import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

// Cliente con sesión de usuario (se usa en endpoints autenticados)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente sin sesión para queries públicas (evita contaminar el singleton con sesiones de usuario)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

// Para páginas server-side: setea la sesión desde las cookies de la request
export async function getSessionFromCookies(cookies: Record<string, string>) {
  const accessToken = cookies['sb-access-token'];
  const refreshToken = cookies['sb-refresh-token'];

  if (!accessToken || !refreshToken) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) return null;
  return data.session;
}