# Chroma

Generador y catálogo de paletas de color. Creá paletas con distintas armonías cromáticas, guardálas en tu dashboard, etiquetálas y explorálas en el catálogo público de la comunidad.

## Stack

- **[Astro 6](https://astro.build)** — SSR, desplegado en Vercel
- **[Supabase](https://supabase.com)** — autenticación (email/password) y base de datos (PostgreSQL)
- TypeScript strict, CSS vanilla (sin frameworks de componentes)

## Funcionalidades

- Generación de paletas con seis tipos de armonía cromática: análoga, complementaria, triádica, split-complementaria, tetrádica y monocromática
- Edición de colores individuales con selector y escala de variantes por luminosidad
- Nombres semánticos de colores via [TheColorAPI](https://www.thecolorapi.com)
- Dashboard personal con paletas guardadas
- Catálogo público con búsqueda por nombre y filtro por etiquetas
- Copia de paletas del catálogo al dashboard propio

## Desarrollo local

### Requisitos

- Node.js 18+
- Una cuenta y proyecto en [Supabase](https://supabase.com)

### Configuración

1. Clonar el repositorio e instalar dependencias:

```bash
git clone <repo-url>
cd chroma
npm install
```

2. Crear el archivo `.env` en la raíz:

```env
PUBLIC_SUPABASE_URL=<url-del-proyecto>
PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

3. Ejecutar las migraciones en el SQL Editor de Supabase:

```sql
-- Tabla de paletas
CREATE TABLE palettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Tabla de colores
CREATE TABLE colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  palette_id uuid REFERENCES palettes ON DELETE CASCADE NOT NULL,
  hex text NOT NULL,
  name text,
  position integer NOT NULL
);

-- Políticas RLS
ALTER TABLE palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "palettes_public_read"  ON palettes FOR SELECT USING (true);
CREATE POLICY "palettes_own_write"    ON palettes FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "colors_public_read"    ON colors   FOR SELECT USING (true);
CREATE POLICY "colors_own_write"      ON colors   FOR ALL
  USING (palette_id IN (SELECT id FROM palettes WHERE user_id = auth.uid()));

-- Vista pública de usernames
CREATE OR REPLACE VIEW public.user_profiles AS
  SELECT id, raw_user_meta_data->>'username' AS username
  FROM auth.users;

GRANT SELECT ON public.user_profiles TO anon, authenticated;
```

4. Iniciar el servidor de desarrollo:

```bash
npm run dev
# http://localhost:4321
```

### Comandos

| Comando           | Descripción                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Servidor de desarrollo en `localhost:4321` |
| `npm run build`   | Build de producción en `./dist/`         |
| `npm run preview` | Preview del build localmente             |

## Estructura del proyecto

```
src/
├── assets/          # Imágenes estáticas (logo)
├── layouts/
│   ├── BaseLayout.astro   # HTML base, CSS variables globales
│   └── AppLayout.astro    # Layout para páginas autenticadas
├── lib/
│   ├── colors.ts    # Algoritmos de armonía cromática y conversión HSL↔HEX
│   ├── palettes.ts  # Queries a Supabase (paletas y colores)
│   └── supabase.ts  # Cliente Supabase + helpers de sesión
├── pages/
│   ├── api/
│   │   ├── auth/    # login, register, logout
│   │   └── palettes/ # create, delete, copy, update-color, update-tags
│   ├── dashboard/
│   │   ├── index.astro        # Grid de paletas guardadas
│   │   ├── new.astro          # Generador interactivo
│   │   └── palette/[id].astro # Vista de paleta individual
│   ├── explore.astro  # Catálogo público
│   ├── login.astro
│   └── register.astro
└── styles/
    ├── global.css
    └── auth.css
```

## Despliegue

El proyecto está configurado para Vercel con el adaptador `@astrojs/vercel`. Basta con conectar el repositorio a un proyecto de Vercel y definir las variables de entorno `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`.
