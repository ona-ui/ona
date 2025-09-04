/**
 * Types pour les requêtes et réponses API
 */

import type { 
  UUID, 
  Timestamp, 
  PaginatedResponse, 
  PaginationParams, 
  SortOptions, 
  SearchFilters,
  APIError,
  ErrorCode
} from "./common.js";
import type { 
  User, 
  PublicUser, 
  UserProfile, 
  CreateUserData, 
  UpdateUserData, 
  License, 
  CreateLicenseData, 
  APIKey, 
  CreateAPIKeyData, 
  APIKeyWithToken,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ResetPasswordData,
  ChangePasswordData
} from "./auth.js";
import type { 
  Product, 
  Category, 
  Subcategory, 
  ProductWithCategories, 
  CategoryWithSubcategories, 
  FullSubcategory,
  CreateProductData, 
  UpdateProductData, 
  CreateCategoryData, 
  UpdateCategoryData, 
  CreateSubcategoryData, 
  UpdateSubcategoryData,
  NavigationStructure
} from "./categories.js";
import type { 
  Component, 
  ComponentVersion, 
  PublicComponent, 
  FullComponent, 
  ComponentWithVersions,
  CreateComponentData, 
  UpdateComponentData, 
  CreateComponentVersionData, 
  UpdateComponentVersionData,
  ComponentRequest,
  ComponentRequestWithUser,
  CreateComponentRequestData,
  ComponentFilters,
  ComponentSortOptions,
  ComponentStats,
  GlobalComponentStats
} from "./components.js";

// =====================================================
// TYPES DE RÉPONSE API GÉNÉRIQUES
// =====================================================

/**
 * Réponse API de succès générique
 */
export interface APIResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: Timestamp;
}

/**
 * Réponse API d'erreur
 */
export interface APIErrorResponse {
  success: false;
  error: APIError;
  timestamp: Timestamp;
}

/**
 * Union des types de réponse API
 */
export type APIResult<T = any> = APIResponse<T> | APIErrorResponse;

/**
 * Réponse paginée API
 */
export interface APIPaginatedResponse<T> extends APIResponse<PaginatedResponse<T>> {}

// =====================================================
// TYPES D'AUTHENTIFICATION API
// =====================================================

/**
 * Requête de connexion
 */
export interface LoginRequest {
  body: LoginCredentials;
}

/**
 * Réponse de connexion
 */
export interface LoginResponse extends APIResponse<AuthResponse> {}

/**
 * Requête d'inscription
 */
export interface RegisterRequest {
  body: RegisterData;
}

/**
 * Réponse d'inscription
 */
export interface RegisterResponse extends APIResponse<AuthResponse> {}

/**
 * Requête de déconnexion
 */
export interface LogoutRequest {}

/**
 * Réponse de déconnexion
 */
export interface LogoutResponse extends APIResponse<{ message: string }> {}

/**
 * Requête de profil utilisateur
 */
export interface GetProfileRequest {}

/**
 * Réponse de profil utilisateur
 */
export interface GetProfileResponse extends APIResponse<UserProfile> {}

/**
 * Requête de mise à jour de profil
 */
export interface UpdateProfileRequest {
  body: UpdateUserData;
}

/**
 * Réponse de mise à jour de profil
 */
export interface UpdateProfileResponse extends APIResponse<UserProfile> {}

/**
 * Requête de changement de mot de passe
 */
export interface ChangePasswordRequest {
  body: ChangePasswordData;
}

/**
 * Réponse de changement de mot de passe
 */
export interface ChangePasswordResponse extends APIResponse<{ message: string }> {}

/**
 * Requête de réinitialisation de mot de passe
 */
export interface ResetPasswordRequest {
  body: ResetPasswordData;
}

/**
 * Réponse de réinitialisation de mot de passe
 */
export interface ResetPasswordResponse extends APIResponse<{ message: string }> {}

// =====================================================
// TYPES D'API POUR LES COMPOSANTS
// =====================================================

/**
 * Requête de liste des composants
 */
export interface GetComponentsRequest {
  query?: ComponentFilters & PaginationParams & {
    sort?: ComponentSortOptions;
  };
}

/**
 * Réponse de liste des composants
 */
