import { Router } from "express";
import { db } from "@workspace/db";
import {
  programsTable,
  facultiesTable,
  universitiesTable,
  tuitionFeesTable,
  insertProgramSchema,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const tuitionFeeInput = z
  .object({
    academic_year: z.string().min(1),
    domestic_fee: z.union([z.string(), z.number()]).nullable().optional(),
    international_fee: z.union([z.string(), z.number()]).nullable().optional(),
    domestic_currency: z.string().min(1).default("TRY"),
    international_currency: z.string().min(1).default("TRY"),
  })
  .nullable()
  .optional();

const programCreateSchema = insertProgramSchema;
const programUpdateSchema = insertProgramSchema.partial();

// GET /admin/programs
router.get("/programs", async (req, res) => {
  try {
    const programs = await db.select().from(programsTable).orderBy(programsTable.id);
    const [faculties, universities, fees] = await Promise.all([
      db.select().from(facultiesTable),
      db.select().from(universitiesTable),
      db.select().from(tuitionFeesTable),
    ]);
    const facultyMap = new Map(faculties.map((f) => [f.id, f]));
    const universityMap = new Map(universities.map((u) => [u.id, u]));
    const feeMap = new Map<number, typeof fees>();
    for (const fee of fees) {
      if (!feeMap.has(fee.program_id)) feeMap.set(fee.program_id, []);
      feeMap.get(fee.program_id)!.push(fee);
    }

    res.json(
      programs.map((p) => {
        const faculty = facultyMap.get(p.faculty_id);
        const university = faculty ? universityMap.get(faculty.university_id) : undefined;
        return {
          ...p,
          faculty_name: faculty?.name_en ?? null,
          university_name: university?.name_en ?? null,
          university_id: university?.id ?? null,
          tuition_fees: feeMap.get(p.id) ?? [],
        };
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list programs (admin)");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/programs
router.post("/programs", async (req, res) => {
  const { tuition_fee: rawFee, ...rest } = req.body as Record<string, unknown>;
  const parsed = programCreateSchema.safeParse(rest);
  const parsedFee = tuitionFeeInput.safeParse(rawFee);
  if (!parsed.success || !parsedFee.success) {
    res.status(400).json({
      error: "Invalid course data",
      details: !parsed.success ? parsed.error.flatten() : parsedFee.error?.flatten(),
    });
    return;
  }
  const programData = parsed.data;
  const tuition_fee = parsedFee.data;

  try {
    const [created] = await db.insert(programsTable).values(programData).returning();

    if (tuition_fee) {
      await db.insert(tuitionFeesTable).values({
        program_id: created.id,
        academic_year: tuition_fee.academic_year,
        domestic_fee: tuition_fee.domestic_fee != null ? String(tuition_fee.domestic_fee) : null,
        international_fee: tuition_fee.international_fee != null ? String(tuition_fee.international_fee) : null,
        domestic_currency: tuition_fee.domestic_currency,
        international_currency: tuition_fee.international_currency,
        currency: tuition_fee.domestic_currency,
      });
    }

    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "23503") {
      res.status(400).json({ error: "Selected faculty does not exist" });
      return;
    }
    req.log.error({ err }, "Failed to create course");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/programs/:id
router.put("/programs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid course id" });
    return;
  }
  const { tuition_fee: rawFee, ...rest } = req.body as Record<string, unknown>;
  const parsed = programUpdateSchema.safeParse(rest);
  const parsedFee = tuitionFeeInput.safeParse(rawFee);
  if (!parsed.success || !parsedFee.success) {
    res.status(400).json({
      error: "Invalid course data",
      details: !parsed.success ? parsed.error.flatten() : parsedFee.error?.flatten(),
    });
    return;
  }
  const programData = parsed.data;
  const tuition_fee = parsedFee.data;

  try {
    const [updated] = await db
      .update(programsTable)
      .set(programData)
      .where(eq(programsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    if (tuition_fee) {
      const [existing] = await db
        .select()
        .from(tuitionFeesTable)
        .where(eq(tuitionFeesTable.program_id, id))
        .limit(1);

      const values = {
        academic_year: tuition_fee.academic_year,
        domestic_fee: tuition_fee.domestic_fee != null ? String(tuition_fee.domestic_fee) : null,
        international_fee: tuition_fee.international_fee != null ? String(tuition_fee.international_fee) : null,
        domestic_currency: tuition_fee.domestic_currency,
        international_currency: tuition_fee.international_currency,
        currency: tuition_fee.domestic_currency,
      };

      if (existing) {
        await db.update(tuitionFeesTable).set(values).where(eq(tuitionFeesTable.id, existing.id));
      } else {
        await db.insert(tuitionFeesTable).values({ program_id: id, ...values });
      }
    }

    res.json(updated);
  } catch (err: any) {
    if (err?.code === "23503") {
      res.status(400).json({ error: "Selected faculty does not exist" });
      return;
    }
    req.log.error({ err }, "Failed to update course");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/programs/:id
router.delete("/programs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid course id" });
    return;
  }

  try {
    await db.delete(tuitionFeesTable).where(eq(tuitionFeesTable.program_id, id));
    const [deleted] = await db.delete(programsTable).where(eq(programsTable.id, id)).returning({ id: programsTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete course");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
