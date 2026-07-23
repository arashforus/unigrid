import { Router } from "express";
import { db } from "@workspace/db";
import { universitiesTable, facultiesTable, programsTable, tuitionFeesTable } from "@workspace/db";
import { eq, ilike, or, and, inArray } from "drizzle-orm";
import {
  ListUniversitiesQueryParams,
  GetUniversityQueryParams,
} from "@workspace/api-zod";

const router = Router();

type Lang = "en" | "tr" | "fa" | "ar";

function localizeUniversity(u: typeof universitiesTable.$inferSelect, lang: Lang) {
  return {
    id: u.id,
    slug: u.slug,
    type: u.type,
    name: u[`name_${lang}` as const] ?? u.name_en,
    city: u[`city_${lang}` as const] ?? u.city_en,
    logo_url: u.logo_url,
    website_url: u.website_url,
    apply_url_international: u.apply_url_international,
    description: u[`description_${lang}` as const] ?? u.description_en,
    established_year: u.established_year,
    latitude: u.latitude,
    longitude: u.longitude,
    rank_turkey: u.rank_turkey,
    rank_world: u.rank_world,
    students_total: u.students_total,
    students_international: u.students_international,
    campus_size_ha: u.campus_size_ha,
  };
}

function localizeFaculty(f: typeof facultiesTable.$inferSelect, lang: Lang) {
  return {
    id: f.id,
    university_id: f.university_id,
    name: f[`name_${lang}` as const] ?? f.name_en,
  };
}

function localizeProgram(p: typeof programsTable.$inferSelect, lang: Lang) {
  return {
    id: p.id,
    faculty_id: p.faculty_id,
    name: p[`name_${lang}` as const] ?? p.name_en,
    yok_atlas_code: p.yok_atlas_code,
    degree_type: p.degree_type,
    language: p.language,
    duration_years: p.duration_years,
    is_active: p.is_active,
  };
}

// GET /universities
router.get("/universities", async (req, res) => {
  const parsed = ListUniversitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { city, type, search, lang = "en" } = parsed.data;
  const l = lang as Lang;

  try {
    const conditions = [];
    if (type) conditions.push(eq(universitiesTable.type, type));
    if (city) {
      conditions.push(
        or(
          ilike(universitiesTable.city_en, `%${city}%`),
          ilike(universitiesTable.city_tr, `%${city}%`),
        )!,
      );
    }
    if (search) {
      conditions.push(
        or(
          ilike(universitiesTable.name_en, `%${search}%`),
          ilike(universitiesTable.name_tr, `%${search}%`),
          ilike(universitiesTable.name_fa, `%${search}%`),
          ilike(universitiesTable.name_ar, `%${search}%`),
        )!,
      );
    }

    const universities =
      conditions.length > 0
        ? await db
            .select()
            .from(universitiesTable)
            .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        : await db.select().from(universitiesTable);

    res.json(universities.map((u) => localizeUniversity(u, l)));
  } catch (err) {
    req.log.error({ err }, "Failed to list universities");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /universities/detail
router.get("/universities/detail", async (req, res) => {
  const parsed = GetUniversityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { slug, lang = "en" } = parsed.data;
  const l = lang as Lang;

  if (!slug) {
    res.status(400).json({ error: "slug is required" });
    return;
  }

  try {
    const [university] = await db
      .select()
      .from(universitiesTable)
      .where(eq(universitiesTable.slug, slug))
      .limit(1);

    if (!university) {
      res.status(404).json({ error: "University not found" });
      return;
    }

    const faculties = await db
      .select()
      .from(facultiesTable)
      .where(eq(facultiesTable.university_id, university.id));

    const facultyIds = faculties.map((f) => f.id);
    const programs =
      facultyIds.length > 0
        ? await db
            .select()
            .from(programsTable)
            .where(inArray(programsTable.faculty_id, facultyIds))
        : [];

    const facultiesWithPrograms = faculties.map((f) => ({
      ...localizeFaculty(f, l),
      programs: programs
        .filter((p) => p.faculty_id === f.id)
        .map((p) => localizeProgram(p, l)),
    }));

    res.json({
      ...localizeUniversity(university, l),
      faculties: facultiesWithPrograms,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get university");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
