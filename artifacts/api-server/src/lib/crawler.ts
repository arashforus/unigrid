import { db } from "@workspace/db";
import {
  crawlJobsTable,
  universitiesTable,
  facultiesTable,
  programsTable,
  tuitionFeesTable,
  type CrawlStats,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { listUniversities, listProgramsForUniversity, type YokProgram } from "./yokatlas";
import { feeAdapters } from "./feeAdapters";
import { logger } from "./logger";

// --- helpers ----------------------------------------------------------

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o",
  ş: "s", Ş: "s", ü: "u", Ü: "u",
};

function slugify(input: string): string {
  const ascii = input.replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => TR_MAP[ch] ?? ch);
  return ascii
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapDegreeType(birimTuruAdi: YokProgram["birimTuruAdi"]): "associate" | "bachelor" {
  return birimTuruAdi === "ONLISANS" ? "associate" : "bachelor";
}

function mapLanguage(ogrenimDiliAdi: string | null | undefined): string {
  const v = (ogrenimDiliAdi ?? "").toLowerCase();
  if (v.includes("ingilizce") && (v.includes("türkçe") || v.includes("turkce"))) return "Turkish/English";
  if (v.includes("ingilizce")) return "English";
  if (v.includes("türkçe") || v.includes("turkce")) return "Turkish";
  return ogrenimDiliAdi?.trim() || "Turkish";
}

async function updateJobStats(jobId: number, stats: CrawlStats) {
  await db.update(crawlJobsTable).set({ stats }).where(eq(crawlJobsTable.id, jobId));
}

// --- main entry point ---------------------------------------------------

/**
 * Runs a full crawl and writes progress into crawl_jobs as it goes so the
 * admin panel can poll it. Designed to be started fire-and-forget from the
 * route handler (see routes/admin/crawler.ts) — it never throws; failures
 * are recorded on the job row instead.
 */
export async function runCrawlJob(jobId: number): Promise<void> {
  const stats: CrawlStats = {
    universities_seen: 0,
    universities_created: 0,
    universities_updated: 0,
    faculties_created: 0,
    programs_seen: 0,
    programs_created: 0,
    programs_updated: 0,
    fees_updated: 0,
    errors: [],
  };

  await db.update(crawlJobsTable).set({ status: "running" }).where(eq(crawlJobsTable.id, jobId));

  try {
    const yokUniversities = await listUniversities();

    for (const yokUni of yokUniversities) {
      stats.universities_seen += 1;
      try {
        const programs = await listProgramsForUniversity(yokUni.universiteId);
        if (programs.length === 0) {
          stats.errors.push(`${yokUni.universiteAdi}: no programs returned, skipped`);
          await updateJobStats(jobId, stats);
          continue;
        }

        const first = programs[0]!;
        const universityId = await upsertUniversity(yokUni.universiteId, yokUni.universiteAdi, first, stats);

        const facultyCache = new Map<string, number>();

        for (const program of programs) {
          stats.programs_seen += 1;
          try {
            const facultyName = program.fymkAdi?.trim() || yokUni.universiteAdi;
            const cacheKey = `${universityId}|${facultyName}`;
            let facultyId = facultyCache.get(cacheKey);
            if (!facultyId) {
              facultyId = await upsertFaculty(universityId, facultyName, stats);
              facultyCache.set(cacheKey, facultyId);
            }
            await upsertProgram(facultyId, program, stats);
          } catch (err) {
            stats.errors.push(`Program ${program.kilavuzKodu} (${program.birimAdi}): ${(err as Error).message}`);
          }
        }

        // Fee enrichment, if we have an adapter for this university.
        const adapter = feeAdapters.find((a) =>
          yokUni.universiteAdi.toLowerCase().includes(a.matchName.toLowerCase()),
        );
        if (adapter) {
          try {
            const fee = await adapter.fetchFee();
            if (fee) {
              const touched = await applyFeeToUniversity(universityId, fee);
              stats.fees_updated += touched;
            } else {
              stats.errors.push(`Fee adapter '${adapter.id}' returned no data (page may have changed)`);
            }
          } catch (err) {
            stats.errors.push(`Fee adapter '${adapter.id}' failed: ${(err as Error).message}`);
          }
        }
      } catch (err) {
        stats.errors.push(`${yokUni.universiteAdi}: ${(err as Error).message}`);
      }

      await updateJobStats(jobId, stats);
    }

    await db
      .update(crawlJobsTable)
      .set({ status: "success", finished_at: new Date(), stats })
      .where(eq(crawlJobsTable.id, jobId));
  } catch (err) {
    logger.error({ err, jobId }, "Crawl job failed");
    await db
      .update(crawlJobsTable)
      .set({ status: "failed", finished_at: new Date(), stats, error: (err as Error).message })
      .where(eq(crawlJobsTable.id, jobId));
  }
}

