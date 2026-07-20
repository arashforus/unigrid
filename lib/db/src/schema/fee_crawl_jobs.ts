import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export type FeeCrawlUniversityResult = {
  university_id: number;
  university_name: string;
  website_url: string | null;
  status: "pending" | "no_url" | "fetching" | "extracting" | "done" | "failed";
  pages_fetched: number;
  fees_saved: number;
  error?: string;
};

export type FeeCrawlStats = {
  universities_total: number;
  universities_done: number;
  universities_with_fees: number;
  universities_no_url: number;
  universities_failed: number;
  fees_saved: number;
  results: FeeCrawlUniversityResult[];
};

export const emptyFeeCrawlStats = (): FeeCrawlStats => ({
  universities_total: 0,
  universities_done: 0,
  universities_with_fees: 0,
  universities_no_url: 0,
  universities_failed: 0,
  fees_saved: 0,
  results: [],
});

export const feeCrawlJobsTable = pgTable("fee_crawl_jobs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("pending"),
  triggered_by: integer("triggered_by"),
  started_at: timestamp("started_at").defaultNow().notNull(),
  finished_at: timestamp("finished_at"),
  stats: jsonb("stats").$type<FeeCrawlStats>().notNull().default(emptyFeeCrawlStats()),
  error: text("error"),
});

export type FeeCrawlJob = typeof feeCrawlJobsTable.$inferSelect;
