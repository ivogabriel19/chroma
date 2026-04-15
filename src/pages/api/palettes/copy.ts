import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '../../../lib/supabase';
import { getPaletteById, createPalette } from '../../../lib/palettes';

export const POST: APIRoute = async ({ request }) => {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookieMap = parseCookies(cookieHeader);
  const session = await getSessionFromCookies(cookieMap);

  if (!session) return new Response('No autorizado', { status: 401 });

  const body = await request.json();
  const { paletteId } = body;

  if (!paletteId) return new Response('Datos inválidos', { status: 400 });

  const original = await getPaletteById(paletteId);
  if (!original) return new Response('Paleta no encontrada', { status: 404 });

  const colors = (original.colors ?? [])
    .sort((a, b) => a.position - b.position)
    .map(c => ({ hex: c.hex, name: c.name, position: c.position }));

  try {
    const newPalette = await createPalette(session.user.id, original.name, colors);
    return new Response(JSON.stringify(newPalette), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
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
