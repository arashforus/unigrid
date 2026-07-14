// Thin client for YÖK Atlas's public JSON API (https://yokatlas.yok.gov.tr).
// These are the same endpoints the SPA at yokatlas.yok.gov.tr calls itself —
// there is no official public API docs page, but the endpoints are stable
// and used by other open-source tools (e.g. github.com/saidsurucu/yokatlas-py).
//
// Coverage:
//   • Undergraduate (LISANS + ÖNLISANS): /api/tercih-kilavuz/search
//   • Graduate (YÜKSEK LİSANS + DOKTORA): /api/lisansustu-kilavuz/search
//
// Tuition fees: YÖK Atlas removed fee sub-pages in its April 2026 SPA
// migration, so fees come from each university's own site (see feeAdapters/).

const BASE_URL = "https://yokatlas.yok.gov.tr";
const REQUEST_DELAY_MS = 200; // be a polite, low-rate caller

// --------------------------------------------------------------------------
// Shared types
// --------------------------------------------------------------------------

export type YokUniversity = {
  universiteId: number;
  universiteAdi: string;
};

// --------------------------------------------------------------------------
// Undergraduate programs (tercih-kilavuz — LISANS + ÖNLISANS)
// --------------------------------------------------------------------------

export type YokProgram = {
  kilavuzKodu: number;
  universiteId: number;
  universiteAdi: string;
  uniIlAdi?: string | null;
  fymkAdi?: string | null;           // faculty / school name (Turkish)
  birimAdi: string;                  // program name (Turkish)
  birimTuruAdi: "LISANS" | "ONLISANS" | string;
  ogrenimTuruAdi?: string | null;
  ogrenimSuresi?: number | null;
  ogrenimDiliAdi?: string | null;
  bursOraniAdi?: string | null;
  universiteTuru: "DEVLET" | "VAKIF" | string;
};

// --------------------------------------------------------------------------
// Graduate programs (lisansustu-kilavuz — YÜKSEK LİSANS + DOKTORA)
// --------------------------------------------------------------------------

export type YokGraduateProgram = {
  kilavuzKodu?: number | null;
  universiteId: number;
  universiteAdi: string;
  uniIlAdi?: string | null;
  enstituAdi?: string | null;        // institute (e.g. "Fen Bilimleri Enstitüsü")
  anabilimDaliAdi?: string | null;   // department / field of study
  programAdi: string;                // program name
  programTuruAdi: string;            // "Tezli Yüksek Lisans" | "Tezsiz Yüksek Lisans" | "Doktora" | …
  ogrenimSuresi?: number | null;
  ogrenimDiliAdi?: string | null;
  universiteTuru?: "DEVLET" | "VAKIF" | string;
};

// --------------------------------------------------------------------------
// Internal helpers
// --------------------------------------------------------------------------

type SearchResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  last: boolean;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // Browser-like headers to reduce WAF friction
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      Origin: "https://yokatlas.yok.gov.tr",
    },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // Detect WAF block page
    if (body.includes("Access To This Page Has Been Blocked") || body.includes("Blocked!")) {
      throw new WafBlockError(`YÖK Atlas WAF blocked the request to ${path}`);
    }
    throw new Error(`YÖK Atlas HTTP ${res.status} ${res.statusText} (${path})`);
  }

  return (await res.json()) as T;
}

/** Thrown when the YÖK Atlas WAF rejects a request by IP. */
export class WafBlockError extends Error {
  readonly isWafBlock = true;
  constructor(msg: string) {
    super(msg);
    this.name = "WafBlockError";
  }
}

// --------------------------------------------------------------------------
// University list
// --------------------------------------------------------------------------

export async function listUniversities(): Promise<YokUniversity[]> {
  return fetchJson<YokUniversity[]>("/api/tercih-kilavuz/universiteler");
}

// --------------------------------------------------------------------------
// Undergraduate programs (LISANS + ÖNLISANS) — one university at a time
// --------------------------------------------------------------------------

export async function listUndergraduateProgramsForUniversity(
  universiteId: number,
): Promise<YokProgram[]> {
  const all: YokProgram[] = [];
  let page = 0;
  const size = 100;

  while (true) {
    const body = {
      filters: {
        puanTuru: null,
        universiteId: [universiteId],
        birimGrupId: [],
        ilKodu: [],
        birimTuruId: null,       // null = all types (LISANS + ONLISANS)
        universiteTuru: null,
        bursOraniId: null,
        ogrenimTuruId: null,
        kilavuzKodu: null,
        minBasariSirasi: null,
        maxBasariSirasi: null,
      },
      page,
      size,
      sortBy: "basariSirasi",
      direction: "ASC",
    };

    const result = await fetchJson<SearchResponse<YokProgram>>(
      "/api/tercih-kilavuz/search",
      { method: "POST", body: JSON.stringify(body) },
    );

    all.push(...result.content);
    if (result.last || result.content.length === 0) break;
    page += 1;
    await sleep(REQUEST_DELAY_MS);
  }

  return all;
}

/** @deprecated Use listUndergraduateProgramsForUniversity */
export const listProgramsForUniversity = listUndergraduateProgramsForUniversity;

// --------------------------------------------------------------------------
// Graduate programs (YÜKSEK LİSANS + DOKTORA) — one university at a time
//
// The lisansustu-kilavuz endpoint may be WAF-blocked when running from
// certain hosting IPs.  Callers should catch WafBlockError and skip
// gracefully rather than failing the whole job.
// --------------------------------------------------------------------------

export async function listGraduateProgramsForUniversity(
  universiteId: number,
): Promise<YokGraduateProgram[]> {
  const all: YokGraduateProgram[] = [];
  let page = 0;
  const size = 100;

  while (true) {
    const body = {
      filters: {
        universiteId: [universiteId],
        anabilimDaliId: [],
        programTuruId: null,     // null = all (master + doctorate)
        universiteTuru: null,
        ogrenimTuruId: null,
        ogrenimDiliId: null,
        minKontenjan: null,
        maxKontenjan: null,
      },
      page,
      size,
      sortBy: "universiteAdi",
      direction: "ASC",
    };

    const result = await fetchJson<SearchResponse<YokGraduateProgram>>(
      "/api/lisansustu-kilavuz/search",
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          Referer: "https://yokatlas.yok.gov.tr/lisansustuliste.php",
        } as any,
      },
    );

    all.push(...result.content);
    if (result.last || result.content.length === 0) break;
    page += 1;
    await sleep(REQUEST_DELAY_MS);
  }

  return all;
}
