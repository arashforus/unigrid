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
  language: text("language").notNull(), // 'Turkish', 'English', 'Turkish/English'
  duration_years: integer("duration_years").notNull(),
  is_active: boolean("is_active").notNull().default(true),
});

export const insertProgramSchema = createInsertSchema(programsTable).omit({ id: true });
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programsTable.$inferSelect;
