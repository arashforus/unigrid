/**
 * Database startup routine.
 *
 * Runs pending Drizzle migrations, seeds if empty, creates the default
 * admin user.  The caller must supply the absolute path to the migrations
 * folder because the build system copies SQL files to a location that
 * varies between development and production.
 *
 * Workflow for schema changes:
 *   1. Edit a file under lib/db/src/schema/
 *   2. pnpm --filter @workspace/db run generate   ← creates a new .sql file
 *   3. Commit both the schema change and the migration file
 *   4. On next deploy, ensureDatabase() runs the new migration automatically
 */

import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import bcrypt from "bcryptjs";
import { seed } from "./seed";
import { db } from "./index";
import { usersTable } from "./schema";
import { eq } from "drizzle-orm";

const { Pool } = pg;

async function tableExists(pool: pg.Pool, name: string): Promise<boolean> {
  const { rows } = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [name],
  );
  return rows[0]?.exists ?? false;
}

async function rowCount(pool: pg.Pool, table: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "${table}"`,
  );
  return parseInt(rows[0]?.count ?? "0", 10);
}

export async function ensureDatabase(opts: {
  migrationsFolder: string;
}): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set before calling ensureDatabase");
  }

  // ── 1. Run pending migrations ─────────────────────────────────────────
  console.log(`[db] Running migrations from: ${opts.migrationsFolder}`);
  await migrate(db, { migrationsFolder: opts.migrationsFolder });
  console.log("[db] Migrations up to date.");

  const pool = new Pool({ connectionString });

  try {
    // ── 2. Session table (not managed by Drizzle) ─────────────────────
    const hasSession = await tableExists(pool, "session");
    if (!hasSession) {
      await pool.query(`
        CREATE TABLE "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        );
        CREATE INDEX "IDX_session_expire" ON "session" ("expire");
      `);
      console.log("[db] Session table created.");
    }

    // ── 3. Seed if the database is empty ──────────────────────────────
    const count = await rowCount(pool, "universities");
    if (count === 0) {
      console.log("[db] No data found — seeding…");
      await seed();
    }

    // ── 4. Ensure default admin user ──────────────────────────────────
    await ensureAdminUser();
  } finally {
    await pool.end();
  }
}

async function ensureAdminUser(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@uniturkey.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin1234";
  const adminName = process.env.ADMIN_NAME ?? "Admin";

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, adminEmail))
    .limit(1);

  if (existing.length > 0) return;

  const password_hash = await bcrypt.hash(adminPassword, 12);
  await db.insert(usersTable).values({
    name: adminName,
    email: adminEmail,
    password_hash,
    role: "admin",
  });

  console.log("[db] Default admin user created.");
  console.log(`[db]   Email:    ${adminEmail}`);
  console.log(`[db]   Password: ${adminPassword}`);
  console.log("[db] Change these credentials after first login.");
}
