import type {
  GetComponentsRequest,
  GetComponentsResponse,
  GetComponentRequest,
  GetComponentResponse,
  APIResponse,
  APIPaginatedResponse
} from "@workspace/types/api"
import type {
  Component,
  FullComponent,
  PublicComponent,
  ComponentWithVersions,
  ComponentFilters,
  ComponentSortOptions
} from "@workspace/types/components"
import type { UUID, PaginationParams, ComponentStatus } from "@workspace/types/common"
import { apiRequest } from "@/lib/query-client"

/**
 * Service API pour la gestion des composants (Public)
 * Utilise les routes publiques pour la partie web
 */
export const componentsApi = {
  /**
   * 1. GET /api/public/components - Liste des composants
   */
  async getComponents(params?: {
    subcategoryId?: UUID
    categoryId?: UUID
    productId?: UUID
    status?: ComponentStatus
    isFree?: boolean
    isNew?: boolean
    isFeatured?: boolean
    search?: string
    tags?: string[]
    framework?: string
    cssFramework?: string
    page?: number
    limit?: number
    sort?: ComponentSortOptions
    includeVersions?: boolean
    includeStats?: boolean
  }): Promise<GetComponentsResponse> {
    const searchParams = new URLSearchParams()

    if (params?.subcategoryId) searchParams.set("subcategoryId", params.subcategoryId)
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId)
    if (params?.productId) searchParams.set("productId", params.productId)
    if (params?.status) searchParams.set("status", params.status)
    if (params?.isFree !== undefined) searchParams.set("isFree", params.isFree.toString())
    if (params?.isNew !== undefined) searchParams.set("isNew", params.isNew.toString())
    if (params?.isFeatured !== undefined) searchParams.set("isFeatured", params.isFeatured.toString())
    if (params?.search) searchParams.set("search", params.search)
    if (params?.tags) searchParams.set("tags", params.tags.join(","))
    if (params?.framework) searchParams.set("framework", params.framework)
    if (params?.cssFramework) searchParams.set("cssFramework", params.cssFramework)
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.sort) {
      searchParams.set("sortField", params.sort.field)
      searchParams.set("sortDirection", params.sort.direction)
    }
    if (params?.includeVersions) searchParams.set("includeVersions", "true")
    if (params?.includeStats) searchParams.set("includeStats", "true")

    const queryString = searchParams.toString()
    const endpoint = `/api/public/components${queryString ? `?${queryString}` : ""}`

    return apiRequest<GetComponentsResponse>(endpoint)
  },

  /**
   * 2. GET /api/public/components/:id - Détail d'un composant
   */
  async getComponent(id: UUID, params?: {
    includeVersions?: boolean
    includeSubcategory?: boolean
    includeStats?: boolean
  }): Promise<GetComponentResponse> {
    const searchParams = new URLSearchParams()

    if (params?.includeVersions) searchParams.set("includeVersions", "true")
    if (params?.includeSubcategory) searchParams.set("includeSubcategory", "true")
    if (params?.includeStats) searchParams.set("includeStats", "true")

    const queryString = searchParams.toString()
    const endpoint = `/api/public/components/${id}${queryString ? `?${queryString}` : ""}`

    return apiRequest<GetComponentResponse>(endpoint)
  },

  /**
   * 3. GET /api/public/components/search - Recherche de composants
   */
  async searchComponents(query: string): Promise<APIResponse<Component[]>> {
    return apiRequest<APIResponse<Component[]>>(`/api/public/components/search?q=${encodeURIComponent(query)}`)
  },

  /**
   * 4. GET /api/public/components/featured - Composants mis en avant
   */
  async getFeaturedComponents(): Promise<APIResponse<Component[]>> {
    return apiRequest<APIResponse<Component[]>>("/api/public/components/featured")
  },

  /**
   * 5. GET /api/public/components/popular - Composants populaires
   */
  async getPopularComponents(): Promise<APIResponse<Component[]>> {
    return apiRequest<APIResponse<Component[]>>("/api/public/components/popular")
  },

  /**
   * 6. GET /api/public/components/:id/preview - Preview compilé d'un composant
   */
  async getPreview(id: UUID, params?: {
    versionId?: UUID
    framework?: string
    theme?: "light" | "dark"
    viewport?: "mobile" | "tablet" | "desktop"
  }): Promise<APIResponse<{
    previewUrl: string
    expiresAt: string
    metadata: {
      framework: string
      theme: string
      viewport: string
    }
  }>> {
    const searchParams = new URLSearchParams()

    if (params?.versionId) searchParams.set("versionId", params.versionId)
    if (params?.framework) searchParams.set("framework", params.framework)
    if (params?.theme) searchParams.set("theme", params.theme)
    if (params?.viewport) searchParams.set("viewport", params.viewport)

    const queryString = searchParams.toString()
    const endpoint = `/api/public/components/${id}/preview${queryString ? `?${queryString}` : ""}`

    return apiRequest<APIResponse<{
      previewUrl: string
      expiresAt: string
      metadata: {
        framework: string
        theme: string
        viewport: string
      }
    }>>(endpoint)
  },

  /**
   * 7. GET /api/public/components/:id/recommendations - Recommandations basées sur un composant
   */
  async getRecommendations(id: UUID): Promise<APIResponse<Component[]>> {
    return apiRequest<APIResponse<Component[]>>(`/api/public/components/${id}/recommendations`)
  },

  /**
   * 8. GET /api/public/components/:id/assets - Assets d'un composant
   */
  async getComponentAssets(id: UUID): Promise<APIResponse<any>> {
    return apiRequest<APIResponse<any>>(`/api/public/components/${id}/assets`)
  },
}

/**
 * Types pour les paramètres des requêtes composants
 */
export interface GetComponentsParams extends PaginationParams {
  subcategoryId?: UUID
  categoryId?: UUID
  productId?: UUID
  status?: ComponentStatus
  isFree?: boolean
  isNew?: boolean
  isFeatured?: boolean
  search?: string
  tags?: string[]
  framework?: string
  cssFramework?: string
  sort?: ComponentSortOptions
  includeVersions?: boolean
  includeStats?: boolean
}

export interface GetComponentParams {
  includeVersions?: boolean
  includeSubcategory?: boolean
  includeStats?: boolean
}

export interface PreviewComponentParams {
  versionId?: UUID
  framework?: string
  theme?: "light" | "dark"
  viewport?: "mobile" | "tablet" | "desktop"
}