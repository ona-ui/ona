import {
  useQuery,
  useQueryClient,
  UseQueryResult
} from "@tanstack/react-query"
import type {
  GetComponentsResponse,
  GetComponentResponse,
  APIResponse
} from "@workspace/types/api"
import type {
  Component,
  ComponentWithVersions,
  ComponentSortOptions
} from "@workspace/types/components"
import type { UUID, ComponentStatus } from "@workspace/types/common"
import {
  componentsApi,
  type GetComponentsParams,
  type GetComponentParams,
  type PreviewComponentParams
} from "@/lib/api/components"
import { queryKeys } from "@/lib/query-client"

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
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook pour récupérer un composant par ID
 */
export function useComponent(
  id: UUID,
  params?: GetComponentParams,
  options?: {
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: queryKeys.components.detail(id),
    queryFn: () => componentsApi.getComponent(id, params),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook pour rechercher des composants
 */
export function useSearchComponents(
  query: string,
  options?: {
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: [...queryKeys.components.lists(), "search", query],
    queryFn: () => componentsApi.searchComponents(query),
    enabled: !!query && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes pour les résultats de recherche
  })
}

/**
 * Hook pour récupérer les composants mis en avant
 */
export function useFeaturedComponents() {
  return useQuery({
    queryKey: [...queryKeys.components.lists(), "featured"],
    queryFn: () => componentsApi.getFeaturedComponents(),
    staleTime: 10 * 60 * 1000, // 10 minutes pour les composants featured
  })
}

/**
 * Hook pour récupérer les composants populaires
 */
export function usePopularComponents() {
  return useQuery({
    queryKey: [...queryKeys.components.lists(), "popular"],
    queryFn: () => componentsApi.getPopularComponents(),
    staleTime: 5 * 60 * 1000, // 5 minutes pour les composants populaires
  })
}

/**
 * Hook pour récupérer la preview d'un composant
 */
export function useComponentPreview(
  id: UUID,
  params?: PreviewComponentParams,
  options?: {
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: queryKeys.components.preview(id, params?.versionId || ""),
    queryFn: () => componentsApi.getPreview(id, params),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 1 * 60 * 1000, // 1 minute pour les previews
  })
}

/**
 * Hook pour récupérer les recommandations d'un composant
 */
export function useComponentRecommendations(
  id: UUID,
  options?: {
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: [...queryKeys.components.detail(id), "recommendations"],
    queryFn: () => componentsApi.getRecommendations(id),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes pour les recommandations
  })
}

/**
 * Hook pour récupérer les assets d'un composant
 */
export function useComponentAssets(
  id: UUID,
  options?: {
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: [...queryKeys.components.detail(id), "assets"],
    queryFn: () => componentsApi.getComponentAssets(id),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 10 * 60 * 1000, // 10 minutes pour les assets
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
 * Hook pour obtenir un composant depuis le cache (sans requête réseau)
 */
export function useCachedComponent(id: UUID): ComponentWithVersions | undefined {
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
    all: () => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.components.all })
    },
    byId: (id: UUID) => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.components.detail(id) })
    },
    lists: () => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.components.lists() })
    },
  }
}

// =====================================================
// TYPES POUR LES HOOKS
// =====================================================

export type ComponentsQueryResult = UseQueryResult<GetComponentsResponse, Error>
export type ComponentQueryResult = UseQueryResult<GetComponentResponse, Error>
export type SearchComponentsQueryResult = UseQueryResult<APIResponse<Component[]>, Error>
export type FeaturedComponentsQueryResult = UseQueryResult<APIResponse<Component[]>, Error>
export type PopularComponentsQueryResult = UseQueryResult<APIResponse<Component[]>, Error>