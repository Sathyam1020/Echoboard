CREATE TYPE "public"."conversation_audit_action" AS ENUM('status_change', 'assignment_change');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('open', 'pending', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"customer_user_id" text,
	"customer_visitor_id" text,
	"status" "conversation_status" DEFAULT 'open' NOT NULL,
	"assigned_to_user_id" text,
	"unread_admin" integer DEFAULT 0 NOT NULL,
	"unread_customer" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_customer_xor" CHECK (("conversation"."customer_user_id" is not null and "conversation"."customer_visitor_id" is null) or ("conversation"."customer_user_id" is null and "conversation"."customer_visitor_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "conversation_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"action" "conversation_audit_action" NOT NULL,
	"from_value" text,
	"to_value" text,
	"actor_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"author_user_id" text,
	"author_visitor_id" text,
	"body" text NOT NULL,
	"read_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_message_author_xor" CHECK (("support_message"."author_user_id" is not null and "support_message"."author_visitor_id" is null) or ("support_message"."author_user_id" is null and "support_message"."author_visitor_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "workspace_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "workspace_role" DEFAULT 'member' NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"accepted_at" timestamp,
	"revoked_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_member" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "workspace_role" DEFAULT 'member' NOT NULL,
	"added_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board" ADD COLUMN "support_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_customer_user_id_user_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_customer_visitor_id_visitor_id_fk" FOREIGN KEY ("customer_visitor_id") REFERENCES "public"."visitor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_assigned_to_user_id_user_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_audit_log" ADD CONSTRAINT "conversation_audit_log_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_audit_log" ADD CONSTRAINT "conversation_audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_message" ADD CONSTRAINT "support_message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_message" ADD CONSTRAINT "support_message_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_message" ADD CONSTRAINT "support_message_author_visitor_id_visitor_id_fk" FOREIGN KEY ("author_visitor_id") REFERENCES "public"."visitor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_added_by_user_id_user_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_workspaceId_customerUserId_uq" ON "conversation" USING btree ("workspace_id","customer_user_id") WHERE "conversation"."customer_user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_workspaceId_customerVisitorId_uq" ON "conversation" USING btree ("workspace_id","customer_visitor_id") WHERE "conversation"."customer_visitor_id" is not null;--> statement-breakpoint
CREATE INDEX "conversation_workspaceId_status_lastMessageAt_idx" ON "conversation" USING btree ("workspace_id","status","last_message_at");--> statement-breakpoint
CREATE INDEX "conversation_assignedToUserId_idx" ON "conversation" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "conversation_audit_log_conversationId_createdAt_idx" ON "conversation_audit_log" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "support_message_conversationId_createdAt_idx" ON "support_message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invite_open_uq" ON "workspace_invite" USING btree ("workspace_id","email") WHERE "workspace_invite"."accepted_at" is null and "workspace_invite"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "workspace_invite_email_idx" ON "workspace_invite" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_member_workspaceId_userId_uq" ON "workspace_member" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_member_userId_idx" ON "workspace_member" USING btree ("user_id");--> statement-breakpoint
-- Full-text search on support messages. The column is GENERATED so Postgres
-- maintains it on every insert/update — no app code or trigger needed.
ALTER TABLE "support_message" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce("body", ''))) STORED;--> statement-breakpoint
CREATE INDEX "support_message_search_idx" ON "support_message" USING GIN ("search_vector");--> statement-breakpoint
-- Backfill: every existing single-owner workspace becomes the first
-- workspace_member row with role 'owner'. Idempotent via ON CONFLICT.
INSERT INTO "workspace_member" ("id", "workspace_id", "user_id", "role", "created_at")
SELECT gen_random_uuid()::text, w."id", w."owner_id", 'owner', now()
FROM "workspace" w
WHERE w."owner_id" IS NOT NULL
ON CONFLICT ("workspace_id", "user_id") DO NOTHING;