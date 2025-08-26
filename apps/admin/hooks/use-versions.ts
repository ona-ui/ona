import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from "@tanstack/react-query"
import type { APIResponse, APIPaginatedResponse } from "@workspace/types/api"
import type {
  ComponentVersion,
  CreateComponentVersionData,
  UpdateComponentVersionData
} from "@workspace/types/components"
import type { UUID, FrameworkType, CssFramework } from "@workspace/types/common"
import {
  versionsApi,
  type GetVersionsParams,
  type GetVersionParams,
  type CompileVersionParams,
  type CreateVariantData
} from "@/lib/api/versions"
import { queryKeys, invalidateQueries } from "@/lib/query-client"

// =====================================================
// QUERIES (Lecture)
// =====================================================

/**
 * Hook pour récupérer la liste des versions
 */
export function useVersions(params?: GetVersionsParams) {
  return useQuery({
    queryKey: queryKeys.versions.list(params?.componentId || "all"),
    queryFn: () => versionsApi.getVersions(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook pour récupérer les versions d'un composant spécifique
 */
export function useComponentVersions(
  componentId: UUID,
  params?: Omit<GetVersionsParams, "componentId">,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.versions.list(componentId),
    queryFn: () => versionsApi.getVersions({ ...params, componentId }),
    enabled: !!componentId && (options?.enabled ?? true),
    staleTime: 3 * 60 * 1000,
  })
}

/**
 * Hook pour récupérer une version par ID
 */
export function useVersion(
  componentId: UUID,
  id: UUID,
  params?: GetVersionParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.versions.detail(id),
    queryFn: () => versionsApi.getVersion(componentId, id, params),
    enabled: !!componentId && !!id && (options?.enabled ?? true),
    staleTime: 3 * 60 * 1000,
  })
}

/**
 * Hook pour comparer deux versions
 */
export function useCompareVersions(
  id1: UUID,
  id2: UUID,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.versions.compare(id1, id2),
    queryFn: () => versionsApi.compareVersions(id1, id2),
    enabled: !!id1 && !!id2 && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes pour les comparaisons
  })
}

/**
 * Hook pour récupérer les frameworks supportés pour une version
 */
export function useFrameworks(componentId: UUID, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["frameworks", componentId],
    queryFn: () => versionsApi.getFrameworks(componentId),
    enabled: !!componentId && (options?.enabled ?? true),
    staleTime: 30 * 60 * 1000, // 30 minutes - data assez statique
  })
}

// =====================================================
// MUTATIONS (Écriture)
// =====================================================

/**
 * Hook pour créer une version
 */
export function useCreateVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateComponentVersionData) => versionsApi.createVersion(data),
    onSuccess: (response, variables) => {
      // Invalider les listes de versions du composant
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.versions.list(variables.componentId) 
      })
      
      // Ajouter optimistiquement la nouvelle version au cache
      queryClient.setQueryData(
        queryKeys.versions.detail(response.data.id),
        response
      )
      
      // Invalider les composants pour mettre à jour les versions
      invalidateQueries.components()
    },
    onError: (error) => {
      console.error("Erreur lors de la création de la version:", error)
    }
  })
}

/**
 * Hook pour mettre à jour une version
 */
export function useUpdateVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId, id, data }: { componentId: UUID; id: UUID; data: UpdateComponentVersionData }) =>
      versionsApi.updateVersion(componentId, id, data),
    onSuccess: (response, { id }) => {
      // Mettre à jour le cache de la version
      queryClient.setQueryData(
        queryKeys.versions.detail(id),
        response
      )
      
      // Invalider les listes qui pourraient contenir cette version
      invalidateQueries.versions()
      invalidateQueries.components()
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour de la version:", error)
    }
  })
}

/**
 * Hook pour supprimer une version
 */
export function useDeleteVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId, id }: { componentId: UUID; id: UUID }) => versionsApi.deleteVersion(componentId, id),
    onSuccess: (_, { id }) => {
      // Retirer la version du cache
      queryClient.removeQueries({ queryKey: queryKeys.versions.detail(id) })
      
      // Invalider toutes les listes de versions
      invalidateQueries.versions()
      invalidateQueries.components()
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression de la version:", error)
    }
  })
}


/**
 * Hook pour définir une version comme active/par défaut
 */
