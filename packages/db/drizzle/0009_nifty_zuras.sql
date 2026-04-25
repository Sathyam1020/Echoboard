ALTER TABLE "board" ADD COLUMN "widget_color" text;--> statement-breakpoint
ALTER TABLE "board" ADD COLUMN "widget_position" text DEFAULT 'bottom-right' NOT NULL;--> statement-breakpoint
ALTER TABLE "board" ADD COLUMN "widget_button_text" text DEFAULT 'Feedback' NOT NULL;--> statement-breakpoint
ALTER TABLE "board" ADD COLUMN "widget_show_branding" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "require_signed_identify" boolean DEFAULT false NOT NULL;