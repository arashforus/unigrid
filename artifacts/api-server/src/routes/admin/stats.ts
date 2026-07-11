import { Router } from "express";
import { db } from "@workspace/db";
import {
  universitiesTable,
  programsTable,
  facultiesTable,
  inquiriesTable,
  usersTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// GET /admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [byDegree, byLanguage, byUniversityType, byCity, byTaskStatus, byUserRole] =
      await Promise.all([
        db
          .select({ label: programsTable.degree_type, count: sql<number>`count(*)::int` })
          .from(programsTable)
          .groupBy(programsTable.degree_type),
        db
          .select({ label: programsTable.language, count: sql<number>`count(*)::int` })
          .from(programsTable)
          .groupBy(programsTable.language),
        db
          .select({ label: universitiesTable.type, count: sql<number>`count(*)::int` })
          .from(universitiesTable)
          .groupBy(universitiesTable.type),
        db
          .select({ label: universitiesTable.city_en, count: sql<number>`count(*)::int` })
          .from(universitiesTable)
          .groupBy(universitiesTable.city_en)
          .orderBy(sql`count(*) desc`)
          .limit(8),
        db
          .select({ label: inquiriesTable.status, count: sql<number>`count(*)::int` })
          .from(inquiriesTable)
          .groupBy(inquiriesTable.status),
        db
          .select({ label: usersTable.role, count: sql<number>`count(*)::int` })
          .from(usersTable)
          .groupBy(usersTable.role),
      ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const signupsByDay = await db
      .select({
        day: sql<string>`to_char(${usersTable.created_at}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(usersTable)
      .where(sql`${usersTable.created_at} >= ${thirtyDaysAgo}`)
      .groupBy(sql`to_char(${usersTable.created_at}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${usersTable.created_at}, 'YYYY-MM-DD')`);

    res.json({
      by_degree: byDegree,
      by_language: byLanguage,
      by_university_type: byUniversityType,
      by_city: byCity,
      by_task_status: byTaskStatus,
      by_user_role: byUserRole,
      signups_by_day: signupsByDay,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
