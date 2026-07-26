import { Router } from "express";
import { db } from "@workspace/db";
import { newsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

type Lang = "en" | "tr" | "fa" | "ar";

function localizeNews(row: typeof newsTable.$inferSelect, lang: Lang) {
  return {
    id: row.id,
    slug: row.slug,
    title: row[`title_${lang}` as const] ?? row.title_en,
    summary: row[`summary_${lang}` as const] ?? row.summary_en ?? null,
    cover_image_url: row.cover_image_url,
    category: row.category,
    author: row.author,
    is_published: row.is_published,
    published_at: row.published_at?.toISOString() ?? null,
    created_at: row.created_at.toISOString(),
  };
}

// GET /news — list published articles, localized
router.get("/news", async (req, res) => {
  const lang = (["en", "tr", "fa", "ar"].includes(req.query.lang as string)
    ? req.query.lang
    : "en") as Lang;
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  try {
    const rows = await db
      .select()
      .from(newsTable)
      .where(eq(newsTable.is_published, true))
      .orderBy(desc(newsTable.published_at))
      .limit(limit);

    res.json(rows.map((r) => localizeNews(r, lang)));
  } catch (err) {
    req.log.error({ err }, "Failed to list news");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
