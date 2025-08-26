import type {
  APIResponse,
  APIPaginatedResponse
} from "@workspace/types/api"
import type {
  ComponentVersion,
  ComponentVersionWithComponent,
  CreateComponentVersionData,
  UpdateComponentVersionData
} from "@workspace/types/components"
import type { 
  UUID, 
  PaginationParams, 
  FrameworkType, 
  CssFramework,
  ComponentDependencies,
  ComponentConfig,
  ComponentIntegrations,
  ComponentFiles
} from "@workspace/types/common"
import { apiRequest } from "@/lib/query-client"

/**
 * Service API pour la gestion des versions de composants (Admin)
 * Implémente toutes les 12 routes admin identifiées
 */
export const versionsApi = {
  /**
   * 1. GET /api/admin/components/:componentId/versions - Liste des versions d'un composant (index)
   */
  async getVersions(params?: {
    componentId?: UUID
    framework?: FrameworkType
    cssFramework?: CssFramework
    isDefault?: boolean
    page?: number
    limit?: number
    includeComponent?: boolean
    includeCode?: boolean
  }): Promise<APIPaginatedResponse<ComponentVersion>> {
    if (!params?.componentId) {
      throw new Error("componentId est requis pour récupérer les versions")
    }

    const searchParams = new URLSearchParams()
    
    if (params?.framework) searchParams.set("framework", params.framework)
    if (params?.cssFramework) searchParams.set("cssFramework", params.cssFramework)
    if (params?.isDefault !== undefined) searchParams.set("isDefault", params.isDefault.toString())
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.includeComponent) searchParams.set("includeComponent", "true")
    if (params?.includeCode) searchParams.set("includeCode", "true")

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/components/${params.componentId}/versions${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<APIPaginatedResponse<ComponentVersion>>(endpoint)
  },

  /**
   * 2. GET /api/admin/components/:componentId/versions/:id - Détail d'une version (show)
   */
  async getVersion(componentId: UUID, id: UUID, params?: {
    includeComponent?: boolean
    includeCode?: boolean
    includeFiles?: boolean
  }): Promise<APIResponse<ComponentVersion>> {
    const searchParams = new URLSearchParams()
    
    if (params?.includeComponent) searchParams.set("includeComponent", "true")
    if (params?.includeCode) searchParams.set("includeCode", "true")
    if (params?.includeFiles) searchParams.set("includeFiles", "true")

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/components/${componentId}/versions/${id}${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<APIResponse<ComponentVersion>>(endpoint)
  },

  /**
   * 3. POST /api/admin/components/:componentId/versions - Créer une version (store)
   */
  async createVersion(data: CreateComponentVersionData): Promise<APIResponse<ComponentVersion>> {
    return apiRequest<APIResponse<ComponentVersion>>(`/api/admin/components/${data.componentId}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * 4. PUT /api/admin/components/:componentId/versions/:id - Mettre à jour une version (update)
   */
  async updateVersion(componentId: UUID, id: UUID, data: UpdateComponentVersionData): Promise<APIResponse<ComponentVersion>> {
    return apiRequest<APIResponse<ComponentVersion>>(`/api/admin/components/${componentId}/versions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  /**
   * 5. DELETE /api/admin/components/:componentId/versions/:id - Supprimer une version (destroy)
   */
  async deleteVersion(componentId: UUID, id: UUID): Promise<APIResponse<{ message: string }>> {
    return apiRequest<APIResponse<{ message: string }>>(`/api/admin/components/${componentId}/versions/${id}`, {
      method: "DELETE",
    })
  },


  /**
   * 6. GET /api/admin/versions/:id1/compare/:id2 - Comparer deux versions (compare)
   */
  async compareVersions(id1: UUID, id2: UUID): Promise<APIResponse<{
    version1: ComponentVersion
    version2: ComponentVersion
    differences: {
      framework: { old: FrameworkType; new: FrameworkType } | null
      cssFramework: { old: CssFramework; new: CssFramework } | null
      codeChanges: {
        additions: string[]
        deletions: string[]
        modifications: Array<{ line: number; old: string; new: string }>
      }
      dependencyChanges: {
        added: Record<string, string>
        removed: Record<string, string>
        updated: Record<string, { old: string; new: string }>
      }
      configChanges: {
        added: Record<string, any>
        removed: Record<string, any>
        updated: Record<string, { old: any; new: any }>
      }
    }
  }>> {
    return apiRequest<APIResponse<{
      version1: ComponentVersion
      version2: ComponentVersion
      differences: {
        framework: { old: FrameworkType; new: FrameworkType } | null
        cssFramework: { old: CssFramework; new: CssFramework } | null
        codeChanges: {
          additions: string[]
          deletions: string[]
          modifications: Array<{ line: number; old: string; new: string }>
        }
        dependencyChanges: {
          added: Record<string, string>
          removed: Record<string, string>
          updated: Record<string, { old: string; new: string }>
        }
        configChanges: {
          added: Record<string, any>
          removed: Record<string, any>
          updated: Record<string, { old: any; new: any }>
        }
      }
    }>>(`/api/admin/versions/${id1}/compare/${id2}`)
  },

  /**
   * 7. POST /api/admin/components/:componentId/versions/:id/activate - Définir comme version par défaut (setActive)
   */
  async setActiveVersion(componentId: UUID, id: UUID): Promise<APIResponse<ComponentVersion>> {
    return apiRequest<APIResponse<ComponentVersion>>(`/api/admin/components/${componentId}/versions/${id}/activate`, {
      method: "POST",
    })
  },

  /**
   * 8. POST /api/admin/versions/:id/compile - Compiler une version (compile)
   */
  async compileVersion(id: UUID, params?: {
    target?: "production" | "development" | "preview"
    minify?: boolean
    includeDependencies?: boolean
  }): Promise<APIResponse<{
    compiledCode: string
    sourceMap?: string
    dependencies?: ComponentDependencies
    warnings: string[]
    errors: string[]
    buildTime: number
    outputSize: number
  }>> {
    const searchParams = new URLSearchParams()
    
    if (params?.target) searchParams.set("target", params.target)
    if (params?.minify !== undefined) searchParams.set("minify", params.minify.toString())
    if (params?.includeDependencies !== undefined) searchParams.set("includeDependencies", params.includeDependencies.toString())

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/versions/${id}/compile${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<APIResponse<{
      compiledCode: string
      sourceMap?: string
      dependencies?: ComponentDependencies
      warnings: string[]
      errors: string[]
      buildTime: number
      outputSize: number
    }>>(endpoint, {
      method: "POST",
    })
  },

  /**
   * 9. GET /api/admin/components/:componentId/frameworks - Liste des frameworks supportés pour un composant (getFrameworks)
   */
  async getFrameworks(componentId: UUID): Promise<APIResponse<{
    frameworks: Array<{
      type: FrameworkType
      name: string
      version: string
      supported: boolean
      cssFrameworks: Array<{
        type: CssFramework
        name: string
        version: string
        compatible: boolean
      }>
    }>
  }>> {
    return apiRequest<APIResponse<{
      frameworks: Array<{
        type: FrameworkType
        name: string
        version: string
        supported: boolean
        cssFrameworks: Array<{
          type: CssFramework
          name: string
          version: string
          compatible: boolean
        }>
      }>
    }>>(`/api/admin/components/${componentId}/frameworks`)
  },

  /**
   * 10. POST /api/admin/components/:componentId/versions/:id/variants - Créer une variante (createVariant)
   */
  async createVariant(componentId: UUID, id: UUID, data: {
    targetFramework?: FrameworkType
    targetCssFramework?: CssFramework
    variantName?: string
    applyTransformations?: boolean
    preserveOriginal?: boolean
  }): Promise<APIResponse<ComponentVersion>> {
    return apiRequest<APIResponse<ComponentVersion>>(`/api/admin/components/${componentId}/versions/${id}/variants`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },


  /**
   * 13. POST /api/admin/components/:componentId/versions/:id/assets - Upload d'assets pour une version
   */
  async uploadVersionAssets(componentId: UUID, versionId: UUID, files: FileList): Promise<APIResponse<{
    uploadedAssets: Array<{
      filename: string
      originalName: string
      url: string
      size: number
      mimeType: string
      type: 'image' | 'video'
    }>
    totalAssets: number
    versionId: UUID
  }>> {
    const formData = new FormData()
    
    // Ajouter tous les fichiers
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file) {
        formData.append('assets', file)
      }
    }

    return apiRequest<APIResponse<{
      uploadedAssets: Array<{
        filename: string
        originalName: string
        url: string
        size: number
        mimeType: string
        type: 'image' | 'video'
      }>
      totalAssets: number
      versionId: UUID
    }>>(`/api/admin/components/${componentId}/versions/${versionId}/assets`, {
      method: "POST",
      body: formData,
      headers: {
        // Ne pas définir Content-Type pour FormData
      },
    })
  },

  /**
   * 14. GET /api/admin/components/:componentId/versions/:id/assets - Récupérer les assets d'une version
   */
  async getVersionAssets(componentId: UUID, versionId: UUID): Promise<APIResponse<{
    versionId: UUID
    componentId: UUID
    assets: Array<{
      filename: string
      originalName: string
      url: string
      size: number
      mimeType: string
      type: 'image' | 'video'
    }>
    totalAssets: number
  }>> {
    return apiRequest<APIResponse<{
      versionId: UUID
      componentId: UUID
      assets: Array<{
        filename: string
        originalName: string
        url: string
        size: number
        mimeType: string
        type: 'image' | 'video'
      }>
      totalAssets: number
    }>>(`/api/admin/components/${componentId}/versions/${versionId}/assets`)
  },

  /**
   * 15. DELETE /api/admin/components/:componentId/versions/:id/assets/:filename - Supprimer un asset
   */
  async deleteVersionAsset(componentId: UUID, versionId: UUID, filename: string): Promise<APIResponse<{
    deletedAsset: {
      filename: string
      originalName: string
      url: string
      size: number
      mimeType: string
      type: 'image' | 'video'
    }
    remainingAssets: number
  }>> {
    return apiRequest<APIResponse<{
      deletedAsset: {
        filename: string
        originalName: string
        url: string
        size: number
        mimeType: string
        type: 'image' | 'video'
      }
      remainingAssets: number
    }>>(`/api/admin/components/${componentId}/versions/${versionId}/assets/${encodeURIComponent(filename)}`, {
      method: "DELETE",
    })
  },
}

/**
 * Types pour les paramètres des requêtes versions
 */
export interface GetVersionsParams extends PaginationParams {
  componentId?: UUID
  framework?: FrameworkType
  cssFramework?: CssFramework
  isDefault?: boolean
  includeComponent?: boolean
  includeCode?: boolean
}

export interface GetVersionParams {
  includeComponent?: boolean
  includeCode?: boolean
  includeFiles?: boolean
}

export interface CompileVersionParams {
  target?: "production" | "development" | "preview"
  minify?: boolean
  includeDependencies?: boolean
}

export interface CreateVariantData {
  targetFramework?: FrameworkType
  targetCssFramework?: CssFramework
  variantName?: string
  applyTransformations?: boolean
  preserveOriginal?: boolean
}
