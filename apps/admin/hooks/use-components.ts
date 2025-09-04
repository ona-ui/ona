import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from "@tanstack/react-query"
import type {
  GetComponentsResponse,
  GetComponentResponse,
  GetComponentStatsResponse,
  APIResponse
} from "@workspace/types/api"
import type {
  Component,
  FullComponent,
  CreateComponentData,
  UpdateComponentData,
  ComponentStats
} from "@workspace/types/components"
import type { UUID, ComponentStatus } from "@workspace/types/common"
import { 
  componentsApi,
  type GetComponentsParams,
  type GetComponentParams,
  type ComponentStatsParams,
  type DuplicateComponentData,
  type ChangeComponentStatusData,
  type UploadComponentFilesData,
  type PreviewComponentParams,
  type CheckComponentSlugData,
  type ComponentBatchOperationData
} from "@/lib/api/components"
import { queryKeys, invalidateQueries } from "@/lib/query-client"

// =====================================================
// QUERIES (Lecture)
// =====================================================

/**
 * Hook pour récupérer la liste des composants
 */
export function useComponents(params?: GetComponentsParams) {
  return useQuery({
    queryKey: queryKeys.components.list(params),
    queryFn: () => componentsApi.getComponents(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook pour récupérer un composant par ID
 */
export function useComponent(
  id: UUID, 
  params?: GetComponentParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.components.detail(id),
    queryFn: () => componentsApi.getComponent(id, params),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 3 * 60 * 1000,
  })
}

/**
 * Hook pour récupérer les statistiques d'un composant
 */
export function useComponentStats(
  id: UUID, 
  params?: ComponentStatsParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.components.stats(),
    queryFn: () => componentsApi.getComponentStats(id, params),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes pour les stats
  })
}

/**
 * Hook pour prévisualiser un composant
 */
export function useComponentPreview(
  id: UUID, 
  params?: PreviewComponentParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.components.preview(id, params?.versionId || "default"),
    queryFn: () => componentsApi.previewComponent(id, params),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 1 * 60 * 1000, // 1 minute pour les previews
  })
}

// =====================================================
// MUTATIONS (Écriture)
// =====================================================

/**
 * Hook pour créer un composant
 */
export function useCreateComponent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateComponentData) => componentsApi.createComponent(data),
    onSuccess: (response, variables) => {
      // Invalider les listes de composants
      invalidateQueries.components()
      
      // Ajouter optimistiquement le nouveau composant au cache
      queryClient.setQueryData(
        queryKeys.components.detail(response.data.id),
        response
      )
      
      // Invalider les stats et les catégories
      invalidateQueries.stats()
      invalidateQueries.subcategories()
    },
    onError: (error) => {
      console.error("Erreur lors de la création du composant:", error)
    }
  })
}

/**
 * Hook pour mettre à jour un composant
 */
export function useUpdateComponent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateComponentData }) => 
      componentsApi.updateComponent(id, data),
    onSuccess: (response, { id }) => {
      // Mettre à jour le cache du composant
      queryClient.setQueryData(
        queryKeys.components.detail(id),
        response
      )
      
      // Invalider les listes qui pourraient contenir ce composant
      invalidateQueries.components()
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du composant:", error)
    }
  })
}

/**
 * Hook pour supprimer un composant
 */
export function useDeleteComponent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: UUID) => componentsApi.deleteComponent(id),
    onSuccess: (_, id) => {
      // Retirer le composant du cache
      queryClient.removeQueries({ queryKey: queryKeys.components.detail(id) })
      
      // Invalider toutes les listes de composants
      invalidateQueries.components()
      
      // Invalider les stats
      invalidateQueries.stats()
      invalidateQueries.subcategories()
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression du composant:", error)
    }
  })
}

/**
 * Hook pour dupliquer un composant
 */
export function useDuplicateComponent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: DuplicateComponentData }) => 
      componentsApi.duplicateComponent(id, data),
    onSuccess: (response) => {
      // Ajouter le nouveau composant au cache
      queryClient.setQueryData(
        queryKeys.components.detail(response.data.id),
        response
      )
      
      // Invalider les listes
      invalidateQueries.components()
      invalidateQueries.stats()
    },
    onError: (error) => {
      console.error("Erreur lors de la duplication du composant:", error)
    }
  })
}

/**
 * Hook pour changer le statut d'un composant
 */
export function useChangeComponentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: ChangeComponentStatusData }) => 
      componentsApi.changeComponentStatus(id, data),
    onSuccess: (response, { id }) => {
      // Mettre à jour le cache du composant
      queryClient.setQueryData(
        queryKeys.components.detail(id),
        response
      )
      
      // Invalider les listes pour refléter le changement de statut
      invalidateQueries.components()
    },
    onError: (error) => {
      console.error("Erreur lors du changement de statut:", error)
    }
  })
}

