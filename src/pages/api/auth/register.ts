import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const username = formData.get('username')?.toString()?.trim();

  if (!email || !password || !username) {
    return new Response('Email, contraseña y nombre de usuario requeridos', { status: 400 });
  }

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return new Response('Nombre de usuario inválido', { status: 400 });
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  return redirect('/login?registered=true');
};