import { Router } from "express";
import { db } from "@workspace/db";
import {
  universitiesTable,
  programsTable,
  facultiesTable,
  settingsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

async function resolveOpenAIKey(): Promise<string | null> {
  const [row] = await db
    .select({ value: settingsTable.value })
    .from(settingsTable)
    .where(eq(settingsTable.key, "openai_api_key"));
  return row?.value || process.env.OPENAI_API_KEY || null;
}

async function resolveOpenAIModel(): Promise<string> {
  const [row] = await db
    .select({ value: settingsTable.value })
    .from(settingsTable)
    .where(eq(settingsTable.key, "openai_model"));
  return row?.value || "gpt-4.1-mini";
}

// POST /advisor/chat
router.post("/advisor/chat", async (req, res) => {
  try {
    const { messages } = req.body as {
      messages: { role: string; content: string }[];
    };

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const apiKey = await resolveOpenAIKey();
    if (!apiKey) {
      return res.status(503).json({
        error:
          "AI Advisor is not configured. Please add your OpenAI API key in Admin → Settings → API Keys.",
      });
    }

    // Fetch catalog data for context
    const [universities, programs, faculties] = await Promise.all([
      db
        .select({
          id: universitiesTable.id,
          name_en: universitiesTable.name_en,
          slug: universitiesTable.slug,
          city_en: universitiesTable.city_en,
          type: universitiesTable.type,
          rank_turkey: universitiesTable.rank_turkey,
          rank_world: universitiesTable.rank_world,
          established_year: universitiesTable.established_year,
          logo_url: universitiesTable.logo_url,
          students_international: universitiesTable.students_international,
        })
        .from(universitiesTable),
      db
        .select({
          id: programsTable.id,
          name_en: programsTable.name_en,
          degree_type: programsTable.degree_type,
          language: programsTable.language,
          duration_years: programsTable.duration_years,
          scholarship_available: programsTable.scholarship_available,
          faculty_id: programsTable.faculty_id,
          is_active: programsTable.is_active,
        })
        .from(programsTable)
        .where(eq(programsTable.is_active, true))
        .limit(400),
      db
        .select({
          id: facultiesTable.id,
          university_id: facultiesTable.university_id,
          name_en: facultiesTable.name_en,
        })
        .from(facultiesTable),
    ]);

    const facultyMap = new Map(faculties.map((f) => [f.id, f]));
    const universityMap = new Map(universities.map((u) => [u.id, u]));

    const uniContext = universities
      .map(
        (u) =>
          `[${u.id}] ${u.name_en} | ${u.city_en} | ${u.type} | TR#${u.rank_turkey ?? "?"} | World#${u.rank_world ?? "?"} | Est:${u.established_year ?? "?"} | slug:${u.slug}`
      )
      .join("\n");

    const progContext = programs
      .map((p) => {
        const faculty = facultyMap.get(p.faculty_id);
        const uni = faculty ? universityMap.get(faculty.university_id) : null;
        return `[${p.id}] ${p.name_en} | ${uni?.name_en ?? "?"} (${uni?.city_en ?? "?"}) | ${p.degree_type} | ${p.language} | ${p.duration_years}yr | schol:${p.scholarship_available ? "Y" : "N"} | uni_slug:${uni?.slug ?? ""}`;
      })
      .join("\n");

    const systemPrompt = `You are UniTurkey AI Study Advisor — a warm, knowledgeable expert helping international students find the right university and degree program in Turkey.

You have access to the complete UniTurkey catalog:

=== UNIVERSITIES (${universities.length}) ===
Format: [ID] Name | City | Type | TR Rank | World Rank | Est | slug
${uniContext}

=== ACTIVE PROGRAMS (${programs.length}) ===
Format: [ID] Name | University (City) | Degree | Language | Duration | Scholarship | uni_slug
${progContext}

CONVERSATION APPROACH:
1. On the first message, greet the student and ask about their goals
2. Gather key info through natural conversation: field of study, degree type (bachelor/master/doctorate), language preference (Turkish/English/other), city preference, scholarship needs, budget
3. Recommend matching programs with clear explanations of why each fits their profile
4. Be concise and friendly — no more than 3-4 short paragraphs per reply

CRITICAL RULE — you MUST end EVERY response with this exact block (even your greeting):
---
RECOMMENDATIONS_JSON:[{"type":"program","id":123,"name":"Computer Engineering","university_name":"Istanbul Tech","university_slug":"istanbul-tech","city":"Istanbul","degree_type":"bachelor","language":"English","scholarship":true},{"type":"university","id":5,"name":"Bogazici University","slug":"bogazici-university","city":"Istanbul","university_type":"state","rank_turkey":1}]

RECOMMENDATIONS_JSON rules:
- Always present, even if empty: RECOMMENDATIONS_JSON:[]  
- Maximum 5 items; mix programs and universities as appropriate
- Only use IDs that exist in the catalog above
- Valid JSON only — no trailing commas, no extra text after the array
- For type "program": include id, name, university_name, university_slug, city, degree_type, language, scholarship (bool)
- For type "university": include id, name, slug, city, university_type, rank_turkey`;

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const model = await resolveOpenAIModel();
    const client = new OpenAI({ apiKey });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await client.chat.completions.create({
      model,
      max_tokens: 2000,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    req.log?.error?.({ err }, "Advisor chat failed");
    if (!res.headersSent) {
      res.status(500).json({ error: err.message ?? "Internal server error" });
    } else {
      res.write(
        `data: ${JSON.stringify({ error: err.message ?? "Unknown error" })}\n\n`
      );
      res.end();
    }
  }
});

export default router;
