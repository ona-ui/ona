/**
 * Validators communs pour l'application Ona UI
 * 
 * Ce fichier contient tous les schémas de validation réutilisables
 * utilisés dans plusieurs domaines de l'application.
 */

import vine from '@vinejs/vine'

/* =====================================================
   CONSTANTES LOCALES (en attendant la résolution du package @workspace/types)
   ===================================================== */

const CONSTRAINTS = {
  EMAIL_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 255,
  USERNAME_MAX_LENGTH: 255,
  SLUG_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 1000,
  BIO_MAX_LENGTH: 500,
  WEBSITE_MAX_LENGTH: 255,
  COMPANY_MAX_LENGTH: 255,
  LOCATION_MAX_LENGTH: 255,
  TWITTER_HANDLE_MAX_LENGTH: 50,
  GITHUB_USERNAME_MAX_LENGTH: 50,
  COMPONENT_NAME_MAX_LENGTH: 255,
  CATEGORY_NAME_MAX_LENGTH: 100,
  SUBCATEGORY_NAME_MAX_LENGTH: 100,
  PRODUCT_NAME_MAX_LENGTH: 100,
  API_KEY_NAME_MAX_LENGTH: 100,
  VERSION_NUMBER_MAX_LENGTH: 20,
  DISCOUNT_CODE_MAX_LENGTH: 50,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_RATE_LIMIT: 1000,
} as const

const ENUM_VALUES = {
  USER_ROLES: ["user", "admin", "super_admin"] as const,
  AUTH_PROVIDERS: ["email", "google", "github", "twitter"] as const,
  PAYMENT_STATUSES: ["pending", "completed", "failed", "refunded", "disputed"] as const,
  LICENSE_TIERS: ["free", "pro", "team", "enterprise"] as const,
  COMPONENT_STATUSES: ["draft", "published", "archived", "deprecated"] as const,
  FRAMEWORK_TYPES: ["html", "react", "vue", "svelte", "alpine", "angular"] as const,
  CSS_FRAMEWORKS: ["tailwind_v3", "tailwind_v4", "vanilla_css"] as const,
  ACCESS_TYPES: ["preview_only", "copy", "full_access", "download"] as const,
  TOKEN_TYPES: ["session", "api_key", "magic_link", "password_reset"] as const,
  TEAM_ROLES: ["owner", "admin", "member"] as const,
  COPIED_TARGETS: ["component", "snippet", "full_code", "preview"] as const,
} as const

/* =====================================================
   VALIDATORS DE BASE
   ===================================================== */

/**
 * Validation d'un UUID v4
 */
export const uuidSchema = vine.string().uuid({ version: [4] })

/**
 * Validation d'un slug URL-friendly
 */
export const slugSchema = vine
  .string()
  .minLength(1)
  .maxLength(CONSTRAINTS.SLUG_MAX_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

/**
 * Validation d'un email
 */
export const emailSchema = vine
  .string()
  .email()
  .maxLength(CONSTRAINTS.EMAIL_MAX_LENGTH)
  .normalizeEmail()

/**
 * Validation d'un mot de passe sécurisé
 */
export const passwordSchema = vine
  .string()
  .minLength(8)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)

/**
 * Validation d'un nom/titre
 */
export const nameSchema = vine
  .string()
  .trim()
  .minLength(1)
  .maxLength(CONSTRAINTS.NAME_MAX_LENGTH)

/**
 * Validation d'une description
 */
export const descriptionSchema = vine
  .string()
  .trim()
  .maxLength(CONSTRAINTS.DESCRIPTION_MAX_LENGTH)
  .optional()

/* =====================================================
   VALIDATORS DE PAGINATION
   ===================================================== */

/**
 * Schéma de validation pour les paramètres de pagination
 */
export const paginationSchema = vine.object({
  page: vine.number().min(1).optional(),
  limit: vine.number().min(1).max(CONSTRAINTS.MAX_PAGE_SIZE).optional(),
  offset: vine.number().min(0).optional(),
})

