import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  universitiesTable,
  programsTable,
  facultiesTable,
  inquiriesTable,
} from "@workspace/db";
import { sql, desc, gte } from "drizzle-orm";

const router = Router();

// GET /admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const [
      [{ count: totalUsers }],
      [{ count: totalUniversities }],
      [{ count: totalFaculties }],
      [{ count: totalPrograms }],
      [{ count: activePrograms }],
      [{ count: scholarshipPrograms }],
      [{ count: totalInquiries }],
      [{ count: newInquiries }],
    ] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
        db.select({ count: sql<number>`count(*)::int` }).from(universitiesTable),
        db.select({ count: sql<number>`count(*)::int` }).from(facultiesTable),
        db.select({ count: sql<number>`count(*)::int` }).from(programsTable),
        db.select({ count: sql<number>`count(*)::int` }).from(programsTable).where(sql`${programsTable.is_active} = true`),
        db.select({ count: sql<number>`count(*)::int` }).from(programsTable).where(sql`${programsTable.scholarship_available} = true`),
        db.select({ count: sql<number>`count(*)::int` }).from(inquiriesTable),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(inquiriesTable)
          .where(sql`${inquiriesTable.status} = 'new'`),
      ]);

    const recentInquiries = await db
      .select()
      .from(inquiriesTable)
      .orderBy(desc(inquiriesTable.created_at))
      .limit(6);

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const inquiriesByDay = await db
      .select({
        day: sql<string>`to_char(${inquiriesTable.created_at}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(inquiriesTable)
      .where(gte(inquiriesTable.created_at, fourteenDaysAgo))
      .groupBy(sql`to_char(${inquiriesTable.created_at}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${inquiriesTable.created_at}, 'YYYY-MM-DD')`);

    res.json({
      total_users: totalUsers,
      total_universities: totalUniversities,
      total_faculties: totalFaculties,
      total_programs: totalPrograms,
      active_programs: activePrograms,
      scholarship_programs: scholarshipPrograms,
      total_inquiries: totalInquiries,
      new_inquiries: newInquiries,
      recent_inquiries: recentInquiries,
      inquiries_by_day: inquiriesByDay,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load admin dashboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
