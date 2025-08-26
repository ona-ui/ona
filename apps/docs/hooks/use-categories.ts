import {
  useQuery,
  useQueryClient,
  UseQueryResult
} from "@tanstack/react-query"
import type {
  GetCategoriesResponse,
  GetCategoryResponse,
  APIResponse
} from "@workspace/types/api"
import type {
  Category,
  CategoryWithSubcategories
} from "@workspace/types/categories"
import type { UUID } from "@workspace/types/common"
import {
  categoriesApi,
  type GetCategoriesParams
} from "@/lib/api/categories"
import { queryKeys } from "@/lib/query-client"

// =====================================================
// QUERIES (Lecture)
// =====================================================

/**
 * Hook pour récupérer la liste des catégories
 */
export function useCategories(params?: GetCategoriesParams) {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => categoriesApi.getCategories(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook pour récupérer une catégorie par ID
 */
export function useCategory(
  id: UUID,
  params?: {
    includeSubcategories?: boolean
    includeComponents?: boolean
  },
  options?: {
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoriesApi.getCategory(id, params),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook pour récupérer la navigation des catégories
 */
export function useCategoriesNavigation() {
  return useQuery({
    queryKey: [...queryKeys.categories.lists(), "navigation"],
    queryFn: () => categoriesApi.getNavigation(),
    staleTime: 10 * 60 * 1000, // 10 minutes pour la navigation
  })
}

/**
 * Hook pour récupérer les statistiques publiques des catégories
 */
export function useCategoriesStats() {
  return useQuery({
    queryKey: [...queryKeys.categories.stats()],
    queryFn: () => categoriesApi.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}


// =====================================================
// HOOKS UTILITAIRES
// =====================================================

/**
 * Hook pour précharger une catégorie
 */
export function usePrefetchCategory() {
  const queryClient = useQueryClient()

  return (id: UUID, params?: { includeSubcategories?: boolean; includeComponents?: boolean }) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.detail(id),
      queryFn: () => categoriesApi.getCategory(id, params),
      staleTime: 3 * 60 * 1000,
    })
  }
}

/**
 * Hook pour obtenir une catégorie depuis le cache (sans requête réseau)
 */
export function useCachedCategory(id: UUID): CategoryWithSubcategories | undefined {
  const queryClient = useQueryClient()

  const cachedData = queryClient.getQueryData<GetCategoryResponse>(
    queryKeys.categories.detail(id)
  )

  return cachedData?.data
}

/**
 * Hook pour invalider manuellement le cache des catégories
 */
export function useInvalidateCategories() {
  return {
    all: () => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
    byId: (id: UUID) => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(id) })
    },
    lists: () => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
    },
    stats: () => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.stats() })
    }
  }
}

// =====================================================
// TYPES POUR LES HOOKS
// =====================================================

export type CategoriesQueryResult = UseQueryResult<GetCategoriesResponse, Error>
export type CategoryQueryResult = UseQueryResult<GetCategoryResponse, Error>