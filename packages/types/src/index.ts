/**
 * Package de types TypeScript partagés pour l'application Ona UI
 * 
 * Ce package contient tous les types nécessaires pour le MVP basés sur le schéma de base de données.
 * Les types sont organisés par domaine pour faciliter l'importation et la maintenance.
 * 
 * @example
 * ```typescript
 * import type { User, Component, APIResponse } from '@workspace/types';
 * import type { LoginRequest, GetComponentsResponse } from '@workspace/types/api';
 * import type { UserRole, ComponentStatus } from '@workspace/types/common';
 * ```
 */

// =====================================================
// EXPORTS PRINCIPAUX - TYPES COMMUNS
// =====================================================

export type {
  // Enums principaux
  UserRole,
  AuthProvider,
  PaymentStatus,
  LicenseTier,
  ComponentStatus,
  FrameworkType,
  CssFramework,
  AccessType,
  TokenType,
  RequestStatus,
  TeamRole,
  CopiedTarget,
  ErrorCode,

  // Types utilitaires
  UUID,
  Timestamp,
  IPAddress,
  JSONMetadata,
  Tags,
  APIScopes,

  // Interfaces de configuration
  ComponentDependencies,
  ComponentConfig,
  ComponentIntegrations,
  ComponentFiles,
  AuditChanges,

  // Types de pagination
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,

  // Types de filtrage et tri
  SortOptions,
  SearchFilters,

  // Types d'erreur
  APIError,
} from "./common.js";

// =====================================================
// EXPORTS - AUTHENTIFICATION ET UTILISATEURS
// =====================================================

export type {
  // Types utilisateur
  User,
  PublicUser,
  UserProfile,
  CreateUserData,
  UpdateUserData,

  // Types d'authentification
  AuthToken,
  Session,
  Account,
  Verification,

  // Types de licence
  License,
  UserLicense,
  LicenseTeamMember,
  CreateLicenseData,

  // Types d'API Key
  APIKey,
  CreateAPIKeyData,
  APIKeyWithToken,

  // Types d'authentification pour l'API
  AuthContext,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ResetPasswordData,
  ChangePasswordData,
} from "./auth.js";

// =====================================================
// EXPORTS - CATÉGORIES ET PRODUITS
// =====================================================

export type {
  // Types produit
  Product,
  ProductWithCategories,
  CreateProductData,
  UpdateProductData,

  // Types catégorie
  Category,
  CategoryWithProduct,
  CategoryWithSubcategories,
  FullCategory,
  CreateCategoryData,
  UpdateCategoryData,

  // Types sous-catégorie
  Subcategory,
  SubcategoryWithCategory,
  SubcategoryWithComponents,
  FullSubcategory,
  CreateSubcategoryData,
  UpdateSubcategoryData,

  // Types de navigation
  CategoryNavItem,
  SubcategoryNavItem,
  NavigationStructure,

  // Types de statistiques
  CategoryStats,
  SubcategoryStats,

  // Types de filtrage
  CategoryFilters,
  SubcategoryFilters,
  CategorySortOptions,
  SubcategorySortOptions,
} from "./categories.js";

// =====================================================
// EXPORTS - COMPOSANTS
// =====================================================

export type {
  // Types composant
  Component,
  ComponentWithSubcategory,
  ComponentWithVersions,
  FullComponent,
  PublicComponent,
  CreateComponentData,
  UpdateComponentData,

  // Types version de composant
  ComponentVersion,
  ComponentVersionWithComponent,
  CreateComponentVersionData,
  UpdateComponentVersionData,

  // Types d'interaction utilisateur
  UserFavorite,
  ComponentDownload,
  ComponentCopy,
  ComponentView,

  // Types de demande de composant
  ComponentRequest,
  ComponentRequestWithUser,
  RequestVote,
  CreateComponentRequestData,

  // Types de recherche et filtrage
  ComponentFilters,
  ComponentSortOptions,

  // Types de statistiques
  ComponentStats,
  GlobalComponentStats,
} from "./components.js";

// =====================================================
// EXPORTS - API
// =====================================================

