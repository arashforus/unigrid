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
  settingsTable,
  type FeeCrawlStats,
  type FeeCrawlUniversityResult,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Resolve API key: env var takes priority, then DB setting
// ---------------------------------------------------------------------------

async function resolveApiKey(): Promise<string> {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const [row] = await db
    .select({ value: settingsTable.value })
    .from(settingsTable)
    .where(eq(settingsTable.key, "openai_api_key"))
    .limit(1);
  if (row?.value) return row.value;
  throw new Error(
    "OpenAI API key is not configured. Add it in Admin → Settings → API Keys.",
  );
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
  academic_year?: string;
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
  apiKey: string,
): Promise<LLMFeesResponse> {
  const openai = new OpenAI({ apiKey });
  const academicYear = currentAcademicYear();

  const programLines = programs
    .map(
      (p) =>
        `id:${p.id} | ${p.name_en} | ${p.name_tr} | ${p.degree_type} | ${p.faculty_name_en}`,
    )
    .join("\n");

  const systemPrompt = `You are an expert on Turkish higher education tuition fees. You have detailed knowledge of tuition costs at Turkish universities, both state and private (vakıf), for domestic and international students. You always respond with valid JSON only.`;

  const userPrompt = `I need the tuition fees for the following programmes at ${universityName}.

Programme list (format: id | English name | Turkish name | degree | faculty):
${programLines}

For each programme, provide:
- domestic_fee: annual fee in TRY for Turkish/domestic students (integer, or null if truly unknown)
- international_fee: annual fee in TRY for international/foreign students (integer, or null if truly unknown)
- currency: "TRY" for Turkish Lira, "USD" or "EUR" only if the university officially uses those currencies

Important:
- ${universityName} is a real Turkish university — use your knowledge of its actual fee structure.
- Private (vakıf) universities charge significant fees; state universities charge very low fees.
- Provide your best known estimate. Only use null if you have absolutely no basis for an estimate.
- Use the exact programme id numbers as the JSON keys.

Respond ONLY with this JSON structure, no markdown, no explanation:
{
  "fees": {
    "42": { "domestic_fee": 95000, "international_fee": 150000, "currency": "TRY" },
    "43": { "domestic_fee": 3500, "international_fee": null, "currency": "TRY" }
  }
}`;

  const res = await openai.chat.completions.create({
    model: "gpt-5.4-nano",
    response_format: { type: "json_object" },
    max_completion_tokens: 4000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
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

    const academicYear = currentAcademicYear();
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
  apiKey: string,
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
    const llmFees = await fetchFeesFromLLM(uni.name_en, programs, apiKey);

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
    // Resolve API key once for the whole job (env var takes priority, then DB)
    const apiKey = await resolveApiKey();

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
      const result = await processUniversity(uni, apiKey);
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
