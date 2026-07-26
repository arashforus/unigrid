import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const newsTable = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary"),
  content: text("content"),
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
