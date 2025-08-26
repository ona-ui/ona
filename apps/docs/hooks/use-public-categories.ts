'use client'

import {
  useQuery,
  UseQueryResult
} from "@tanstack/react-query"
import { ApiService, type Category, type Subcategory } from "@/lib/api"

interface UsePublicCategoriesOptions {
  enabled?: boolean
  includeSubcategories?: boolean
}

/**
 * Hook pour récupérer les catégories publiques (pour l'affichage public)
 */
export function usePublicCategories(options: UsePublicCategoriesOptions = {}) {
  const { enabled = true, includeSubcategories = false } = options

  return useQuery({
    queryKey: ['public-categories', { includeSubcategories }],
    queryFn: () => ApiService.getCategories(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      // Les données sont directement un tableau de catégories
      if (Array.isArray(data)) {
        return { data }
      }
      return { data: [] }
    }
  })
}

/**
 * Hook pour récupérer une catégorie publique avec ses sous-catégories
 */
export function usePublicCategory(categorySlug: string, enabled = true) {
  return useQuery({
    queryKey: ['public-category', categorySlug],
    queryFn: () => ApiService.getCategoryWithSubcategories(categorySlug),
    enabled: !!categorySlug && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook pour récupérer une sous-catégorie publique avec ses composants
 */
export function usePublicSubcategory(subcategorySlug: string, enabled = true) {
  return useQuery({
    queryKey: ['public-subcategory', subcategorySlug],
    queryFn: () => ApiService.getSubcategoryWithComponents(subcategorySlug),
    enabled: !!subcategorySlug && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook pour récupérer les sous-catégories publiques
 */
export function usePublicSubcategories(categoryId?: string) {
  return useQuery({
    queryKey: ['public-subcategories', categoryId],
    queryFn: () => ApiService.getSubcategories(categoryId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Types pour les résultats des hooks
export type PublicCategoriesQueryResult = UseQueryResult<Category[], Error>
export type PublicCategoryQueryResult = UseQueryResult<Category, Error>
export type PublicSubcategoryQueryResult = UseQueryResult<Subcategory, Error>
export type PublicSubcategoriesQueryResult = UseQueryResult<Subcategory[], Error>