/**
 * LLM-powered university fee lookup.
 *
 * For each university it:
 *  1. Fetches all programmes for that university from the DB
 *  2. Sends ONE OpenAI request with the university name + programme list
 *  3. Asks the model to return known/estimated tuition fees per programme ID
 *  4. Upserts the returned fees into the DB (no web scraping, no matching step)
 *
 * Because we send the actual DB programme IDs in the prompt and ask the model to
 * key its response by those IDs, the expensive "batch matching" pass is eliminated.
 */

import OpenAI from "openai";
import { db } from "@workspace/db";
import {
  feeCrawlJobsTable,
  universitiesTable,
  facultiesTable,
  programsTable,
  tuitionFeesTable,
  type FeeCrawlStats,
  type FeeCrawlUniversityResult,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// OpenAI client (lazy)
// ---------------------------------------------------------------------------

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it as a secret in the Replit environment.",
      );
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DBProgram = {
  id: number;
  name_tr: string;
  name_en: string;
  degree_type: string;
  faculty_name_en: string;
};

type LLMFeeEntry = {
  domestic_fee: number | null;
  international_fee: number | null;
  currency: string;
  academic_year: string;
};

/** Shape the model must return: { "programId": { ... } } */
type LLMFeesResponse = {
  fees: Record<string, LLMFeeEntry>;
};

// ---------------------------------------------------------------------------
// Current academic year helper
// ---------------------------------------------------------------------------

function currentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Academic year starts in September
  return now.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

// ---------------------------------------------------------------------------
// Core: ask OpenAI for fees for one university
// ---------------------------------------------------------------------------

async function fetchFeesFromLLM(
  universityName: string,
  programs: DBProgram[],
): Promise<LLMFeesResponse> {
  const academicYear = currentAcademicYear();

  const programLines = programs
    .map(
      (p) =>
        `  id:${p.id}  ${p.name_en} / ${p.name_tr}  (${p.degree_type})  [${p.faculty_name_en}]`,
    )
    .join("\n");

  const prompt = `You are a higher-education data assistant. Your task is to provide tuition fee estimates for a Turkish university's programmes.

University: ${universityName}
Academic year: ${academicYear}

Programmes (use the exact numeric IDs as keys in your response):
${programLines}

Instructions:
- Return your best estimate of tuition fees for each programme based on your knowledge of Turkish university pricing.
- Fees are in Turkish Lira (TRY) unless you know the university uses a different currency.
- domestic_fee: fee for Turkish citizens (null if unknown).
- international_fee: fee for international/foreign students (null if unknown).
- If you have no knowledge of a programme's fee, set both to null — do NOT invent numbers you are not confident about.
- academic_year must be "${academicYear}".
- currency is usually "TRY"; use "USD" or "EUR" only if the university publicly quotes fees in that currency.

Return ONLY valid JSON in this exact shape (no markdown, no explanation):
{
  "fees": {
    "42": { "domestic_fee": 95000, "international_fee": 180000, "currency": "TRY", "academic_year": "${academicYear}" },
    "43": { "domestic_fee": null, "international_fee": null, "currency": "TRY", "academic_year": "${academicYear}" }
  }
}`;

  const res = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    max_completion_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = res.choices[0]?.message?.content ?? '{"fees":{}}';
  try {
    const parsed = JSON.parse(raw) as LLMFeesResponse;
    if (!parsed.fees || typeof parsed.fees !== "object") return { fees: {} };
    return parsed;
  } catch {
    logger.warn({ raw }, "Failed to parse LLM fee response");
    return { fees: {} };
  }
}

// ---------------------------------------------------------------------------
// Upsert fees into DB
// ---------------------------------------------------------------------------

