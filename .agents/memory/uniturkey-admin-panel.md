---
name: UniTurkey admin panel architecture
description: How the admin section of the university-explorer artifact is structured — routing, auth gating, API client choice, and domain-table mappings.
---

The admin panel lives inside the existing `university-explorer` artifact (not a separate artifact), under `/admin/*` routes, gated client-side by `useAuth().user.role === 'admin'` via a shared `AdminLayout` wrapper (shows "sign in required" / "access denied" states for non-admins).

**Backend:** all admin endpoints are under `/api/admin/*`, protected by one `requireAdmin` middleware mounted once in `routes/admin/index.ts` (401 if not logged in, 403 if not admin) — sub-routers don't each re-check auth.

**Frontend API client:** admin pages use a plain `fetch` wrapper (`src/admin/api.ts`), not the Orval-generated public API client. This is intentional — admin endpoints are internal-only, and mixing them into the generated client risks the Orval/Zod TS2308 type-collision issue seen in this project's public API codegen.

**Domain mapping quirks** (don't rebuild these as new tables if asked to extend the admin panel):
- "Tasks" in the admin UI = the `inquiries` table (student consulting leads), with a status workflow (`new`, `contacted`, `in_progress`, `converted`, `closed`).
- "Courses" in the admin UI = the `programs` table. Admin course create/update also upserts one associated `tuition_fees` row inline (academic_year, domestic_fee, international_fee, currency) — there's no separate pricing page.
- Site-wide settings (name, tagline, contact info, featured university, maintenance mode) live in a generic `settings` key/value table with defaults defined in code and merged in on GET.

**Why:** keeps the admin surface fully separate from the public-facing typed API surface, avoids type-generation conflicts, and matches how the domain tables are actually named (so "Tasks"/"Courses" in the UI are intentional renames, not missing schema).
