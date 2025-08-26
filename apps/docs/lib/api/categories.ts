import type {
  GetCategoriesRequest,
  GetCategoriesResponse,
  GetCategoryRequest,
  GetCategoryResponse,
  APIResponse,
  APIPaginatedResponse
} from "@workspace/types/api"
import type {
  Category,
  CategoryWithSubcategories,
  CreateCategoryData,
  UpdateCategoryData,
  CategoryStats,
  CategorySortOptions
} from "@workspace/types/categories"
import type { UUID, PaginationParams } from "@workspace/types/common"
import { apiRequest } from "@/lib/query-client"

/**
 * Service API pour la gestion des catégories (Public)
 * Utilise les routes publiques pour la partie web
 */
export const categoriesApi = {
  /**
   * 1. GET /api/public/categories - Liste des catégories
   */
  async getCategories(params?: {
    productId?: UUID
    includeSubcategories?: boolean
    includeStats?: boolean
    page?: number
    limit?: number
    search?: string
    sort?: CategorySortOptions
  }): Promise<GetCategoriesResponse> {
    const searchParams = new URLSearchParams()

    if (params?.productId) searchParams.set("productId", params.productId)
    if (params?.includeSubcategories) searchParams.set("includeSubcategories", "true")
    if (params?.includeStats) searchParams.set("includeStats", "true")
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.search) searchParams.set("search", params.search)
    if (params?.sort) {
      searchParams.set("sortField", params.sort.field)
      searchParams.set("sortDirection", params.sort.direction)
    }

    const queryString = searchParams.toString()
    const endpoint = `/api/public/categories${queryString ? `?${queryString}` : ""}`

    return apiRequest<GetCategoriesResponse>(endpoint)
  },

  /**
   * 2. GET /api/public/categories/:id - Détail d'une catégorie
   */
  async getCategory(id: UUID, params?: {
    includeSubcategories?: boolean
    includeComponents?: boolean
  }): Promise<GetCategoryResponse> {
    const searchParams = new URLSearchParams()

    if (params?.includeSubcategories) searchParams.set("includeSubcategories", "true")
    if (params?.includeComponents) searchParams.set("includeComponents", "true")

    const queryString = searchParams.toString()
    const endpoint = `/api/public/categories/${id}${queryString ? `?${queryString}` : ""}`

    return apiRequest<GetCategoryResponse>(endpoint)
  },

  /**
   * 3. GET /api/public/categories/navigation - Structure de navigation
   */
  async getNavigation(): Promise<APIResponse<any>> {
    return apiRequest<APIResponse<any>>("/api/public/categories/navigation")
  },

  /**
   * 4. GET /api/public/categories/stats - Statistiques publiques des catégories
   */
  async getStats(): Promise<APIResponse<any>> {
    return apiRequest<APIResponse<any>>("/api/public/categories/stats")
  },
}

/**
 * Types pour les paramètres des requêtes catégories
 */
export interface GetCategoriesParams extends PaginationParams {
  productId?: UUID
  includeSubcategories?: boolean
  includeStats?: boolean
  search?: string
  sort?: CategorySortOptions
}

export interface CategoryStatsParams {
  period?: "7d" | "30d" | "90d" | "1y"
}

export interface CheckCategorySlugData {
  slug: string
  productId: UUID
  excludeId?: UUID
}

export interface ExportCategoriesParams {
  productId?: UUID
  format?: "csv" | "json" | "xlsx"
}

export interface CategoryBatchOperationData {
  categoryIds: UUID[]
  action: "delete" | "activate" | "deactivate" | "reorder"
  productId?: UUID
  newOrder?: UUID[]
}

export interface DuplicateCategoryData {
  name: string
  slug: string
  copySubcategories?: boolean
}