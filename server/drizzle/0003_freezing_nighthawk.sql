CREATE TABLE IF NOT EXISTS "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Drop foreign key constraints first
ALTER TABLE "form_versions" DROP CONSTRAINT IF EXISTS "form_versions_created_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "forms" DROP CONSTRAINT IF EXISTS "forms_created_by_users_id_fk";--> statement-breakpoint  
ALTER TABLE "forms" DROP CONSTRAINT IF EXISTS "forms_updated_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT IF EXISTS "submissions_created_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT IF EXISTS "submissions_updated_by_users_id_fk";--> statement-breakpoint

-- Change users.id to text first
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint

-- Now change the referencing columns
ALTER TABLE "form_versions" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "forms" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "forms" ALTER COLUMN "updated_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "updated_by" SET DATA TYPE text;--> statement-breakpoint

-- Recreate foreign key constraints
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint  
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified') THEN
        ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;
    END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='image') THEN
        ALTER TABLE "users" ADD COLUMN "image" text;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='accounts_user_id_users_id_fk') THEN
        ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='sessions_user_id_users_id_fk') THEN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;