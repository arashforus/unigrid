import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { universitiesTable } from "./universities";

export const facultiesTable = pgTable("faculties", {
  id: serial("id").primaryKey(),
  university_id: integer("university_id").notNull().references(() => universitiesTable.id),
  name_en: text("name_en").notNull(),
  name_tr: text("name_tr").notNull(),
  name_fa: text("name_fa").notNull(),
  name_ar: text("name_ar").notNull(),
});

export const insertFacultySchema = createInsertSchema(facultiesTable).omit({ id: true });
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Faculty = typeof facultiesTable.$inferSelect;
