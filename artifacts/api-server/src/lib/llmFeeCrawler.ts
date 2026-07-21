/**
 * LLM-powered university fee crawler.
 *
 * For each university in the DB it:
 *  1. Resolves the official website URL (uses stored value or guesses from name/slug)
 *  2. Fetches the homepage + known fee-page URL patterns and discovers more via GPT
 *  3. Parses HTML preserving table structure so the LLM can read fee tables
 *  4. Sends page content to GPT to extract structured per-program fee data
 *  5. Uses GPT to match extracted program names to DB programs and upserts tuition_fees rows
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 15_000;
const MAX_PAGE_CHARS = 28_000;
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
  "/ogrenci/harç",
  "/ogrenci/mali-isler",
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
  // Extract all rows
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
 * Strip HTML but preserve table contents as markdown tables.
 * Fee data almost always lives in HTML tables; preserving structure dramatically
 * improves LLM extraction accuracy.
 */
function extractTextWithTables(html: string, maxChars = MAX_PAGE_CHARS): string {
  // Remove scripts and styles first
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const parts: string[] = [];

  // Find tables and convert them; keep remaining text stripped
  const tablePattern = /<table[\s\S]*?<\/table>/gi;
  let lastIndex = 0;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tablePattern.exec(cleaned)) !== null) {
    // Add text before the table
    const before = cleaned
      .slice(lastIndex, tableMatch.index)
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (before) parts.push(before);

    // Convert the table to markdown
    const md = htmlTableToMarkdown(tableMatch[0]);
    if (md) parts.push("\n" + md + "\n");

    lastIndex = tableMatch.index + tableMatch[0].length;
  }

  // Add any remaining text after the last table
  const after = cleaned
    .slice(lastIndex)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (after) parts.push(after);

  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, maxChars);
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
 * Try common fee-page URL patterns directly against the university's origin,
 * without needing to crawl the homepage first.
 */
async function probeFeeUrls(origin: string): Promise<string[]> {
  const found: string[] = [];
  for (const suffix of FEE_PATH_PATTERNS) {
    const url = origin.replace(/\/$/, "") + suffix;
    if (await safeHead(url)) {
      found.push(url);
      if (found.length >= 4) break; // enough candidates
    }
    await sleep(200);
  }
  return found;
}

// ---------------------------------------------------------------------------
// LLM helpers
// ---------------------------------------------------------------------------

