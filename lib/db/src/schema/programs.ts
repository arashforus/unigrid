import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { facultiesTable } from "./faculties";

export const programsTable = pgTable("programs", {
  id: serial("id").primaryKey(),
  faculty_id: integer("faculty_id").notNull().references(() => facultiesTable.id),
  name_en: text("name_en").notNull(),
  name_tr: text("name_tr").notNull(),
  name_fa: text("name_fa").notNull(),
  name_ar: text("name_ar").notNull(),
  yok_atlas_code: text("yok_atlas_code"),
  degree_type: text("degree_type").notNull(), // 'associate' | 'bachelor' | 'master' | 'doctorate'
  language: text("language").notNull(),       // 'Turkish', 'English', 'Turkish/English'
  duration_years: integer("duration_years").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  // AI-enriched fields
  description_en: text("description_en"),
  description_tr: text("description_tr"),
  description_fa: text("description_fa"),
  description_ar: text("description_ar"),
  admission_requirements: text("admission_requirements"),
  admission_requirements_tr: text("admission_requirements_tr"),
  admission_requirements_fa: text("admission_requirements_fa"),
  admission_requirements_ar: text("admission_requirements_ar"),
  quota_total: integer("quota_total"),
  quota_international: integer("quota_international"),
  application_deadline_fall: text("application_deadline_fall"),
  application_deadline_spring: text("application_deadline_spring"),
  scholarship_available: boolean("scholarship_available"),
  scholarship_description: text("scholarship_description"),
  scholarship_description_tr: text("scholarship_description_tr"),
  scholarship_description_fa: text("scholarship_description_fa"),
  scholarship_description_ar: text("scholarship_description_ar"),
  thesis_option: text("thesis_option"), // 'thesis' | 'non-thesis' | 'both' — master/doctorate only
});

export const insertProgramSchema = createInsertSchema(programsTable).omit({ id: true });
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programsTable.$inferSelect;
