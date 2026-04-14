import type { APIRoute } from 'astro';
import { getSessionFromCookies } from '../../../lib/supabase';
import { createPalette } from '../../../lib/palettes';

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookieMap = parseCookies(cookieHeader);
  const session = await getSessionFromCookies(cookieMap);

  if (!session) return redirect('/login');

  const body = await request.json();
  const { name, colors } = body;

  if (!name || !Array.isArray(colors)) {
    return new Response('Datos inválidos', { status: 400 });
  }

  try {
    const palette = await createPalette(session.user.id, name, colors);
    return new Response(JSON.stringify(palette), {
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