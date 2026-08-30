CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"role" varchar(20) DEFAULT 'ADMIN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_role_unique" UNIQUE("role"),
	CONSTRAINT "users_role_check" CHECK ("users"."role" = 'ADMIN')
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"slug" varchar(60) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"summary" text NOT NULL,
	"content_markdown" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"category_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"archived_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug"),
	CONSTRAINT "posts_status_check" CHECK ("posts"."status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
	CONSTRAINT "posts_published_at_check" CHECK ("posts"."status" != 'PUBLISHED' OR "posts"."published_at" IS NOT NULL),
	CONSTRAINT "posts_archived_at_check" CHECK ("posts"."status" != 'ARCHIVED' OR ("posts"."archived_at" IS NOT NULL AND "posts"."archived_by_user_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(40) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "technologies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"slug" varchar(60) NOT NULL,
	"icon_name" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technologies_name_unique" UNIQUE("name"),
	CONSTRAINT "technologies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_technologies" (
	"project_id" uuid NOT NULL,
	"technology_id" uuid NOT NULL,
	CONSTRAINT "project_technologies_project_id_technology_id_pk" PRIMARY KEY("project_id","technology_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"summary" text NOT NULL,
	"description_markdown" text NOT NULL,
	"live_url" varchar(500),
	"github_url" varchar(500),
	"is_featured" boolean DEFAULT false NOT NULL,
	"status" varchar(20) NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"archived_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug"),
	CONSTRAINT "projects_status_check" CHECK ("projects"."status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
	CONSTRAINT "projects_published_at_check" CHECK ("projects"."status" != 'PUBLISHED' OR "projects"."published_at" IS NOT NULL),
	CONSTRAINT "projects_archived_at_check" CHECK ("projects"."status" != 'ARCHIVED' OR ("projects"."archived_at" IS NOT NULL AND "projects"."archived_by_user_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"public_url" varchar(500),
	"mime_type" varchar(100) NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"status" varchar(20) NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"upload_expires_at" timestamp with time zone NOT NULL,
	"uploaded_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"archived_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "media_assets_status_check" CHECK ("media_assets"."status" IN ('PENDING_UPLOAD', 'ACTIVE', 'ARCHIVED')),
	CONSTRAINT "media_assets_pending_check" CHECK ("media_assets"."status" != 'PENDING_UPLOAD' OR "media_assets"."upload_expires_at" IS NOT NULL),
	CONSTRAINT "media_assets_active_check" CHECK ("media_assets"."status" != 'ACTIVE' OR ("media_assets"."public_url" IS NOT NULL AND "media_assets"."uploaded_at" IS NOT NULL)),
	CONSTRAINT "media_assets_archived_check" CHECK ("media_assets"."status" != 'ARCHIVED' OR "media_assets"."archived_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "post_media_assets" (
	"post_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "post_media_assets_post_id_media_asset_id_pk" PRIMARY KEY("post_id","media_asset_id"),
	CONSTRAINT "post_media_assets_display_order_unique" UNIQUE("post_id","display_order")
);
--> statement-breakpoint
CREATE TABLE "project_media_assets" (
	"project_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "project_media_assets_project_id_media_asset_id_pk" PRIMARY KEY("project_id","media_asset_id"),
	CONSTRAINT "project_media_assets_display_order_unique" UNIQUE("project_id","display_order")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_name" varchar(100) NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"message_body" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"ip_address_hash" varchar(64) NOT NULL,
	"read_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"archived_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_messages_status_check" CHECK ("contact_messages"."status" IN ('UNREAD', 'READ', 'ARCHIVED')),
	CONSTRAINT "contact_messages_read_check" CHECK ("contact_messages"."status" != 'READ' OR "contact_messages"."read_at" IS NOT NULL),
	CONSTRAINT "contact_messages_archived_check" CHECK ("contact_messages"."status" != 'ARCHIVED' OR "contact_messages"."archived_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_archived_by_user_id_users_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_technology_id_technologies_id_fk" FOREIGN KEY ("technology_id") REFERENCES "public"."technologies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_archived_by_user_id_users_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_archived_by_user_id_users_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_media_assets" ADD CONSTRAINT "post_media_assets_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_media_assets" ADD CONSTRAINT "post_media_assets_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media_assets" ADD CONSTRAINT "project_media_assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media_assets" ADD CONSTRAINT "project_media_assets_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_archived_by_user_id_users_id_fk" FOREIGN KEY ("archived_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_posts_status_published_at" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "idx_posts_category_id" ON "posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_post_tags_tag_id" ON "post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_project_technologies_tech_id" ON "project_technologies" USING btree ("technology_id");--> statement-breakpoint
CREATE INDEX "idx_projects_featured_status" ON "projects" USING btree ("is_featured","status","published_at");--> statement-breakpoint
CREATE INDEX "idx_media_assets_status_expires" ON "media_assets" USING btree ("status","upload_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_post_media_single_cover" ON "post_media_assets" USING btree ("post_id") WHERE "post_media_assets"."is_cover" = true;--> statement-breakpoint
CREATE INDEX "idx_post_media_asset_id" ON "post_media_assets" USING btree ("media_asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_project_media_single_cover" ON "project_media_assets" USING btree ("project_id") WHERE "project_media_assets"."is_cover" = true;--> statement-breakpoint
CREATE INDEX "idx_project_media_asset_id" ON "project_media_assets" USING btree ("media_asset_id");--> statement-breakpoint
CREATE INDEX "idx_contact_messages_status_created_at" ON "contact_messages" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_actor_created_at" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_audit_logs_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is an append-only immutable table. UPDATE, DELETE, and TRUNCATE are strictly forbidden.';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER audit_logs_immutable_trigger
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_logs_mutation();