CREATE TABLE "file_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"token" text NOT NULL,
	"permission" text DEFAULT 'view' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "file_shares_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "files" RENAME COLUMN "is_trash" TO "is_trashed";--> statement-breakpoint
CREATE INDEX "file_shares_file_id_idx" ON "file_shares" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "file_shares_token_idx" ON "file_shares" USING btree ("token");