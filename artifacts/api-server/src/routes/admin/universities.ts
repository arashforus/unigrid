import { Router } from "express";
import { db } from "@workspace/db";
import { universitiesTable, facultiesTable, insertUniversitySchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// GET /admin/universities
router.get("/universities", async (req, res) => {
  try {
    const universities = await db.select().from(universitiesTable).orderBy(universitiesTable.id);
    res.json(universities);
  } catch (err) {
    req.log.error({ err }, "Failed to list universities (admin)");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/faculties
router.get("/faculties", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: facultiesTable.id,
        name_en: facultiesTable.name_en,
        university_id: facultiesTable.university_id,
        university_name: universitiesTable.name_en,
      })
      .from(facultiesTable)
      .innerJoin(universitiesTable, eq(facultiesTable.university_id, universitiesTable.id))
      .orderBy(universitiesTable.name_en, facultiesTable.name_en);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list faculties (admin)");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/universities
router.post("/universities", async (req, res) => {
  const parsed = insertUniversitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid university data", details: parsed.error.flatten() });
    return;
  }

  try {
    const [created] = await db.insert(universitiesTable).values(parsed.data).returning();
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A university with this slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to create university");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/universities/:id
router.put("/universities/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid university id" });
    return;
  }
  const parsed = insertUniversitySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid university data", details: parsed.error.flatten() });
    return;
  }

  try {
    const [updated] = await db
      .update(universitiesTable)
      .set(parsed.data)
      .where(eq(universitiesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "University not found" });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A university with this slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to update university");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/universities/:id
router.delete("/universities/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid university id" });
    return;
  }

  try {
    const [existingFaculty] = await db
      .select({ id: facultiesTable.id })
      .from(facultiesTable)
      .where(eq(facultiesTable.university_id, id))
      .limit(1);
    if (existingFaculty) {
      res.status(409).json({ error: "Remove this university's faculties and courses first" });
      return;
    }

    const [deleted] = await db.delete(universitiesTable).where(eq(universitiesTable.id, id)).returning({ id: universitiesTable.id });
    if (!deleted) {
      res.status(404).json({ error: "University not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete university");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
