import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '../../../lib/supabase';
import { getPaletteById, updatePaletteTags } from '../../../lib/palettes';

export const PATCH: APIRoute = async ({ request }) => {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookieMap = parseCookies(cookieHeader);
  const session = await getSessionFromCookies(cookieMap);

  if (!session) return new Response('No autorizado', { status: 401 });

  const body = await request.json();
  const { paletteId, tags } = body;

  if (!paletteId || !Array.isArray(tags)) {
    return new Response('Datos inválidos', { status: 400 });
  }

  const cleanTags = tags
    .filter((t: unknown) => typeof t === 'string' && (t as string).trim())
    .map((t: string) => t.trim())
    .slice(0, 8);

  const palette = await getPaletteById(paletteId);
  if (!palette || palette.user_id !== session.user.id) {
    return new Response('No autorizado', { status: 403 });
  }

  try {
    await updatePaletteTags(paletteId, cleanTags);
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
