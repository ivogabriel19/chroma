import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return new Response('Email y contraseña requeridos', { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return new Response(error?.message ?? 'Error al iniciar sesión', { status: 401 });
  }

  // Guardamos los tokens en cookies seguras
  const { access_token, refresh_token } = data.session;

  cookies.set('sb-access-token', access_token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hora
  });

  cookies.set('sb-refresh-token', refresh_token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  return redirect('/dashboard');
};