export function useSetActiveVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId, id }: { componentId: UUID; id: UUID }) => versionsApi.setActiveVersion(componentId, id),
    onSuccess: (response, { id }) => {
      // Mettre à jour le cache de la version
      queryClient.setQueryData(
        queryKeys.versions.detail(id),
        response
      )
      
      // Invalider les listes pour refléter le changement d'état
      invalidateQueries.versions()
      invalidateQueries.components()
    },
    onError: (error) => {
      console.error("Erreur lors du changement de version active:", error)
    }
  })
}

/**
 * Hook pour compiler une version
 */
export function useCompileVersion() {
  return useMutation({
    mutationFn: ({ id, params }: { id: UUID; params?: CompileVersionParams }) => 
      versionsApi.compileVersion(id, params),
    onError: (error) => {
      console.error("Erreur lors de la compilation de la version:", error)
    }
  })
}

/**
 * Hook pour créer une variante
 */
export function useCreateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId, id, data }: { componentId: UUID; id: UUID; data: CreateVariantData }) =>
      versionsApi.createVariant(componentId, id, data),
    onSuccess: (response, { id }) => {
      // Ajouter la nouvelle variante au cache
      queryClient.setQueryData(
        queryKeys.versions.detail(response.data.id),
        response
      )
      
      // Invalider les listes de versions
      invalidateQueries.versions()
      invalidateQueries.components()
    },
    onError: (error) => {
      console.error("Erreur lors de la création de la variante:", error)
    }
  })
}


// =====================================================
// HOOKS POUR LES ASSETS DES VERSIONS
// =====================================================

/**
 * Hook pour récupérer les assets d'une version
 */
export function useVersionAssets(
  componentId: UUID,
  versionId: UUID,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.versions.detail(versionId), "assets"],
    queryFn: () => versionsApi.getVersionAssets(componentId, versionId),
    enabled: !!componentId && !!versionId && (options?.enabled ?? true),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook pour uploader des assets pour une version
 */
export function useUploadVersionAssets() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId, versionId, files }: {
      componentId: UUID;
      versionId: UUID;
      files: FileList
    }) => versionsApi.uploadVersionAssets(componentId, versionId, files),
    onSuccess: (response, { componentId, versionId }) => {
      // Invalider le cache des assets de cette version
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.versions.detail(versionId), "assets"]
      })
      
      // Invalider la version elle-même pour refléter les changements
      queryClient.invalidateQueries({
        queryKey: queryKeys.versions.detail(versionId)
      })
      
      // Invalider les listes de versions et composants
      invalidateQueries.versions()
      invalidateQueries.components()
    },
    onError: (error) => {
      console.error("Erreur lors de l'upload des assets:", error)
    }
  })
}

/**
 * Hook pour supprimer un asset d'une version
 */
export function useDeleteVersionAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ componentId, versionId, filename }: {
      componentId: UUID;
      versionId: UUID;
      filename: string
    }) => versionsApi.deleteVersionAsset(componentId, versionId, filename),
    onSuccess: (response, { componentId, versionId }) => {
      // Invalider le cache des assets de cette version
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.versions.detail(versionId), "assets"]
      })
      
      // Invalider la version elle-même
      queryClient.invalidateQueries({
        queryKey: queryKeys.versions.detail(versionId)
      })
      
      // Invalider les listes
      invalidateQueries.versions()
      invalidateQueries.components()
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression de l'asset:", error)
    }
  })
}

/**
 * Hook pour précharger les assets d'une version
 */
export function usePrefetchVersionAssets() {
  const queryClient = useQueryClient()

  return (componentId: UUID, versionId: UUID) => {
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.versions.detail(versionId), "assets"],
      queryFn: () => versionsApi.getVersionAssets(componentId, versionId),
      staleTime: 3 * 60 * 1000,
    })
  }
}

/**
 * Hook pour uploader des assets avec progress
 */
export function useUploadVersionAssetsWithProgress() {
  const uploadAssets = useUploadVersionAssets()
  
  return {
    ...uploadAssets,
    uploadWithProgress: (
      componentId: UUID,
      versionId: UUID,
      files: FileList,
      onProgress?: (progress: number) => void
    ) => {
      // Simuler le progress
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15
        if (progress > 90) progress = 90
        onProgress?.(progress)
      }, 300)
      
      uploadAssets.mutate({ componentId, versionId, files }, {
        onSuccess: () => {
          clearInterval(interval)
          onProgress?.(100)
        },
        onError: () => {
          clearInterval(interval)
        }
      })
    }
  }
}

