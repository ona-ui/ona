import type {
  Category,
  Subcategory,
  Component
} from "@/lib/api"
import { headers } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

/**
 * Server-side API functions for ISR
 * Ces fonctions sont utilisées côté serveur pour le pré-rendu avec ISR
 */
export class ServerApi {
  private static async fetchApi<T>(endpoint: string, useHeaders = true): Promise<T> {
    const url = `${API_BASE_URL}/api/public${endpoint}`

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 🔧 FIX: Récupérer les cookies depuis les headers Next.js pour les requêtes SSR
    // Seulement si useHeaders est true (pour éviter les erreurs dans generateStaticParams)
    if (useHeaders) {
      try {
        const headersList = await headers()
        const cookie = headersList.get('cookie')

        // Transmettre les cookies si disponibles
        if (cookie) {
          requestHeaders['Cookie'] = cookie
        }
      } catch (error) {
      }
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      credentials: useHeaders ? 'include' : 'same-origin', // 🔧 FIX: Inclure les cookies d'authentification seulement si headers activés
      // Cache configuration for ISR
      next: {
        revalidate: 300, // 5 minutes par défaut
      }
    })

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText} for ${url}`)
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  private static async fetchApiShortCache<T>(endpoint: string, useHeaders = true): Promise<T> {
    const url = `${API_BASE_URL}/api/public${endpoint}`

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 🔧 FIX: Récupérer les cookies depuis les headers Next.js pour les requêtes SSR
    // Seulement si useHeaders est true (pour éviter les erreurs dans generateStaticParams)
    if (useHeaders) {
      try {
        const headersList = await headers()
        const cookie = headersList.get('cookie')

        // Transmettre les cookies si disponibles
        if (cookie) {
          requestHeaders['Cookie'] = cookie
        }
      } catch (error) {
      }
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      credentials: useHeaders ? 'include' : 'same-origin',
      // Cache court pour permettre la génération statique mais garder les données fraîches
      next: {
        revalidate: 30, // 30 secondes de cache pour les composants
      }
    })

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText} for ${url}`)
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  private static async fetchApiNoCache<T>(endpoint: string, useHeaders = true): Promise<T> {
    const url = `${API_BASE_URL}/api/public${endpoint}`

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 🔧 FIX: Récupérer les cookies depuis les headers Next.js pour les requêtes SSR
    // Seulement si useHeaders est true (pour éviter les erreurs dans generateStaticParams)
    if (useHeaders) {
      try {
        const headersList = await headers()
        const cookie = headersList.get('cookie')

        // Transmettre les cookies si disponibles
        if (cookie) {
          requestHeaders['Cookie'] = cookie
        }
      } catch (error) {
      }
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      credentials: useHeaders ? 'include' : 'same-origin',
      // Pas de cache - toujours récupérer les données fraîches
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText} for ${url}`)
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Fetch categories with optional subcategories
   */
  static async getCategories(params?: {
    includeSubcategories?: boolean
    productId?: string
  }, useHeaders = true): Promise<{ data: Category[] }> {
    const searchParams = new URLSearchParams()

    if (params?.includeSubcategories) {
      searchParams.set('includeSubcategories', 'true')
    }
    if (params?.productId) {
      searchParams.set('productId', params.productId)
    }

    const query = searchParams.toString()
    const endpoint = `/categories${query ? `?${query}` : ''}`

    try {
      const result = await this.fetchApi<any>(endpoint, useHeaders)

      // Handle different response structures
      if (result?.data?.categories) {
        return { data: result.data.categories }
      }
      if (result?.data && Array.isArray(result.data)) {
        return { data: result.data }
      }
      if (Array.isArray(result)) {
        return { data: result }
      }

      return { data: [] }
    } catch (error) {
      console.error('Error fetching categories:', error)
      return { data: [] }
    }
  }

  /**
   * Fetch a specific category with subcategories
   */
  static async getCategoryBySlug(categorySlug: string): Promise<Category | null> {
    try {
      const result = await this.fetchApi<any>(`/categories/${categorySlug}`)
      return result?.data || result || null
    } catch (error) {
      console.error(`Error fetching category ${categorySlug}:`, error)
      return null
    }
  }

  /**
   * Fetch components with filtering
   */
  static async getComponents(params?: {
    categoryId?: string
    subcategoryId?: string
    category?: string
    subcategory?: string
    status?: 'published' | 'draft'
    limit?: number
    includeVersions?: boolean
  }, useHeaders = true, shortCache = false): Promise<{ data: Component[] }> {
    const searchParams = new URLSearchParams()

    if (params?.categoryId) searchParams.set('categoryId', params.categoryId)
    if (params?.subcategoryId) searchParams.set('subcategoryId', params.subcategoryId)
    if (params?.category) searchParams.set('category', params.category)
    if (params?.subcategory) searchParams.set('subcategory', params.subcategory)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.includeVersions) searchParams.set('includeVersions', 'true')

    const query = searchParams.toString()
    const endpoint = `/components${query ? `?${query}` : ''}`

    try {
      // Utiliser un cache court pour les composants si demandé, sinon cache standard
      const result = shortCache 
        ? await this.fetchApiShortCache<any>(endpoint, useHeaders)
        : await this.fetchApi<any>(endpoint, useHeaders)

      console.log(result)

      // Handle different response structures
      if (result?.data?.components) {
        return { data: result.data.components }
      }
      if (result?.data && Array.isArray(result.data)) {
        return { data: result.data }
      }
      if (Array.isArray(result)) {
        return { data: result }
      }

      return { data: [] }
    } catch (error) {
      console.error('Error fetching components:', error)
      return { data: [] }
    }
  }

  /**
   * Fetch a specific component by ID
   */
  static async getComponentById(componentId: string): Promise<Component | null> {
    try {
      const result = await this.fetchApiShortCache<any>(`/components/${componentId}?includeVersions=true`)
      return result?.data || result || null
    } catch (error) {
      console.error(`Error fetching component ${componentId}:`, error)
      return null
    }
  }

  /**
   * Fetch subcategory with components
   */
  static async getSubcategoryBySlug(subcategorySlug: string): Promise<Subcategory | null> {
    try {
      const result = await this.fetchApi<any>(`/subcategories/${subcategorySlug}`)
      return result?.data || result || null
    } catch (error) {
      console.error(`Error fetching subcategory ${subcategorySlug}:`, error)
      return null
    }
  }

  /**
   * Get navigation data for sidebar
   */
  static async getNavigation(): Promise<any> {
    try {
      const result = await this.fetchApi<any>('/categories/navigation')
      return result?.data || result || null
    } catch (error) {
      console.error('Error fetching navigation:', error)
      return null
    }
  }

  /**
   * Get featured components
   */
  static async getFeaturedComponents(): Promise<{ data: Component[] }> {
    try {
      const result = await this.fetchApiShortCache<any>('/components/featured')
      
      if (result?.data && Array.isArray(result.data)) {
        return { data: result.data }
      }
      if (Array.isArray(result)) {
        return { data: result }
      }
      
      return { data: [] }
    } catch (error) {
      console.error('Error fetching featured components:', error)
      return { data: [] }
    }
  }

  /**
   * Get popular components
   */
  static async getPopularComponents(): Promise<{ data: Component[] }> {
    try {
      const result = await this.fetchApiShortCache<any>('/components/popular')
      
      if (result?.data && Array.isArray(result.data)) {
        return { data: result.data }
      }
      if (Array.isArray(result)) {
        return { data: result }
      }
      
      return { data: [] }
    } catch (error) {
      console.error('Error fetching popular components:', error)
      return { data: [] }
    }
  }
}

/**
 * Helper function to get all categories for generateStaticParams
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  try {
    const { data: categories } = await ServerApi.getCategories({ includeSubcategories: true }, false)
    return categories.map(cat => cat.slug).filter(Boolean)
  } catch (error) {
    console.error('Error getting category slugs:', error)
    return []
  }
}

/**
 * Helper function to get all subcategory slugs for generateStaticParams
 */
export async function getAllSubcategorySlugs(): Promise<Array<{ categorySlug: string, subcategorySlug: string }>> {
  try {
    const { data: categories } = await ServerApi.getCategories({ includeSubcategories: true }, false)
    const slugs: Array<{ categorySlug: string, subcategorySlug: string }> = []

    categories.forEach(category => {
      if (category.subcategories) {
        category.subcategories.forEach(subcategory => {
          if (subcategory.slug) {
            slugs.push({
              categorySlug: category.slug,
              subcategorySlug: subcategory.slug
            })
          }
        })
      }
    })

    return slugs
  } catch (error) {
    console.error('Error getting subcategory slugs:', error)
    return []
  }
}

/**
 * Helper function to get all component IDs for generateStaticParams
 */
export async function getAllComponentIds(): Promise<string[]> {
  try {
    const { data: components } = await ServerApi.getComponents({
      status: 'published',
      includeVersions: false
    }, false)
    return components.map(comp => comp.id).filter(Boolean)
  } catch (error) {
    console.error('Error getting component IDs:', error)
    return []
  }
}