/**
 * Hook pour uploader des fichiers pour un composant
 */
export function useUploadComponentFiles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UploadComponentFilesData }) => 
      componentsApi.uploadComponentFiles(id, data),
    onSuccess: (response, { id }) => {
      // Invalider le cache du composant pour rafraîchir les fichiers
      queryClient.invalidateQueries({ queryKey: queryKeys.components.detail(id) })
      
      // Invalider le cache des fichiers
      invalidateQueries.files()
    },
    onError: (error) => {
      console.error("Erreur lors de l'upload des fichiers:", error)
    }
  })
}

/**
 * Hook pour vérifier la disponibilité d'un slug
 */
export function useCheckComponentSlug() {
  return useMutation({
    mutationFn: (data: CheckComponentSlugData) => componentsApi.checkSlug(data),
    // Pas de side effects pour cette mutation de vérification
  })
}

/**
 * Hook pour les opérations par lot
 */
export function useComponentsBatchOperations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ComponentBatchOperationData) => 
      componentsApi.batchOperations(data),
    onSuccess: (response, { action, componentIds }) => {
      // En fonction de l'action, invalider ou mettre à jour le cache
      switch (action) {
        case "delete":
          // Retirer les composants supprimés du cache
          componentIds.forEach(id => {
            queryClient.removeQueries({ queryKey: queryKeys.components.detail(id) })
          })
          break
        case "publish":
        case "archive":
        case "feature":
        case "unfeature":
        case "change_status":
        case "move":
          // Invalider les listes pour refléter les changements
          break
      }
      
      invalidateQueries.components()
      invalidateQueries.stats()
    },
    onError: (error) => {
      console.error("Erreur lors de l'opération par lot:", error)
    }
  })
}

// =====================================================
// HOOKS UTILITAIRES
// =====================================================

/**
 * Hook pour précharger un composant
 */
export function usePrefetchComponent() {
  const queryClient = useQueryClient()

  return (id: UUID, params?: GetComponentParams) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.components.detail(id),
      queryFn: () => componentsApi.getComponent(id, params),
      staleTime: 3 * 60 * 1000,
    })
  }
}

/**
 * Hook pour obtenir un composant depuis le cache
 */
export function useCachedComponent(id: UUID): FullComponent | undefined {
  const queryClient = useQueryClient()
  
  const cachedData = queryClient.getQueryData<GetComponentResponse>(
    queryKeys.components.detail(id)
  )
  
  return cachedData?.data
}

/**
 * Hook pour invalider manuellement le cache des composants
 */
export function useInvalidateComponents() {
  return {
    all: invalidateQueries.components,
    byId: (id: UUID) => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.components.detail(id) })
    },
    lists: () => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.components.lists() })
    },
    stats: () => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.components.stats() })
    },
    previews: (id: UUID) => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ 
        queryKey: [queryKeys.components.detail(id), "preview"],
        exact: false 
      })
    }
  }
}

// =====================================================
// HOOKS SPÉCIALISÉS
// =====================================================

/**
 * Hook pour les composants d'une sous-catégorie spécifique
 */
export function useComponentsBySubcategory(subcategoryId: UUID) {
  return useComponents({ subcategoryId, includeVersions: true, includeSubcategory: true })
}

/**
 * Hook pour les composants récents
 */
export function useRecentComponents(limit = 10) {
  return useComponents({
    limit,
    sort: { field: "createdAt", direction: "desc" },
    includeStats: true,
    includeSubcategory: true
  })
}

/**
 * Hook pour les composants populaires
 */
export function usePopularComponents(limit = 10) {
  return useComponents({
    limit,
    sort: { field: "viewCount", direction: "desc" },
    includeStats: true,
    includeSubcategory: true
  })
}

/**
 * Hook pour les composants en brouillon
 */
export function useDraftComponents() {
  return useComponents({ status: "draft" as ComponentStatus, includeSubcategory: true })
}

/**
 * Hook pour les composants publiés
 */
export function usePublishedComponents(params?: Omit<GetComponentsParams, "status">) {
  return useComponents({ ...params, status: "published" as ComponentStatus, includeSubcategory: true })
}

// =====================================================
// TYPES POUR LES HOOKS
// =====================================================

export type ComponentsQueryResult = UseQueryResult<GetComponentsResponse, Error>
export type ComponentQueryResult = UseQueryResult<GetComponentResponse, Error>
export type ComponentStatsQueryResult = UseQueryResult<GetComponentStatsResponse, Error>

export type CreateComponentMutation = UseMutationResult<
  APIResponse<Component>, 
  Error, 
  CreateComponentData
>

export type UpdateComponentMutation = UseMutationResult<
  APIResponse<Component>, 
  Error, 
  { id: UUID; data: UpdateComponentData }
>

export type DeleteComponentMutation = UseMutationResult<
  APIResponse<{ message: string }>, 
  Error, 
  UUID
>