// --- upsert helpers -------------------------------------------------------

async function upsertUniversity(
  yokId: number,
  yokName: string,
  sample: YokProgram,
  stats: CrawlStats,
): Promise<number> {
  const [byYokId] = await db
    .select({ id: universitiesTable.id })
    .from(universitiesTable)
    .where(eq(universitiesTable.yok_universite_id, yokId))
    .limit(1);
  if (byYokId) {
    stats.universities_updated += 1;
    return byYokId.id;
  }

  const slug = slugify(yokName);
  const [bySlug] = await db
    .select({ id: universitiesTable.id })
    .from(universitiesTable)
    .where(eq(universitiesTable.slug, slug))
    .limit(1);
  if (bySlug) {
    await db.update(universitiesTable).set({ yok_universite_id: yokId }).where(eq(universitiesTable.id, bySlug.id));
    stats.universities_updated += 1;
    return bySlug.id;
  }

  const city = sample.uniIlAdi?.trim() || "";
  const type = sample.universiteTuru === "DEVLET" ? "state" : "foundation";

  const [created] = await db
    .insert(universitiesTable)
    .values({
      name_en: yokName,
      name_tr: yokName,
      name_fa: yokName,
      name_ar: yokName,
      slug,
      type,
      city_en: city,
      city_tr: city,
      city_fa: city,
      city_ar: city,
      yok_universite_id: yokId,
    })
    .returning({ id: universitiesTable.id });

  stats.universities_created += 1;
  return created!.id;
}

async function upsertFaculty(universityId: number, name: string, stats: CrawlStats): Promise<number> {
  const [existing] = await db
    .select({ id: facultiesTable.id })
    .from(facultiesTable)
    .where(and(eq(facultiesTable.university_id, universityId), eq(facultiesTable.name_tr, name)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(facultiesTable)
    .values({
      university_id: universityId,
      name_en: name,
      name_tr: name,
      name_fa: name,
      name_ar: name,
    })
    .returning({ id: facultiesTable.id });

  stats.faculties_created += 1;
  return created!.id;
}

async function upsertProgram(facultyId: number, program: YokProgram, stats: CrawlStats): Promise<number> {
  const code = String(program.kilavuzKodu);
  const [existing] = await db
    .select({ id: programsTable.id })
    .from(programsTable)
    .where(eq(programsTable.yok_atlas_code, code))
    .limit(1);

  const structuralFields = {
    faculty_id: facultyId,
    degree_type: mapDegreeType(program.birimTuruAdi),
    language: mapLanguage(program.ogrenimDiliAdi),
    duration_years: program.ogrenimSuresi ?? (program.birimTuruAdi === "ONLISANS" ? 2 : 4),
    is_active: true,
  };

  if (existing) {
    await db.update(programsTable).set(structuralFields).where(eq(programsTable.id, existing.id));
    stats.programs_updated += 1;
    return existing.id;
  }

  const [created] = await db
    .insert(programsTable)
    .values({
      ...structuralFields,
      name_en: program.birimAdi,
      name_tr: program.birimAdi,
      name_fa: program.birimAdi,
      name_ar: program.birimAdi,
      yok_atlas_code: code,
    })
    .returning({ id: programsTable.id });

  stats.programs_created += 1;
  return created!.id;
}

async function applyFeeToUniversity(
  universityId: number,
  fee: { academic_year: string; domestic_fee: number | null; international_fee: number | null; currency: string },
): Promise<number> {
  const rows = await db
    .select({ programId: programsTable.id })
    .from(programsTable)
    .innerJoin(facultiesTable, eq(programsTable.faculty_id, facultiesTable.id))
    .where(and(eq(facultiesTable.university_id, universityId), eq(programsTable.is_active, true)));

  let touched = 0;
  for (const row of rows) {
    const [existing] = await db
      .select({ id: tuitionFeesTable.id })
      .from(tuitionFeesTable)
      .where(and(eq(tuitionFeesTable.program_id, row.programId), eq(tuitionFeesTable.academic_year, fee.academic_year)))
      .limit(1);

    const values = {
      domestic_fee: fee.domestic_fee != null ? String(fee.domestic_fee) : null,
      international_fee: fee.international_fee != null ? String(fee.international_fee) : null,
      currency: fee.currency,
    };

    if (existing) {
      await db.update(tuitionFeesTable).set(values).where(eq(tuitionFeesTable.id, existing.id));
    } else {
      await db.insert(tuitionFeesTable).values({ program_id: row.programId, academic_year: fee.academic_year, ...values });
    }
    touched += 1;
  }
  return touched;
}
