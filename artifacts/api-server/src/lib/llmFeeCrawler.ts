/**
 * LLM-powered university fee crawler.
 *
 * For each university in the DB it:
 *  1. Resolves the official website URL (uses stored value or guesses from name/slug)
 *  2. Fetches the homepage and discovers fee-related page links using GPT
 *  3. Fetches those pages and sends the stripped text to GPT for structured extraction
 *  4. Matches extracted program names to DB programs and upserts tuition_fees rows
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
// OpenAI client (lazy — only instantiated when the crawler actually runs)
// ---------------------------------------------------------------------------

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not set. The fee crawler requires an OpenAI API key.",
      );
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExtractedFee = {
  program_name: string;
  degree_type: "bachelor" | "associate" | "master" | "doctorate";
  domestic_fee: number | null;
  international_fee: number | null;
  currency: string;
};

type ExtractedFeePage = {
  academic_year: string;
  currency: string;
  fees: ExtractedFee[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_CHARS = 30_000; // keep prompts manageable
const REQUEST_DELAY_MS = 500;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeFetch(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; UniTurkeyCrawler/1.0; +https://uniturkey.com)",
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text") && !ct.includes("html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Strip HTML tags, collapse whitespace, trim to limit. */
function stripHtml(html: string, maxChars = MAX_HTML_CHARS): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

/** Extract href links from HTML that look like fee/tuition pages. */
function extractLinks(html: string, baseUrl: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  const base = new URL(baseUrl);
  const pattern = /href=["']([^"'#?]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(html)) !== null) {
    try {
      const resolved = new URL(m[1], base).href;
      // Only keep same-domain links
      if (!resolved.startsWith(base.origin)) continue;
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      results.push(resolved);
    } catch {}
  }
  return results;
}

const FEE_KEYWORDS = [
  "ücret", "ucret", "harç", "harc", "tuition", "fee", "fiyat", "öğrenim",
  "ogrenim", "akademik", "uluslararasi", "uluslararası", "yabanci", "yabancı",
];

function looksLikeFeeLink(url: string): boolean {
  const lower = url.toLowerCase();
  return FEE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// URL discovery
// ---------------------------------------------------------------------------

/** Try to discover the university's website via common Turkish .edu.tr patterns. */
async function discoverWebsiteUrl(
  name: string,
  slug: string,
): Promise<string | null> {
  // Build candidate URLs from slug and common patterns
  const candidates: string[] = [];

  // Direct slug-based
  candidates.push(`https://www.${slug}.edu.tr`);
  candidates.push(`https://${slug}.edu.tr`);

  // Name-derived: take first word of the university name (e.g. "Ankara" from "Ankara Üniversitesi")
  const firstWord = name
    .split(/\s+/)[0]
    ?.toLowerCase()
    .replace(/[^a-z]/g, "");
  if (firstWord && firstWord.length > 3) {
    candidates.push(`https://www.${firstWord}.edu.tr`);
    candidates.push(`https://${firstWord}.edu.tr`);
  }

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6_000);
      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        headers: { "User-Agent": "UniTurkeyCrawler/1.0" },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (res.ok || res.status === 301 || res.status === 302) {
        return url;
      }
    } catch {}
  }
  return null;
}

// ---------------------------------------------------------------------------
// LLM helpers
// ---------------------------------------------------------------------------

