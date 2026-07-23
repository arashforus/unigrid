import { Router } from "express";
import { db } from "@workspace/db";
import { universitiesTable, facultiesTable, settingsTable, insertUniversitySchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

/** Resolve the OpenAI API key: DB setting takes priority, then env var. */
async function resolveOpenAIKey(): Promise<string | null> {
  const [row] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, "openai_api_key"))
    .limit(1);
  return row?.value || process.env.OPENAI_API_KEY || null;
}

const router = Router();

// GET /admin/universities
router.get("/universities", async (req, res) => {
  try {
    const universities = await db.select().from(universitiesTable).orderBy(universitiesTable.id);
    res.json(universities);
  } catch (err) {
    req.log.error({ err }, "Failed to list universities (admin)");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/faculties
router.get("/faculties", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: facultiesTable.id,
        name_en: facultiesTable.name_en,
        university_id: facultiesTable.university_id,
        university_name: universitiesTable.name_en,
      })
      .from(facultiesTable)
      .innerJoin(universitiesTable, eq(facultiesTable.university_id, universitiesTable.id))
      .orderBy(universitiesTable.name_en, facultiesTable.name_en);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list faculties (admin)");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/universities
router.post("/universities", async (req, res) => {
  const parsed = insertUniversitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid university data", details: parsed.error.flatten() });
    return;
  }

  try {
    const [created] = await db.insert(universitiesTable).values(parsed.data).returning();
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A university with this slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to create university");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/universities/:id
router.put("/universities/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid university id" });
    return;
  }
  const parsed = insertUniversitySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid university data", details: parsed.error.flatten() });
    return;
  }

  try {
    const [updated] = await db
      .update(universitiesTable)
      .set(parsed.data)
      .where(eq(universitiesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "University not found" });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A university with this slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to update university");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Fetch the latest QS rankings for a university using OpenAI's web search.
 * Returns null values if the search fails or rankings are not found.
 */
async function fetchLiveQSRankings(
  client: OpenAI,
  nameEn: string,
  nameTr: string,
): Promise<{ rank_turkey: number | null; rank_world: number | null }> {
  try {
    const response = await (client as any).responses.create({
      model: "gpt-4o-mini-search-preview",
      tools: [{ type: "web_search_preview" }],
      input: `Search the web for the most recent QS World University Rankings for "${nameEn}" (Turkish name: "${nameTr}"), a university in Turkey.

Find:
1. Its current QS World University Ranking (global position, e.g. 401-450 or 523)
2. Its current QS ranking among Turkish universities only (e.g. 3rd in Turkey)

Look specifically at topuniversities.com or the official QS rankings website for the 2024 or 2025 edition.

Reply ONLY with a JSON object and nothing else:
{"rank_world": <integer or null>, "rank_turkey": <integer or null>}

Use the midpoint if a band is given (e.g. "401-450" → 425). Use null if not found in the rankings.`,
    });

    const text: string = response.output_text ?? "";
    // Extract JSON from the response (may have surrounding text)
    const match = text.match(/\{[^{}]*"rank_world"[^{}]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as { rank_world?: unknown; rank_turkey?: unknown };
      return {
        rank_world: typeof parsed.rank_world === "number" ? Math.round(parsed.rank_world) : null,
        rank_turkey: typeof parsed.rank_turkey === "number" ? Math.round(parsed.rank_turkey) : null,
      };
    }
  } catch (_err) {
    // Non-fatal — fall through and let the main prompt handle rankings
  }
  return { rank_world: null, rank_turkey: null };
}

// POST /admin/universities/:id/ai-enrich  — ask AI for rich university data
router.post("/universities/:id/ai-enrich", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid university id" });
    return;
  }

  const [university] = await db
    .select()
    .from(universitiesTable)
    .where(eq(universitiesTable.id, id))
    .limit(1);

  if (!university) {
    res.status(404).json({ error: "University not found" });
    return;
  }

  const apiKey = await resolveOpenAIKey();
  if (!apiKey) {
    res.status(503).json({ error: "OpenAI API key not configured. Add it in Admin → Settings → API Keys." });
    return;
  }

  try {
    const client = new OpenAI({ apiKey });

    // Step 1: fetch live QS rankings via web search so we always use current data
    const liveRankings = await fetchLiveQSRankings(client, university.name_en, university.name_tr ?? "");

    const rankingsContext = liveRankings.rank_world !== null || liveRankings.rank_turkey !== null
      ? `VERIFIED LIVE QS RANKINGS (use these exact values — do not substitute your own):
  - QS World Ranking: ${liveRankings.rank_world ?? "not in top rankings"}
  - QS Turkey Ranking: ${liveRankings.rank_turkey ?? "not found"}
`
      : `QS rankings could not be fetched in real time. Use your best knowledge for rank_turkey and rank_world, or set them to null if uncertain.`;

    const prompt = `You are a factual research assistant with deep knowledge of Turkish universities.
Provide comprehensive, accurate information about the following university.

University: "${university.name_en}" (Turkish: "${university.name_tr}")
City: ${university.city_en}, Turkey
Slug: ${university.slug}

${rankingsContext}

Return a single JSON object with EXACTLY these fields (no extra fields):
{
  "logo_url": "Direct URL to the official university logo image (from the university's own website, e.g. https://www.boun.edu.tr/...logo.png), or null if you are not confident",
  "description_en": "Detailed English description, ~3000 characters covering history, academic strengths, faculties, campus life, international programs, and notable achievements",
  "description_tr": "Aynı içeriğin Türkçe versiyonu, ~3000 karakter",
  "description_fa": "همان محتوا به فارسی، حدود ۳۰۰۰ کاراکتر",
  "description_ar": "نفس المحتوى باللغة العربية، حوالي ٣٠٠٠ حرف",
  "latitude": <campus center latitude as a number, e.g. 41.0833>,
  "longitude": <campus center longitude as a number, e.g. 29.05>,
  "rank_turkey": <QS ranking within Turkey as integer — use the VERIFIED value above if provided>,
  "rank_world": <QS world ranking as integer — use the VERIFIED value above if provided>,
  "students_total": <total enrolled students as integer, or null if unknown>,
  "students_international": <international students as integer, or null if unknown>,
  "established_year": <founding year as integer, or null if unknown>
}

Be factual and precise. For rankings, use integers only.
Descriptions must be rich, engaging prose — not bullet points.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a factual assistant. Return only valid JSON with accurate university data." },
        { role: "user", content: prompt },
      ],
      max_tokens: 8000,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw);

    // Sanitise types before returning
    const result = {
      logo_url: typeof data.logo_url === "string" ? data.logo_url : null,
      description_en: typeof data.description_en === "string" ? data.description_en : null,
      description_tr: typeof data.description_tr === "string" ? data.description_tr : null,
      description_fa: typeof data.description_fa === "string" ? data.description_fa : null,
      description_ar: typeof data.description_ar === "string" ? data.description_ar : null,
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
      rank_turkey: typeof data.rank_turkey === "number" ? Math.round(data.rank_turkey) : null,
      rank_world: typeof data.rank_world === "number" ? Math.round(data.rank_world) : null,
      students_total: typeof data.students_total === "number" ? Math.round(data.students_total) : null,
      students_international: typeof data.students_international === "number" ? Math.round(data.students_international) : null,
      established_year: typeof data.established_year === "number" ? Math.round(data.established_year) : null,
    };

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "AI enrichment failed");
    res.status(500).json({ error: "AI enrichment failed. Check your API key and try again." });
  }
});

// POST /admin/universities/:id/find-url  — ask OpenAI for the official website
router.post("/universities/:id/find-url", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid university id" });
    return;
  }

  const [university] = await db
    .select()
    .from(universitiesTable)
    .where(eq(universitiesTable.id, id))
    .limit(1);

  if (!university) {
    res.status(404).json({ error: "University not found" });
    return;
  }

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "OpenAI API key not configured" });
    return;
  }

  try {
    const client = new OpenAI({ apiKey });
    const prompt = `What is the official website URL for "${university.name_en}" (also known as "${university.name_tr}"), located in ${university.city_en}, Turkey?
Reply with a JSON object: { "url": "https://..." } — the URL must be the real homepage, starting with https://. If you don't know it with confidence, reply { "url": null }.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a factual assistant. Return only valid JSON with the official university website URL.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { url?: string | null };
    const url = typeof parsed.url === "string" && parsed.url.startsWith("http") ? parsed.url : null;

    res.json({ url });
  } catch (err) {
    req.log.error({ err }, "OpenAI URL search failed");
    res.status(500).json({ error: "AI search failed" });
  }
});

// DELETE /admin/universities/:id
router.delete("/universities/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid university id" });
    return;
  }

  try {
    const [existingFaculty] = await db
      .select({ id: facultiesTable.id })
      .from(facultiesTable)
      .where(eq(facultiesTable.university_id, id))
      .limit(1);
    if (existingFaculty) {
      res.status(409).json({ error: "Remove this university's faculties and courses first" });
      return;
    }

    const [deleted] = await db.delete(universitiesTable).where(eq(universitiesTable.id, id)).returning({ id: universitiesTable.id });
    if (!deleted) {
      res.status(404).json({ error: "University not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete university");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
