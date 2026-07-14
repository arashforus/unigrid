import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export type CrawlStats = {
  universities_seen: number;
  universities_created: number;
  universities_updated: number;
  faculties_created: number;
  programs_seen: number;
  programs_created: number;
  programs_updated: number;
  fees_updated: number;
  errors: string[];
};

export const emptyCrawlStats = (): CrawlStats => ({
  universities_seen: 0,
  universities_created: 0,
  universities_updated: 0,
  faculties_created: 0,
  programs_seen: 0,
  programs_created: 0,
  programs_updated: 0,
  fees_updated: 0,
  errors: [],
});

export const crawlJobsTable = pgTable("crawl_jobs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(), // 'yokatlas' | 'fee_adapters'
  status: text("status").notNull().default("pending"), // 'pending' | 'running' | 'success' | 'failed'
  triggered_by: integer("triggered_by"),
  started_at: timestamp("started_at").defaultNow().notNull(),
  finished_at: timestamp("finished_at"),
  stats: jsonb("stats").$type<CrawlStats>().notNull().default(emptyCrawlStats()),
  error: text("error"),
});

export type CrawlJob = typeof crawlJobsTable.$inferSelect;
