-- Add extended university fields and AI-enriched program fields missing from initial migration.

-- Universities: extended info columns
DO $$ BEGIN
  ALTER TABLE "universities" ADD COLUMN "established_year" integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "universities" ADD COLUMN "latitude" double precision;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "universities" ADD COLUMN "longitude" double precision;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "universities" ADD COLUMN "rank_turkey" integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "universities" ADD COLUMN "rank_world" integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "universities" ADD COLUMN "students_total" integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "universities" ADD COLUMN "students_international" integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "universities" ADD COLUMN "campus_size_ha" integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint

-- Programs: AI-enriched fields
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "description_en" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "description_tr" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "description_fa" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "description_ar" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "admission_requirements" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "admission_requirements_tr" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "admission_requirements_fa" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "admission_requirements_ar" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "quota_total" integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "quota_international" integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "application_deadline_fall" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "application_deadline_spring" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "scholarship_available" boolean;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "scholarship_description" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "scholarship_description_tr" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "scholarship_description_fa" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "scholarship_description_ar" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "programs" ADD COLUMN "thesis_option" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
