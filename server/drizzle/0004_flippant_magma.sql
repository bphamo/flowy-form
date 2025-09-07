ALTER TABLE "users" DROP CONSTRAINT "users_github_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "github_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "avatar_url";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_verified_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "remember_token";