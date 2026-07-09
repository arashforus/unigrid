import { Router } from "express";
import { db } from "@workspace/db";
import { facultiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListFacultiesQueryParams } from "@workspace/api-zod";

const router = Router();

type Lang = "en" | "tr" | "fa" | "ar";

// GET /faculties
router.get("/faculties", async (req, res) => {
  const parsed = ListFacultiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { university_id, lang = "en" } = parsed.data;
  const l = lang as Lang;

  try {
    const faculties = university_id
      ? await db
          .select()
          .from(facultiesTable)
          .where(eq(facultiesTable.university_id, university_id))
      : await db.select().from(facultiesTable);

    res.json(
      faculties.map((f) => ({
        id: f.id,
        university_id: f.university_id,
        name: f[`name_${l}` as const] ?? f.name_en,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list faculties");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
