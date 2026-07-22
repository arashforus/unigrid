import { Router } from "express";
import { db } from "@workspace/db";
import {
  programsTable,
  facultiesTable,
  universitiesTable,
  tuitionFeesTable,
} from "@workspace/db";
import { eq, ilike, or, and, inArray, sql } from "drizzle-orm";
import {
  ListProgramsQueryParams,
  GetProgramQueryParams,
  ListTuitionFeesQueryParams,
} from "@workspace/api-zod";

const router = Router();

type Lang = "en" | "tr" | "fa" | "ar";

function localizeProgram(
  p: typeof programsTable.$inferSelect,
  lang: Lang,
  extras?: {
    university_name?: string | null;
    university_slug?: string | null;
    university_logo?: string | null;
    faculty_name?: string | null;
    city?: string | null;
    tuition_fees?: Array<{
      id: number;
      program_id: number;
      academic_year: string;
      domestic_fee: string | null;
      international_fee: string | null;
      currency: string;
    }>;
  },
) {
  return {
    id: p.id,
    faculty_id: p.faculty_id,
    name: p[`name_${lang}` as const] ?? p.name_en,
    yok_atlas_code: p.yok_atlas_code,
    degree_type: p.degree_type,
    language: p.language,
    duration_years: p.duration_years,
    is_active: p.is_active,
    university_name: extras?.university_name ?? null,
    university_slug: extras?.university_slug ?? null,
    university_logo: extras?.university_logo ?? null,
    faculty_name: extras?.faculty_name ?? null,
    city: extras?.city ?? null,
    tuition_fees: extras?.tuition_fees ?? [],
  };
}

