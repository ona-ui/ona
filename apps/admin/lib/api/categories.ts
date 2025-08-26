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
 * Service API pour la gestion des catégories (Admin)
 * Implémente toutes les 12 routes admin identifiées
 */
export const categoriesApi = {
  /**
   * 1. GET /api/admin/categories - Liste des catégories
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
    const endpoint = `/api/admin/categories${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<GetCategoriesResponse>(endpoint)
  },

  /**
   * 2. GET /api/admin/categories/:id - Détail d'une catégorie
   */
  async getCategory(id: UUID, params?: {
    includeSubcategories?: boolean
    includeComponents?: boolean
  }): Promise<GetCategoryResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.includeSubcategories) searchParams.set("includeSubcategories", "true")
    if (params?.includeComponents) searchParams.set("includeComponents", "true")

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/categories/${id}${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<GetCategoryResponse>(endpoint)
  },

  /**
   * 3. POST /api/admin/categories - Créer une catégorie
   */
  async createCategory(data: CreateCategoryData): Promise<APIResponse<Category>> {
    return apiRequest<APIResponse<Category>>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 4. PUT /api/admin/categories/:id - Mettre à jour une catégorie
   */
  async updateCategory(id: UUID, data: UpdateCategoryData): Promise<APIResponse<Category>> {
    return apiRequest<APIResponse<Category>>(`/api/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  /**
   * 5. DELETE /api/admin/categories/:id - Supprimer une catégorie
   */
  async deleteCategory(id: UUID): Promise<APIResponse<{ message: string }>> {
    return apiRequest<APIResponse<{ message: string }>>(`/api/admin/categories/${id}`, {
      method: "DELETE",
    })
  },

  /**
   * 6. POST /api/admin/categories/reorder - Réorganiser les catégories
   */
  async reorderCategories(data: {
    categoryIds: UUID[]
    productId?: UUID
  }): Promise<APIResponse<{ message: string }>> {
    return apiRequest<APIResponse<{ message: string }>>("/api/admin/categories/reorder", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 7. GET /api/admin/categories/:id/stats - Statistiques d'une catégorie
   */
  async getCategoryStats(id: UUID, params?: {
    period?: "7d" | "30d" | "90d" | "1y"
  }): Promise<APIResponse<CategoryStats>> {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set("period", params.period)

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/categories/${id}/stats${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<APIResponse<CategoryStats>>(endpoint)
  },

  /**
   * 8. POST /api/admin/categories/check-slug - Vérifier la disponibilité d'un slug
   */
  async checkSlug(data: {
    slug: string
    productId: UUID
    excludeId?: UUID
  }): Promise<APIResponse<{ available: boolean; suggestions?: string[] }>> {
    return apiRequest<APIResponse<{ available: boolean; suggestions?: string[] }>>("/api/admin/categories/check-slug", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 9. GET /api/admin/categories/export - Exporter les catégories
   */
  async exportCategories(params?: {
    productId?: UUID
    format?: "csv" | "json" | "xlsx"
  }): Promise<APIResponse<{ downloadUrl: string; expiresAt: string }>> {
    const searchParams = new URLSearchParams()
    
    if (params?.productId) searchParams.set("productId", params.productId)
    if (params?.format) searchParams.set("format", params.format)

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/categories/export${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<APIResponse<{ downloadUrl: string; expiresAt: string }>>(endpoint)
  },

  /**
   * 10. POST /api/admin/categories/batch - Opérations par lot sur les catégories
   */
  async batchOperations(data: {
    categoryIds: UUID[]
    action: "delete" | "activate" | "deactivate" | "reorder"
    productId?: UUID
    newOrder?: UUID[]
  }): Promise<APIResponse<{ 
    processed: number
    errors: { id: UUID; error: string }[]
    message: string
  }>> {
    return apiRequest<APIResponse<{ 
      processed: number
      errors: { id: UUID; error: string }[]
      message: string
    }>>("/api/admin/categories/batch", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 11. GET /api/admin/categories/global-stats - Statistiques globales enrichies des catégories
   */
  async getGlobalStats(): Promise<APIResponse<{
    totalCategories: number
    activeCategories: number
    totalSubcategories: number
    activeSubcategories: number
    totalComponents: number
    publishedComponents: number
    totalUsers: number
    totalViews: number
    totalDownloads: number
    totalCopies: number
    totalRevenue: number
    avgComponentsPerCategory: number
    avgSubcategoriesPerCategory: number
    topCategories: Array<{
      id: string
      name: string
      slug: string
      componentCount: number
      viewCount: number
      downloadCount: number
      copyCount: number
    }>
    recentActivity: {
      viewsLast7Days: number
      downloadsLast7Days: number
      copiesLast7Days: number
      newUsersLast7Days: number
    }
    chartData: {
      viewsOverTime: Array<{ date: string; views: number }>
      downloadsOverTime: Array<{ date: string; downloads: number }>
      copiesOverTime: Array<{ date: string; copies: number }>
      revenueOverTime: Array<{ date: string; revenue: number }>
    }
  }>> {
    return apiRequest<APIResponse<{
      totalCategories: number
      activeCategories: number
      totalSubcategories: number
      activeSubcategories: number
      totalComponents: number
      publishedComponents: number
      totalUsers: number
      totalViews: number
      totalDownloads: number
      totalCopies: number
      totalRevenue: number
      avgComponentsPerCategory: number
      avgSubcategoriesPerCategory: number
      topCategories: Array<{
        id: string
        name: string
        slug: string
        componentCount: number
        viewCount: number
        downloadCount: number
        copyCount: number
      }>
      recentActivity: {
        viewsLast7Days: number
        downloadsLast7Days: number
        copiesLast7Days: number
        newUsersLast7Days: number
      }
      chartData: {
        viewsOverTime: Array<{ date: string; views: number }>
        downloadsOverTime: Array<{ date: string; downloads: number }>
        copiesOverTime: Array<{ date: string; copies: number }>
        revenueOverTime: Array<{ date: string; revenue: number }>
      }
    }>>("/api/admin/categories/global-stats")
  },

  /**
   * 12. POST /api/admin/categories/:id/duplicate - Dupliquer une catégorie
   */
  async duplicateCategory(id: UUID, data: {
    name: string
    slug: string
    copySubcategories?: boolean
  }): Promise<APIResponse<Category>> {
    return apiRequest<APIResponse<Category>>(`/api/admin/categories/${id}/duplicate`, {
      method: "POST",
      body: JSON.stringify(data),
    })
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