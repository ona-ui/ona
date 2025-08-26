/**
 * Types communs et enums pour l'application Ona UI
 * Extraits du schéma de base de données Drizzle
 */

// =====================================================
// ENUMS
// =====================================================

/**
 * Rôles des utilisateurs dans le système
 */
export type UserRole = "user" | "admin" | "super_admin";

/**
 * Fournisseurs d'authentification supportés
 */
export type AuthProvider = "email" | "google" | "github" | "twitter";

/**
 * Statuts des paiements
 */
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "disputed";

/**
 * Niveaux de licence disponibles
 */
export type LicenseTier = "free" | "pro" | "team" | "enterprise";

/**
 * Statuts des composants
 */
export type ComponentStatus = "draft" | "published" | "archived" | "deprecated";

/**
 * Types de frameworks supportés
 */
export type FrameworkType = "html" | "react" | "vue" | "svelte" | "alpine" | "angular";

/**
 * Frameworks CSS supportés
 */
export type CssFramework = "tailwind_v3" | "tailwind_v4" | "vanilla_css";

/**
 * Types d'accès aux composants
 */
export type AccessType = "preview_only" | "copy" | "full_access" | "download";

/**
 * Types de tokens d'authentification
 */
export type TokenType = "session" | "api_key" | "magic_link" | "password_reset";

/**
 * Statuts des demandes de composants
 */
export type RequestStatus = "pending" | "in_progress" | "completed" | "rejected" | "cancelled";

/**
 * Rôles dans une équipe de licence
 */
export type TeamRole = "owner" | "admin" | "member";

/**
 * Cibles de copie pour les composants
 */
export type CopiedTarget = "component" | "snippet" | "full_code" | "preview";

// =====================================================
// TYPES UTILITAIRES
// =====================================================

/**
 * Type pour les identifiants UUID
 */
export type UUID = string;

/**
 * Type pour les timestamps
 */
export type Timestamp = Date | string;

/**
 * Type pour les adresses IP
 */
export type IPAddress = string;

/**
 * Type pour les métadonnées JSON
 */
export type JSONMetadata = Record<string, any>;

/**
 * Type pour les tableaux de tags
 */
export type Tags = string[];

/**
 * Type pour les scopes d'API
 */
export type APIScopes = string[];

/**
 * Type pour les dépendances de composants
 */
export interface ComponentDependencies {
  npm?: Record<string, string>;
  cdn?: string[];
  fonts?: string[];
  icons?: string[];
}

/**
 * Type pour la configuration requise d'un composant
 */
export interface ComponentConfig {
  env?: Record<string, string>;
  tailwind?: {
    plugins?: string[];
    config?: Record<string, any>;
  };
  css?: {
    variables?: Record<string, string>;
    imports?: string[];
  };
}

/**
 * Type pour les intégrations de composants
 */
export interface ComponentIntegrations {
  stripe?: boolean;
  posthog?: boolean;
  supabase?: boolean;
  auth?: boolean;
  database?: boolean;
  email?: boolean;
}

/**
 * Type pour les fichiers de composants
 */
export interface ComponentFiles {
  [filename: string]: {
    content: string;
    language: string;
    path?: string;
  };
}

/**
 * Type pour les changements d'audit
 */
export interface AuditChanges {
  before?: Record<string, any>;
  after?: Record<string, any>;
  fields?: string[];
}

// =====================================================
// TYPES DE PAGINATION
// =====================================================

/**
 * Paramètres de pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Métadonnées de pagination
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Réponse paginée générique
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// =====================================================
// TYPES DE FILTRAGE ET TRI
// =====================================================

/**
 * Options de tri
 */
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Filtres de recherche
 */
export interface SearchFilters {
  query?: string;
  tags?: string[];
  category?: string;
  subcategory?: string;
  framework?: FrameworkType;
  cssFramework?: CssFramework;
  isFree?: boolean;
  status?: ComponentStatus;
  isNew?: boolean;
  isFeatured?: boolean;
}

// =====================================================
// TYPES D'ERREUR
// =====================================================

/**
 * Structure d'erreur API standardisée
 */
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
}

/**
 * Codes d'erreur communs
 */
export type ErrorCode = 
  | "UNAUTHORIZED"
  | "FORBIDDEN" 
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "PAYMENT_REQUIRED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";