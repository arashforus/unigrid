import { Router } from "express";
import { db } from "@workspace/db";
import { crawlJobsTable, emptyCrawlStats } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { runCrawlJob } from "../../lib/crawler";

const router = Router();

// GET /admin/crawler/jobs — history, most recent first
router.get("/crawler/jobs", async (req, res) => {
  try {
    const jobs = await db.select().from(crawlJobsTable).orderBy(desc(crawlJobsTable.id)).limit(20);
    res.json(jobs);
  } catch (err) {
    req.log.error({ err }, "Failed to list crawl jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/crawler/jobs/:id — single job, for polling
router.get("/crawler/jobs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid job id" });
    return;
  }
  try {
    const [job] = await db.select().from(crawlJobsTable).where(eq(crawlJobsTable.id, id)).limit(1);
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json(job);
  } catch (err) {
    req.log.error({ err }, "Failed to get crawl job");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/crawler/run — starts a crawl in the background, returns immediately
router.post("/crawler/run", async (req, res) => {
  try {
    const [running] = await db
      .select({ id: crawlJobsTable.id })
      .from(crawlJobsTable)
      .where(eq(crawlJobsTable.status, "running"))
      .limit(1);
    if (running) {
      res.status(409).json({ error: "A crawl job is already running", job_id: running.id });
      return;
    }

    const [job] = await db
      .insert(crawlJobsTable)
      .values({
        source: "yokatlas",
        status: "pending",
        triggered_by: req.session.userId ?? null,
        stats: emptyCrawlStats(),
      })
      .returning();

    // Fire-and-forget: route responds immediately, admin panel polls for progress.
    setImmediate(() => {
      runCrawlJob(job!.id).catch((err) => req.log.error({ err }, "Unhandled crawl job error"));
    });

    res.status(202).json(job);
  } catch (err) {
    req.log.error({ err }, "Failed to start crawl job");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
