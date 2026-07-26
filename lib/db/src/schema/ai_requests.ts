import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const aiRequestsTable = pgTable("ai_requests", {
  id: serial("id").primaryKey(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  source: text("source").notNull(), // 'fee-crawler' | 'program-enrich' | 'university-enrich'
  model: text("model").notNull(),
  status: text("status").notNull().default("success"), // 'success' | 'error'
  prompt_tokens: integer("prompt_tokens").notNull().default(0),
  completion_tokens: integer("completion_tokens").notNull().default(0),
  total_tokens: integer("total_tokens").notNull().default(0),
  duration_ms: integer("duration_ms"),
  request_text: text("request_text"),
  response_text: text("response_text"),
  error: text("error"),
  context: jsonb("context").$type<Record<string, unknown>>(),
});

export type AiRequest = typeof aiRequestsTable.$inferSelect;
