-- Script de configuration de la base de données locale pour Ona UI
-- Exécuter avec : psql -U postgres -f setup_local_db.sql

-- Créer la base de données si elle n'existe pas
CREATE DATABASE "ona-ui-dev" WITH ENCODING 'UTF8';

-- Se connecter à la base de données
\c "ona-ui-dev";

-- Créer les tables principales
CREATE TABLE IF NOT EXISTS "products" (
    "id" VARCHAR PRIMARY KEY,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR UNIQUE NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "categories" (
    "id" VARCHAR PRIMARY KEY,
    "product_id" VARCHAR NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "description" TEXT,
    "icon_name" VARCHAR,
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    UNIQUE("product_id", "slug")
);

CREATE TABLE IF NOT EXISTS "subcategories" (
    "id" VARCHAR PRIMARY KEY,
    "category_id" VARCHAR NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    UNIQUE("category_id", "slug")
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" VARCHAR PRIMARY KEY,
    "email" VARCHAR UNIQUE NOT NULL,
    "name" VARCHAR NOT NULL,
    "username" VARCHAR UNIQUE,
    "role" VARCHAR DEFAULT 'user',
    "email_verified" BOOLEAN DEFAULT false,
    "image" VARCHAR,
    "bio" TEXT,
    "website" VARCHAR,
    "company" VARCHAR,
    "location" VARCHAR,
    "twitter_handle" VARCHAR,
    "github_username" VARCHAR,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "last_login_at" TIMESTAMP,
    "deleted_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "licenses" (
    "id" VARCHAR PRIMARY KEY,
    "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "license_key" VARCHAR UNIQUE NOT NULL,
    "tier" VARCHAR NOT NULL,
    "status" VARCHAR DEFAULT 'active',
    "expires_at" TIMESTAMP,
    "team_seats" INTEGER DEFAULT 1,
    "used_seats" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "components" (
    "id" VARCHAR PRIMARY KEY,
    "subcategory_id" VARCHAR NOT NULL REFERENCES "subcategories"("id") ON DELETE CASCADE,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "description" TEXT,
    "is_free" BOOLEAN DEFAULT false,
    "required_tier" VARCHAR,
    "access_type" VARCHAR DEFAULT 'free',
    "status" VARCHAR DEFAULT 'draft',
    "is_new" BOOLEAN DEFAULT false,
    "is_featured" BOOLEAN DEFAULT false,
    "conversion_rate" DECIMAL(5,2),
    "tested_companies" TEXT[],
    "preview_image_large" VARCHAR,
    "preview_image_small" VARCHAR,
    "preview_video_url" VARCHAR,
    "tags" TEXT[],
    "sort_order" INTEGER DEFAULT 0,
    "view_count" INTEGER DEFAULT 0,
    "copy_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    "published_at" TIMESTAMP,
    UNIQUE("subcategory_id", "slug")
);

CREATE TABLE IF NOT EXISTS "component_versions" (
    "id" VARCHAR PRIMARY KEY,
    "component_id" VARCHAR NOT NULL REFERENCES "components"("id") ON DELETE CASCADE,
    "version_number" VARCHAR NOT NULL,
    "framework" VARCHAR NOT NULL,
    "css_framework" VARCHAR NOT NULL,
    "code_preview" TEXT,
    "code_full" TEXT,
    "code_encrypted" TEXT,
    "dependencies" JSONB,
    "config_required" JSONB,
    "supports_dark_mode" BOOLEAN DEFAULT false,
    "dark_mode_code" TEXT,
    "integrations" JSONB,
    "integration_code" JSONB,
    "files" JSONB,
    "is_default" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    UNIQUE("component_id", "version_number", "framework", "css_framework")
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS "idx_categories_product_id" ON "categories"("product_id");
CREATE INDEX IF NOT EXISTS "idx_subcategories_category_id" ON "subcategories"("category_id");
CREATE INDEX IF NOT EXISTS "idx_components_subcategory_id" ON "components"("subcategory_id");
CREATE INDEX IF NOT EXISTS "idx_component_versions_component_id" ON "component_versions"("component_id");
CREATE INDEX IF NOT EXISTS "idx_licenses_user_id" ON "licenses"("user_id");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_username" ON "users"("username");

-- Afficher un message de succès
SELECT 'Base de données Ona UI configurée avec succès!' as message;