export interface GetComponentsResponse extends APIResponse<{
  components: PublicComponent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {}

/**
 * Requête de détail d'un composant
 */
export interface GetComponentRequest {
  params: {
    slug: string;
  };
  query?: {
    framework?: string;
    cssFramework?: string;
  };
}

/**
 * Réponse de détail d'un composant
 */
export interface GetComponentResponse extends APIResponse<FullComponent> {}

/**
 * Requête de code d'un composant
 */
export interface GetComponentCodeRequest {
  params: {
    componentId: UUID;
    versionId: UUID;
  };
  query?: {
    target?: "preview" | "full" | "files";
  };
}

/**
 * Réponse de code d'un composant
 */
export interface GetComponentCodeResponse extends APIResponse<{
  code?: string;
  files?: Record<string, any>;
  dependencies?: Record<string, any>;
  config?: Record<string, any>;
  integrations?: Record<string, any>;
}> {}

/**
 * Requête de copie d'un composant
 */
export interface CopyComponentRequest {
  params: {
    componentId: UUID;
    versionId: UUID;
  };
  body: {
    target: "component" | "snippet" | "full_code";
    snippetName?: string;
  };
}

/**
 * Réponse de copie d'un composant
 */
export interface CopyComponentResponse extends APIResponse<{
  copied: boolean;
  code?: string;
  message: string;
}> {}

/**
 * Requête de téléchargement d'un composant
 */
export interface DownloadComponentRequest {
  params: {
    componentId: UUID;
    versionId: UUID;
  };
}

/**
 * Réponse de téléchargement d'un composant
 */
export interface DownloadComponentResponse extends APIResponse<{
  downloadUrl: string;
  expiresAt: Timestamp;
}> {}

// =====================================================
// TYPES D'API POUR LES CATÉGORIES
// =====================================================

/**
 * Requête de navigation
 */
export interface GetNavigationRequest {}

/**
 * Réponse de navigation
 */
export interface GetNavigationResponse extends APIResponse<NavigationStructure> {}

/**
 * Requête de liste des catégories
 */
export interface GetCategoriesRequest {
  query?: {
    productId?: UUID;
    includeSubcategories?: boolean;
    includeStats?: boolean;
  };
}

/**
 * Réponse de liste des catégories
 */
export interface GetCategoriesResponse extends APIResponse<{
  categories: CategoryWithSubcategories[];
}> {}

/**
 * Requête de détail d'une catégorie
 */
export interface GetCategoryRequest {
  params: {
    slug: string;
  };
  query?: {
    includeComponents?: boolean;
  };
}

/**
 * Réponse de détail d'une catégorie
 */
export interface GetCategoryResponse extends APIResponse<CategoryWithSubcategories> {}

/**
 * Requête de liste des sous-catégories
 */
export interface GetSubcategoriesRequest {
  query?: {
    categoryId?: UUID;
    includeStats?: boolean;
  };
}

/**
 * Réponse de liste des sous-catégories
 */
export interface GetSubcategoriesResponse extends APIResponse<FullSubcategory[]> {}

// =====================================================
// TYPES D'API POUR LES FAVORIS
// =====================================================

/**
 * Requête de liste des favoris
 */
export interface GetFavoritesRequest {
  query?: PaginationParams & {
    sort?: ComponentSortOptions;
  };
}

/**
 * Réponse de liste des favoris
 */
export interface GetFavoritesResponse extends APIPaginatedResponse<PublicComponent> {}

/**
 * Requête d'ajout aux favoris
 */
export interface AddToFavoritesRequest {
  params: {
    componentId: UUID;
  };
}

/**
 * Réponse d'ajout aux favoris
 */
export interface AddToFavoritesResponse extends APIResponse<{ message: string }> {}

/**
 * Requête de suppression des favoris
 */
export interface RemoveFromFavoritesRequest {
  params: {
    componentId: UUID;
  };
}

/**
 * Réponse de suppression des favoris
 */
export interface RemoveFromFavoritesResponse extends APIResponse<{ message: string }> {}

// =====================================================
// TYPES D'API POUR LES DEMANDES DE COMPOSANTS
// =====================================================

/**
 * Requête de liste des demandes
 */
export interface GetComponentRequestsRequest {
  query?: PaginationParams & {
    status?: string;
    sort?: "votes" | "recent" | "oldest";
  };
}

/**
 * Réponse de liste des demandes
 */
export interface GetComponentRequestsResponse extends APIPaginatedResponse<ComponentRequestWithUser> {}

/**
 * Requête de création de demande
 */
export interface CreateComponentRequestRequest {
  body: CreateComponentRequestData;
}

/**
 * Réponse de création de demande
 */
export interface CreateComponentRequestResponse extends APIResponse<ComponentRequest> {}

/**
 * Requête de vote pour une demande
 */
export interface VoteComponentRequestRequest {
  params: {
    requestId: UUID;
  };
}

/**
 * Réponse de vote pour une demande
 */
export interface VoteComponentRequestResponse extends APIResponse<{ message: string; voteCount: number }> {}

// =====================================================
// TYPES D'API ADMIN
// =====================================================

/**
 * Requête de liste des utilisateurs (admin)
 */
export interface GetUsersRequest {
  query?: PaginationParams & {
    role?: string;
    search?: string;
    sort?: SortOptions;
  };
}

/**
 * Réponse de liste des utilisateurs (admin)
 */
export interface GetUsersResponse extends APIPaginatedResponse<User> {}

/**
 * Requête de création d'utilisateur (admin)
 */
export interface CreateUserRequest {
  body: CreateUserData;
}

/**
 * Réponse de création d'utilisateur (admin)
 */
export interface CreateUserResponse extends APIResponse<User> {}

/**
 * Requête de mise à jour d'utilisateur (admin)
 */
export interface UpdateUserRequest {
  params: {
    userId: UUID;
  };
  body: UpdateUserData & {
    role?: string;
    emailVerified?: boolean;
  };
}

/**
 * Réponse de mise à jour d'utilisateur (admin)
 */
export interface UpdateUserResponse extends APIResponse<User> {}

/**
 * Requête de création de composant (admin)
 */
export interface CreateComponentRequest {
  body: CreateComponentData;
}

/**
 * Réponse de création de composant (admin)
 */
export interface CreateComponentResponse extends APIResponse<Component> {}

/**
 * Requête de mise à jour de composant (admin)
 */
export interface UpdateComponentRequest {
  params: {
    componentId: UUID;
  };
  body: UpdateComponentData;
}

/**
 * Réponse de mise à jour de composant (admin)
 */
export interface UpdateComponentResponse extends APIResponse<Component> {}

/**
 * Requête de création de version (admin)
 */
export interface CreateComponentVersionRequest {
  body: CreateComponentVersionData;
}

/**
 * Réponse de création de version (admin)
 */
export interface CreateComponentVersionResponse extends APIResponse<ComponentVersion> {}

/**
 * Requête de mise à jour de version (admin)
 */
export interface UpdateComponentVersionRequest {
  params: {
    versionId: UUID;
  };
  body: UpdateComponentVersionData;
}

/**
 * Réponse de mise à jour de version (admin)
 */
export interface UpdateComponentVersionResponse extends APIResponse<ComponentVersion> {}

// =====================================================
// TYPES D'API POUR LES STATISTIQUES
// =====================================================

/**
 * Requête de statistiques globales
 */
export interface GetGlobalStatsRequest {}

/**
 * Réponse de statistiques globales
 */
export interface GetGlobalStatsResponse extends APIResponse<GlobalComponentStats> {}

/**
 * Requête de statistiques d'un composant
 */
export interface GetComponentStatsRequest {
  params: {
    componentId: UUID;
  };
  query?: {
    period?: "7d" | "30d" | "90d" | "1y";
  };
}

/**
 * Réponse de statistiques d'un composant
 */
export interface GetComponentStatsResponse extends APIResponse<ComponentStats> {}

// =====================================================
// TYPES D'API POUR LES CLÉS API
// =====================================================

/**
 * Requête de liste des clés API
 */
export interface GetAPIKeysRequest {}

/**
 * Réponse de liste des clés API
 */
export interface GetAPIKeysResponse extends APIResponse<APIKey[]> {}

/**
 * Requête de création de clé API
 */
export interface CreateAPIKeyRequest {
  body: CreateAPIKeyData;
}

/**
 * Réponse de création de clé API
 */
export interface CreateAPIKeyResponse extends APIResponse<APIKeyWithToken> {}

/**
 * Requête de révocation de clé API
 */
export interface RevokeAPIKeyRequest {
  params: {
    keyId: UUID;
  };
}

/**
 * Réponse de révocation de clé API
 */
export interface RevokeAPIKeyResponse extends APIResponse<{ message: string }> {}

// =====================================================
// TYPES D'API POUR LES LICENCES
// =====================================================

/**
 * Requête de création de licence
 */
export interface CreateLicenseRequest {
  body: CreateLicenseData;
}

/**
 * Réponse de création de licence
 */
export interface CreateLicenseResponse extends APIResponse<License> {}

/**
 * Requête de vérification de licence
 */
export interface VerifyLicenseRequest {
  params: {
    licenseKey: string;
  };
}

/**
 * Réponse de vérification de licence
 */
export interface VerifyLicenseResponse extends APIResponse<{
  valid: boolean;
  license?: License;
  permissions: string[];
}> {}