async function upsertFees(
  programIds: number[],
  llmFees: LLMFeesResponse,
): Promise<number> {
  let saved = 0;
  const programIdSet = new Set(programIds);

  for (const [idStr, entry] of Object.entries(llmFees.fees)) {
    const programId = parseInt(idStr, 10);
    if (isNaN(programId) || !programIdSet.has(programId)) continue;
    if (entry.domestic_fee == null && entry.international_fee == null) continue;

    const academicYear = entry.academic_year || currentAcademicYear();
    const currency = entry.currency || "TRY";

    const values = {
      domestic_fee: entry.domestic_fee != null ? String(entry.domestic_fee) : null,
      international_fee:
        entry.international_fee != null ? String(entry.international_fee) : null,
      currency,
    };

    const [existing] = await db
      .select({ id: tuitionFeesTable.id })
      .from(tuitionFeesTable)
      .where(
        and(
          eq(tuitionFeesTable.program_id, programId),
          eq(tuitionFeesTable.academic_year, academicYear),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(tuitionFeesTable)
        .set(values)
        .where(eq(tuitionFeesTable.id, existing.id));
    } else {
      await db
        .insert(tuitionFeesTable)
        .values({ program_id: programId, academic_year: academicYear, ...values });
    }
    saved++;
  }

  return saved;
}

// ---------------------------------------------------------------------------
// Per-university handler
// ---------------------------------------------------------------------------

async function processUniversity(
  uni: { id: number; name_en: string; slug: string; website_url: string | null },
): Promise<FeeCrawlUniversityResult> {
  const result: FeeCrawlUniversityResult = {
    university_id: uni.id,
    university_name: uni.name_en,
    website_url: uni.website_url,
    status: "pending",
    pages_fetched: 0,
    fees_saved: 0,
  };

  try {
    // 1. Fetch this university's programmes from DB
    const programs = await db
      .select({
        id: programsTable.id,
        name_tr: programsTable.name_tr,
        name_en: programsTable.name_en,
        degree_type: programsTable.degree_type,
        faculty_name_en: facultiesTable.name_en,
      })
      .from(programsTable)
      .innerJoin(facultiesTable, eq(programsTable.faculty_id, facultiesTable.id))
      .where(eq(facultiesTable.university_id, uni.id));

    if (programs.length === 0) {
      result.status = "done";
      return result;
    }

    result.status = "extracting";

    // 2. Ask OpenAI for fees
    const llmFees = await fetchFeesFromLLM(uni.name_en, programs);

    // 3. Upsert into DB
    result.fees_saved = await upsertFees(
      programs.map((p) => p.id),
      llmFees,
    );

    result.status = "done";
  } catch (err) {
    result.status = "failed";
    result.error = (err as Error).message;
    logger.error({ err, uni: uni.name_en }, "University fee lookup failed");
  }

  return result;
}

// ---------------------------------------------------------------------------
// Job runner (unchanged contract — route file imports this)
// ---------------------------------------------------------------------------

async function updateJobStats(jobId: number, stats: FeeCrawlStats) {
  await db
    .update(feeCrawlJobsTable)
    .set({ stats })
    .where(eq(feeCrawlJobsTable.id, jobId));
}

export async function runFeeCrawlJob(
  jobId: number,
  universityIds?: number[],
): Promise<void> {
  const stats: FeeCrawlStats = {
    universities_total: 0,
    universities_done: 0,
    universities_with_fees: 0,
    universities_no_url: 0,
    universities_failed: 0,
    fees_saved: 0,
    results: [],
  };

  await db
    .update(feeCrawlJobsTable)
    .set({ status: "running" })
    .where(eq(feeCrawlJobsTable.id, jobId));

  try {
    const baseQuery = db
      .select({
        id: universitiesTable.id,
        name_en: universitiesTable.name_en,
        slug: universitiesTable.slug,
        website_url: universitiesTable.website_url,
      })
      .from(universitiesTable);

    const universities =
      universityIds && universityIds.length > 0
        ? await baseQuery.where(inArray(universitiesTable.id, universityIds))
        : await baseQuery;

    stats.universities_total = universities.length;
    await updateJobStats(jobId, stats);

    for (const uni of universities) {
      const result = await processUniversity(uni);
      stats.results.push(result);
      stats.universities_done++;
      stats.fees_saved += result.fees_saved;
      if (result.status === "failed") stats.universities_failed++;
      else if (result.fees_saved > 0) stats.universities_with_fees++;
      await updateJobStats(jobId, stats);
    }

    await db
      .update(feeCrawlJobsTable)
      .set({ status: "success", finished_at: new Date(), stats })
      .where(eq(feeCrawlJobsTable.id, jobId));
  } catch (err) {
    logger.error({ err, jobId }, "Fee crawl job failed");
    await db
      .update(feeCrawlJobsTable)
      .set({
        status: "failed",
        finished_at: new Date(),
        stats,
        error: (err as Error).message,
      })
      .where(eq(feeCrawlJobsTable.id, jobId));
  }
}
