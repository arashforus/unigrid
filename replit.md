# UniTurkey — Turkey University Explorer

A premium multilingual web platform for international students to discover, compare, and apply to Turkish universities. Supports English, Turkish, Persian (Farsi), and Arabic with full RTL layout for FA/AR.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/university-explorer run dev` — run the frontend (served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — auto-provided by Replit's built-in PostgreSQL (no setup needed)
- Optional env: `OPENAI_API_KEY` — needed for AI-powered university crawling in the admin panel

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Wouter routing, react-i18next
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Icons: Lucide React (with DirectionalIcon for RTL-aware arrow mirroring)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — Drizzle table schemas (universities, faculties, programs, tuition_fees)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/university-explorer/src/` — React frontend
- `artifacts/university-explorer/src/i18n/` — i18n config + locale files (en/tr/fa/ar)
- `artifacts/university-explorer/src/contexts/language.tsx` — LanguageProvider + useLanguage hook

## Architecture decisions

- **Query-param detail endpoints**: `/api/universities/detail?slug=xxx` and `/api/programs/detail?id=xxx` use query params (not path params) to avoid Orval-generated TS2308 type collision between Zod schemas in `api.ts` and TypeScript types in `types/`.
- **Client-side filtering in Explore**: The /explore page fetches all programs and filters client-side to support multi-select city/degree/language filters (API only accepts single values per param).
- **RTL via LanguageContext**: Switching to FA or AR sets `document.documentElement.dir='rtl'`; all layout uses Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`).
- **Always-dark theme**: CSS vars are set for dark mode only. No light-mode toggle.
- **Numeric fees from Drizzle**: Drizzle returns `numeric` columns as strings; frontend uses `parseFloat(String(fee))` before `.toLocaleString()`.

## Product

- **Landing page** (`/`): Hero search, live stats (total unis, state vs private breakdown, cities, programs), featured universities grid, international pathways section
- **Explore page** (`/explore`): Sidebar filters (city, degree type, instruction language), programs grid with multi-select client-side filtering
- **University detail** (`/university?slug=xxx`): Hero, tabbed layout (Programs by faculty / About description)
- **Program detail** (`/program?id=xxx`): Degree info, duration, city, YÖK Atlas code, tuition fees table (domestic & international)
- **Language switcher**: Sticky navbar dropdown toggles EN/TR/FA/AR; re-fetches all localized data

## Seeded data

5 universities: Boğaziçi (BOUN), ITU, Koç, Sabancı, Bilkent  
10 faculties, 26 programs (bachelor/master/doctorate), 26 tuition fee records (2024-2025, TRY)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After OpenAPI spec changes, always run codegen (`pnpm --filter @workspace/api-spec run codegen`) before typechecking artifacts
- After schema changes in `lib/db/`, run `pnpm run typecheck:libs` to rebuild declarations before checking artifact packages
- Path-param endpoints for `get` operations cause Orval TS2308 collisions — use query params for detail lookups instead
- Do not run `pnpm dev` at workspace root — use workflows or individual package scripts

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
