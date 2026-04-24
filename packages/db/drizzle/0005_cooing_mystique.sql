CREATE TABLE "changelog_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "changelog_post" (
	"changelog_entry_id" text NOT NULL,
	"post_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "changelog_post_changelog_entry_id_post_id_pk" PRIMARY KEY("changelog_entry_id","post_id")
);
--> statement-breakpoint
ALTER TABLE "changelog_entry" ADD CONSTRAINT "changelog_entry_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_entry" ADD CONSTRAINT "changelog_entry_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_post" ADD CONSTRAINT "changelog_post_changelog_entry_id_changelog_entry_id_fk" FOREIGN KEY ("changelog_entry_id") REFERENCES "public"."changelog_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_post" ADD CONSTRAINT "changelog_post_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "changelog_entry_workspaceId_idx" ON "changelog_entry" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "changelog_entry_workspaceId_publishedAt_idx" ON "changelog_entry" USING btree ("workspace_id","published_at");--> statement-breakpoint
CREATE INDEX "changelog_post_postId_idx" ON "changelog_post" USING btree ("post_id");