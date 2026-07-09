import { Router } from "express";
import { db } from "@workspace/db";
import {
  universitiesTable,
  facultiesTable,
  programsTable,
} from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router = Router();

// GET /stats/overview
router.get("/stats/overview", async (req, res) => {
  try {
    const [totalUnis] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(universitiesTable);

    const [stateUnis] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(universitiesTable)
      .where(eq(universitiesTable.type, "state"));

    const [privateUnis] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(universitiesTable)
      .where(eq(universitiesTable.type, "private"));

    const [foundationUnis] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(universitiesTable)
      .where(eq(universitiesTable.type, "foundation"));

    const [totalPrograms] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(programsTable);

    const [totalFaculties] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(facultiesTable);

    const citiesResult = await db
      .select({ city: universitiesTable.city_en })
      .from(universitiesTable)
      .groupBy(universitiesTable.city_en);

    res.json({
      total_universities: totalUnis?.count ?? 0,
      state_universities: stateUnis?.count ?? 0,
      private_universities: privateUnis?.count ?? 0,
      foundation_universities: foundationUnis?.count ?? 0,
      total_programs: totalPrograms?.count ?? 0,
      total_cities: citiesResult.length,
      total_faculties: totalFaculties?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats overview");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /stats/cities
router.get("/stats/cities", async (req, res) => {
  try {
    const cities = await db
      .select({
        city: universitiesTable.city_en,
        university_count: sql<number>`count(distinct ${universitiesTable.id})::int`,
      })
      .from(universitiesTable)
      .groupBy(universitiesTable.city_en)
      .orderBy(sql`count(distinct ${universitiesTable.id}) desc`);

    const programCountsByCity = await db
      .select({
        city: universitiesTable.city_en,
        program_count: sql<number>`count(${programsTable.id})::int`,
      })
      .from(universitiesTable)
      .leftJoin(facultiesTable, eq(facultiesTable.university_id, universitiesTable.id))
      .leftJoin(programsTable, eq(programsTable.faculty_id, facultiesTable.id))
      .groupBy(universitiesTable.city_en);

    const programMap = new Map(
      programCountsByCity.map((r) => [r.city, r.program_count]),
    );

    res.json(
      cities.map((c) => ({
        city: c.city,
        university_count: c.university_count,
        program_count: programMap.get(c.city) ?? 0,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get city stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /stats/programs-by-degree
router.get("/stats/programs-by-degree", async (req, res) => {
  try {
    const result = await db
      .select({
        degree_type: programsTable.degree_type,
        program_count: sql<number>`count(*)::int`,
      })
      .from(programsTable)
      .groupBy(programsTable.degree_type)
      .orderBy(sql`count(*) desc`);

    res.json(
      result.map((r) => ({
        degree_type: r.degree_type,
        program_count: r.program_count,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get degree stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
