# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Build for production (output: ./dist/)
npm run preview   # Preview production build locally
```

No test suite is currently configured.

## Environment Variables

Required in `.env`:
```
PUBLIC_SUPABASE_URL=<supabase-project-url>
PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

## Architecture

**Chroma** is an Astro SSR app (deployed on Vercel) for generating and saving color palettes. The UI is in Spanish.

### Tech Stack
- **Astro 6** with `@astrojs/vercel` adapter (SSR mode)
- **Supabase** for auth (email/password) and database (PostgreSQL)
- **TypeScript** strict mode, no component libraries (plain CSS)

### Key Directories
- `src/pages/` — Astro file-based routes and API endpoints
- `src/lib/` — Core logic: `colors.ts` (algorithms), `palettes.ts` (DB queries), `supabase.ts` (client + auth utils)
- `src/layouts/` — `BaseLayout.astro` (HTML wrapper, CSS variables), `AppLayout.astro` (authenticated pages)
- `src/styles/` — `global.css`, `auth.css`

### Auth Flow
1. POST to `/api/auth/login` or `/api/auth/register` → Supabase returns tokens
2. Tokens stored in `httpOnly` cookies (`sb-access-token`, `sb-refresh-token`)
3. Protected pages read cookies server-side and reconstruct the Supabase session
4. Unauthenticated requests redirect to `/login`

### Color Generation (`src/lib/colors.ts`)
- Hex ↔ HSL conversion utilities
- Six harmony types: `analogous`, `complementary`, `triadic`, `split-complementary`, `tetradic`, `monochromatic`
- Algorithm: hex → HSL → apply harmony hue offsets + saturation/luminosity variations → back to hex
- Color names fetched asynchronously from TheColorAPI

### Database Schema (Supabase)
- `palettes`: `id, user_id, name, created_at`
- `colors`: `id, palette_id, hex, name, position` (cascade-deleted with palette)

### Pages & API Routes
| Path | Purpose |
|---|---|
| `/` | Redirects to login or dashboard |
| `/login`, `/register` | Auth pages |
| `/dashboard` | User's saved palettes grid |
| `/dashboard/new` | Interactive palette generator (Spacebar = new palette) |
| `/dashboard/palette/[id]` | Individual palette detail view |
| `POST /api/auth/login` | Login endpoint |
| `POST /api/auth/register` | Register endpoint |
| `POST /api/auth/logout` | Logout endpoint |
| `POST /api/palettes/create` | Save palette + colors |
| `DELETE /api/palettes/delete` | Delete palette |

### Conventions
- UI text and comments are in Spanish
- CSS design tokens (colors, fonts, spacing) are defined as CSS variables in `BaseLayout.astro`
- Client-side interactivity uses inline `<script>` blocks in `.astro` files — no separate JS framework
- Primary accent color: `#FFEE8C` (yellow)
