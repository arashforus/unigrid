import { Router } from "express";
import { db } from "@workspace/db";
import { inquiriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

const VALID_STATUSES = ["new", "contacted", "in_progress", "converted", "closed"];

// GET /admin/tasks
router.get("/tasks", async (req, res) => {
  try {
    const tasks = await db.select().from(inquiriesTable).orderBy(desc(inquiriesTable.created_at));
    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Failed to list tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/tasks/:id
router.patch("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status?: string };

  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid task id" });
    return;
  }
  if (!status || !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(", ")}` });
    return;
  }

  try {
    const [updated] = await db
      .update(inquiriesTable)
      .set({ status })
      .where(eq(inquiriesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
