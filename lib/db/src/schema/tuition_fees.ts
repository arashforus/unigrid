import { pgTable, serial, text, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { programsTable } from "./programs";

export const tuitionFeesTable = pgTable("tuition_fees", {
  id: serial("id").primaryKey(),
  program_id: integer("program_id").notNull().references(() => programsTable.id),
  academic_year: text("academic_year").notNull(), // e.g. '2024-2025'
  domestic_fee: numeric("domestic_fee"),
  international_fee: numeric("international_fee"),
  currency: text("currency").notNull().default("TRY"),
});

export const insertTuitionFeeSchema = createInsertSchema(tuitionFeesTable).omit({ id: true });
export type InsertTuitionFee = z.infer<typeof insertTuitionFeeSchema>;
export type TuitionFee = typeof tuitionFeesTable.$inferSelect;