/**
 * Schéma de validation pour les paramètres de tri
 */
export const sortingSchema = vine.object({
  sortBy: vine.string().optional(),
  sortOrder: vine.enum(['asc', 'desc']).optional(),
})

/* =====================================================
   VALIDATORS DE PARAMÈTRES
   ===================================================== */

/**
 * Validation d'un ID en paramètre d'URL
 */
export const idParamSchema = vine.object({
  id: uuidSchema,
})

/**
 * Validation d'un slug en paramètre d'URL
 */
export const slugParamSchema = vine.object({
  slug: slugSchema,
})

/* =====================================================
   VALIDATORS D'ENUMS
   ===================================================== */

/**
 * Validation du rôle utilisateur
 */
export const userRoleSchema = vine.enum(ENUM_VALUES.USER_ROLES)

/**
 * Validation du provider d'authentification
 */
export const authProviderSchema = vine.enum(ENUM_VALUES.AUTH_PROVIDERS)

/**
 * Validation du statut de paiement
 */
export const paymentStatusSchema = vine.enum(ENUM_VALUES.PAYMENT_STATUSES)

/**
 * Validation du tier de licence
 */
export const licenseTierSchema = vine.enum(ENUM_VALUES.LICENSE_TIERS)

/**
 * Validation du statut de composant
 */
export const componentStatusSchema = vine.enum(ENUM_VALUES.COMPONENT_STATUSES)

/**
 * Validation du type de framework
 */
export const frameworkTypeSchema = vine.enum(ENUM_VALUES.FRAMEWORK_TYPES)

/**
 * Validation du framework CSS
 */
export const cssFrameworkSchema = vine.enum(ENUM_VALUES.CSS_FRAMEWORKS)

/**
 * Validation du type d'accès
 */
export const accessTypeSchema = vine.enum(ENUM_VALUES.ACCESS_TYPES)

/**
 * Validation du type de token
 */
export const tokenTypeSchema = vine.enum(ENUM_VALUES.TOKEN_TYPES)

/**
 * Validation du rôle d'équipe
 */
export const teamRoleSchema = vine.enum(ENUM_VALUES.TEAM_ROLES)

/**
 * Validation de la cible de copie
 */
export const copiedTargetSchema = vine.enum(ENUM_VALUES.COPIED_TARGETS)

/* =====================================================
   VALIDATORS DE MÉTADONNÉES
   ===================================================== */

/**
 * Validation des tags (tableau de chaînes)
 */
export const tagsSchema = vine
  .array(vine.string().trim().minLength(1).maxLength(50))
  .maxLength(20)
  .optional()

/**
 * Validation des dépendances de composant
 */
export const dependenciesSchema = vine
  .object({
    npm: vine.array(vine.string()).optional(),
    cdn: vine.array(vine.string()).optional(),
    fonts: vine.array(vine.string()).optional(),
    icons: vine.array(vine.string()).optional(),
  })
  .optional()

/**
 * Validation de la configuration requise
 */
export const configRequiredSchema = vine
  .object({
    env: vine.array(vine.string()).optional(),
    api: vine.array(vine.string()).optional(),
    database: vine.array(vine.string()).optional(),
  })
  .optional()

/**
 * Validation des intégrations
 */
export const integrationsSchema = vine
  .object({
    stripe: vine.boolean().optional(),
    posthog: vine.boolean().optional(),
    supabase: vine.boolean().optional(),
    clerk: vine.boolean().optional(),
    nextauth: vine.boolean().optional(),
  })
  .optional()

/* =====================================================
   VALIDATORS DE RECHERCHE
   ===================================================== */

/**
 * Schéma de validation pour la recherche de composants
 */
