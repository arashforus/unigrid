import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

export const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: "UniTurkey",
  site_tagline: "Your Gateway to Turkish Universities",
  contact_email: "info@uniturkey.com",
  contact_phone: "",
  whatsapp_number: "",
  featured_university_slug: "",
  maintenance_mode: "false",
  openai_model: "gpt-4.1-mini",
};

// GET /admin/settings
router.get("/settings", async (req, res) => {
  try {
    const rows = await db.select().from(settingsTable);
    const map: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of rows) map[row.key] = row.value;
    res.json(map);
  } catch (err) {
    req.log.error({ err }, "Failed to load settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/settings
router.put("/settings", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const entries = Object.entries(body).filter(([k]) => k in DEFAULT_SETTINGS);

  if (entries.length === 0) {
    res.status(400).json({ error: "No valid settings provided" });
    return;
  }

  try {
    for (const [key, value] of entries) {
      await db
        .insert(settingsTable)
        .values({ key, value: String(value ?? ""), updated_at: new Date() })
        .onConflictDoUpdate({
          target: settingsTable.key,
          set: { value: String(value ?? ""), updated_at: new Date() },
        });
    }
    const rows = await db.select().from(settingsTable);
    const map: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of rows) map[row.key] = row.value;
    res.json(map);
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
