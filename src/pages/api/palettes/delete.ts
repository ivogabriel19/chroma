import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '../../../lib/supabase';
import { deletePalette, getPaletteById } from '../../../lib/palettes';

export const DELETE: APIRoute = async ({ request, redirect }) => {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookieMap = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  const session = await getSessionFromCookies(cookieMap);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { id } = await request.json();
  if (!id) return new Response('ID requerido', { status: 400 });

  // Verificar que la paleta pertenece al usuario (doble check además de RLS)
  const palette = await getPaletteById(id);
  if (!palette || palette.user_id !== session.user.id) {
    return new Response('Not found', { status: 404 });
  }

  try {
    await deletePalette(id);
    return new Response(null, { status: 204 });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};