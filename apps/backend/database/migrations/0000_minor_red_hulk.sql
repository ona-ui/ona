CREATE TYPE "public"."access_type" AS ENUM('preview_only', 'copy', 'full_access', 'download');--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('email', 'google', 'github', 'twitter');--> statement-breakpoint
CREATE TYPE "public"."component_status" AS ENUM('draft', 'published', 'archived', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."css_framework" AS ENUM('tailwind_v3', 'tailwind_v4', 'vanilla_css');--> statement-breakpoint
CREATE TYPE "public"."framework_type" AS ENUM('html', 'react', 'vue', 'svelte', 'alpine', 'angular');--> statement-breakpoint
CREATE TYPE "public"."license_tier" AS ENUM('free', 'pro', 'team', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'super_admin');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"license_id" uuid,
	"name" varchar(100) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(20) NOT NULL,
	"scopes" text[],
	"rate_limit_per_hour" integer DEFAULT 1000,
	"last_used_at" timestamp with time zone,
	"usage_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "apikey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean DEFAULT true,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"rate_limit_max" integer DEFAULT 10,
	"request_count" integer,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"changes" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"token_type" varchar(50) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "valid_token_type" CHECK ("auth_tokens"."token_type" IN ('session','api_key','magic_link','password_reset'))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon_name" varchar(50),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "component_copies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"component_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"license_id" uuid,
	"copied_target" varchar(50) DEFAULT 'component',
	"snippet_name" varchar(255),
	"session_id" varchar(255),
	"ip_address" "inet",
	"user_agent" text,
	"copied_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "component_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"license_id" uuid,
	"ip_address" "inet",
	"user_agent" text,
	"downloaded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "component_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"reference_url" text,
	"category_suggestion" varchar(100),
	"vote_count" integer DEFAULT 1,
	"status" varchar(50) DEFAULT 'pending',
	"completed_component_id" uuid,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "component_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"version_number" varchar(20) NOT NULL,
	"framework" "framework_type" NOT NULL,
	"css_framework" "css_framework" NOT NULL,
	"code_preview" text,
	"code_full" text,
	"code_encrypted" text,
	"dependencies" jsonb,
	"config_required" jsonb,
	"supports_dark_mode" boolean DEFAULT false,
	"dark_mode_code" text,
	"integrations" jsonb,
	"integration_code" jsonb,
	"files" jsonb,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "component_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"referrer" text,
	"ip_address" "inet",
	"user_agent" text,
	"viewed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subcategory_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"is_free" boolean DEFAULT false,
	"required_tier" "license_tier" DEFAULT 'pro',
	"access_type" "access_type" DEFAULT 'preview_only',
	"status" "component_status" DEFAULT 'draft',
	"is_new" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"conversion_rate" numeric(5, 2),
	"tested_companies" text[],
	"preview_image_large" varchar(500),
	"preview_image_small" varchar(500),
	"preview_video_url" varchar(500),
	"tags" text[],
	"sort_order" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"copy_count" integer DEFAULT 0,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "license_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"invited_by" uuid,
	"role" varchar(50) DEFAULT 'member',
	"joined_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"license_key" varchar(255) NOT NULL,
	"tier" "license_tier" NOT NULL,
	"stripe_payment_id" varchar(255),
	"stripe_customer_id" varchar(255),
	"stripe_invoice_id" varchar(255),
	"amount_paid" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"payment_status" "payment_status" DEFAULT 'pending',
	"seats_allowed" integer DEFAULT 1,
	"seats_used" integer DEFAULT 0,
	"valid_from" timestamp with time zone DEFAULT now(),
	"valid_until" timestamp with time zone,
	"is_lifetime" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"is_early_bird" boolean DEFAULT false,
	"discount_percentage" integer DEFAULT 0,
	"discount_code" varchar(50),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "valid_seats" CHECK ("licenses"."seats_used" <= "licenses"."seats_allowed"),
	CONSTRAINT "valid_discount" CHECK ("licenses"."discount_percentage" >= 0 AND "licenses"."discount_percentage" <= 100)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "request_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"username" varchar(255),
	"full_name" varchar(255),
	"image" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user',
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"password_hash" text,
	"provider" "auth_provider" DEFAULT 'email',
	"provider_id" varchar(255),
	"bio" text,
	"website" varchar(255),
	"company" varchar(255),
	"location" varchar(255),
	"twitter_handle" varchar(50),
	"github_username" varchar(50),
	"preferred_framework" "framework_type" DEFAULT 'react',
	"preferred_css" "css_framework" DEFAULT 'tailwind_v4',
	"dark_mode_default" boolean DEFAULT false,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "valid_email" CHECK ("users"."email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_copies" ADD CONSTRAINT "component_copies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_copies" ADD CONSTRAINT "component_copies_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_copies" ADD CONSTRAINT "component_copies_version_id_component_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."component_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_copies" ADD CONSTRAINT "component_copies_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_downloads" ADD CONSTRAINT "component_downloads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_downloads" ADD CONSTRAINT "component_downloads_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_downloads" ADD CONSTRAINT "component_downloads_version_id_component_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."component_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_downloads" ADD CONSTRAINT "component_downloads_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_completed_component_id_components_id_fk" FOREIGN KEY ("completed_component_id") REFERENCES "public"."components"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_versions" ADD CONSTRAINT "component_versions_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_views" ADD CONSTRAINT "component_views_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_views" ADD CONSTRAINT "component_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_team_members" ADD CONSTRAINT "license_team_members_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_team_members" ADD CONSTRAINT "license_team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_team_members" ADD CONSTRAINT "license_team_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_votes" ADD CONSTRAINT "request_votes_request_id_component_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."component_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_votes" ADD CONSTRAINT "request_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_hash_unique" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_api_keys_user" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_hash" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_tokens_token_hash_unique" ON "auth_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_auth_tokens_user_id" ON "auth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_auth_tokens_token_hash" ON "auth_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_auth_tokens_expires_at" ON "auth_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_product_slug_unique" ON "categories" USING btree ("product_id","slug");--> statement-breakpoint
CREATE INDEX "idx_categories_product" ON "categories" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_copies_user" ON "component_copies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_copies_component" ON "component_copies" USING btree ("component_id");--> statement-breakpoint
CREATE INDEX "idx_copies_date" ON "component_copies" USING btree ("copied_at");--> statement-breakpoint
CREATE INDEX "idx_downloads_user" ON "component_downloads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_downloads_component" ON "component_downloads" USING btree ("component_id");--> statement-breakpoint
CREATE INDEX "idx_downloads_date" ON "component_downloads" USING btree ("downloaded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "component_versions_unique" ON "component_versions" USING btree ("component_id","framework","css_framework","version_number");--> statement-breakpoint
CREATE INDEX "idx_component_versions_component" ON "component_versions" USING btree ("component_id");--> statement-breakpoint
CREATE INDEX "idx_component_versions_framework" ON "component_versions" USING btree ("framework","css_framework");--> statement-breakpoint
CREATE INDEX "idx_component_versions_default" ON "component_versions" USING btree ("component_id","is_default") WHERE "component_versions"."is_default" = true;--> statement-breakpoint
CREATE INDEX "idx_views_component" ON "component_views" USING btree ("component_id");--> statement-breakpoint
CREATE INDEX "idx_views_date" ON "component_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "components_subcategory_slug_unique" ON "components" USING btree ("subcategory_id","slug");--> statement-breakpoint
CREATE INDEX "idx_components_subcategory" ON "components" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "idx_components_slug" ON "components" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_components_status" ON "components" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_components_is_free" ON "components" USING btree ("is_free");--> statement-breakpoint
CREATE INDEX "idx_components_free_published" ON "components" USING btree ("is_free","status") WHERE "components"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "license_team_members_license_id_user_id_unique" ON "license_team_members" USING btree ("license_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "licenses_license_key_unique" ON "licenses" USING btree ("license_key");--> statement-breakpoint
CREATE UNIQUE INDEX "licenses_stripe_payment_unique" ON "licenses" USING btree ("stripe_payment_id");--> statement-breakpoint
CREATE INDEX "idx_licenses_user_id" ON "licenses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_licenses_license_key" ON "licenses" USING btree ("license_key");--> statement-breakpoint
CREATE INDEX "idx_licenses_stripe_payment" ON "licenses" USING btree ("stripe_payment_id");--> statement-breakpoint
CREATE INDEX "idx_licenses_active" ON "licenses" USING btree ("user_id","is_active") WHERE "licenses"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_unique" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "request_votes_request_user_unique" ON "request_votes" USING btree ("request_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subcategories_category_slug_unique" ON "subcategories" USING btree ("category_id","slug");--> statement-breakpoint
CREATE INDEX "idx_subcategories_category" ON "subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_favorites_user_component_unique" ON "user_favorites" USING btree ("user_id","component_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_users_provider" ON "users" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");