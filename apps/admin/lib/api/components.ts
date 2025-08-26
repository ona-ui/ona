import type {
  GetComponentsRequest,
  GetComponentsResponse,
  GetComponentRequest,
  GetComponentResponse,
  GetComponentStatsRequest,
  GetComponentStatsResponse,
  APIResponse,
  APIPaginatedResponse
} from "@workspace/types/api"
import type {
  Component,
  FullComponent,
  PublicComponent,
  ComponentWithVersions,
  CreateComponentData,
  UpdateComponentData,
  ComponentFilters,
  ComponentSortOptions,
  ComponentStats
} from "@workspace/types/components"
import type { UUID, PaginationParams, ComponentStatus } from "@workspace/types/common"
import { apiRequest } from "@/lib/query-client"

/**
 * Service API pour la gestion des composants (Admin)
 * Implémente toutes les 12 routes admin identifiées
 */
export const componentsApi = {
  /**
   * 1. GET /api/admin/components - Liste des composants
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
    const endpoint = `/api/admin/components${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<GetComponentsResponse>(endpoint)
  },

  /**
   * 2. GET /api/admin/components/:id - Détail d'un composant
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
    const endpoint = `/api/admin/components/${id}${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<GetComponentResponse>(endpoint)
  },

  /**
   * 3. POST /api/admin/components - Créer un composant
   */
  async createComponent(data: CreateComponentData): Promise<APIResponse<Component>> {
    return apiRequest<APIResponse<Component>>("/api/admin/components", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 4. PUT /api/admin/components/:id - Mettre à jour un composant
   */
  async updateComponent(id: UUID, data: UpdateComponentData): Promise<APIResponse<Component>> {
    return apiRequest<APIResponse<Component>>(`/api/admin/components/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  /**
   * 5. DELETE /api/admin/components/:id - Supprimer un composant
   */
  async deleteComponent(id: UUID): Promise<APIResponse<{ message: string }>> {
    return apiRequest<APIResponse<{ message: string }>>(`/api/admin/components/${id}`, {
      method: "DELETE",
    })
  },

  /**
   * 6. POST /api/admin/components/:id/duplicate - Dupliquer un composant
   */
  async duplicateComponent(id: UUID, data: {
    name: string
    slug: string
    subcategoryId?: UUID
    duplicateVersions?: boolean
  }): Promise<APIResponse<Component>> {
    return apiRequest<APIResponse<Component>>(`/api/admin/components/${id}/duplicate`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 7. PATCH /api/admin/components/:id/status - Changer le statut d'un composant
   */
  async changeComponentStatus(id: UUID, data: {
    status: ComponentStatus
    publishedAt?: string
    archivedAt?: string
  }): Promise<APIResponse<Component>> {
    return apiRequest<APIResponse<Component>>(`/api/admin/components/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  /**
   * 8. GET /api/admin/components/:id/stats - Statistiques d'un composant
   */
  async getComponentStats(id: UUID, params?: {
    period?: "7d" | "30d" | "90d" | "1y"
  }): Promise<GetComponentStatsResponse> {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set("period", params.period)

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/components/${id}/stats${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<GetComponentStatsResponse>(endpoint)
  },

  /**
   * 9. POST /api/admin/components/:id/upload-files - Upload de fichiers pour un composant
   */
  async uploadComponentFiles(id: UUID, data: {
    files: FormData
    versionId?: UUID
    type: "preview_image" | "preview_video" | "source_files" | "assets"
  }): Promise<APIResponse<{
    uploadedFiles: Array<{
      filename: string
      originalName: string
      size: number
      mimetype: string
      url: string
    }>
    message: string
  }>> {
    // Pour les uploads de fichiers, on n'utilise pas JSON
    return apiRequest<APIResponse<{
      uploadedFiles: Array<{
        filename: string
        originalName: string
        size: number
        mimetype: string
        url: string
      }>
      message: string
    }>>(`/api/admin/components/${id}/upload-files?type=${data.type}${data.versionId ? `&versionId=${data.versionId}` : ""}`, {
      method: "POST",
      body: data.files,
      headers: {
        // Retirer le Content-Type pour les FormData
      },
    })
  },

  /**
   * 10. GET /api/admin/components/:id/preview - Prévisualiser un composant
   */
  async previewComponent(id: UUID, params?: {
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
    const endpoint = `/api/admin/components/${id}/preview${queryString ? `?${queryString}` : ""}`
    
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
   * 11. POST /api/admin/components/check-slug - Vérifier la disponibilité d'un slug
   */
  async checkSlug(data: {
    slug: string
    subcategoryId: UUID
    excludeId?: UUID
  }): Promise<APIResponse<{ available: boolean; suggestions?: string[] }>> {
    return apiRequest<APIResponse<{ available: boolean; suggestions?: string[] }>>("/api/admin/components/check-slug", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 12. POST /api/admin/components/batch - Opérations par lot sur les composants
   */
  async batchOperations(data: {
    componentIds: UUID[]
    action: "delete" | "publish" | "archive" | "feature" | "unfeature" | "change_status" | "move"
    status?: ComponentStatus
    subcategoryId?: UUID
    isFeatured?: boolean
  }): Promise<APIResponse<{ 
    processed: number
    errors: { id: UUID; error: string }[]
    message: string
  }>> {
    return apiRequest<APIResponse<{ 
      processed: number
      errors: { id: UUID; error: string }[]
      message: string
    }>>("/api/admin/components/batch", {
      method: "POST",
      body: JSON.stringify(data),
    })
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

export interface ComponentStatsParams {
  period?: "7d" | "30d" | "90d" | "1y"
}

export interface DuplicateComponentData {
  name: string
  slug: string
  subcategoryId?: UUID
  duplicateVersions?: boolean
}

export interface ChangeComponentStatusData {
  status: ComponentStatus
  publishedAt?: string
  archivedAt?: string
}

export interface UploadComponentFilesData {
  files: FormData
  versionId?: UUID
  type: "preview_image" | "preview_video" | "source_files" | "assets"
}

export interface PreviewComponentParams {
  versionId?: UUID
  framework?: string
  theme?: "light" | "dark"
  viewport?: "mobile" | "tablet" | "desktop"
}

export interface CheckComponentSlugData {
  slug: string
  subcategoryId: UUID
  excludeId?: UUID
}

export interface ComponentBatchOperationData {
  componentIds: UUID[]
  action: "delete" | "publish" | "archive" | "feature" | "unfeature" | "change_status" | "move"
  status?: ComponentStatus
  subcategoryId?: UUID
  isFeatured?: boolean
}