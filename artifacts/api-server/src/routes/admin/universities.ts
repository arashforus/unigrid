import { Router } from "express";
import { db } from "@workspace/db";
import { universitiesTable, facultiesTable, settingsTable, insertUniversitySchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

/** Resolve the OpenAI API key: DB setting takes priority, then env var. */
async function resolveOpenAIKey(): Promise<string | null> {
  const [row] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, "openai_api_key"))
    .limit(1);
  return row?.value || process.env.OPENAI_API_KEY || null;
}

/** Resolve the configured OpenAI model from DB settings, with fallback. */
async function resolveOpenAIModel(): Promise<string> {
  try {
    const [row] = await db
      .select({ value: settingsTable.value })
      .from(settingsTable)
      .where(eq(settingsTable.key, "openai_model"))
      .limit(1);
    return row?.value?.trim() || DEFAULT_OPENAI_MODEL;
  } catch {
    return DEFAULT_OPENAI_MODEL;
  }
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

// POST /admin/universities/:id/ai-enrich  — single AI request for all university data
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
    const [client, model] = [new OpenAI({ apiKey }), await resolveOpenAIModel()];

    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a factual research assistant with deep knowledge of Turkish universities. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Provide comprehensive, accurate information about the following Turkish university.

University: "${university.name_en}" (Turkish: "${university.name_tr}")
City: ${university.city_en}, Turkey
Slug: ${university.slug}

Return a single JSON object with EXACTLY these fields (no extra fields):
{
  "logo_url": "Direct URL to the official university logo image from the university's own website, or null if not confident",
  "description_en": "Detailed English description ~3000 characters: history, academic strengths, faculties, campus life, international programs, notable achievements",
  "description_tr": "Aynı içeriğin Türkçe versiyonu, ~3000 karakter",
  "description_fa": "همان محتوا به فارسی، حدود ۳۰۰۰ کاراکتر",
  "description_ar": "نفس المحتوى باللغة العربية، حوالي ٣٠٠٠ حرف",
  "latitude": <campus center latitude as a number, e.g. 41.0833>,
  "longitude": <campus center longitude as a number, e.g. 29.05>,
  "rank_turkey": <most recent QS ranking within Turkey as integer, or null if unranked>,
  "rank_world": <most recent QS world ranking as integer, or null if outside top rankings — use midpoint if given as a band e.g. "401-450" → 425>,
  "students_total": <total enrolled students as integer, or null if unknown>,
  "students_international": <international students as integer, or null if unknown>,
  "established_year": <founding year as integer, or null if unknown>
}

Be factual and precise. Use integers only for all numeric fields. Descriptions must be rich engaging prose — not bullet points.`,
        },
      ],
      max_completion_tokens: 8000,
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

  const apiKey = await resolveOpenAIKey();
  if (!apiKey) {
    res.status(503).json({ error: "OpenAI API key not configured. Add it in Admin → Settings → API Keys." });
    return;
  }

  try {
    const [client, model] = [new OpenAI({ apiKey }), await resolveOpenAIModel()];
    const prompt = `What is the official website URL for "${university.name_en}" (also known as "${university.name_tr}"), located in ${university.city_en}, Turkey?
Reply with a JSON object: { "url": "https://..." } — the URL must be the real homepage, starting with https://. If you don't know it with confidence, reply { "url": null }.`;

    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a factual assistant. Return only valid JSON with the official university website URL.",
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 100,
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
