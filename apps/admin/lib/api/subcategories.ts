import type {
  GetSubcategoriesRequest,
  GetSubcategoriesResponse,
  APIResponse,
  APIPaginatedResponse
} from "@workspace/types/api"
import type {
  Subcategory,
  FullSubcategory,
  CreateSubcategoryData,
  UpdateSubcategoryData,
  SubcategoryStats,
  SubcategorySortOptions,
  SubcategoryFilters
} from "@workspace/types/categories"
import type { UUID, PaginationParams } from "@workspace/types/common"
import { apiRequest } from "@/lib/query-client"

/**
 * Service API pour la gestion des sous-catégories (Admin)
 * Implémente toutes les 11 routes admin identifiées
 */
export const subcategoriesApi = {
  /**
   * 1. GET /api/admin/subcategories - Liste des sous-catégories
   */
  async getSubcategories(params?: {
    categoryId?: UUID
    includeStats?: boolean
    page?: number
    limit?: number
    search?: string
    sort?: SubcategorySortOptions
    filters?: SubcategoryFilters
  }): Promise<GetSubcategoriesResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId)
    if (params?.includeStats) searchParams.set("includeStats", "true")
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.search) searchParams.set("search", params.search)
    if (params?.sort) {
      searchParams.set("sortField", params.sort.field)
      searchParams.set("sortDirection", params.sort.direction)
    }
    if (params?.filters?.isActive !== undefined) {
      searchParams.set("isActive", params.filters.isActive.toString())
    }
    if (params?.filters?.hasComponents !== undefined) {
      searchParams.set("hasComponents", params.filters.hasComponents.toString())
    }

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/subcategories${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<GetSubcategoriesResponse>(endpoint)
  },

  /**
   * 2. GET /api/admin/subcategories/:id - Détail d'une sous-catégorie
   */
  async getSubcategory(id: UUID, params?: {
    includeCategory?: boolean
    includeComponents?: boolean
    includeStats?: boolean
  }): Promise<APIResponse<FullSubcategory>> {
    const searchParams = new URLSearchParams()
    
    if (params?.includeCategory) searchParams.set("includeCategory", "true")
    if (params?.includeComponents) searchParams.set("includeComponents", "true")
    if (params?.includeStats) searchParams.set("includeStats", "true")

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/subcategories/${id}${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<APIResponse<FullSubcategory>>(endpoint)
  },

  /**
   * 3. POST /api/admin/subcategories - Créer une sous-catégorie
   */
  async createSubcategory(data: CreateSubcategoryData): Promise<APIResponse<Subcategory>> {
    return apiRequest<APIResponse<Subcategory>>("/api/admin/subcategories", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 4. PUT /api/admin/subcategories/:id - Mettre à jour une sous-catégorie
   */
  async updateSubcategory(id: UUID, data: UpdateSubcategoryData): Promise<APIResponse<Subcategory>> {
    return apiRequest<APIResponse<Subcategory>>(`/api/admin/subcategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  /**
   * 5. DELETE /api/admin/subcategories/:id - Supprimer une sous-catégorie
   */
  async deleteSubcategory(id: UUID): Promise<APIResponse<{ message: string }>> {
    return apiRequest<APIResponse<{ message: string }>>(`/api/admin/subcategories/${id}`, {
      method: "DELETE",
    })
  },

  /**
   * 6. POST /api/admin/subcategories/reorder - Réorganiser les sous-catégories
   */
  async reorderSubcategories(data: {
    subcategoryIds: UUID[]
    categoryId?: UUID
  }): Promise<APIResponse<{ message: string }>> {
    return apiRequest<APIResponse<{ message: string }>>("/api/admin/subcategories/reorder", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 7. POST /api/admin/subcategories/:id/move - Déplacer une sous-catégorie vers une autre catégorie
   */
  async moveSubcategory(id: UUID, data: {
    newCategoryId: UUID
    newSortOrder?: number
  }): Promise<APIResponse<Subcategory>> {
    return apiRequest<APIResponse<Subcategory>>(`/api/admin/subcategories/${id}/move`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 8. GET /api/admin/subcategories/:id/stats - Statistiques d'une sous-catégorie
   */
  async getSubcategoryStats(id: UUID, params?: {
    period?: "7d" | "30d" | "90d" | "1y"
  }): Promise<APIResponse<SubcategoryStats>> {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set("period", params.period)

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/subcategories/${id}/stats${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<APIResponse<SubcategoryStats>>(endpoint)
  },

  /**
   * 9. POST /api/admin/subcategories/check-slug - Vérifier la disponibilité d'un slug
   */
  async checkSlug(data: {
    slug: string
    categoryId: UUID
    excludeId?: UUID
  }): Promise<APIResponse<{ available: boolean; suggestions?: string[] }>> {
    return apiRequest<APIResponse<{ available: boolean; suggestions?: string[] }>>("/api/admin/subcategories/check-slug", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 10. POST /api/admin/subcategories/batch - Opérations par lot sur les sous-catégories
   */
  async batchOperations(data: {
    subcategoryIds: UUID[]
    action: "delete" | "activate" | "deactivate" | "move" | "reorder"
    categoryId?: UUID
    newCategoryId?: UUID
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
    }>>("/api/admin/subcategories/batch", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 11. GET /api/admin/subcategories/export - Exporter les sous-catégories
   */
  async exportSubcategories(params?: {
    categoryId?: UUID
    format?: "csv" | "json" | "xlsx"
    includeStats?: boolean
  }): Promise<APIResponse<{ downloadUrl: string; expiresAt: string }>> {
    const searchParams = new URLSearchParams()
    
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId)
    if (params?.format) searchParams.set("format", params.format)
    if (params?.includeStats) searchParams.set("includeStats", "true")

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/subcategories/export${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<APIResponse<{ downloadUrl: string; expiresAt: string }>>(endpoint)
  },
}

/**
 * Types pour les paramètres des requêtes sous-catégories
 */
export interface GetSubcategoriesParams extends PaginationParams {
  categoryId?: UUID
  includeStats?: boolean
  search?: string
  sort?: SubcategorySortOptions
  filters?: SubcategoryFilters
}

export interface GetSubcategoryParams {
  includeCategory?: boolean
  includeComponents?: boolean
  includeStats?: boolean
}

export interface SubcategoryStatsParams {
  period?: "7d" | "30d" | "90d" | "1y"
}

export interface CheckSubcategorySlugData {
  slug: string
  categoryId: UUID
  excludeId?: UUID
}

export interface ReorderSubcategoriesData {
  subcategoryIds: UUID[]
  categoryId?: UUID
}

export interface MoveSubcategoryData {
  newCategoryId: UUID
  newSortOrder?: number
}

export interface ExportSubcategoriesParams {
  categoryId?: UUID
  format?: "csv" | "json" | "xlsx"
  includeStats?: boolean
}

export interface SubcategoryBatchOperationData {
  subcategoryIds: UUID[]
  action: "delete" | "activate" | "deactivate" | "move" | "reorder"
  categoryId?: UUID
  newCategoryId?: UUID
  newOrder?: UUID[]
}