export type {
  // Types de réponse API génériques
  APIResponse,
  APIErrorResponse,
  APIResult,
  APIPaginatedResponse,

  // Types d'authentification API
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  LogoutRequest,
  LogoutResponse,
  GetProfileRequest,
  GetProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,

  // Types d'API pour les composants
  GetComponentsRequest,
  GetComponentsResponse,
  GetComponentRequest,
  GetComponentResponse,
  GetComponentCodeRequest,
  GetComponentCodeResponse,
  CopyComponentRequest,
  CopyComponentResponse,
  DownloadComponentRequest,
  DownloadComponentResponse,

  // Types d'API pour les catégories
  GetNavigationRequest,
  GetNavigationResponse,
  GetCategoriesRequest,
  GetCategoriesResponse,
  GetCategoryRequest,
  GetCategoryResponse,
  GetSubcategoriesRequest,
  GetSubcategoriesResponse,

  // Types d'API pour les favoris
  GetFavoritesRequest,
  GetFavoritesResponse,
  AddToFavoritesRequest,
  AddToFavoritesResponse,
  RemoveFromFavoritesRequest,
  RemoveFromFavoritesResponse,

  // Types d'API pour les demandes de composants
  GetComponentRequestsRequest,
  GetComponentRequestsResponse,
  CreateComponentRequestRequest,
  CreateComponentRequestResponse,
  VoteComponentRequestRequest,
  VoteComponentRequestResponse,

  // Types d'API admin
  GetUsersRequest,
  GetUsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  CreateComponentRequest,
  CreateComponentResponse,
  UpdateComponentRequest,
  UpdateComponentResponse,
  CreateComponentVersionRequest,
  CreateComponentVersionResponse,
  UpdateComponentVersionRequest,
  UpdateComponentVersionResponse,

  // Types d'API pour les statistiques
  GetGlobalStatsRequest,
  GetGlobalStatsResponse,
  GetComponentStatsRequest,
  GetComponentStatsResponse,

  // Types d'API pour les clés API
  GetAPIKeysRequest,
  GetAPIKeysResponse,
  CreateAPIKeyRequest,
  CreateAPIKeyResponse,
  RevokeAPIKeyRequest,
  RevokeAPIKeyResponse,

  // Types d'API pour les licences
  CreateLicenseRequest,
  CreateLicenseResponse,
  VerifyLicenseRequest,
  VerifyLicenseResponse,
} from "./api.js";

// =====================================================
// EXPORTS - ASSETS
// =====================================================

export type {
  AssetMetadata,
  SharedAsset,
  ComponentSpecificAsset,
  AssetExtractionResult,
  BatchUploadResult,
  AssetMapping,
  AssetMappingResult,
  OptimizedHtmlResult,
  ComponentAssetBundle,
  UploadOptions,
  AssetAnalytics,
  WorkflowProgress,
  AssetType,
  AssetFilter,
  CacheStrategy,
} from "./assets.js";

// =====================================================
// EXPORTS - HTTP CONTEXT
// =====================================================

export type {
  AuthenticatedHttpContext,
  AdminHttpContext,
  SuperAdminHttpContext,
  PremiumHttpContext,
  PermissionHttpContext,
} from "./http_context.js";

export {
  isAuthenticatedContext,
  isAdminContext,
  isSuperAdminContext,
  isPremiumContext,
  hasPermission,
  getUserFromContext,
  getSubscriptionFromContext,
  getPermissionsFromContext,
  getPersonalizationFromContext,
  getRateLimitsFromContext,
} from "./http_context.js";

// =====================================================
// EXPORTS - STRIPE
// =====================================================

export type {
  CreateCheckoutSessionParams,
  CheckoutSessionResponse,
  PublicSessionData,
  SessionPaymentStatus,
  StripePublicConfig,
  PublicProductData,
  PublicPriceData,
  StripeErrorDetails,
  StripeWebhookEventType,
  StripeWebhookData,
  SessionMetadata,
  ExtendedCheckoutSessionParams,
  PaymentStats,
  SessionFilters,
  PaginatedSessionsResponse,
  StripePaymentMode,
  StripeSessionStatus,
  StripePaymentStatus,
  PaymentLifecycleEvent,
  BillingDetails,
  PaymentInfo,
} from "./stripe_types.js";

// =====================================================
// EXPORTS PAR DÉFAUT POUR LA COMPATIBILITÉ
// =====================================================

/**
 * Types les plus couramment utilisés, exportés pour faciliter l'importation
 */
export type {
  User as OnaUser,
  License as OnaLicense,
} from "./auth.js";

export type {
  Component as OnaComponent,
  ComponentVersion as OnaComponentVersion,
} from "./components.js";

export type {
  Category as OnaCategory,
  Subcategory as OnaSubcategory,
} from "./categories.js";

export type {
  APIResponse as OnaAPIResponse,
} from "./api.js";

// =====================================================
// CONSTANTES UTILES
// =====================================================

/**
 * Valeurs par défaut pour les enums
 */
export const DEFAULT_VALUES = {
  USER_ROLE: "user" as const,
  AUTH_PROVIDER: "email" as const,
  PAYMENT_STATUS: "pending" as const,
  LICENSE_TIER: "free" as const,
  COMPONENT_STATUS: "draft" as const,
  FRAMEWORK_TYPE: "react" as const,
  CSS_FRAMEWORK: "tailwind_v4" as const,
  ACCESS_TYPE: "preview_only" as const,
  TOKEN_TYPE: "session" as const,
  TEAM_ROLE: "member" as const,
  COPIED_TARGET: "component" as const,
} as const;

/**
 * Listes des valeurs possibles pour les enums
 */
export const ENUM_VALUES = {
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
} as const;

/**
 * Limites et contraintes
 */
export const CONSTRAINTS = {
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
} as const;