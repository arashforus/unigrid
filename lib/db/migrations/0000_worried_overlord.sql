-- Initial schema migration.
-- Written as idempotent (IF NOT EXISTS / DO blocks) so it can run safely
-- against a database that was previously bootstrapped with drizzle-kit push.
CREATE TABLE IF NOT EXISTS "universities" (
"id" serial PRIMARY KEY NOT NULL,
"name_en" text NOT NULL,
"name_tr" text NOT NULL,
"name_fa" text NOT NULL,
"name_ar" text NOT NULL,
"slug" text NOT NULL,
"type" text NOT NULL,
"city_en" text NOT NULL,
"city_tr" text NOT NULL,
"city_fa" text NOT NULL,
"city_ar" text NOT NULL,
"website_url" text,
"apply_url_international" text,
"logo_url" text,
"description_en" text,
"description_tr" text,
"description_fa" text,
"description_ar" text,
"yok_universite_id" integer,
CONSTRAINT "universities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faculties" (
"id" serial PRIMARY KEY NOT NULL,
"university_id" integer NOT NULL,
"name_en" text NOT NULL,
"name_tr" text NOT NULL,
"name_fa" text NOT NULL,
"name_ar" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programs" (
"id" serial PRIMARY KEY NOT NULL,
"faculty_id" integer NOT NULL,
"name_en" text NOT NULL,
"name_tr" text NOT NULL,
"name_fa" text NOT NULL,
"name_ar" text NOT NULL,
"yok_atlas_code" text,
"degree_type" text NOT NULL,
"language" text NOT NULL,
"duration_years" integer NOT NULL,
"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tuition_fees" (
"id" serial PRIMARY KEY NOT NULL,
"program_id" integer NOT NULL,
"academic_year" text NOT NULL,
"domestic_fee" numeric,
"international_fee" numeric,
"currency" text DEFAULT 'TRY' NOT NULL,
"domestic_currency" text DEFAULT 'TRY' NOT NULL,
"international_currency" text DEFAULT 'TRY' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inquiries" (
"id" serial PRIMARY KEY NOT NULL,
"full_name" text NOT NULL,
"email" text NOT NULL,
"phone" text,
"country" text,
"desired_field" text,
"degree_type" text,
"message" text,
"status" text DEFAULT 'new' NOT NULL,
"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
"id" serial PRIMARY KEY NOT NULL,
"name" text NOT NULL,
"email" text NOT NULL,
"password_hash" text NOT NULL,
"role" text DEFAULT 'student' NOT NULL,
"created_at" timestamp DEFAULT now() NOT NULL,
CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
"key" text PRIMARY KEY NOT NULL,
"value" text NOT NULL,
"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crawl_jobs" (
"id" serial PRIMARY KEY NOT NULL,
"source" text NOT NULL,
"status" text DEFAULT 'pending' NOT NULL,
"triggered_by" integer,
"started_at" timestamp DEFAULT now() NOT NULL,
"finished_at" timestamp,
"stats" jsonb DEFAULT '{"universities_seen":0,"universities_created":0,"universities_updated":0,"faculties_created":0,"programs_seen":0,"programs_created":0,"programs_updated":0,"fees_updated":0,"errors":[]}'::jsonb NOT NULL,
"error" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fee_crawl_jobs" (
"id" serial PRIMARY KEY NOT NULL,
"status" text DEFAULT 'pending' NOT NULL,
"triggered_by" integer,
"started_at" timestamp DEFAULT now() NOT NULL,
"finished_at" timestamp,
"stats" jsonb DEFAULT '{"universities_total":0,"universities_done":0,"universities_with_fees":0,"universities_no_url":0,"universities_failed":0,"fees_saved":0,"llm_requests":0,"llm_tokens":{"prompt":0,"completion":0,"total":0},"results":[]}'::jsonb NOT NULL,
"error" text
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "faculties" ADD CONSTRAINT "faculties_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD CONSTRAINT "programs_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tuition_fees" ADD CONSTRAINT "tuition_fees_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
