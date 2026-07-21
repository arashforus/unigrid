/**
 * LLM-powered university fee crawler.
 *
 * For each university in the DB it:
 *  1. Resolves the official website URL (uses stored value or guesses from name/slug)
 *  2. Probes known fee-page URL patterns; falls back to LLM link-selection only when needed
 *  3. Parses HTML preserving table structure so the LLM can read fee tables
 *  4. Sends page content to GPT to extract structured per-program fee data
 *  5. Uses a SINGLE batched LLM call to match ALL extracted fees to DB programs, then upserts
 *
 * Token-efficiency principles:
 *  - Batch all program-matching into one LLM call per university (not one per fee row)
 *  - Skip LLM link discovery when direct URL probing finds ≥2 fee pages
 *  - Hard-trim page content to tables + nearby text only (≤10k chars)
 *  - Skip extraction LLM call when page text has no fee keywords
 *  - Use response_format: json_object for reliable JSON without retries
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

type DBProgram = {
  id: number;
  name_tr: string;
  name_en: string;
  degree_type: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 15_000;
const MAX_PAGE_CHARS = 10_000; // Tighter limit — tables only
const REQUEST_DELAY_MS = 600;
const MODEL = "gpt-4o-mini";

// Common path suffixes used by Turkish universities for fee pages
const FEE_PATH_PATTERNS = [
  "/ogrenci/ucretler",
  "/ogrenci-ucretleri",
  "/akademik/ucretler",
  "/ucretler",
  "/harc",
  "/ogrenim-ucreti",
  "/tuition",
  "/tuition-fees",
  "/fees",
  "/en/fees",
  "/en/tuition",
  "/en/tuition-fees",
  "/international/fees",
  "/uluslararasi/ucretler",
  "/yabanci-uyruklu/ucretler",
  "/ogrenci/harc",
  "/ogrenci/mali-isler",
];

// Keywords that indicate fee content is present — used to skip pages cheaply
const FEE_CONTENT_KEYWORDS = [
  "ücret", "ucret", "harç", "harc", "tuition", "fee",
  "öğrenim", "ogrenim", "tl", "try", "usd", "eur",
  "burs", "indirim", "fiyat",
];

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

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
        Accept: "text/html,application/xhtml+xml,*/*;q=0.9",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
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

async function safeHead(url: string): Promise<boolean> {
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
    return res.ok || (res.status >= 300 && res.status < 400);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// HTML → readable text with preserved table structure
// ---------------------------------------------------------------------------

/**
 * Converts an HTML table element text into a pipe-delimited markdown table.
 * This preserves the row/column relationships that are critical for reading fee data.
 */
function htmlTableToMarkdown(tableHtml: string): string {
  const rows: string[][] = [];
  const rowPattern = /<tr[\s\S]*?<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowPattern.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[0];
    const cells: string[] = [];
    const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
      const cellText = cellMatch[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim();
      cells.push(cellText);
    }
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) return "";
  return rows.map((r) => "| " + r.join(" | ") + " |").join("\n");
}

/**
 * Extract tables + a small window of surrounding text, discarding nav/footer noise.
 * Fee data almost always lives in HTML tables — we prioritise those and only keep
 * text that's near a table or contains fee keywords.
 */
function extractTextWithTables(html: string, maxChars = MAX_PAGE_CHARS): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Strip nav / header / footer / aside blocks — mostly noise
    .replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, " ");

  const parts: string[] = [];
  const tablePattern = /<table[\s\S]*?<\/table>/gi;
  let lastIndex = 0;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tablePattern.exec(cleaned)) !== null) {
    // Keep a small snippet of text before the table (headings / labels)
    const before = cleaned
      .slice(Math.max(lastIndex, tableMatch.index - 300), tableMatch.index)
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (before) parts.push(before);

    const md = htmlTableToMarkdown(tableMatch[0]);
    if (md) parts.push("\n" + md + "\n");

    lastIndex = tableMatch.index + tableMatch[0].length;
  }

  // If there were no tables, fall back to plain text extraction
  if (parts.length === 0) {
    const plain = cleaned
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return plain.slice(0, maxChars);
  }

  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, maxChars);
}