async function askGptForFeeLinks(
  universityName: string,
  pageText: string,
  allLinks: string[],
): Promise<string[]> {
  const feeLinks = allLinks.filter(looksLikeFeeLink).slice(0, 30);
  if (feeLinks.length === 0) return [];

  const prompt = `University: ${universityName}

Here are links found on the university homepage. Pick the ones most likely to contain tuition fee or programme cost information. Return a JSON array of URLs only. Max 5 URLs.

Links:
${feeLinks.join("\n")}

Respond with ONLY a JSON array like: ["url1", "url2"]`;

  try {
    const res = await getOpenAI().chat.completions.create({
      model: "gpt-4.1-mini",
      max_completion_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.choices[0]?.message?.content ?? "[]";
    const parsed = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return feeLinks.slice(0, 3);
  }
}

async function extractFeesFromPage(
  universityName: string,
  pageUrl: string,
  pageText: string,
): Promise<ExtractedFeePage | null> {
  const prompt = `You are extracting tuition fee data from a Turkish university website.

University: ${universityName}
Page URL: ${pageUrl}

Page content:
${pageText.slice(0, 25_000)}

Extract ALL tuition fee information. Return a JSON object:
{
  "academic_year": "2024-2025",
  "currency": "TRY",
  "fees": [
    {
      "program_name": "Bilgisayar Mühendisliği",
      "degree_type": "bachelor",
      "domestic_fee": 50000,
      "international_fee": 8000,
      "currency": "TRY"
    }
  ]
}

Rules:
- degree_type must be one of: bachelor, associate, master, doctorate
- Use null for fees not found
- If the page has no fee information, return {"academic_year":"","currency":"TRY","fees":[]}
- currency: TRY for Turkish Lira, USD for US Dollar, EUR for Euro
- Return ONLY valid JSON, no explanation`;

  try {
    const res = await getOpenAI().chat.completions.create({
      model: "gpt-4.1-mini",
      max_completion_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed: ExtractedFeePage = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.fees)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Match extracted fees to DB programs using LLM
// ---------------------------------------------------------------------------

async function matchAndSaveFees(
  universityId: number,
  extracted: ExtractedFeePage,
): Promise<number> {
  if (extracted.fees.length === 0) return 0;

  // Load all programs for this university
  const rows = await db
    .select({
      id: programsTable.id,
      name_tr: programsTable.name_tr,
      name_en: programsTable.name_en,
      degree_type: programsTable.degree_type,
    })
    .from(programsTable)
    .innerJoin(facultiesTable, eq(programsTable.faculty_id, facultiesTable.id))
    .where(eq(facultiesTable.university_id, universityId));

  if (rows.length === 0) return 0;

  const academicYear =
    extracted.academic_year ||
    `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;

  let saved = 0;

  for (const fee of extracted.fees) {
    if (fee.domestic_fee == null && fee.international_fee == null) continue;

    const currency = fee.currency || extracted.currency || "TRY";
    const feeNameLower = fee.program_name.toLowerCase();

    // Simple fuzzy match: find programs where name contains the extracted name or vice versa,
    // and degree_type matches if provided
    const candidates = rows.filter((p) => {
      const nameTrLower = (p.name_tr ?? "").toLowerCase();
      const nameEnLower = (p.name_en ?? "").toLowerCase();
      const nameMatch =
        nameTrLower.includes(feeNameLower) ||
        feeNameLower.includes(nameTrLower) ||
        nameEnLower.includes(feeNameLower) ||
        feeNameLower.includes(nameEnLower);
      const degreeMatch = !fee.degree_type || p.degree_type === fee.degree_type;
      return nameMatch && degreeMatch;
    });

    // If no match by name, apply to all programs of matching degree type
    const targets =
      candidates.length > 0
        ? candidates
        : rows.filter((p) => !fee.degree_type || p.degree_type === fee.degree_type);

    for (const prog of targets) {
      const [existing] = await db
        .select({ id: tuitionFeesTable.id })
        .from(tuitionFeesTable)
        .where(
          and(
            eq(tuitionFeesTable.program_id, prog.id),
            eq(tuitionFeesTable.academic_year, academicYear),
          ),
        )
        .limit(1);

      const values = {
        domestic_fee: fee.domestic_fee != null ? String(fee.domestic_fee) : null,
        international_fee:
          fee.international_fee != null ? String(fee.international_fee) : null,
        currency,
      };

      if (existing) {
        await db
          .update(tuitionFeesTable)
          .set(values)
          .where(eq(tuitionFeesTable.id, existing.id));
      } else {
        await db
          .insert(tuitionFeesTable)
          .values({ program_id: prog.id, academic_year: academicYear, ...values });
      }
      saved += 1;
    }
  }

  return saved;
}

// ---------------------------------------------------------------------------
// Main per-university crawl
// ---------------------------------------------------------------------------

async function crawlUniversity(
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
    // 1. Resolve URL
    let websiteUrl = uni.website_url;
    if (!websiteUrl) {
      result.status = "fetching";
      websiteUrl = await discoverWebsiteUrl(uni.name_en, uni.slug);
      if (websiteUrl) {
        // Cache in DB
        await db
          .update(universitiesTable)
          .set({ website_url: websiteUrl })
          .where(eq(universitiesTable.id, uni.id));
        result.website_url = websiteUrl;
      }
    }

    if (!websiteUrl) {
      result.status = "no_url";
      return result;
    }

    result.status = "fetching";

    // 2. Fetch homepage to discover fee links
    const homepage = await safeFetch(websiteUrl);
    if (!homepage) {
      result.status = "no_url";
      result.error = "Homepage unreachable";
      return result;
    }
    result.pages_fetched += 1;

    const allLinks = extractLinks(homepage, websiteUrl);
    const homepageText = stripHtml(homepage, 5_000);

    // 3. Pick fee pages (via LLM or keyword filter)
    const feePageUrls = await askGptForFeeLinks(uni.name_en, homepageText, allLinks);

    // Also add any obvious keyword-matching links not already in list
    const quickFeeLinks = allLinks.filter(looksLikeFeeLink).slice(0, 5);
    const allFeeUrls = [...new Set([...feePageUrls, ...quickFeeLinks])].slice(0, 6);

    // 4. Fetch fee pages and extract
    result.status = "extracting";
    let bestExtraction: ExtractedFeePage | null = null;

    for (const url of allFeeUrls) {
      await sleep(REQUEST_DELAY_MS);
      const html = await safeFetch(url);
      if (!html) continue;
      result.pages_fetched += 1;

      const text = stripHtml(html);
      const extracted = await extractFeesFromPage(uni.name_en, url, text);
      if (!extracted || extracted.fees.length === 0) continue;

      // Pick the extraction with most fee entries
      if (!bestExtraction || extracted.fees.length > bestExtraction.fees.length) {
        bestExtraction = extracted;
      }
    }

    // 5. Also try to extract from homepage if no fee pages found
    if (!bestExtraction && homepageText.length > 500) {
      const extracted = await extractFeesFromPage(uni.name_en, websiteUrl, stripHtml(homepage));
      if (extracted && extracted.fees.length > 0) bestExtraction = extracted;
    }

    // 6. Save to DB
    if (bestExtraction && bestExtraction.fees.length > 0) {
      result.fees_saved = await matchAndSaveFees(uni.id, bestExtraction);
    }

    result.status = "done";
  } catch (err) {
    result.status = "failed";
    result.error = (err as Error).message;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Job runner
// ---------------------------------------------------------------------------

async function updateJobStats(jobId: number, stats: FeeCrawlStats) {
  await db
    .update(feeCrawlJobsTable)
    .set({ stats })
    .where(eq(feeCrawlJobsTable.id, jobId));
}

export async function runFeeCrawlJob(jobId: number, universityIds?: number[]): Promise<void> {
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
    // Load universities
    const query = db
      .select({
        id: universitiesTable.id,
        name_en: universitiesTable.name_en,
        slug: universitiesTable.slug,
        website_url: universitiesTable.website_url,
      })
      .from(universitiesTable);

    const universities =
      universityIds && universityIds.length > 0
        ? await query.where(inArray(universitiesTable.id, universityIds))
        : await query;

    stats.universities_total = universities.length;
    await updateJobStats(jobId, stats);

    for (const uni of universities) {
      const result = await crawlUniversity(uni);
      stats.results.push(result);
      stats.universities_done += 1;
      stats.fees_saved += result.fees_saved;
      if (result.status === "no_url") stats.universities_no_url += 1;
      else if (result.status === "failed") stats.universities_failed += 1;
      else if (result.fees_saved > 0) stats.universities_with_fees += 1;
      await updateJobStats(jobId, stats);
      await sleep(REQUEST_DELAY_MS);
    }

    await db
      .update(feeCrawlJobsTable)
      .set({ status: "success", finished_at: new Date(), stats })
      .where(eq(feeCrawlJobsTable.id, jobId));
  } catch (err) {
    logger.error({ err, jobId }, "Fee crawl job failed");
    await db
      .update(feeCrawlJobsTable)
      .set({ status: "failed", finished_at: new Date(), stats, error: (err as Error).message })
      .where(eq(feeCrawlJobsTable.id, jobId));
  }
}
