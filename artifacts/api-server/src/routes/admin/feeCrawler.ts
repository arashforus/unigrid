import { Router } from "express";
import { db } from "@workspace/db";
import { feeCrawlJobsTable, emptyFeeCrawlStats, universitiesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { runFeeCrawlJob } from "../../lib/llmFeeCrawler";

const router = Router();

// GET /admin/fee-crawler/jobs
router.get("/fee-crawler/jobs", async (req, res) => {
  try {
    const jobs = await db
      .select()
      .from(feeCrawlJobsTable)
      .orderBy(desc(feeCrawlJobsTable.id))
      .limit(20);
    res.json(jobs);
  } catch (err) {
    req.log.error({ err }, "Failed to list fee crawl jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/fee-crawler/jobs/:id
router.get("/fee-crawler/jobs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid job id" });
    return;
  }
  try {
    const [job] = await db
      .select()
      .from(feeCrawlJobsTable)
      .where(eq(feeCrawlJobsTable.id, id))
      .limit(1);
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json(job);
  } catch (err) {
    req.log.error({ err }, "Failed to get fee crawl job");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/fee-crawler/universities — list all universities with their website_url status
router.get("/fee-crawler/universities", async (req, res) => {
  try {
    const unis = await db
      .select({
        id: universitiesTable.id,
        name_en: universitiesTable.name_en,
        slug: universitiesTable.slug,
        website_url: universitiesTable.website_url,
      })
      .from(universitiesTable)
      .orderBy(universitiesTable.name_en);
    res.json(unis);
  } catch (err) {
    req.log.error({ err }, "Failed to list universities for fee crawler");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/fee-crawler/run
// Body: { university_ids?: number[] }  — omit or [] to crawl all
router.post("/fee-crawler/run", async (req, res) => {
  try {
    // Check for running job
    const [running] = await db
      .select({ id: feeCrawlJobsTable.id })
      .from(feeCrawlJobsTable)
      .where(eq(feeCrawlJobsTable.status, "running"))
      .limit(1);
    if (running) {
      res.status(409).json({ error: "A fee crawl job is already running", job_id: running.id });
      return;
    }

    const universityIds: number[] | undefined =
      Array.isArray(req.body?.university_ids) && req.body.university_ids.length > 0
        ? req.body.university_ids.map(Number).filter(Boolean)
        : undefined;

    const [job] = await db
      .insert(feeCrawlJobsTable)
      .values({
        status: "pending",
        triggered_by: req.session.userId ?? null,
        stats: emptyFeeCrawlStats(),
      })
      .returning();

    setImmediate(() => {
      runFeeCrawlJob(job!.id, universityIds).catch((err) =>
        req.log.error({ err }, "Unhandled fee crawl job error"),
      );
    });

    res.status(202).json(job);
  } catch (err) {
    req.log.error({ err }, "Failed to start fee crawl job");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