async function askGptForFeeLinks(
  universityName: string,
  allLinks: string[],
): Promise<string[]> {
  if (allLinks.length === 0) return [];

  const feeLinks = allLinks.filter(looksLikeFeeLink);
  const linksToSend = (feeLinks.length > 0 ? feeLinks : allLinks).slice(0, 60);

  const prompt = `University: ${universityName}

Choose up to 5 URLs from this list that are most likely to contain tuition fee or programme cost tables for this Turkish university. Prefer pages with "ücret", "harç", "tuition", "fee", or "mali" in the URL path.

Links:
${linksToSend.join("\n")}

Return ONLY a JSON array of URLs, e.g. ["url1", "url2"]`;

  try {
    const res = await getOpenAI().chat.completions.create({
      model: MODEL,
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
  pageContent: string,
): Promise<ExtractedFeePage | null> {
  const prompt = `You are extracting tuition fee data from a Turkish university website page.

University: ${universityName}
Page URL: ${pageUrl}

Page content (tables preserved as markdown):
${pageContent}

Extract ALL tuition fee information you can find. Each entry should be one specific academic programme (department/bölüm), not a general category.

Return a JSON object:
{
  "academic_year": "2024-2025",
  "currency": "TRY",
  "fees": [
    {
      "program_name": "Bilgisayar Mühendisliği",
      "degree_type": "bachelor",
      "domestic_fee": 95000,
      "international_fee": 12000,
      "currency": "TRY"
    }
  ]
}

Rules:
- degree_type must be one of: associate, bachelor, master, doctorate
- domestic_fee / international_fee: numeric value only (no commas, no currency symbols), null if not found
- currency: TRY (Turkish Lira), USD, or EUR
- Include both Turkish and English programme names when you see them — use the Turkish name
- If amounts use dots as thousands separators (e.g. 95.000), convert to plain integers (95000)
- If a row shows only one fee amount with no domestic/international distinction, put it in domestic_fee and set international_fee to null
- If the page has no fee data, return {"academic_year":"","currency":"TRY","fees":[]}
- Return ONLY valid JSON, no explanation or markdown fences`;

  try {
    const res = await getOpenAI().chat.completions.create({
      model: MODEL,
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
// LLM-based program matching
// ---------------------------------------------------------------------------

type DBProgram = {
  id: number;
  name_tr: string;
  name_en: string;
  degree_type: string;
};

/**
 * Use the LLM to match extracted fee entries to DB programs.
 * Returns a map of extracted fee index → array of matching program IDs.
 * Much more accurate than simple string includes() matching.
 */
async function llmMatchFeeToPrograms(
  fee: ExtractedFee,
  candidates: DBProgram[],
): Promise<number[]> {
  if (candidates.length === 0) return [];

  const programList = candidates
    .map((p) => `id:${p.id} | ${p.name_tr} / ${p.name_en} (${p.degree_type})`)
    .join("\n");

  const prompt = `Match this extracted fee entry to the correct university programme(s) from the list below.

Extracted fee entry:
- Programme name: "${fee.program_name}"
- Degree type: ${fee.degree_type}

Available programmes (id | Turkish name / English name | degree):
${programList}

Return a JSON array of matching programme IDs (integers). Return [] if no confident match exists.
Match only by name similarity — the degree type already filters the list.
Return ONLY a JSON array, e.g. [12] or [12, 15] or []`;

  try {
    const res = await getOpenAI().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 128,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.choices[0]?.message?.content ?? "[]";
    const parsed = JSON.parse(text.match(/\[[\s\S]*?\]/)?.[0] ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x: unknown) => typeof x === "number") : [];
  } catch {
    return [];
  }
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
        // Merge: prefer non-null values
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

  // Load all active programs for this university
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

  const academicYear = merged.academic_year;
  let saved = 0;

  for (const fee of merged.fees) {
    if (fee.domestic_fee == null && fee.international_fee == null) continue;

    // Narrow candidates by degree_type before asking LLM (reduces prompt size + cost)
    const typeCandidates = fee.degree_type
      ? dbPrograms.filter((p) => p.degree_type === fee.degree_type)
      : dbPrograms;

    if (typeCandidates.length === 0) continue;

    // LLM matching
    const matchedIds = await llmMatchFeeToPrograms(fee, typeCandidates);
    if (matchedIds.length === 0) continue;

    const currency = fee.currency || merged.currency || "TRY";
    const values = {
      domestic_fee: fee.domestic_fee != null ? String(fee.domestic_fee) : null,
      international_fee: fee.international_fee != null ? String(fee.international_fee) : null,
      currency,
    };

    for (const programId of matchedIds) {
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

    await sleep(150); // small pause between LLM matching calls
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

    // 2. Probe common fee URL patterns directly (fast, no LLM cost)
    const probedFeeUrls = await probeFeeUrls(origin);

    // 3. Fetch homepage to discover additional fee links via LLM
    const homepage = await safeFetch(websiteUrl);
    let llmFeeUrls: string[] = [];

    if (homepage) {
      result.pages_fetched++;
      const allLinks = extractLinks(homepage, websiteUrl);
      llmFeeUrls = await askGptForFeeLinks(uni.name_en, allLinks);
    }

    // Combine: probed URLs first, then LLM-suggested, then keyword-matched from homepage
    const keywordLinks = homepage ? extractLinks(homepage, websiteUrl).filter(looksLikeFeeLink).slice(0, 5) : [];
    const allFeeUrls = [...new Set([...probedFeeUrls, ...llmFeeUrls, ...keywordLinks])].slice(0, 8);

    if (allFeeUrls.length === 0 && !homepage) {
      result.status = "no_url";
      result.error = "Homepage unreachable and no fee URLs found";
      return result;
    }

    // 4. Fetch each fee page and extract
    result.status = "extracting";
    const extractions: ExtractedFeePage[] = [];

    for (const url of allFeeUrls) {
      await sleep(REQUEST_DELAY_MS);
      const html = await safeFetch(url);
      if (!html) continue;
      result.pages_fetched++;

      const content = extractTextWithTables(html);
      const extracted = await extractFeesFromPage(uni.name_en, url, content);
      if (extracted && extracted.fees.length > 0) {
        extractions.push(extracted);
      }
    }

    // 5. If no fee pages found at all, try extracting from homepage itself
    if (extractions.length === 0 && homepage) {
      const content = extractTextWithTables(homepage);
      const extracted = await extractFeesFromPage(uni.name_en, websiteUrl, content);
      if (extracted && extracted.fees.length > 0) extractions.push(extracted);
    }

    // 6. Merge all extractions and save
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
