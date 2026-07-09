import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const inquiriesTable = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  full_name: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  country: text("country"),
  desired_field: text("desired_field"),
  degree_type: text("degree_type"),
  message: text("message"),
  status: text("status").default("new").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