export const searchComponentsSchema = vine.object({
  // Paramètres de recherche
  q: vine.string().trim().minLength(1).maxLength(255).optional(),
  
  // Filtres
  framework: frameworkTypeSchema.optional(),
  cssFramework: cssFrameworkSchema.optional(),
  category: slugSchema.optional(),
  subcategory: slugSchema.optional(),
  tags: vine.array(vine.string()).optional(),
  isFree: vine.boolean().optional(),
  isNew: vine.boolean().optional(),
  isFeatured: vine.boolean().optional(),
  
  // Tri et pagination
  ...paginationSchema.getProperties(),
  ...sortingSchema.getProperties(),
})

/* =====================================================
   VALIDATORS DE FICHIERS
   ===================================================== */

/**
 * Validation des types MIME autorisés pour les images
 */
export const imageTypesSchema = vine.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

/**
 * Validation des types MIME autorisés pour les vidéos
 */
export const videoTypesSchema = vine.enum([
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

/**
 * Validation de la taille de fichier (en bytes)
 */
export const fileSizeSchema = vine.number().min(1).max(5 * 1024 * 1024) // 5MB max

/* =====================================================
   VALIDATORS DE DATES
   ===================================================== */

/**
 * Validation d'une date ISO
 */
export const dateSchema = vine.date()

/**
 * Validation d'une date optionnelle
 */
export const optionalDateSchema = vine.date().optional()

/* =====================================================
   VALIDATORS D'URL
   ===================================================== */

/**
 * Validation d'une URL
 */
export const urlSchema = vine.string().url().maxLength(500)

/**
 * Validation d'une URL optionnelle
 */
export const optionalUrlSchema = vine.string().url().maxLength(500).optional()

/**
 * Règle de validation personnalisée pour les URLs avec placeholders Stripe
 */
const stripeUrlRule = vine.createRule((value: unknown, _options: any, field) => {
  if (typeof value !== 'string') {
    field.report('La valeur doit être une chaîne de caractères', 'string', field)
    return
  }

  // Remplacer temporairement les placeholders Stripe par des valeurs valides pour la validation
  const urlWithoutPlaceholders = value
    .replace(/{CHECKOUT_SESSION_ID}/g, 'cs_test_placeholder')
    .replace(/{SESSION_ID}/g, 'session_placeholder')
    .replace(/{CUSTOMER_ID}/g, 'cus_placeholder')
    .replace(/{PAYMENT_INTENT_ID}/g, 'pi_placeholder')
  
  try {
    // Valider l'URL après remplacement des placeholders
    new URL(urlWithoutPlaceholders)
  } catch (error) {
    field.report('L\'URL fournie n\'est pas valide', 'stripeUrl', field)
  }
})

/**
 * Validation d'une URL avec placeholders Stripe autorisés
 * Accepte les URLs normales et celles contenant des placeholders comme {CHECKOUT_SESSION_ID}
 */
export const stripeUrlSchema = vine.string().maxLength(500).use(stripeUrlRule())

/**
 * Validation d'une URL avec placeholders Stripe optionnelle
 */
export const optionalStripeUrlSchema = vine.string().maxLength(500).use(stripeUrlRule()).optional()

/* =====================================================
   VALIDATORS DE NUMÉROS DE VERSION
   ===================================================== */

/**
 * Validation d'un numéro de version sémantique
 */
export const versionNumberSchema = vine
  .string()
  .regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*)?$/)
  .maxLength(CONSTRAINTS.VERSION_NUMBER_MAX_LENGTH)

/* =====================================================
   VALIDATORS DE MÉTADONNÉES AVANCÉES
   ===================================================== */

/**
 * Validation des fichiers de composant
 */
export const componentFilesSchema = vine
  .object({
    main: vine.string().optional(),
    styles: vine.string().optional(),
    types: vine.string().optional(),
    readme: vine.string().optional(),
    examples: vine.array(vine.string()).optional(),
  })
  .optional()

/**
 * Validation du code d'intégration
 */
export const integrationCodeSchema = vine
  .object({
    stripe: vine.string().optional(),
    posthog: vine.string().optional(),
    supabase: vine.string().optional(),
    clerk: vine.string().optional(),
    nextauth: vine.string().optional(),
  })
  .optional()