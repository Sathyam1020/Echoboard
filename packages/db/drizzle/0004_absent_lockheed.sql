ALTER TABLE "post" ADD COLUMN "pinned_at" timestamp;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "merged_into_post_id" text;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_merged_into_post_id_post_id_fk" FOREIGN KEY ("merged_into_post_id") REFERENCES "public"."post"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_mergedIntoPostId_idx" ON "post" USING btree ("merged_into_post_id");