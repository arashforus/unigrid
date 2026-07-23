import { pgTable, serial, text, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const universitiesTable = pgTable("universities", {
  id: serial("id").primaryKey(),
  name_en: text("name_en").notNull(),
  name_tr: text("name_tr").notNull(),
  name_fa: text("name_fa").notNull(),
  name_ar: text("name_ar").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // 'state' | 'private' | 'foundation'
  city_en: text("city_en").notNull(),
  city_tr: text("city_tr").notNull(),
  city_fa: text("city_fa").notNull(),
  city_ar: text("city_ar").notNull(),
  website_url: text("website_url"),
  apply_url_international: text("apply_url_international"),
  logo_url: text("logo_url"),
  description_en: text("description_en"),
  description_tr: text("description_tr"),
  description_fa: text("description_fa"),
  description_ar: text("description_ar"),
  yok_universite_id: integer("yok_universite_id"),
  // Extended info
  established_year: integer("established_year"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  rank_turkey: integer("rank_turkey"),
  rank_world: integer("rank_world"),
  students_total: integer("students_total"),
  students_international: integer("students_international"),
  campus_size_ha: integer("campus_size_ha"),
});

export const insertUniversitySchema = createInsertSchema(universitiesTable).omit({ id: true });
export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
export type University = typeof universitiesTable.$inferSelect;
