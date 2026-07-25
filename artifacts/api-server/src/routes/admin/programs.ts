import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import {
  programsTable,
  facultiesTable,
  universitiesTable,
  tuitionFeesTable,
  settingsTable,
  insertProgramSchema,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

async function resolveOpenAIKey(): Promise<string> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "openai_api_key")).limit(1);
  return row?.value ?? process.env["OPENAI_API_KEY"] ?? "";
}

async function resolveOpenAIModel(): Promise<string> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "openai_model")).limit(1);
  return row?.value ?? "gpt-4.1-mini";
}

const router = Router();

const tuitionFeeInput = z
  .object({
    academic_year: z.string().min(1),
    domestic_fee: z.union([z.string(), z.number()]).nullable().optional(),
    international_fee: z.union([z.string(), z.number()]).nullable().optional(),
    domestic_currency: z.string().min(1).default("TRY"),
    international_currency: z.string().min(1).default("TRY"),
  })
  .nullable()
  .optional();

const programCreateSchema = insertProgramSchema;
const programUpdateSchema = insertProgramSchema.partial();

// GET /admin/programs
router.get("/programs", async (req, res) => {
  try {
    const programs = await db.select().from(programsTable).orderBy(programsTable.id);
    const [faculties, universities, fees] = await Promise.all([
      db.select().from(facultiesTable),
      db.select().from(universitiesTable),
      db.select().from(tuitionFeesTable),
    ]);
    const facultyMap = new Map(faculties.map((f) => [f.id, f]));
    const universityMap = new Map(universities.map((u) => [u.id, u]));
    const feeMap = new Map<number, typeof fees>();
    for (const fee of fees) {
      if (!feeMap.has(fee.program_id)) feeMap.set(fee.program_id, []);
      feeMap.get(fee.program_id)!.push(fee);
    }

    res.json(
      programs.map((p) => {
        const faculty = facultyMap.get(p.faculty_id);
        const university = faculty ? universityMap.get(faculty.university_id) : undefined;
        return {
          ...p,
          faculty_name: faculty?.name_en ?? null,
          university_name: university?.name_en ?? null,
          university_id: university?.id ?? null,
          tuition_fees: feeMap.get(p.id) ?? [],
        };
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list programs (admin)");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/programs
router.post("/programs", async (req, res) => {
  const { tuition_fee: rawFee, ...rest } = req.body as Record<string, unknown>;
  const parsed = programCreateSchema.safeParse(rest);
  const parsedFee = tuitionFeeInput.safeParse(rawFee);
  if (!parsed.success || !parsedFee.success) {
    res.status(400).json({
      error: "Invalid course data",
      details: !parsed.success ? parsed.error.flatten() : parsedFee.error?.flatten(),
    });
    return;
  }
  const programData = parsed.data;
  const tuition_fee = parsedFee.data;

  try {
    const [created] = await db.insert(programsTable).values(programData).returning();

    if (tuition_fee) {
      await db.insert(tuitionFeesTable).values({
        program_id: created.id,
        academic_year: tuition_fee.academic_year,
        domestic_fee: tuition_fee.domestic_fee != null ? String(tuition_fee.domestic_fee) : null,
        international_fee: tuition_fee.international_fee != null ? String(tuition_fee.international_fee) : null,
        domestic_currency: tuition_fee.domestic_currency,
        international_currency: tuition_fee.international_currency,
        currency: tuition_fee.domestic_currency,
      });
    }

    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "23503") {
      res.status(400).json({ error: "Selected faculty does not exist" });
      return;
    }
    req.log.error({ err }, "Failed to create course");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/programs/:id
router.put("/programs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid course id" });
    return;
  }
  const { tuition_fee: rawFee, ...rest } = req.body as Record<string, unknown>;
  const parsed = programUpdateSchema.safeParse(rest);
  const parsedFee = tuitionFeeInput.safeParse(rawFee);
  if (!parsed.success || !parsedFee.success) {
    res.status(400).json({
      error: "Invalid course data",
      details: !parsed.success ? parsed.error.flatten() : parsedFee.error?.flatten(),
    });
    return;
  }
  const programData = parsed.data;
  const tuition_fee = parsedFee.data;

  try {
    const [updated] = await db
      .update(programsTable)
      .set(programData)
      .where(eq(programsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    if (tuition_fee) {
      const [existing] = await db
        .select()
        .from(tuitionFeesTable)
        .where(eq(tuitionFeesTable.program_id, id))
        .limit(1);

      const values = {
        academic_year: tuition_fee.academic_year,
        domestic_fee: tuition_fee.domestic_fee != null ? String(tuition_fee.domestic_fee) : null,
        international_fee: tuition_fee.international_fee != null ? String(tuition_fee.international_fee) : null,
        domestic_currency: tuition_fee.domestic_currency,
        international_currency: tuition_fee.international_currency,
        currency: tuition_fee.domestic_currency,
      };

      if (existing) {
        await db.update(tuitionFeesTable).set(values).where(eq(tuitionFeesTable.id, existing.id));
      } else {
        await db.insert(tuitionFeesTable).values({ program_id: id, ...values });
      }
    }

    res.json(updated);
  } catch (err: any) {
    if (err?.code === "23503") {
      res.status(400).json({ error: "Selected faculty does not exist" });
      return;
    }
    req.log.error({ err }, "Failed to update course");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/programs/:id
router.delete("/programs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid course id" });
    return;
  }

  try {
    await db.delete(tuitionFeesTable).where(eq(tuitionFeesTable.program_id, id));
    const [deleted] = await db.delete(programsTable).where(eq(programsTable.id, id)).returning({ id: programsTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete course");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/programs/:id/ai-enrich
router.post("/programs/:id/ai-enrich", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid program id" });
    return;
  }

  try {
    const [program] = await db.select().from(programsTable).where(eq(programsTable.id, id)).limit(1);
    if (!program) {
      res.status(404).json({ error: "Program not found" });
      return;
    }

    const [faculty] = await db
      .select()
      .from(facultiesTable)
      .where(eq(facultiesTable.id, program.faculty_id))
      .limit(1);

    const university = faculty
      ? (
          await db
            .select()
            .from(universitiesTable)
            .where(eq(universitiesTable.id, faculty.university_id))
            .limit(1)
        )[0]
      : undefined;

    const [apiKey, model] = await Promise.all([resolveOpenAIKey(), resolveOpenAIModel()]);
    if (!apiKey) {
      res.status(400).json({ error: "No OpenAI API key configured" });
      return;
    }

    const client = new OpenAI({ apiKey });

    const isMasterOrDoc = program.degree_type === "master" || program.degree_type === "doctorate";

    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a factual research assistant specializing in Turkish higher education. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Provide detailed, accurate information about the following university program in Turkey.

Program: "${program.name_en}" (${program.name_tr})
University: "${university?.name_en ?? "Unknown"}"
Faculty: "${faculty?.name_en ?? "Unknown"}"
Degree type: ${program.degree_type}
Language of instruction: ${program.language}
Duration: ${program.duration_years} years

Return a single JSON object with EXACTLY these fields:
{
  "description_en": "Rich ~1500 character description: what students study, key course areas, specializations, career outcomes, and what makes this program notable",
  "description_tr": "Aynı içeriğin Türkçe versiyonu, ~1500 karakter",
  "description_fa": "همان محتوا به فارسی، حدود ۱۵۰۰ کاراکتر",
  "description_ar": "نفس المحتوى باللغة العربية، حوالي ١٥٠٠ حرف",
  "admission_requirements": "English prose 300-500 chars: minimum GPA, language test scores (TOEFL/IELTS/YÖS), entrance exam requirements, key document requirements for international students. Use typical Turkish university standards if specifics are unknown.",
  "quota_total": <total program seat quota as integer, or null if unknown>,
  "quota_international": <international student quota as integer, or null if unknown>,
  "application_deadline_fall": "Typical fall deadline for international applicants e.g. 'July 31', or null if unknown",
  "application_deadline_spring": "Typical spring deadline e.g. 'December 31', or null if program is fall-only or unknown",
  "scholarship_available": <true if merit/need scholarships are commonly offered, false if definitely none, null if unknown>,
  "scholarship_description": "Brief description of scholarship types and typical amounts if available, else null",
  "thesis_option": ${isMasterOrDoc ? '"thesis", "non-thesis", or "both" — whether this program offers a thesis track, coursework-only track, or both' : "null"}
}

Be factual. Use null for any field you are not confident about.`,
        },
      ],
      max_completion_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw);

    const update = {
      description_en: typeof data.description_en === "string" ? data.description_en : null,
      description_tr: typeof data.description_tr === "string" ? data.description_tr : null,
      description_fa: typeof data.description_fa === "string" ? data.description_fa : null,
      description_ar: typeof data.description_ar === "string" ? data.description_ar : null,
      admission_requirements:
        typeof data.admission_requirements === "string" ? data.admission_requirements : null,
      quota_total: Number.isInteger(data.quota_total) ? data.quota_total : null,
      quota_international: Number.isInteger(data.quota_international) ? data.quota_international : null,
      application_deadline_fall:
        typeof data.application_deadline_fall === "string" ? data.application_deadline_fall : null,
      application_deadline_spring:
        typeof data.application_deadline_spring === "string" ? data.application_deadline_spring : null,
      scholarship_available:
        typeof data.scholarship_available === "boolean" ? data.scholarship_available : null,
      scholarship_description:
        typeof data.scholarship_description === "string" ? data.scholarship_description : null,
      thesis_option: ["thesis", "non-thesis", "both"].includes(data.thesis_option)
        ? data.thesis_option
        : null,
    };

    const [updated] = await db
      .update(programsTable)
      .set(update)
      .where(eq(programsTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to AI-enrich program");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
