import type { UniversityFeeAdapter, FeeResult } from "./types";

const SOURCE_URL = "https://w3.bilkent.edu.tr/bilkent/international-and-other-students-tuition-fees/";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export const bilkentFeeAdapter: UniversityFeeAdapter = {
  id: "bilkent",
  matchName: "bilkent",

  async fetchFee(): Promise<FeeResult | null> {
    const res = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "UniTurkey-Crawler/1.0" },
    });
    if (!res.ok) return null;

    const text = stripHtml(await res.text());

    const yearMatch = text.match(/(\d{4})\s*[–-]\s*(\d{4})\s*academic year/i);
    const academicYear = yearMatch ? `${yearMatch[1]}-${yearMatch[2]}` : null;

    const tierRe = /admitted (?:in|before) (\d{4}) is ([\d,]+)\s*USD/gi;
    let best: { year: number; amount: number } | null = null;
    let m: RegExpExecArray | null;
    while ((m = tierRe.exec(text)) !== null) {
      const year = Number(m[1]);
      const amount = Number(m[2].replace(/,/g, ""));
      if (!best || year > best.year) best = { year, amount };
    }

    if (!academicYear || !best) return null;

    return {
      scope: "all_programs",
      academic_year: academicYear,
      domestic_fee: null,
      international_fee: best.amount,
      domestic_currency: "TRY",
      international_currency: "USD",
      source_url: SOURCE_URL,
    };
  },
};