/**
 * Hook pour valider les assets avant upload
 */
export function useValidateVersionAssets() {
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm'
    ]
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Fichier trop volumineux (max 50MB)' }
    }
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Type de fichier non supporté. Formats acceptés: JPG, PNG, WebP, GIF, SVG, MP4, WebM'
      }
    }
    
    return { valid: true }
  }
  
  const validateFiles = (files: FileList): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file) {
        const result = validateFile(file)
        if (!result.valid) {
          errors.push(`${file.name}: ${result.error}`)
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  return {
    validateFile,
    validateFiles
  }
}

// =====================================================
// HOOKS UTILITAIRES
// =====================================================

/**
 * Hook pour précharger une version
 */
export function usePrefetchVersion() {
  const queryClient = useQueryClient()

  return (componentId: UUID, id: UUID, params?: GetVersionParams) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.versions.detail(id),
      queryFn: () => versionsApi.getVersion(componentId, id, params),
      staleTime: 3 * 60 * 1000,
    })
  }
}

/**
 * Hook pour obtenir une version depuis le cache
 */
export function useCachedVersion(id: UUID): ComponentVersion | undefined {
  const queryClient = useQueryClient()
  
  const cachedData = queryClient.getQueryData<APIResponse<ComponentVersion>>(
    queryKeys.versions.detail(id)
  )
  
  return cachedData?.data
}

/**
 * Hook pour invalider manuellement le cache des versions
 */
export function useInvalidateVersions() {
  return {
    all: invalidateQueries.versions,
    byId: (id: UUID) => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.versions.detail(id) })
    },
    byComponent: (componentId: UUID) => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.versions.list(componentId) })
    },
    comparisons: (id: UUID) => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.versions.all,
        predicate: (query) => {
          return query.queryKey.includes("compare") && query.queryKey.includes(id)
        }
      })
    }
  }
}

// =====================================================
// HOOKS SPÉCIALISÉS
// =====================================================

/**
 * Hook pour obtenir la version par défaut d'un composant
 */
export function useDefaultVersion(componentId: UUID) {
  return useQuery({
    queryKey: [...queryKeys.versions.list(componentId), "default"],
    queryFn: () => versionsApi.getVersions({ 
      componentId, 
      isDefault: true, 
      limit: 1 
    }),
    enabled: !!componentId,
    staleTime: 3 * 60 * 1000,
    select: (data) => data.data.data[0] // Récupérer directement la première version
  })
}

/**
 * Hook pour obtenir les versions par framework
 */
export function useVersionsByFramework(
  componentId: UUID, 
  framework: FrameworkType
) {
  return useVersions({ 
    componentId, 
    framework,
    includeCode: true 
  })
}

/**
 * Hook pour obtenir les versions par CSS framework
 */
export function useVersionsByCssFramework(
  componentId: UUID, 
  cssFramework: CssFramework
) {
  return useVersions({ 
    componentId, 
    cssFramework,
    includeCode: true 
  })
}

/**
 * Hook pour compiler automatiquement lors de la sauvegarde
 */
export function useAutoCompileVersion(enabled = false) {
  const compileVersion = useCompileVersion()

  return {
    ...compileVersion,
    compileIfEnabled: (id: UUID, params?: CompileVersionParams) => {
      if (enabled) {
        compileVersion.mutate({ id, params })
      }
    }
  }
}

// =====================================================
// TYPES POUR LES HOOKS
// =====================================================

export type VersionsQueryResult = UseQueryResult<APIPaginatedResponse<ComponentVersion>, Error>
export type VersionQueryResult = UseQueryResult<APIResponse<ComponentVersion>, Error>

export type CreateVersionMutation = UseMutationResult<
  APIResponse<ComponentVersion>, 
  Error, 
  CreateComponentVersionData
>

export type UpdateVersionMutation = UseMutationResult<
  APIResponse<ComponentVersion>, 
  Error, 
  { id: UUID; data: UpdateComponentVersionData }
>

export type DeleteVersionMutation = UseMutationResult<
  APIResponse<{ message: string }>, 
  Error, 
  UUID
>

export type CompileVersionMutation = UseMutationResult<
  APIResponse<{
    compiledCode: string
    sourceMap?: string
    warnings: string[]
    errors: string[]
    buildTime: number
    outputSize: number
  }>, 
  Error, 
  { id: UUID; params?: CompileVersionParams }
>