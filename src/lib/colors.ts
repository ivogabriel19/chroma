// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface HSL {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

export interface GeneratedColor {
  hex: string;
  hsl: HSL;
  name: string | null; // se completa con TheColorAPI
}

export type HarmonyType =
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'monochromatic';

// ─────────────────────────────────────────────
// Conversiones
// ─────────────────────────────────────────────

export function hexToHsl(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case r: h = ((g - b) / delta + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / delta + 2) / 6; break;
      case b: h = ((r - g) / delta + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex({ h, s, l }: HSL): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);

  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

// Normaliza hue al rango 0–360
function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

// ─────────────────────────────────────────────
// Generación de color base aleatorio
// ─────────────────────────────────────────────

export function randomBaseColor(): HSL {
  return {
    h: Math.floor(Math.random() * 360),
    s: 55 + Math.floor(Math.random() * 30), // 55–85: saturados pero no eléctricos
    l: 40 + Math.floor(Math.random() * 20), // 40–60: ni muy oscuro ni muy claro
  };
}

// ─────────────────────────────────────────────
// Harmonías de color
// ─────────────────────────────────────────────

/**
 * Análogo: colores adyacentes en el círculo cromático.
 * Sensación: serena, cohesiva, natural.
 * Separación de ±30°
 */
function analogous(base: HSL, count: number): HSL[] {
  const step = 30;
  const half = Math.floor(count / 2);
  return Array.from({ length: count }, (_, i) => ({
    ...base,
    h: wrapHue(base.h + (i - half) * step),
  }));
}

/**
 * Complementario: color opuesto (180°) más variaciones de luminosidad.
 * Sensación: contraste fuerte, vibrante.
 */
function complementary(base: HSL, count: number): HSL[] {
  const comp: HSL = { ...base, h: wrapHue(base.h + 180) };
  const results: HSL[] = [base, comp];

  // Rellenar con variantes de luminosidad del base y del complemento
  const extras = [
    { ...base, l: clamp(base.l - 20, 20, 80) },
    { ...comp, l: clamp(comp.l - 20, 20, 80) },
    { ...base, l: clamp(base.l + 20, 20, 80) },
  ];

  return [...results, ...extras].slice(0, count);
}

/**
 * Triádico: tres colores equidistantes (120° entre sí).
 * Sensación: equilibrado y variado.
 */
function triadic(base: HSL, count: number): HSL[] {
  const roots = [
    base,
    { ...base, h: wrapHue(base.h + 120) },
    { ...base, h: wrapHue(base.h + 240) },
  ];

  if (count <= 3) return roots.slice(0, count);

  // Extras: variantes de luminosidad de los 3 nodos
  const extras = roots.map(c => ({ ...c, l: clamp(c.l + 18, 20, 85) }));
  return [...roots, ...extras].slice(0, count);
}

/**
 * Split-complementario: base + dos colores adyacentes al complemento.
 * Sensación: contraste alto pero más suave que el complementario puro.
 */
function splitComplementary(base: HSL, count: number): HSL[] {
  const roots = [
    base,
    { ...base, h: wrapHue(base.h + 150) },
    { ...base, h: wrapHue(base.h + 210) },
  ];

  if (count <= 3) return roots.slice(0, count);

  const extras = [
    { ...roots[1], l: clamp(roots[1].l + 18, 20, 85) },
    { ...roots[2], l: clamp(roots[2].l + 18, 20, 85) },
  ];

  return [...roots, ...extras].slice(0, count);
}

/**
 * Tetrádico (cuadrado): cuatro colores a 90° entre sí.
 * Sensación: rico, diverso, complejo.
 */
function tetradic(base: HSL, count: number): HSL[] {
  const roots = [
    base,
    { ...base, h: wrapHue(base.h + 90) },
    { ...base, h: wrapHue(base.h + 180) },
    { ...base, h: wrapHue(base.h + 270) },
  ];

  if (count <= 4) return roots.slice(0, count);

  const extras = roots.map(c => ({ ...c, l: clamp(c.l - 15, 20, 85) }));
  return [...roots, ...extras].slice(0, count);
}

/**
 * Monocromático: mismo hue, distintas saturaciones y luminosidades.
 * Sensación: elegante, minimalista, sofisticado.
 */
function monochromatic(base: HSL, count: number): HSL[] {
  const step = Math.floor(60 / (count - 1));
  return Array.from({ length: count }, (_, i) => ({
    h: base.h,
    s: clamp(base.s - 10 + i * 5, 10, 100),
    l: clamp(20 + i * step, 15, 85),
  }));
}

// ─────────────────────────────────────────────
// Función principal
// ─────────────────────────────────────────────

/**
 * Genera una paleta de `count` colores según la harmonía elegida.
 * Si no se pasa `baseHex`, genera un color base aleatorio.
 */
export function generatePalette(
  harmony: HarmonyType,
  count: number = 5,
  baseHex?: string
): GeneratedColor[] {
  const base: HSL = baseHex ? hexToHsl(baseHex) : randomBaseColor();

  let hslColors: HSL[];

  switch (harmony) {
    case 'analogous':           hslColors = analogous(base, count); break;
    case 'complementary':       hslColors = complementary(base, count); break;
    case 'triadic':             hslColors = triadic(base, count); break;
    case 'split-complementary': hslColors = splitComplementary(base, count); break;
    case 'tetradic':            hslColors = tetradic(base, count); break;
    case 'monochromatic':       hslColors = monochromatic(base, count); break;
    default:                    hslColors = analogous(base, count);
  }

  return hslColors.map(hsl => ({
    hex: hslToHex(hsl),
    hsl,
    name: null, // se rellena llamando a TheColorAPI
  }));
}

// ─────────────────────────────────────────────
// TheColorAPI — obtener nombre de un color
// ─────────────────────────────────────────────

export async function getColorName(hex: string): Promise<string> {
  const clean = hex.replace('#', '');

  try {
    const res = await fetch(`https://www.thecolorapi.com/id?hex=${clean}&format=json`);
    if (!res.ok) return hex;
    const data = await res.json();
    return data?.name?.value ?? hex;
  } catch {
    return hex; // fallback: usar el hex como nombre
  }
}

/**
 * Enriquece un array de colores generados con sus nombres reales.
 * Hace las llamadas en paralelo para no ser lento.
 */
export async function enrichWithNames(
  colors: GeneratedColor[]
): Promise<GeneratedColor[]> {
  const names = await Promise.all(colors.map(c => getColorName(c.hex)));
  return colors.map((c, i) => ({ ...c, name: names[i] }));
}

// ─────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}