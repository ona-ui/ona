const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

// Types from database schema
export type LicenseTier = 'free' | 'pro' | 'team' | 'enterprise'
export type AccessType = 'preview_only' | 'copy' | 'full_access' | 'download'
export type ComponentStatus = 'draft' | 'published' | 'archived' | 'deprecated'
export type FrameworkType = 'html' | 'react' | 'vue' | 'svelte' | 'alpine' | 'angular'
export type CssFramework = 'tailwind_v3' | 'tailwind_v4' | 'vanilla_css'

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  categories?: Category[]
}

export interface Category {
  id: string
  productId: string
  name: string
  slug: string
  description?: string
  iconName?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  subcategories?: Subcategory[]
  componentCount?: number
}

export interface Subcategory {
  id: string
  categoryId: string
  name: string
  slug: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  components?: Component[]
  componentCount?: number
}

export interface Component {
  id: string
  subcategoryId: string
  name: string
  slug: string
  description?: string
  isFree: boolean
  requiredTier: LicenseTier
  accessType: AccessType
  status: ComponentStatus
  isNew: boolean
  isFeatured: boolean
  conversionRate?: string
  testedCompanies?: string[]
  previewImageLarge?: string
  previewImageSmall?: string
  previewVideoUrl?: string
  tags?: string[]
  sortOrder: number
  viewCount: number
  copyCount: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
  versions?: ComponentVersion[]
  versionsCount?: number
  // User access computed fields
  hasAccess?: boolean
  canViewCode?: boolean
  canCopy?: boolean
  canDownload?: boolean
  accessIndicator?: {
    type: string
    label: string
    canAccess: boolean
    icon: string
  }
  urls?: {
    preview: string
    thumbnail: string
    assets: string[]
  }
}

export interface ComponentVersion {
  id: string
  componentId: string
  versionNumber: string
  framework: FrameworkType
  cssFramework: CssFramework
  codePreview?: string
  codeFull?: string
  codeEncrypted?: string
  dependencies?: Record<string, any>
  configRequired?: Record<string, any>
  supportsDarkMode: boolean
  darkModeCode?: string
  integrations?: Record<string, any>
  integrationCode?: Record<string, any>
  files?: Record<string, any>
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export class ApiService {
  private static async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/api/public${endpoint}`, {
      credentials: 'include', // 🔧 FIX: Inclure les cookies d'authentification
      ...options,
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  // Navigation and hierarchy
  static async getNavigation(): Promise<any> {
    return this.fetchApi<any>('/categories/navigation')
  }

  static async getCategoriesStats(): Promise<any> {
    return this.fetchApi<any>('/categories/stats')
  }

  // Categories with component counts
  static async getCategories(productId?: string): Promise<Category[]> {
    const query = productId ? `?product=${productId}` : ''
    return this.fetchApi<Category[]>(`/categories${query}`)
  }

  static async getCategoryWithSubcategories(categorySlug: string): Promise<Category> {
    return this.fetchApi<Category>(`/categories/${categorySlug}`)
  }

  // Subcategories with components
  static async getSubcategories(categoryId?: string): Promise<Subcategory[]> {
    const query = categoryId ? `?category=${categoryId}` : ''
    return this.fetchApi<Subcategory[]>(`/subcategories${query}`)
  }

  static async getSubcategoryWithComponents(subcategorySlug: string): Promise<Subcategory> {
    return this.fetchApi<Subcategory>(`/subcategories/${subcategorySlug}`)
  }

  // Components
  static async getFeaturedComponents(): Promise<Component[]> {
    return this.fetchApi<Component[]>('/components/featured')
  }

  static async getPopularComponents(): Promise<Component[]> {
    return this.fetchApi<Component[]>('/components/popular')
  }

  static async getComponents(params?: {
    limit?: number
    page?: number
    subcategory?: string
    category?: string
    categoryId?: string
    subcategoryId?: string
    product?: string
    framework?: FrameworkType
    tier?: LicenseTier
    status?: ComponentStatus
    isFree?: boolean
    search?: string
    includeVersions?: boolean
  }): Promise<{ data: Component[], meta: any }> {
    const searchParams = new URLSearchParams()
    
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.subcategory) searchParams.append('subcategory', params.subcategory)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.categoryId) searchParams.append('categoryId', params.categoryId)
    if (params?.subcategoryId) searchParams.append('subcategoryId', params.subcategoryId)
    if (params?.product) searchParams.append('product', params.product)
    if (params?.framework) searchParams.append('framework', params.framework)
    if (params?.tier) searchParams.append('tier', params.tier)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.isFree !== undefined) searchParams.append('isFree', params.isFree.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.includeVersions) searchParams.append('includeVersions', 'true')
    
    const query = searchParams.toString()
    return this.fetchApi<{ data: Component[], meta: any }>(`/components${query ? `?${query}` : ''}`)
  }

  static async getComponent(id: string): Promise<Component> {
    return this.fetchApi<Component>(`/components/${id}`)
  }

  static async getComponentPreview(id: string): Promise<any> {
    return this.fetchApi<any>(`/components/${id}/preview`)
  }

  static async getComponentRecommendations(id: string): Promise<Component[]> {
    return this.fetchApi<Component[]>(`/components/${id}/recommendations`)
  }

  static async getComponentAssets(id: string): Promise<any> {
    return this.fetchApi<any>(`/components/${id}/assets`)
  }

  static async searchComponents(query: string): Promise<Component[]> {
    return this.fetchApi<Component[]>(`/components/search?q=${encodeURIComponent(query)}`)
  }

  /**
   * Incrémente le compteur de copies d'un composant
   * @param componentId - ID du composant
   * @returns Promise avec la réponse de l'API
   */
  static async incrementCopyCount(componentId: string): Promise<{ componentId: string; message: string }> {
    return this.fetchApi<{ componentId: string; message: string }>(`/components/${componentId}/copy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  // Health check
  static async healthCheck(): Promise<any> {
    return this.fetchApi<any>('/health')
  }

  // API info
  static async getApiInfo(): Promise<any> {
    return this.fetchApi<any>('/info')
  }
}