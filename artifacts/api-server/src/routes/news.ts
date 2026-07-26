import { Router } from "express";
import { db } from "@workspace/db";
import { newsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

type Lang = "en" | "tr" | "fa" | "ar";

function localizeNews(row: typeof newsTable.$inferSelect, lang: Lang, full = false) {
  return {
    id: row.id,
    slug: row.slug,
    title: row[`title_${lang}` as const] ?? row.title_en,
    summary: row[`summary_${lang}` as const] ?? row.summary_en ?? null,
    ...(full ? { content: row[`content_${lang}` as const] ?? row.content_en ?? null } : {}),
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

// GET /news/detail?slug=xxx — single published article with full content
router.get("/news/detail", async (req, res) => {
  const slug = req.query.slug as string;
  if (!slug) {
    res.status(400).json({ error: "slug is required" });
    return;
  }

  const lang = (["en", "tr", "fa", "ar"].includes(req.query.lang as string)
    ? req.query.lang
    : "en") as Lang;

  try {
    const [row] = await db
      .select()
      .from(newsTable)
      .where(eq(newsTable.slug, slug))
      .limit(1);

    if (!row || !row.is_published) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    res.json(localizeNews(row, lang, true));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch news article");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
