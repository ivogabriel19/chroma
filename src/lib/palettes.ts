import { supabase, supabasePublic } from './supabase';

export interface Color {
  id: string;
  palette_id: string;
  hex: string;
  name: string | null;
  position: number;
}

export interface Palette {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  tags: string[];
  colors?: Color[];
}

// ── Queries ──────────────────────────────────────────────

export async function getUserPalettes(userId: string): Promise<Palette[]> {
  const { data, error } = await supabase
    .from('palettes')
    .select('*, colors(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPaletteById(id: string): Promise<Palette | null> {
  const { data, error } = await supabase
    .from('palettes')
    .select('*, colors(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ── Mutations ─────────────────────────────────────────────

export async function createPalette(
  userId: string,
  name: string,
  colors: { hex: string; name: string | null; position: number }[],
  tags: string[] = []
): Promise<Palette> {
  // 1. Crear la paleta
  const { data: palette, error: paletteError } = await supabase
    .from('palettes')
    .insert({ user_id: userId, name, tags })
    .select()
    .single();

  if (paletteError || !palette) throw paletteError;

  // 2. Insertar los colores asociados
  if (colors.length > 0) {
    const { error: colorsError } = await supabase
      .from('colors')
      .insert(colors.map(c => ({ ...c, palette_id: palette.id })));

    if (colorsError) throw colorsError;
  }

  return palette;
}

export async function deletePalette(id: string): Promise<void> {
  const { error } = await supabase
    .from('palettes')
    .delete()
    .eq('id', id);

  if (error) throw error;
  // Los colores se eliminan en cascada (ON DELETE CASCADE del schema)
}

// Usa supabasePublic para no depender de una sesión de usuario (requiere política RLS "public read")
export async function getAllPalettes(): Promise<Palette[]> {
  const { data, error } = await supabasePublic
    .from('palettes')
    .select('*, colors(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updatePaletteTags(
  paletteId: string,
  tags: string[]
): Promise<void> {
  const { error } = await supabase
    .from('palettes')
    .update({ tags })
    .eq('id', paletteId);

  if (error) throw error;
}

export async function updateColor(
  colorId: string,
  hex: string,
  name: string | null
): Promise<void> {
  const { error } = await supabase
    .from('colors')
    .update({ hex, name })
    .eq('id', colorId);

  if (error) throw error;
}