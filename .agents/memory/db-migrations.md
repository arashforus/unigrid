---
name: DB migration system
description: How schema changes must be applied in this project — migration files, not push.
---

## Rule
Every DB schema change must have a corresponding Drizzle migration file committed to the repo. On the next deploy, `migrate()` runs it automatically at server start.

**Why:** The project switched from `drizzle-kit push` (which blows away schema state non-reproducibly) to the `migrate()` programmatic runner so that deployed environments stay in sync with the source tree.

## How to apply
1. Edit a file under `lib/db/src/schema/`
2. `pnpm --filter @workspace/db run generate` — creates a new `.sql` file in `lib/db/migrations/`
3. Commit **both** the schema change and the generated `.sql` file
4. On next deploy / server restart `ensureDatabase()` calls `migrate()` automatically

## Implementation details
- Migrations live in `lib/db/migrations/`
- `build.mjs` in `artifacts/api-server` copies `lib/db/migrations/ → dist/migrations/` after every esbuild run so the runtime can read the SQL files
- `lib/db/src/setup.ts` calls `migrate(db, { migrationsFolder })` where `migrationsFolder = path.join(__dirname, 'migrations')` (passed from `index.ts`)
- `__dirname` is injected by the esbuild banner and points to `dist/`
- `__drizzle_migrations` table is auto-created by the migrator to track applied migrations

## Bootstrapping an existing DB (push → migrate)
The initial migration `0000_worried_overlord.sql` is written with `CREATE TABLE IF NOT EXISTS` and `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` for FK constraints so it is idempotent and safe to run on a DB already set up by push.

## Adding new migrations
Never hand-write migration SQL — always use `drizzle-kit generate`. If a manual DB fix was applied (e.g. `ALTER TABLE ADD COLUMN`), the corresponding migration must still be generated and committed so future fresh deployments work correctly.
