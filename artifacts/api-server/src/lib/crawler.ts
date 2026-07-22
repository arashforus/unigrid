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
import {
  listUniversities,
  listUndergraduateProgramsForUniversity,
  listGraduateProgramsForUniversity,
  WafBlockError,
  type YokProgram,
  type YokGraduateProgram,
} from "./yokatlas";
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

type DegreeType = "associate" | "bachelor" | "master" | "doctorate";

/** Maps the undergraduate birimTuruAdi field to our degree_type enum. */
function mapUndergraduateDegree(birimTuruAdi: string): DegreeType {
  const v = birimTuruAdi.toUpperCase().trim();
  if (v === "ONLISANS" || v === "ÖNLİSANS") return "associate";
  return "bachelor"; // LISANS and any unknown undergraduate type
}

/** Maps the graduate programTuruAdi field to our degree_type enum. */
function mapGraduateDegree(programTuruAdi: string): DegreeType {
  const v = programTuruAdi.toUpperCase().trim();
  if (v.includes("DOKTORA")) return "doctorate";
  // "Tezli Yüksek Lisans", "Tezsiz Yüksek Lisans", "YUKSEK LISANS", etc.
  return "master";
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
 * Runs a full crawl (undergraduate + graduate) and writes progress into
 * crawl_jobs as it goes so the admin panel can poll it.
 *
 * Designed to be started fire-and-forget from the route handler — it never
 * throws; failures are recorded on the job row instead.
 *
 * Graduate programs: fetched from the lisansustu-kilavuz endpoint. If that
 * endpoint is WAF-blocked (common on some hosting IPs), the graduate phase
 * is skipped with a warning logged on the job; undergraduate programs are
 * still imported normally.
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

  // Track whether the graduate endpoint is reachable.
  // After the first WAF block we skip it for subsequent universities to
  // avoid flooding the logs.
  let graduateEndpointBlocked = false;

  try {
    const yokUniversities = await listUniversities();

    for (const yokUni of yokUniversities) {
      stats.universities_seen += 1;
      try {
        // ---- 1. Undergraduate programs (LISANS + ÖNLISANS) ---------------
        const undergradPrograms = await listUndergraduateProgramsForUniversity(yokUni.universiteId);

        // ---- 2. Graduate programs (YÜKSEK LİSANS + DOKTORA) --------------
        let graduatePrograms: YokGraduateProgram[] = [];
        if (!graduateEndpointBlocked) {
          try {
            graduatePrograms = await listGraduateProgramsForUniversity(yokUni.universiteId);
          } catch (err) {
            if (err instanceof WafBlockError) {
              graduateEndpointBlocked = true;
              stats.errors.push(
                "Graduate endpoint (lisansustu-kilavuz) is WAF-blocked from this server IP. " +
                "Only undergraduate (Bachelor + Associate) programs will be imported. " +
                "Run the crawler from the deployed production environment to import Master + Doctorate programs.",
              );
            } else {
              stats.errors.push(`${yokUni.universiteAdi} graduate: ${(err as Error).message}`);
            }
          }
        }

        const totalPrograms = undergradPrograms.length + graduatePrograms.length;
        if (totalPrograms === 0) {
          stats.errors.push(`${yokUni.universiteAdi}: no programs returned, skipped`);
          await updateJobStats(jobId, stats);
          continue;
        }

        // Determine city / type from whichever list has data
        const sampleUG = undergradPrograms[0];
        const sampleGR = graduatePrograms[0];
        const city =
          sampleUG?.uniIlAdi?.trim() ||
          sampleGR?.uniIlAdi?.trim() ||
          "";
        const uniTuru =
          sampleUG?.universiteTuru ||
          sampleGR?.universiteTuru ||
          "DEVLET";

        const universityId = await upsertUniversity(
          yokUni.universiteId,
          yokUni.universiteAdi,
          city,
          uniTuru,
          stats,
        );

        const facultyCache = new Map<string, number>();

        // ---- 3. Upsert undergraduate programs ----------------------------
        for (const program of undergradPrograms) {
          stats.programs_seen += 1;
          try {
            const facultyName = program.fymkAdi?.trim() || yokUni.universiteAdi;
            const cacheKey = `${universityId}|${facultyName}`;
            let facultyId = facultyCache.get(cacheKey);
            if (!facultyId) {
              facultyId = await upsertFaculty(universityId, facultyName, stats);
              facultyCache.set(cacheKey, facultyId);
            }
            await upsertProgram(
              facultyId,
              {
                code: String(program.kilavuzKodu),
                nametr: program.birimAdi,
                degreeType: mapUndergraduateDegree(program.birimTuruAdi),
                language: mapLanguage(program.ogrenimDiliAdi),
                durationYears:
                  program.ogrenimSuresi ??
                  (program.birimTuruAdi === "ONLISANS" ? 2 : 4),
              },
              stats,
            );
          } catch (err) {
            stats.errors.push(
              `UG Program ${program.kilavuzKodu} (${program.birimAdi}): ${(err as Error).message}`,
            );
          }
        }

        // ---- 4. Upsert graduate programs ---------------------------------
        for (const program of graduatePrograms) {
          stats.programs_seen += 1;
          try {
            // Use institute as the faculty grouping
            const facultyName =
              program.enstituAdi?.trim() ||
              program.anabilimDaliAdi?.trim() ||
              yokUni.universiteAdi;
            const cacheKey = `${universityId}|${facultyName}`;
            let facultyId = facultyCache.get(cacheKey);
            if (!facultyId) {
              facultyId = await upsertFaculty(universityId, facultyName, stats);
              facultyCache.set(cacheKey, facultyId);
            }

            const degreeType = mapGraduateDegree(program.programTuruAdi);
            const durationYears =
              program.ogrenimSuresi ?? (degreeType === "doctorate" ? 4 : 2);

            // Graduate programs may not have a stable kilavuzKodu — fall back
            // to a composite key derived from universiteId + programAdi + programTuruAdi
            const code = program.kilavuzKodu
              ? String(program.kilavuzKodu)
              : `gr-${yokUni.universiteId}-${slugify(program.programAdi)}-${slugify(program.programTuruAdi)}`;

            await upsertProgram(
              facultyId,
              {
                code,
                nametr: program.programAdi,
                degreeType,
                language: mapLanguage(program.ogrenimDiliAdi),
                durationYears,
              },
              stats,
            );
          } catch (err) {
            stats.errors.push(
              `GR Program (${program.programAdi}): ${(err as Error).message}`,
            );
          }
        }

        // ---- 5. Fee enrichment (university-level adapter) ----------------
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
  city: string,
  uniTuru: string,
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

  const type = uniTuru === "DEVLET" ? "state" : "foundation";
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

type ProgramData = {
  code: string;
  nametr: string;
  degreeType: DegreeType;
  language: string;
  durationYears: number;
};

async function upsertProgram(
  facultyId: number,
  data: ProgramData,
  stats: CrawlStats,
): Promise<number> {
  const [existing] = await db
    .select({ id: programsTable.id })
    .from(programsTable)
    .where(eq(programsTable.yok_atlas_code, data.code))
    .limit(1);

  const structuralFields = {
    faculty_id: facultyId,
    degree_type: data.degreeType,
    language: data.language,
    duration_years: data.durationYears,
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
      name_en: data.nametr,
      name_tr: data.nametr,
      name_fa: data.nametr,
      name_ar: data.nametr,
      yok_atlas_code: data.code,
    })
    .returning({ id: programsTable.id });

  stats.programs_created += 1;
  return created!.id;
}

async function applyFeeToUniversity(
  universityId: number,
  fee: { academic_year: string; domestic_fee: number | null; international_fee: number | null; domestic_currency: string; international_currency: string },
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
      domestic_currency: fee.domestic_currency,
      international_currency: fee.international_currency,
      currency: fee.domestic_currency, // legacy column kept in sync
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
