/**
 * Auto-setup: pushes the Drizzle schema and seeds the database if it is empty.
 * Called once on API server startup so the app works out-of-the-box on a fresh
 * Replit environment without manual migration or seed steps.
 */

import { execSync } from "child_process";
import { resolve } from "path";
import pg from "pg";
import { seed } from "./seed";

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

export async function ensureDatabase(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set before calling ensureDatabase");
  }

  const pool = new Pool({ connectionString });

  try {
    const hasSchema = await tableExists(pool, "universities");

    if (!hasSchema) {
      console.log("[db] Schema not found — running drizzle-kit push…");
      // Workspace root is two levels above artifacts/api-server (the process cwd)
      const workspaceRoot = resolve(process.cwd(), "../..");
      execSync("pnpm --filter @workspace/db run push-force", {
        stdio: "inherit",
        cwd: workspaceRoot,
        env: { ...process.env },
      });
      console.log("[db] Schema pushed.");
    }

    const count = await rowCount(pool, "universities");
    if (count === 0) {
      console.log("[db] No data found — seeding…");
      await seed();
    }
  } finally {
    await pool.end();
  }
}
