import {
    pgTable,
    pgEnum,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    integer,
    jsonb,
    numeric,
    inet,
    index,
    uniqueIndex,
    check,
  } from "drizzle-orm/pg-core";
  import { sql } from "drizzle-orm";
  
  /* =====================================================
     ENUMS
     ===================================================== */
  
  export const userRole = pgEnum("user_role", ["user", "admin", "super_admin"]);
  export const authProvider = pgEnum("auth_provider", ["email", "google", "github", "twitter"]);
  export const paymentStatus = pgEnum("payment_status", ["pending", "completed", "failed", "refunded", "disputed"]);
  export const licenseTier = pgEnum("license_tier", ["free", "pro", "team", "enterprise"]);
  export const componentStatus = pgEnum("component_status", ["draft", "published", "archived", "deprecated"]);
  export const frameworkType = pgEnum("framework_type", ["html", "react", "vue", "svelte", "alpine", "angular"]);
  export const cssFramework = pgEnum("css_framework", ["tailwind_v3", "tailwind_v4", "vanilla_css"]);
  export const accessType = pgEnum("access_type", ["preview_only", "copy", "full_access", "download"]);
  
  /* =====================================================
     USERS & AUTHENTICATION
     ===================================================== */
  
  export const users = pgTable(
    "users",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      email: varchar("email", { length: 255 }).notNull(),
      name: varchar("name", { length: 255 }),
      username: varchar("username", { length: 255 }),
      fullName: varchar("full_name", { length: 255 }),
      image: text("image"),
      avatarUrl: text("avatar_url"),
      role: userRole("role").default("user"),
      emailVerified: boolean("email_verified").default(false).notNull(),
      emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
      passwordHash: text("password_hash"),
      provider: authProvider("provider").default("email"),
      providerId: varchar("provider_id", { length: 255 }),
  
      bio: text("bio"),
      website: varchar("website", { length: 255 }),
      company: varchar("company", { length: 255 }),
      location: varchar("location", { length: 255 }),
      twitterHandle: varchar("twitter_handle", { length: 50 }),
      githubUsername: varchar("github_username", { length: 50 }),
  
      preferredFramework: frameworkType("preferred_framework").default("react"),
      preferredCss: cssFramework("preferred_css").default("tailwind_v4"),
      darkModeDefault: boolean("dark_mode_default").default(false),
  
      lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
      index("idx_users_email").on(t.email),
      index("idx_users_username").on(t.username),
      index("idx_users_provider").on(t.provider, t.providerId),
      uniqueIndex("users_email_unique").on(t.email),
      uniqueIndex("users_username_unique").on(t.username),
      check(
        "valid_email",
        sql`${t.email} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`
      ),
    ]
  );
  
  export const authTokens = pgTable(
    "auth_tokens",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      tokenHash: varchar("token_hash", { length: 255 }).notNull(),
      tokenType: varchar("token_type", { length: 50 }).notNull(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
      lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
      ipAddress: inet("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      uniqueIndex("auth_tokens_token_hash_unique").on(t.tokenHash),
      index("idx_auth_tokens_user_id").on(t.userId),
      index("idx_auth_tokens_token_hash").on(t.tokenHash),
      index("idx_auth_tokens_expires_at").on(t.expiresAt),
      check(
        "valid_token_type",
        sql`${t.tokenType} IN ('session','api_key','magic_link','password_reset')`
      ),
    ]
  );
  
  /* =====================================================
     LICENSES & PURCHASES
     ===================================================== */
  
  export const licenses = pgTable(
    "licenses",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      licenseKey: varchar("license_key", { length: 255 }).notNull(),
      tier: licenseTier("tier").notNull(),
  
      stripePaymentId: varchar("stripe_payment_id", { length: 255 }),
      stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
      stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
      amountPaid: integer("amount_paid").notNull(),
      currency: varchar("currency", { length: 3 }).default("USD"),
      paymentStatus: paymentStatus("payment_status").default("pending"),
  
      seatsAllowed: integer("seats_allowed").default(1),
      seatsUsed: integer("seats_used").default(0),
  
      validFrom: timestamp("valid_from", { withTimezone: true }).defaultNow(),
      validUntil: timestamp("valid_until", { withTimezone: true }),
      isLifetime: boolean("is_lifetime").default(true),
      isActive: boolean("is_active").default(true),
  
      isEarlyBird: boolean("is_early_bird").default(false),
      discountPercentage: integer("discount_percentage").default(0),
      discountCode: varchar("discount_code", { length: 50 }),
  
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      uniqueIndex("licenses_license_key_unique").on(t.licenseKey),
      uniqueIndex("licenses_stripe_payment_unique").on(t.stripePaymentId),
      index("idx_licenses_user_id").on(t.userId),
      index("idx_licenses_license_key").on(t.licenseKey),
      index("idx_licenses_stripe_payment").on(t.stripePaymentId),
      index("idx_licenses_active").on(t.userId, t.isActive).where(sql`${t.isActive} = true`),
      check("valid_seats", sql`${t.seatsUsed} <= ${t.seatsAllowed}`),
      check(
        "valid_discount",
        sql`${t.discountPercentage} >= 0 AND ${t.discountPercentage} <= 100`
      ),
    ]
  );
  
  export const licenseTeamMembers = pgTable(
    "license_team_members",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      licenseId: uuid("license_id").notNull().references(() => licenses.id, { onDelete: "cascade" }),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      invitedBy: uuid("invited_by").references(() => users.id),
      role: varchar("role", { length: 50 }).default("member"),
      joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      uniqueIndex("license_team_members_license_id_user_id_unique").on(t.licenseId, t.userId),
    ]
  );
  
  /* =====================================================
     PRODUCTS / CATEGORIES
     ===================================================== */
  
  export const products = pgTable(
    "products",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      slug: varchar("slug", { length: 100 }).notNull(),
      description: text("description"),
      sortOrder: integer("sort_order").default(0),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      uniqueIndex("products_slug_unique").on(t.slug),
    ]
  );
  
  export const categories = pgTable(
    "categories",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      name: varchar("name", { length: 100 }).notNull(),
      slug: varchar("slug", { length: 100 }).notNull(),
      description: text("description"),
      iconName: varchar("icon_name", { length: 50 }),
      sortOrder: integer("sort_order").default(0),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      uniqueIndex("categories_product_slug_unique").on(t.productId, t.slug),
      index("idx_categories_product").on(t.productId),
    ]
  );
  
  export const subcategories = pgTable(
    "subcategories",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
      name: varchar("name", { length: 100 }).notNull(),
      slug: varchar("slug", { length: 100 }).notNull(),
      description: text("description"),
      sortOrder: integer("sort_order").default(0),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      uniqueIndex("subcategories_category_slug_unique").on(t.categoryId, t.slug),
      index("idx_subcategories_category").on(t.categoryId),
    ]
  );
  
  /* =====================================================
     COMPONENTS
     ===================================================== */
  
  export const components = pgTable(
    "components",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      subcategoryId: uuid("subcategory_id").notNull().references(() => subcategories.id, { onDelete: "cascade" }),
  
      name: varchar("name", { length: 255 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull(),
      description: text("description"),
  
      isFree: boolean("is_free").default(false),
      requiredTier: licenseTier("required_tier").default("pro"),
      accessType: accessType("access_type").default("preview_only"),
  
      status: componentStatus("status").default("draft"),
      isNew: boolean("is_new").default(false),
      isFeatured: boolean("is_featured").default(false),
  
      conversionRate: numeric("conversion_rate", { precision: 5, scale: 2 }),
      testedCompanies: text("tested_companies").array(),
  
      previewImageLarge: varchar("preview_image_large", { length: 500 }),
      previewImageSmall: varchar("preview_image_small", { length: 500 }),
      previewVideoUrl: varchar("preview_video_url", { length: 500 }),
  
      tags: text("tags").array(),
      sortOrder: integer("sort_order").default(0),
      viewCount: integer("view_count").default(0),
      copyCount: integer("copy_count").default(0),
  
      publishedAt: timestamp("published_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
      archivedAt: timestamp("archived_at", { withTimezone: true }),
    },
    (t) => [
      uniqueIndex("components_subcategory_slug_unique").on(t.subcategoryId, t.slug),
      index("idx_components_subcategory").on(t.subcategoryId),
      index("idx_components_slug").on(t.slug),
      index("idx_components_status").on(t.status),
      index("idx_components_is_free").on(t.isFree),
      index("idx_components_free_published")
        .on(t.isFree, t.status)
        .where(sql`${t.status} = 'published'`),
    ]
  );
  
  /* =====================================================
     COMPONENT VERSIONS
     ===================================================== */
  
  export const componentVersions = pgTable(
    "component_versions",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      componentId: uuid("component_id").notNull().references(() => components.id, { onDelete: "cascade" }),
  
      versionNumber: varchar("version_number", { length: 20 }).notNull(),
      framework: frameworkType("framework").notNull(),
      cssFramework: cssFramework("css_framework").notNull(),
  
      codePreview: text("code_preview"),
      codeFull: text("code_full"),
      codeEncrypted: text("code_encrypted"),
  
      dependencies: jsonb("dependencies"),
      configRequired: jsonb("config_required"),
  
      supportsDarkMode: boolean("supports_dark_mode").default(false),
      darkModeCode: text("dark_mode_code"),
  
      integrations: jsonb("integrations"),
      integrationCode: jsonb("integration_code"),
  
      files: jsonb("files"),
  
      isDefault: boolean("is_default").default(false),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      uniqueIndex("component_versions_unique").on(
        t.componentId,
        t.framework,
        t.cssFramework,
        t.versionNumber
      ),
      index("idx_component_versions_component").on(t.componentId),
      index("idx_component_versions_framework").on(t.framework, t.cssFramework),
      index("idx_component_versions_default")
        .on(t.componentId, t.isDefault)
        .where(sql`${t.isDefault} = true`),
    ]
  );
  
  /* =====================================================
     USER INTERACTIONS
     ===================================================== */
  
  export const userFavorites = pgTable(
    "user_favorites",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      componentId: uuid("component_id").notNull().references(() => components.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      uniqueIndex("user_favorites_user_component_unique").on(t.userId, t.componentId),
    ]
  );
  
  export const componentDownloads = pgTable(
    "component_downloads",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      componentId: uuid("component_id").notNull().references(() => components.id, { onDelete: "cascade" }),
      versionId: uuid("version_id").notNull().references(() => componentVersions.id, { onDelete: "cascade" }),
      licenseId: uuid("license_id").references(() => licenses.id),
  
      ipAddress: inet("ip_address"),
      userAgent: text("user_agent"),
      downloadedAt: timestamp("downloaded_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      index("idx_downloads_user").on(t.userId),
      index("idx_downloads_component").on(t.componentId),
      index("idx_downloads_date").on(t.downloadedAt),
    ]
  );
  
  export const componentCopies = pgTable(
    "component_copies",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
      componentId: uuid("component_id").notNull().references(() => components.id, { onDelete: "cascade" }),
      versionId: uuid("version_id").notNull().references(() => componentVersions.id, { onDelete: "cascade" }),
      licenseId: uuid("license_id").references(() => licenses.id),
  
      copiedTarget: varchar("copied_target", { length: 50 }).default("component"),
      snippetName: varchar("snippet_name", { length: 255 }),
      sessionId: varchar("session_id", { length: 255 }),
      ipAddress: inet("ip_address"),
      userAgent: text("user_agent"),
      copiedAt: timestamp("copied_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      index("idx_copies_user").on(t.userId),
      index("idx_copies_component").on(t.componentId),
      index("idx_copies_date").on(t.copiedAt),
    ]
  );
  
  export const componentViews = pgTable(
    "component_views",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      componentId: uuid("component_id").notNull().references(() => components.id, { onDelete: "cascade" }),
      userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
      sessionId: varchar("session_id", { length: 255 }),
  
      referrer: text("referrer"),
      ipAddress: inet("ip_address"),
      userAgent: text("user_agent"),
      viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      index("idx_views_component").on(t.componentId),
      index("idx_views_date").on(t.viewedAt),
    ]
  );
  
  /* =====================================================
     COMPONENT REQUESTS
     ===================================================== */
  
  export const componentRequests = pgTable(
    "component_requests",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      referenceUrl: text("reference_url"),
      categorySuggestion: varchar("category_suggestion", { length: 100 }),
  
      voteCount: integer("vote_count").default(1),
  
      status: varchar("status", { length: 50 }).default("pending"),
      completedComponentId: uuid("completed_component_id").references(() => components.id),
      adminNotes: text("admin_notes"),
  
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
      completedAt: timestamp("completed_at", { withTimezone: true }),
    }
  );
  
  export const requestVotes = pgTable(
    "request_votes",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      requestId: uuid("request_id").notNull().references(() => componentRequests.id, { onDelete: "cascade" }),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      uniqueIndex("request_votes_request_user_unique").on(t.requestId, t.userId),
    ]
  );
  
  /* =====================================================
     API KEYS
     ===================================================== */
  
  export const apiKeys = pgTable(
    "api_keys",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      licenseId: uuid("license_id").references(() => licenses.id),
  
      name: varchar("name", { length: 100 }).notNull(),
      keyHash: varchar("key_hash", { length: 255 }).notNull(),
      keyPrefix: varchar("key_prefix", { length: 20 }).notNull(),
  
      scopes: text("scopes").array(),
  
      rateLimitPerHour: integer("rate_limit_per_hour").default(1000),
  
      lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
      usageCount: integer("usage_count").default(0),
  
      isActive: boolean("is_active").default(true),
      expiresAt: timestamp("expires_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
      revokedAt: timestamp("revoked_at", { withTimezone: true }),
    },
    (t) => [
      uniqueIndex("api_keys_key_hash_unique").on(t.keyHash),
      index("idx_api_keys_user").on(t.userId),
      index("idx_api_keys_hash").on(t.keyHash),
    ]
  );
  
  /* =====================================================
     AUDIT LOGS
     ===================================================== */
  
  export const auditLogs = pgTable(
    "audit_logs",
    {
      id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
      action: varchar("action", { length: 100 }).notNull(),
      entityType: varchar("entity_type", { length: 50 }),
      entityId: uuid("entity_id"),
      changes: jsonb("changes"),
      ipAddress: inet("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (t) => [
      index("idx_audit_user").on(t.userId),
      index("idx_audit_entity").on(t.entityType, t.entityId),
      index("idx_audit_created").on(t.createdAt),
    ]
  );
  
  export const apikey = pgTable("apikey", {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    name: text("name"),
    start: text("start"),
    prefix: text("prefix"),
    key: text("key").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at"),
    enabled: boolean("enabled").default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").default(true),
    rateLimitTimeWindow: integer("rate_limit_time_window").default(86400000),
    rateLimitMax: integer("rate_limit_max").default(10),
    requestCount: integer("request_count"),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    permissions: text("permissions"),
    metadata: text("metadata"),
  });

  // IMPORTANT: on réutilise `users` (UUID) comme table d'utilisateur.
  // Les FKs référencent `users.id` en UUID et les IDs locaux sont des UUID.
  export const session = pgTable("session", {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  });
  
  export const account = pgTable("account", {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  });
  
  export const verification = pgTable("verification", {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  });