// ---------------------------------------------------------------------------
// Content relevance check (avoid LLM call for unrelated pages)
// ---------------------------------------------------------------------------

function hasFeeContent(text: string): boolean {
  const lower = text.toLowerCase();
  return FEE_CONTENT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// Link extraction
// ---------------------------------------------------------------------------

function extractLinks(html: string, baseUrl: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  const base = new URL(baseUrl);
  const pattern = /href=["']([^"'#?][^"']*?)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(html)) !== null) {
    try {
      const resolved = new URL(m[1], base).href;
      if (!resolved.startsWith(base.origin)) continue;
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      results.push(resolved);
    } catch {}
  }
  return results;
}

const FEE_KEYWORDS = [
  "ücret", "ucret", "harç", "harc", "tuition", "fee", "fiyat",
  "öğrenim", "ogrenim", "mali", "uluslararas", "yabancı", "yabanci",
];

function looksLikeFeeLink(url: string): boolean {
  const lower = url.toLowerCase();
  return FEE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// URL discovery
// ---------------------------------------------------------------------------

async function discoverWebsiteUrl(name: string, slug: string): Promise<string | null> {
  const firstWord = name.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  const candidates = [
    `https://www.${slug}.edu.tr`,
    `https://${slug}.edu.tr`,
    ...(firstWord.length > 3
      ? [`https://www.${firstWord}.edu.tr`, `https://${firstWord}.edu.tr`]
      : []),
  ];
  for (const url of candidates) {
    if (await safeHead(url)) return url;
  }
  return null;
}

/**
 * Try common fee-page URL patterns directly against the university's origin.
 * No LLM cost. Returns up to 4 live URLs.
 */
async function probeFeeUrls(origin: string): Promise<string[]> {
  const found: string[] = [];
  for (const suffix of FEE_PATH_PATTERNS) {
    const url = origin.replace(/\/$/, "") + suffix;
    if (await safeHead(url)) {
      found.push(url);
      if (found.length >= 4) break;
    }
    await sleep(200);
  }
  return found;
}

// ---------------------------------------------------------------------------
// LLM helpers
// ---------------------------------------------------------------------------

/**
 * Ask GPT to pick fee page URLs from a link list.
 * Only called when direct probing found fewer than 2 URLs.
 */
async function askGptForFeeLinks(
  universityName: string,
  allLinks: string[],
): Promise<string[]> {
  if (allLinks.length === 0) return [];

  const feeLinks = allLinks.filter(looksLikeFeeLink);
  // If keyword matching already found enough, skip the LLM call entirely
  if (feeLinks.length >= 3) return feeLinks.slice(0, 5);

  const linksToSend = (feeLinks.length > 0 ? feeLinks : allLinks).slice(0, 50);

  const prompt = `University: ${universityName}

Pick up to 5 URLs most likely to contain tuition fee tables. Prefer paths with "ücret", "harç", "tuition", "fee", "mali" in them.

Links:
${linksToSend.join("\n")}

Return ONLY a JSON array of URLs: ["url1","url2"]`;

  try {
    const res = await getOpenAI().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: 'Return {"urls":["url1","url2"]}',
        },
        { role: "user", content: prompt },
      ],
    });
    const text = res.choices[0]?.message?.content ?? '{"urls":[]}';
    const parsed = JSON.parse(text);
    const urls: unknown = parsed.urls ?? parsed;
    return Array.isArray(urls) ? (urls as string[]).slice(0, 5) : [];
  } catch {
    return feeLinks.slice(0, 3);
  }
}

/**
 * Extract fee rows from a single page's text content.
 */
