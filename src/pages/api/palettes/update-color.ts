import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '../../../lib/supabase';
import { updateColor, getPaletteById } from '../../../lib/palettes';

export const PATCH: APIRoute = async ({ request }) => {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookieMap = parseCookies(cookieHeader);
  const session = await getSessionFromCookies(cookieMap);

  if (!session) return new Response('No autorizado', { status: 401 });

  const body = await request.json();
  const { colorId, paletteId, hex, name } = body;

  if (!colorId || !paletteId || !hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return new Response('Datos inválidos', { status: 400 });
  }

  const palette = await getPaletteById(paletteId);
  if (!palette || palette.user_id !== session.user.id) {
    return new Response('No autorizado', { status: 403 });
  }

  try {
    await updateColor(colorId, hex, name ?? null);
    return new Response(null, { status: 204 });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
}
