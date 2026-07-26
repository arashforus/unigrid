import { Router } from "express";
import { db } from "@workspace/db";
import { aiRequestsTable } from "@workspace/db";
import { desc, count, sql } from "drizzle-orm";

const router = Router();

// GET /admin/ai-requests?page=1&limit=50&source=&status=
router.get("/ai-requests", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(aiRequestsTable)
      .orderBy(desc(aiRequestsTable.created_at))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(aiRequestsTable);

    // Summary stats
    const stats = await db
      .select({
        total_requests: count(),
        total_tokens: sql<number>`coalesce(sum(${aiRequestsTable.total_tokens}), 0)`,
        total_prompt_tokens: sql<number>`coalesce(sum(${aiRequestsTable.prompt_tokens}), 0)`,
        total_completion_tokens: sql<number>`coalesce(sum(${aiRequestsTable.completion_tokens}), 0)`,
        avg_duration_ms: sql<number>`round(avg(${aiRequestsTable.duration_ms}))`,
      })
      .from(aiRequestsTable);

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: Number(total),
        pages: Math.ceil(Number(total) / limit),
      },
      stats: stats[0],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list ai-requests");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/ai-requests/:id — single request detail
router.get("/ai-requests/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [row] = await db
      .select()
      .from(aiRequestsTable)
      .where(sql`${aiRequestsTable.id} = ${id}`)
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch ai-request");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
