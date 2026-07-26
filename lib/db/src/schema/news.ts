import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const newsTable = pgTable("news", {
  id: serial("id").primaryKey(),
  // Titles — EN is required; others optional
  title_en: text("title_en").notNull(),
  title_tr: text("title_tr"),
  title_fa: text("title_fa"),
  title_ar: text("title_ar"),
  // Single URL slug (EN-based, used for routing)
  slug: text("slug").notNull().unique(),
  // Summaries
  summary_en: text("summary_en"),
  summary_tr: text("summary_tr"),
  summary_fa: text("summary_fa"),
  summary_ar: text("summary_ar"),
  // Full content (Markdown)
  content_en: text("content_en"),
  content_tr: text("content_tr"),
  content_fa: text("content_fa"),
  content_ar: text("content_ar"),
  // Meta
  cover_image_url: text("cover_image_url"),
  category: text("category").notNull().default("general"),
  author: text("author"),
  is_published: boolean("is_published").notNull().default(false),
  published_at: timestamp("published_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type NewsItem = typeof newsTable.$inferSelect;
export type InsertNewsItem = typeof newsTable.$inferInsert;
