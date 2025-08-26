'use client'

import {
  useQuery,
  UseQueryResult
} from "@tanstack/react-query"
import { ApiService, type Component } from "@/lib/api"

interface UsePublicComponentsParams {
  categoryId?: string
  subcategoryId?: string
  category?: string
  subcategory?: string
  status?: 'published' | 'draft'
  limit?: number
  search?: string
  featured?: boolean
  popular?: boolean
  enabled?: boolean
}

/**
 * Hook pour récupérer les composants publics
 */
export function usePublicComponents(params: UsePublicComponentsParams = {}) {
  const { enabled = true, ...queryParams } = params

  return useQuery({
    queryKey: ['public-components', queryParams],
    queryFn: async () => {
      if (queryParams?.featured) {
        return ApiService.getFeaturedComponents()
      }
      if (queryParams?.popular) {
        return ApiService.getPopularComponents()
      }
      // Utiliser la route /api/public/components avec includeVersions=true
      const searchParams = new URLSearchParams()

      if (queryParams?.categoryId) searchParams.append('categoryId', queryParams.categoryId)
      if (queryParams?.subcategoryId) searchParams.append('subcategoryId', queryParams.subcategoryId)
      if (queryParams?.limit) searchParams.append('limit', queryParams.limit.toString())
      if (queryParams?.search) searchParams.append('search', queryParams.search)

      // Toujours inclure les versions pour avoir le code
      searchParams.append('includeVersions', 'true')

      return ApiService.getComponents({
        categoryId: queryParams?.categoryId,
        subcategoryId: queryParams?.subcategoryId,
        category: queryParams?.category,
        subcategory: queryParams?.subcategory,
        status: queryParams?.status || 'published',
        limit: queryParams?.limit,
        includeVersions: true
      })
    },
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    select: (data) => {
      // Les données sont directement un tableau de composants
      if (Array.isArray(data)) {
        return { data }
      }
      return { data: [] }
    }
  })
}

/**
 * Hook pour récupérer les composants populaires
 */
export function usePopularComponents(enabled = true) {
  return useQuery({
    queryKey: ['public-components', 'popular'],
    queryFn: () => ApiService.getPopularComponents(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook pour récupérer les composants en vedette
 */
export function useFeaturedComponents(enabled = true) {
  return useQuery({
    queryKey: ['public-components', 'featured'],
    queryFn: () => ApiService.getFeaturedComponents(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook pour récupérer les composants d'une catégorie
 */
export function useCategoryComponents(category: string, enabled = true) {
  return useQuery({
    queryKey: ['public-components', 'category', category],
    queryFn: () => ApiService.getComponents({ 
      category, 
      status: 'published' 
    }),
    enabled: !!category && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    select: (data) => {
      return Array.isArray(data) ? data : (data?.data || [])
    }
  })
}

/**
 * Hook pour récupérer les composants d'une sous-catégorie
 */
export function useSubcategoryComponents(subcategory: string, enabled = true) {
  return useQuery({
    queryKey: ['public-components', 'subcategory', subcategory],
    queryFn: () => ApiService.getComponents({ 
      subcategory, 
      status: 'published' 
    }),
    enabled: !!subcategory && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    select: (data) => {
      return Array.isArray(data) ? data : (data?.data || [])
    }
  })
}

// Types pour les résultats des hooks
export type PublicComponentsQueryResult = UseQueryResult<Component[], Error>
export type PopularComponentsQueryResult = UseQueryResult<Component[], Error>
export type FeaturedComponentsQueryResult = UseQueryResult<Component[], Error>