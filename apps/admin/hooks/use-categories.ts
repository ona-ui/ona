import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from "@tanstack/react-query"
import type {
  GetCategoriesResponse,
  GetCategoryResponse,
  APIResponse
} from "@workspace/types/api"
import type {
  Category,
  CategoryWithSubcategories,
  CreateCategoryData,
  UpdateCategoryData,
  CategoryStats
} from "@workspace/types/categories"
import type { UUID } from "@workspace/types/common"
import {
  categoriesApi,
  type GetCategoriesParams,
  type CategoryStatsParams,
  type CheckCategorySlugData,
  type ExportCategoriesParams,
  type CategoryBatchOperationData,
  type DuplicateCategoryData
} from "@/lib/api/categories"
import { queryKeys, invalidateQueries } from "@/lib/query-client"
import { useErrorHandler } from "./use-error-handler"
import { toast } from "@/components/admin/error-toast"

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
 * Hook pour récupérer les statistiques d'une catégorie
 */
export function useCategoryStats(
  id: UUID, 
  params?: CategoryStatsParams,
  options?: {
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: [...queryKeys.categories.detail(id), "stats", params],
    queryFn: () => categoriesApi.getCategoryStats(id, params),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes pour les stats
  })
}

/**
 * Hook pour récupérer les statistiques globales des catégories
 */
export function useGlobalCategoriesStats() {
  return useQuery({
    queryKey: [...queryKeys.categories.stats()],
    queryFn: () => categoriesApi.getGlobalStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// =====================================================
// MUTATIONS (Écriture)
// =====================================================

/**
 * Hook pour créer une catégorie
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: (data: CreateCategoryData) => categoriesApi.createCategory(data),
    onSuccess: (response, variables) => {
      // Invalider les listes de catégories
      invalidateQueries.categories()
      
      // Ajouter optimistiquement la nouvelle catégorie au cache
      queryClient.setQueryData(
        queryKeys.categories.detail(response.data.id),
        response
      )
      
      // Invalider les stats si nécessaire
      invalidateQueries.stats()
      
      // Afficher un message de succès
      toast.success("Succès", `La catégorie "${response.data.name}" a été créée avec succès.`)
    },
    onError: (error) => {
      handleError(error, {
        customMessage: "Impossible de créer la catégorie. Veuillez vérifier les données saisies.",
        onError: (appError) => {
          console.error("Erreur lors de la création de la catégorie:", appError)
        }
      })
    }
  })
}

/**
 * Hook pour mettre à jour une catégorie
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateCategoryData }) =>
      categoriesApi.updateCategory(id, data),
    onSuccess: (response, { id }) => {
      // Mettre à jour le cache de la catégorie
      queryClient.setQueryData(
        queryKeys.categories.detail(id),
        response
      )
      
      // Invalider les listes qui pourraient contenir cette catégorie
      invalidateQueries.categories()
      
    },
    onError: (error) => {
      handleError(error, {
        customMessage: "Impossible de mettre à jour la catégorie. Veuillez vérifier les données saisies.",
        onError: (appError) => {
          console.error("Erreur lors de la mise à jour de la catégorie:", appError)
        }
      })
    }
  })
}

/**
 * Hook pour supprimer une catégorie
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: (id: UUID) => categoriesApi.deleteCategory(id),
    onSuccess: (_, id) => {
      // Retirer la catégorie du cache
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(id) })
      
      // Invalider toutes les listes de catégories
      invalidateQueries.categories()
      
      // Invalider les stats
      invalidateQueries.stats()
      
      // Afficher un message de succès
      toast.success("Succès", "La catégorie a été supprimée avec succès.")
    },
    onError: (error) => {
      handleError(error, {
        customMessage: "Impossible de supprimer la catégorie. Vérifiez qu'elle ne contient pas de sous-catégories ou de composants.",
        onError: (appError) => {
          console.error("Erreur lors de la suppression de la catégorie:", appError)
        }
      })
    }
  })
}

/**
 * Hook pour réorganiser les catégories
 */
export function useReorderCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { categoryIds: UUID[]; productId?: UUID }) => 
      categoriesApi.reorderCategories(data),
    onSuccess: () => {
      // Invalider toutes les listes de catégories pour refléter le nouvel ordre
      invalidateQueries.categories()
    },
    onError: (error) => {
      console.error("Erreur lors de la réorganisation des catégories:", error)
    }
  })
}

/**
 * Hook pour vérifier la disponibilité d'un slug
 */
export function useCheckCategorySlug() {
  return useMutation({
    mutationFn: (data: CheckCategorySlugData) => categoriesApi.checkSlug(data),
    // Pas de side effects pour cette mutation de vérification
  })
}

/**
 * Hook pour exporter les catégories
 */
export function useExportCategories() {
  return useMutation({
    mutationFn: (params?: ExportCategoriesParams) => 
      categoriesApi.exportCategories(params),
    onError: (error) => {
      console.error("Erreur lors de l'export des catégories:", error)
    }
  })
}

/**
 * Hook pour les opérations par lot
 */
export function useCategoriesBatchOperations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategoryBatchOperationData) => 
      categoriesApi.batchOperations(data),
    onSuccess: (response, { action, categoryIds }) => {
      // En fonction de l'action, invalider ou mettre à jour le cache
      switch (action) {
        case "delete":
          // Retirer les catégories supprimées du cache
          categoryIds.forEach(id => {
            queryClient.removeQueries({ queryKey: queryKeys.categories.detail(id) })
          })
          break
        case "activate":
        case "deactivate":
        case "reorder":
          // Invalider les listes pour refléter les changements
          break
      }
      
      invalidateQueries.categories()
      invalidateQueries.stats()
    },
    onError: (error) => {
      console.error("Erreur lors de l'opération par lot:", error)
    }
  })
}

/**
 * Hook pour dupliquer une catégorie
 */
export function useDuplicateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: DuplicateCategoryData }) => 
      categoriesApi.duplicateCategory(id, data),
    onSuccess: (response) => {
      // Ajouter la nouvelle catégorie au cache
      queryClient.setQueryData(
        queryKeys.categories.detail(response.data.id),
        response
      )
      
      // Invalider les listes
      invalidateQueries.categories()
      invalidateQueries.stats()
    },
    onError: (error) => {
      console.error("Erreur lors de la duplication de la catégorie:", error)
    }
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
    all: invalidateQueries.categories,
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
export type CategoryStatsQueryResult = UseQueryResult<APIResponse<CategoryStats>, Error>

export type CreateCategoryMutation = UseMutationResult<
  APIResponse<Category>, 
  Error, 
  CreateCategoryData
>

export type UpdateCategoryMutation = UseMutationResult<
  APIResponse<Category>, 
  Error, 
  { id: UUID; data: UpdateCategoryData }
>

export type DeleteCategoryMutation = UseMutationResult<
  APIResponse<{ message: string }>, 
  Error, 
  UUID
>