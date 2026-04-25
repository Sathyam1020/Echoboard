CREATE TABLE "visitor" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"external_id" text,
	"email" text,
	"name" text,
	"avatar_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"auth_method" text NOT NULL,
	"hmac_verified" boolean DEFAULT false NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_session" (
	"id" text PRIMARY KEY NOT NULL,
	"visitor_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "visitor_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "post_vote" DROP CONSTRAINT "post_vote_post_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "author_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "post" ALTER COLUMN "author_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "post_vote" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "visitor_id" text;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "visitor_id" text;--> statement-breakpoint
ALTER TABLE "post_vote" ADD COLUMN "id" text;--> statement-breakpoint
UPDATE "post_vote" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;--> statement-breakpoint
ALTER TABLE "post_vote" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "post_vote" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "post_vote" ADD COLUMN "visitor_id" text;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "public_board_auth" text DEFAULT 'guest' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "identify_secret_key" text;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "sso_redirect_url" text;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "sso_shared_secret" text;--> statement-breakpoint
ALTER TABLE "visitor" ADD CONSTRAINT "visitor_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_session" ADD CONSTRAINT "visitor_session_visitor_id_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "visitor_workspaceId_idx" ON "visitor" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "visitor_email_idx" ON "visitor" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "visitor_workspaceId_email_uq" ON "visitor" USING btree ("workspace_id","email") WHERE "visitor"."email" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "visitor_workspaceId_externalId_uq" ON "visitor" USING btree ("workspace_id","external_id") WHERE "visitor"."external_id" is not null;--> statement-breakpoint
CREATE INDEX "visitor_session_token_idx" ON "visitor_session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "visitor_session_visitorId_idx" ON "visitor_session" USING btree ("visitor_id");--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_visitor_id_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_visitor_id_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_vote" ADD CONSTRAINT "post_vote_visitor_id_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_visitorId_idx" ON "comment" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "post_visitorId_idx" ON "post" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "post_vote_visitor_id_idx" ON "post_vote" USING btree ("visitor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_vote_post_user_uq" ON "post_vote" USING btree ("post_id","user_id") WHERE "post_vote"."user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "post_vote_post_visitor_uq" ON "post_vote" USING btree ("post_id","visitor_id") WHERE "post_vote"."visitor_id" is not null;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_author_xor" CHECK (("comment"."author_id" is not null and "comment"."visitor_id" is null) or ("comment"."author_id" is null and "comment"."visitor_id" is not null));--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_author_xor" CHECK (("post"."author_id" is not null and "post"."visitor_id" is null) or ("post"."author_id" is null and "post"."visitor_id" is not null));--> statement-breakpoint
ALTER TABLE "post_vote" ADD CONSTRAINT "post_vote_voter_xor" CHECK (("post_vote"."user_id" is not null and "post_vote"."visitor_id" is null) or ("post_vote"."user_id" is null and "post_vote"."visitor_id" is not null));--> statement-breakpoint
-- Backfill identify_secret_key for existing workspaces. 64 hex chars to match
-- crypto.randomBytes(32).toString('hex') in app code. Two uuids concatenated
-- (with hyphens stripped) avoids needing the pgcrypto extension.
UPDATE "workspace" SET "identify_secret_key" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') WHERE "identify_secret_key" IS NULL;