async function extractFeesFromPage(
  universityName: string,
  pageUrl: string,
  pageContent: string,
): Promise<ExtractedFeePage | null> {
  const prompt = `Extract tuition fee data from this Turkish university page.

University: ${universityName}
URL: ${pageUrl}

Content:
${pageContent}

Rules:
- Each fee entry = one specific academic programme (not a general category)
- degree_type: associate | bachelor | master | doctorate
- domestic_fee / international_fee: number only (strip commas/dots used as thousands separators), null if absent
- currency: TRY, USD, or EUR
- Use Turkish programme name when available
- If one fee column with no domestic/international split: put in domestic_fee, set international_fee null
- academic_year: e.g. "2024-2025" (infer from page or use current year)
- If no fee data found: return {"academic_year":"","currency":"TRY","fees":[]}

Return JSON matching this schema exactly:
{"academic_year":"2024-2025","currency":"TRY","fees":[{"program_name":"string","degree_type":"bachelor","domestic_fee":95000,"international_fee":null,"currency":"TRY"}]}`;

  try {
    const res = await getOpenAI().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.choices[0]?.message?.content ?? "{}";
    const parsed: ExtractedFeePage = JSON.parse(text);
    if (!Array.isArray(parsed.fees)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Batched LLM program matching (ONE call per university, not one per fee row)
// ---------------------------------------------------------------------------

/**
 * Match ALL extracted fees to DB programs in a single LLM call.
 * Returns a map: fee index (string) → array of matching program IDs.
 *
 * This replaces the previous per-row approach which made N LLM calls for N fees.
 */
async function batchMatchFeesToPrograms(
  fees: ExtractedFee[],
  dbPrograms: DBProgram[],
): Promise<Map<number, number[]>> {
  const result = new Map<number, number[]>();
  if (fees.length === 0 || dbPrograms.length === 0) return result;

  // Build a compact fee list (index + name + degree)
  const feeList = fees
    .map((f, i) => `${i}: "${f.program_name}" (${f.degree_type})`)
    .join("\n");

  // Build a compact program list
  const programList = dbPrograms
    .map((p) => `id:${p.id} ${p.name_tr} / ${p.name_en} (${p.degree_type})`)
    .join("\n");

  const prompt = `Match each extracted fee entry (by index) to the correct programme ID(s) from the list below.

Extracted fees (index: name, degree):
${feeList}

Available programmes (id name_tr / name_en degree):
${programList}

Rules:
- Match by name similarity; degree type is a strong hint but name match takes priority
- Only return confident matches; use [] for no match
- A fee entry may match multiple programme IDs (e.g. same programme offered at multiple faculties)

Return JSON: {"matches":{"0":[12],"1":[15,16],"2":[]}}`;

  try {
    const res = await getOpenAI().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 800,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.choices[0]?.message?.content ?? '{"matches":{}}';
    const parsed = JSON.parse(text);
    const matches: Record<string, unknown> = parsed.matches ?? parsed;

    for (const [key, val] of Object.entries(matches)) {
      const idx = parseInt(key, 10);
      if (isNaN(idx)) continue;
      const ids = Array.isArray(val)
        ? (val as unknown[]).filter((x): x is number => typeof x === "number")
        : [];
      result.set(idx, ids);
    }
  } catch (err) {
    logger.warn({ err }, "Batch fee matching LLM call failed");
  }

  return result;
}

// ---------------------------------------------------------------------------
// Merge and de-duplicate fee extractions from multiple pages
// ---------------------------------------------------------------------------

function mergeFeeExtractions(pages: ExtractedFeePage[]): ExtractedFeePage {
  const seen = new Map<string, ExtractedFee>();
  let academicYear = "";
  let currency = "TRY";

  for (const page of pages) {
    if (page.academic_year && !academicYear) academicYear = page.academic_year;
    if (page.currency) currency = page.currency;

    for (const fee of page.fees) {
      if (fee.domestic_fee == null && fee.international_fee == null) continue;
      const key = `${fee.degree_type}::${fee.program_name.toLowerCase().trim()}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, fee);
      } else {
        seen.set(key, {
          ...existing,
          domestic_fee: existing.domestic_fee ?? fee.domestic_fee,
          international_fee: existing.international_fee ?? fee.international_fee,
        });
      }
    }
  }

  if (!academicYear) {
    const y = new Date().getFullYear();
    academicYear = `${y - 1}-${y}`;
  }

  return { academic_year: academicYear, currency, fees: Array.from(seen.values()) };
}

// ---------------------------------------------------------------------------
// Save matched fees to DB
// ---------------------------------------------------------------------------

async function saveFees(
  universityId: number,
  merged: ExtractedFeePage,
): Promise<number> {
  if (merged.fees.length === 0) return 0;

  const dbPrograms = await db
    .select({
      id: programsTable.id,
      name_tr: programsTable.name_tr,
      name_en: programsTable.name_en,
      degree_type: programsTable.degree_type,
    })
    .from(programsTable)
    .innerJoin(facultiesTable, eq(programsTable.faculty_id, facultiesTable.id))
    .where(eq(facultiesTable.university_id, universityId));

  if (dbPrograms.length === 0) return 0;

  const fees = merged.fees.filter(
    (f) => f.domestic_fee != null || f.international_fee != null,
  );

  if (fees.length === 0) return 0;

  // ONE batched LLM call for all fees × all programs
  const matchMap = await batchMatchFeesToPrograms(fees, dbPrograms);

  const academicYear = merged.academic_year;
  let saved = 0;

  for (const [feeIdx, matchedIds] of matchMap.entries()) {
    if (matchedIds.length === 0) continue;
    const fee = fees[feeIdx];
    if (!fee) continue;

    const currency = fee.currency || merged.currency || "TRY";
    const values = {
      domestic_fee: fee.domestic_fee != null ? String(fee.domestic_fee) : null,
      international_fee: fee.international_fee != null ? String(fee.international_fee) : null,
      currency,
    };

    // Validate IDs are actually in our DB programs list
    const validIds = matchedIds.filter((id) => dbPrograms.some((p) => p.id === id));

    for (const programId of validIds) {
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
    const origin = new URL(websiteUrl).origin;

    // 2. Probe common fee URL patterns directly (zero LLM cost)
    const probedFeeUrls = await probeFeeUrls(origin);

    // 3. Only fetch homepage + run LLM link discovery when probing didn't find enough
    let llmFeeUrls: string[] = [];
    let homepage: string | null = null;

    if (probedFeeUrls.length < 2) {
      homepage = await safeFetch(websiteUrl);
      if (homepage) {
        result.pages_fetched++;
        const allLinks = extractLinks(homepage, websiteUrl);
        llmFeeUrls = await askGptForFeeLinks(uni.name_en, allLinks);
      }
    }

    const allFeeUrls = [...new Set([...probedFeeUrls, ...llmFeeUrls])].slice(0, 6);

    if (allFeeUrls.length === 0 && !homepage) {
      result.status = "no_url";
      result.error = "Homepage unreachable and no fee URLs found";
      return result;
    }

    // 4. Fetch each fee page, check for content, then extract
    result.status = "extracting";
    const extractions: ExtractedFeePage[] = [];

    for (const url of allFeeUrls) {
      await sleep(REQUEST_DELAY_MS);
      const html = await safeFetch(url);
      if (!html) continue;
      result.pages_fetched++;

      const content = extractTextWithTables(html);

      // Skip LLM call if page clearly has no fee content
      if (!hasFeeContent(content)) continue;

      const extracted = await extractFeesFromPage(uni.name_en, url, content);
      if (extracted && extracted.fees.length > 0) {
        extractions.push(extracted);
      }
    }

    // 5. Fallback: try homepage itself if nothing found from fee pages
    if (extractions.length === 0 && homepage) {
      const content = extractTextWithTables(homepage);
      if (hasFeeContent(content)) {
        const extracted = await extractFeesFromPage(uni.name_en, websiteUrl, content);
        if (extracted && extracted.fees.length > 0) extractions.push(extracted);
      }
    }

    // 6. Merge all extractions and save (one batched LLM match call)
    if (extractions.length > 0) {
      const merged = mergeFeeExtractions(extractions);
      result.fees_saved = await saveFees(uni.id, merged);
    }

    result.status = "done";
  } catch (err) {
    result.status = "failed";
    result.error = (err as Error).message;
    logger.error({ err, uni: uni.name_en }, "University fee crawl failed");
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
      const result = await crawlUniversity(uni);
      stats.results.push(result);
      stats.universities_done++;
      stats.fees_saved += result.fees_saved;
      if (result.status === "no_url") stats.universities_no_url++;
      else if (result.status === "failed") stats.universities_failed++;
      else if (result.fees_saved > 0) stats.universities_with_fees++;
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
      .set({
        status: "failed",
        finished_at: new Date(),
        stats,
        error: (err as Error).message,
      })
      .where(eq(feeCrawlJobsTable.id, jobId));
  }
}
