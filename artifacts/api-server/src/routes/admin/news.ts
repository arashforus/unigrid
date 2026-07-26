import { Router } from "express";
import { db } from "@workspace/db";
import { newsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const newsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  summary: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  cover_image_url: z.string().url().nullable().optional().or(z.literal("")),
  category: z.string().min(1).default("general"),
  author: z.string().nullable().optional(),
  is_published: z.boolean().default(false),
});

const newsUpdateSchema = newsSchema.partial();

// GET /admin/news
router.get("/news", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(newsTable)
      .orderBy(desc(newsTable.created_at));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list news");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/news/:id
router.get("/news/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [row] = await db.select().from(newsTable).where(eq(newsTable.id, id)).limit(1);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch news item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/news
router.post("/news", async (req, res) => {
  const parsed = newsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid news data", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  try {
    const [created] = await db
      .insert(newsTable)
      .values({
        ...data,
        cover_image_url: data.cover_image_url || null,
        published_at: data.is_published ? new Date() : null,
      })
      .returning();
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "A news item with this slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to create news item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/news/:id
router.put("/news/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = newsUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid news data", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  try {
    // If toggling published on, set published_at if not already set
    const [existing] = await db.select().from(newsTable).where(eq(newsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    const published_at =
      data.is_published && !existing.published_at ? new Date() :
      data.is_published === false ? null :
      existing.published_at;

    const [updated] = await db
      .update(newsTable)
      .set({
        ...data,
        cover_image_url: data.cover_image_url === "" ? null : data.cover_image_url,
        published_at,
        updated_at: new Date(),
      })
      .where(eq(newsTable.id, id))
      .returning();

    res.json(updated);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "A news item with this slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to update news item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/news/:id
router.delete("/news/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [deleted] = await db.delete(newsTable).where(eq(newsTable.id, id)).returning({ id: newsTable.id });
    if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete news item");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
