import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from "@tanstack/react-query"
import type {
  GetSubcategoriesResponse,
  APIResponse
} from "@workspace/types/api"
import type {
  Subcategory,
  FullSubcategory,
  CreateSubcategoryData,
  UpdateSubcategoryData,
  SubcategoryStats
} from "@workspace/types/categories"
import type { UUID } from "@workspace/types/common"
import {
  subcategoriesApi,
  type GetSubcategoriesParams,
  type GetSubcategoryParams,
  type SubcategoryStatsParams,
  type CheckSubcategorySlugData,
  type ReorderSubcategoriesData,
  type MoveSubcategoryData,
  type ExportSubcategoriesParams,
  type SubcategoryBatchOperationData
} from "@/lib/api/subcategories"
import { queryKeys, invalidateQueries } from "@/lib/query-client"
import { useErrorHandler } from "./use-error-handler"
import { toast } from "@/components/admin/error-toast"

/**
 * Hook pour récupérer la liste des sous-catégories
 */
export function useSubcategories(params?: GetSubcategoriesParams) {
  return useQuery({
    queryKey: queryKeys.subcategories.list(params),
    queryFn: () => subcategoriesApi.getSubcategories(params),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook pour récupérer une sous-catégorie par ID
 */
export function useSubcategory(
  id: UUID, 
  params?: GetSubcategoryParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.subcategories.detail(id),
    queryFn: () => subcategoriesApi.getSubcategory(id, params),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 3 * 60 * 1000,
  })
}

/**
 * Hook pour récupérer les statistiques d'une sous-catégorie
 */
export function useSubcategoryStats(
  id: UUID, 
  params?: SubcategoryStatsParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.subcategories.detail(id), "stats", params],
    queryFn: () => subcategoriesApi.getSubcategoryStats(id, params),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook pour créer une sous-catégorie
 */
export function useCreateSubcategory() {
  const queryClient = useQueryClient()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: (data: CreateSubcategoryData) => subcategoriesApi.createSubcategory(data),
    onSuccess: (response, variables) => {
      invalidateQueries.subcategories()
      invalidateQueries.categories() // Les catégories peuvent contenir des sous-catégories
      queryClient.setQueryData(
        queryKeys.subcategories.detail(response.data.id),
        response
      )
      
    },
    onError: (error) => {
      handleError(error, {
        customMessage: "Impossible de créer la sous-catégorie. Veuillez vérifier les données saisies.",
        onError: (appError) => {
          console.error("Erreur lors de la création de la sous-catégorie:", appError)
        }
      })
    }
  })
}

/**
 * Hook pour mettre à jour une sous-catégorie
 */
export function useUpdateSubcategory() {
  const queryClient = useQueryClient()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateSubcategoryData }) =>
      subcategoriesApi.updateSubcategory(id, data),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(queryKeys.subcategories.detail(id), response)
      invalidateQueries.subcategories()
      invalidateQueries.categories()
      
    },
    onError: (error) => {
      handleError(error, {
        customMessage: "Impossible de mettre à jour la sous-catégorie. Veuillez vérifier les données saisies.",
        onError: (appError) => {
          console.error("Erreur lors de la mise à jour de la sous-catégorie:", appError)
        }
      })
    }
  })
}

/**
 * Hook pour supprimer une sous-catégorie
 */
export function useDeleteSubcategory() {
  const queryClient = useQueryClient()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: (id: UUID) => subcategoriesApi.deleteSubcategory(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.subcategories.detail(id) })
      invalidateQueries.subcategories()
      invalidateQueries.categories()      
    },
    onError: (error) => {
      handleError(error, {
        customMessage: "Impossible de supprimer la sous-catégorie. Vérifiez qu'elle ne contient pas de composants.",
        onError: (appError) => {
          console.error("Erreur lors de la suppression de la sous-catégorie:", appError)
        }
      })
    }
  })
}

/**
 * Hook pour réorganiser les sous-catégories
 */
export function useReorderSubcategories() {
  return useMutation({
    mutationFn: (data: ReorderSubcategoriesData) => 
      subcategoriesApi.reorderSubcategories(data),
    onSuccess: () => {
      invalidateQueries.subcategories()
      invalidateQueries.categories()
    },
  })
}

/**
 * Hook pour déplacer une sous-catégorie
 */
export function useMoveSubcategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: MoveSubcategoryData }) => 
      subcategoriesApi.moveSubcategory(id, data),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(queryKeys.subcategories.detail(id), response)
      invalidateQueries.subcategories()
      invalidateQueries.categories()
    },
  })
}

/**
 * Hook pour les opérations par lot
 */
export function useSubcategoriesBatchOperations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SubcategoryBatchOperationData) => 
      subcategoriesApi.batchOperations(data),
    onSuccess: (response, { action, subcategoryIds }) => {
      if (action === "delete") {
        subcategoryIds.forEach(id => {
          queryClient.removeQueries({ queryKey: queryKeys.subcategories.detail(id) })
        })
      }
      invalidateQueries.subcategories()
      invalidateQueries.categories()
    },
  })
}

/**
 * Hook pour vérifier la disponibilité d'un slug
 */
export function useCheckSubcategorySlug() {
  return useMutation({
    mutationFn: (data: CheckSubcategorySlugData) => subcategoriesApi.checkSlug(data),
  })
}

/**
 * Hook pour exporter les sous-catégories
 */
export function useExportSubcategories() {
  return useMutation({
    mutationFn: (params?: ExportSubcategoriesParams) => 
      subcategoriesApi.exportSubcategories(params),
  })
}