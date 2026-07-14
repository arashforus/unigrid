// Thin client for YÖK Atlas's public JSON API (https://yokatlas.yok.gov.tr).
// These are the same endpoints the SPA at yokatlas.yok.gov.tr calls itself —
// there is no official public API docs page, but the endpoints are stable
// and used by other open-source tools (e.g. github.com/saidsurucu/yokatlas-py).
//
// Coverage: university list + per-program details (name, faculty, degree
// type, language of instruction, duration, quotas). It does NOT include
// tuition fee amounts — YÖK Atlas removed the fee sub-pages in its April
// 2026 SPA migration, so fees have to come from each university's own site
// (see feeAdapters/).

const BASE_URL = "https://yokatlas.yok.gov.tr";
const REQUEST_DELAY_MS = 150; // be a polite, low-rate caller

export type YokUniversity = {
  universiteId: number;
  universiteAdi: string;
};

export type YokProgram = {
  kilavuzKodu: number; // stable per-program code -> our programs.yok_atlas_code
  universiteId: number;
  universiteAdi: string;
  uniIlAdi?: string | null; // city (Turkish)
  fymkAdi?: string | null; // faculty / school name (Turkish)
  birimAdi: string; // program name (Turkish)
  birimTuruAdi: "LISANS" | "ONLISANS";
  ogrenimTuruAdi?: string | null; // 'Örgün Öğretim', 'İkinci Öğretim', ...
  ogrenimSuresi?: number | null; // duration in years
  ogrenimDiliAdi?: string | null; // language of instruction
  bursOraniAdi?: string | null; // fee/scholarship tier label, e.g. "Ücretli", "%50 İndirimli", "Tam Burslu"
  universiteTuru: "DEVLET" | "VAKIF";
};

type SearchResponse = {
  content: YokProgram[];
  totalPages: number;
  totalElements: number;
  last: boolean;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`YÖK Atlas request failed: ${res.status} ${res.statusText} (${path})`);
  }
  return (await res.json()) as T;
}

export async function listUniversities(): Promise<YokUniversity[]> {
  return fetchJson<YokUniversity[]>("/api/tercih-kilavuz/universiteler");
}

/** Fetches every program for a single university, paging through results. */
export async function listProgramsForUniversity(universiteId: number): Promise<YokProgram[]> {
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
        birimTuruId: null,
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

    const result = await fetchJson<SearchResponse>("/api/tercih-kilavuz/search", {
      method: "POST",
      body: JSON.stringify(body),
    });

    all.push(...result.content);

    if (result.last || result.content.length === 0) break;
    page += 1;
    await sleep(REQUEST_DELAY_MS);
  }

  return all;
}
