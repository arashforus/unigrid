import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const API_KEY_SETTINGS = ["openai_api_key"] as const;
type ApiKeySetting = (typeof API_KEY_SETTINGS)[number];

function maskKey(value: string): string {
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 7) + "..." + value.slice(-4);
}

// GET /admin/api-keys
// Returns { openai_api_key: { set: boolean; preview: string | null } }
router.get("/api-keys", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(settingsTable)
      .then((all) => all.filter((r) => (API_KEY_SETTINGS as readonly string[]).includes(r.key)));

    const map: Record<string, { set: boolean; preview: string | null }> = {};
    for (const name of API_KEY_SETTINGS) {
      const row = rows.find((r) => r.key === name);
      const val = row?.value || process.env.OPENAI_API_KEY;
      map[name] = {
        set: Boolean(val),
        preview: val ? maskKey(val) : null,
      };
    }
    res.json(map);
  } catch (err) {
    req.log.error({ err }, "Failed to load API keys");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/api-keys
// Body: { openai_api_key?: string }  — omit a key to leave it unchanged; send "" to clear
router.put("/api-keys", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const entries = Object.entries(body).filter(([k]) =>
    (API_KEY_SETTINGS as readonly string[]).includes(k),
  ) as [ApiKeySetting, string][];

  if (entries.length === 0) {
    res.status(400).json({ error: "No valid API key fields provided" });
    return;
  }

  try {
    for (const [key, value] of entries) {
      const strVal = String(value ?? "").trim();
      if (strVal === "") {
        // Clear the key
        await db.delete(settingsTable).where(eq(settingsTable.key, key));
      } else {
        await db
          .insert(settingsTable)
          .values({ key, value: strVal, updated_at: new Date() })
          .onConflictDoUpdate({
            target: settingsTable.key,
            set: { value: strVal, updated_at: new Date() },
          });
      }
    }

    // Return updated state
    const rows = await db
      .select()
      .from(settingsTable)
      .then((all) => all.filter((r) => (API_KEY_SETTINGS as readonly string[]).includes(r.key)));

    const map: Record<string, { set: boolean; preview: string | null }> = {};
    for (const name of API_KEY_SETTINGS) {
      const row = rows.find((r) => r.key === name);
      const val = row?.value || process.env.OPENAI_API_KEY;
      map[name] = {
        set: Boolean(val),
        preview: val ? maskKey(val) : null,
      };
    }
    res.json(map);
  } catch (err) {
    req.log.error({ err }, "Failed to update API keys");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