// GET /programs — paginated
router.get("/programs", async (req, res) => {
  const parsed = ListProgramsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const {
    faculty_id,
    university_id,
    degree_type,
    language,
    city,
    min_fee,
    max_fee,
    search,
    lang = "en",
    is_active,
    page,
    limit,
  } = parsed.data;
  const l = lang as Lang;
  const pageNum = page ?? 1;
  const pageSize = limit ?? 24;
  const offset = (pageNum - 1) * pageSize;

  try {
    const programConditions = [];

    if (faculty_id) programConditions.push(eq(programsTable.faculty_id, faculty_id));
    if (degree_type) programConditions.push(eq(programsTable.degree_type, degree_type));
    if (language) programConditions.push(ilike(programsTable.language, `%${language}%`));
    if (is_active !== undefined) programConditions.push(eq(programsTable.is_active, is_active));
    if (search) {
      programConditions.push(
        or(
          ilike(programsTable.name_en, `%${search}%`),
          ilike(programsTable.name_tr, `%${search}%`),
          ilike(programsTable.name_fa, `%${search}%`),
          ilike(programsTable.name_ar, `%${search}%`),
        )!,
      );
    }

    const whereClause =
      programConditions.length === 0
        ? undefined
        : programConditions.length === 1
          ? programConditions[0]
          : and(...programConditions);

    // Resolve faculty IDs when filtering by university_id or city
    let allowedFacultyIds: number[] | null = null;
    if (university_id || city) {
      const facultyConditions = [];
      if (university_id)
        facultyConditions.push(eq(facultiesTable.university_id, university_id));

      let faculties =
        facultyConditions.length > 0
          ? await db
              .select()
              .from(facultiesTable)
              .where(and(...facultyConditions))
          : await db.select().from(facultiesTable);

      if (city) {
        const uniIds = (
          await db
            .select({ id: universitiesTable.id })
            .from(universitiesTable)
            .where(
              or(
                ilike(universitiesTable.city_en, `%${city}%`),
                ilike(universitiesTable.city_tr, `%${city}%`),
              ),
            )
        ).map((u) => u.id);
        faculties = faculties.filter((f) => uniIds.includes(f.university_id));
      }
      allowedFacultyIds = faculties.map((f) => f.id);
    }

    // Build the final WHERE by combining conditions + faculty filter
    const buildFinalWhere = () => {
      const parts = whereClause ? [whereClause] : [];
      if (allowedFacultyIds !== null) {
        if (allowedFacultyIds.length === 0) return sql`false`;
        parts.push(inArray(programsTable.faculty_id, allowedFacultyIds));
      }
      if (parts.length === 0) return undefined;
      if (parts.length === 1) return parts[0];
      return and(...parts);
    };

    const finalWhere = buildFinalWhere();

    // Count total matching programs (for pagination metadata)
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(programsTable)
      .where(finalWhere);

    const total = count ?? 0;

    if (total === 0) {
      res.json({ data: [], total: 0, page: pageNum, totalPages: 0 });
      return;
    }

    // Handle fee filtering: we need all matching programs to filter by fee,
    // but that's expensive with 21k rows. Apply fee filter post-page only when
    // min_fee / max_fee are set (small result set expected).
    let programs: typeof programsTable.$inferSelect[];

    if (min_fee !== undefined || max_fee !== undefined) {
      // Fetch all matching (no pagination yet), then filter by fee
      programs = finalWhere
        ? await db.select().from(programsTable).where(finalWhere)
        : await db.select().from(programsTable);
    } else {
      // Fast path: paginate in SQL
      const q = db.select().from(programsTable);
      const filtered = finalWhere ? q.where(finalWhere) : q;
      programs = await (filtered as any).limit(pageSize).offset(offset);
    }

    if (programs.length === 0) {
      res.json({ data: [], total, page: pageNum, totalPages: Math.ceil(total / pageSize) });
      return;
    }

    const programIds = programs.map((p) => p.id);
    const facultyIds = [...new Set(programs.map((p) => p.faculty_id))];

    const [allFaculties, allTuitionFees] = await Promise.all([
      db
        .select()
        .from(facultiesTable)
        .where(inArray(facultiesTable.id, facultyIds)),
      db
        .select()
        .from(tuitionFeesTable)
        .where(inArray(tuitionFeesTable.program_id, programIds)),
    ]);

    const universityIds = [...new Set(allFaculties.map((f) => f.university_id))];
    const allUniversities = await db
      .select()
      .from(universitiesTable)
      .where(inArray(universitiesTable.id, universityIds));

    const facultyMap = new Map(allFaculties.map((f) => [f.id, f]));
    const universityMap = new Map(allUniversities.map((u) => [u.id, u]));
    const tuitionMap = new Map<number, typeof tuitionFeesTable.$inferSelect[]>();
    for (const fee of allTuitionFees) {
      if (!tuitionMap.has(fee.program_id)) tuitionMap.set(fee.program_id, []);
      tuitionMap.get(fee.program_id)!.push(fee);
    }

    // Apply fee filter if needed
    let filteredPrograms = programs;
    if (min_fee !== undefined || max_fee !== undefined) {
      filteredPrograms = programs.filter((p) => {
        const fees = tuitionMap.get(p.id) ?? [];
        if (fees.length === 0) return false;
        const intlFee = fees[0].international_fee;
        if (!intlFee) return false;
        const fee = parseFloat(intlFee);
        if (min_fee !== undefined && fee < min_fee) return false;
        if (max_fee !== undefined && fee > max_fee) return false;
        return true;
      });
      // Apply pagination after fee filter
      const feeTotal = filteredPrograms.length;
      filteredPrograms = filteredPrograms.slice(offset, offset + pageSize);
      res.json({
        data: filteredPrograms.map((p) => localizeProgram(p, l, buildExtras(p, facultyMap, universityMap, tuitionMap, l))),
        total: feeTotal,
        page: pageNum,
        totalPages: Math.ceil(feeTotal / pageSize),
      });
      return;
    }

    res.json({
      data: filteredPrograms.map((p) => localizeProgram(p, l, buildExtras(p, facultyMap, universityMap, tuitionMap, l))),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list programs");
    res.status(500).json({ error: "Internal server error" });
  }
});

function buildExtras(
  p: typeof programsTable.$inferSelect,
  facultyMap: Map<number, typeof facultiesTable.$inferSelect>,
  universityMap: Map<number, typeof universitiesTable.$inferSelect>,
  tuitionMap: Map<number, typeof tuitionFeesTable.$inferSelect[]>,
  l: Lang,
) {
  const faculty = facultyMap.get(p.faculty_id);
  const university = faculty ? universityMap.get(faculty.university_id) : undefined;
  return {
    university_name: university ? (university[`name_${l}` as const] ?? university.name_en) : null,
    university_slug: university?.slug ?? null,
    university_logo: university?.logo_url ?? null,
    faculty_name: faculty ? (faculty[`name_${l}` as const] ?? faculty.name_en) : null,
    city: university ? (university[`city_${l}` as const] ?? university.city_en) : null,
    tuition_fees: (tuitionMap.get(p.id) ?? []).map((f) => ({
      id: f.id,
      program_id: f.program_id,
      academic_year: f.academic_year,
      domestic_fee: f.domestic_fee,
      international_fee: f.international_fee,
      domestic_currency: f.domestic_currency,
      international_currency: f.international_currency,
    })),
  };
}

// GET /programs/detail
router.get("/programs/detail", async (req, res) => {
  const parsed = GetProgramQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { id, lang = "en" } = parsed.data;
  const l = lang as Lang;

  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  try {
    const [program] = await db
      .select()
      .from(programsTable)
      .where(eq(programsTable.id, id))
      .limit(1);

    if (!program) {
      res.status(404).json({ error: "Program not found" });
      return;
    }

    const [faculty] = await db
      .select()
      .from(facultiesTable)
      .where(eq(facultiesTable.id, program.faculty_id))
      .limit(1);

    const university = faculty
      ? (
          await db
            .select()
            .from(universitiesTable)
            .where(eq(universitiesTable.id, faculty.university_id))
            .limit(1)
        )[0]
      : undefined;

    const fees = await db
      .select()
      .from(tuitionFeesTable)
      .where(eq(tuitionFeesTable.program_id, program.id));

    res.json(
      localizeProgram(program, l, {
        university_name: university
          ? (university[`name_${l}` as const] ?? university.name_en)
          : null,
        university_slug: university?.slug ?? null,
        university_logo: university?.logo_url ?? null,
        faculty_name: faculty ? (faculty[`name_${l}` as const] ?? faculty.name_en) : null,
        city: university
          ? (university[`city_${l}` as const] ?? university.city_en)
          : null,
        tuition_fees: fees.map((f) => ({
          id: f.id,
          program_id: f.program_id,
          academic_year: f.academic_year,
          domestic_fee: f.domestic_fee,
          international_fee: f.international_fee,
          domestic_currency: f.domestic_currency,
          international_currency: f.international_currency,
        })),
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get program");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tuition-fees
router.get("/tuition-fees", async (req, res) => {
  const parsed = ListTuitionFeesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { program_id } = parsed.data;

  try {
    const fees = program_id
      ? await db
          .select()
          .from(tuitionFeesTable)
          .where(eq(tuitionFeesTable.program_id, program_id))
      : await db.select().from(tuitionFeesTable);

    res.json(
      fees.map((f) => ({
        id: f.id,
        program_id: f.program_id,
        academic_year: f.academic_year,
        domestic_fee: f.domestic_fee,
        international_fee: f.international_fee,
        domestic_currency: f.domestic_currency,
        international_currency: f.international_currency,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list tuition fees");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
