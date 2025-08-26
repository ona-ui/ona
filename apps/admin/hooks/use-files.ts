import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from "@tanstack/react-query"
import type { APIResponse } from "@workspace/types/api"
import type { UUID } from "@workspace/types/common"
import { 
  filesApi,
  type UploadImageData,
  type UploadVideoData,
  type GetFileInfoParams,
  type DeleteFileData,
  type CleanupOrphanedFilesData,
  type UploadedImage,
  type UploadedVideo,
  type FileInfo
} from "@/lib/api/files"
import { queryKeys, invalidateQueries } from "@/lib/query-client"

// =====================================================
// QUERIES (Lecture)
// =====================================================

/**
 * Hook pour obtenir les informations d'un fichier
 */
export function useFileInfo(
  params: GetFileInfoParams,
  options?: { enabled?: boolean }
) {
  const hasValidParam = !!(params.path || params.url || params.filename)
  
  return useQuery({
    queryKey: queryKeys.files.info(params.path || params.url || params.filename || ""),
    queryFn: () => filesApi.getFileInfo(params),
    enabled: hasValidParam && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes pour les infos de fichiers
  })
}

/**
 * Hook pour obtenir l'usage d'un fichier
 */
export function useFileUsage(
  filename: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.files.all, "usage", filename],
    queryFn: () => filesApi.getFileUsage(filename),
    enabled: !!filename && (options?.enabled ?? true),
    staleTime: 3 * 60 * 1000, // 3 minutes pour l'usage
  })
}

// =====================================================
// MUTATIONS (Écriture)
// =====================================================

/**
 * Hook pour uploader une image
 */
export function useUploadImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UploadImageData) => filesApi.uploadImage(data),
    onSuccess: (response, variables) => {
      // Invalider le cache des fichiers
      invalidateQueries.files()
      
      // Si l'image est liée à un composant, invalider son cache
      if (variables.componentId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.components.detail(variables.componentId) 
        })
      }
      
      // Si l'image est liée à une version, invalider son cache
      if (variables.versionId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.versions.detail(variables.versionId) 
        })
      }
    },
    onError: (error) => {
      console.error("Erreur lors de l'upload de l'image:", error)
    }
  })
}

/**
 * Hook pour uploader une vidéo
 */
export function useUploadVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UploadVideoData) => filesApi.uploadVideo(data),
    onSuccess: (response, variables) => {
      // Invalider le cache des fichiers
      invalidateQueries.files()
      
      // Si la vidéo est liée à un composant, invalider son cache
      if (variables.componentId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.components.detail(variables.componentId) 
        })
      }
      
      // Si la vidéo est liée à une version, invalider son cache
      if (variables.versionId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.versions.detail(variables.versionId) 
        })
      }
    },
    onError: (error) => {
      console.error("Erreur lors de l'upload de la vidéo:", error)
    }
  })
}

/**
 * Hook pour supprimer un fichier
 */
export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DeleteFileData) => filesApi.deleteFile(data),
    onSuccess: (response, variables) => {
      // Invalider le cache des fichiers
      invalidateQueries.files()
      
      // Retirer les informations du fichier supprimé du cache
      const identifier = variables.path || variables.url || variables.filename
      if (identifier) {
        queryClient.removeQueries({ 
          queryKey: queryKeys.files.info(identifier) 
        })
      }
      
      // Invalider les composants et versions qui pourraient référencer ce fichier
      invalidateQueries.components()
      invalidateQueries.versions()
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression du fichier:", error)
    }
  })
}

/**
 * Hook pour nettoyer les fichiers orphelins
 */
export function useCleanupOrphanedFiles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data?: CleanupOrphanedFilesData) => 
      filesApi.cleanupOrphanedFiles(data),
    onSuccess: (response) => {
      // Si ce n'était pas un dry run et que des fichiers ont été supprimés
      if (!response.data.dryRun && response.data.deleted > 0) {
        // Invalider tout le cache des fichiers
        invalidateQueries.files()
        
        // Invalider les autres entités qui pourraient être affectées
        invalidateQueries.components()
        invalidateQueries.versions()
      }
    },
    onError: (error) => {
      console.error("Erreur lors du nettoyage des fichiers orphelins:", error)
    }
  })
}

// =====================================================
// HOOKS UTILITAIRES
// =====================================================

/**
 * Hook pour précharger les informations d'un fichier
 */
export function usePrefetchFileInfo() {
  const queryClient = useQueryClient()

  return (params: GetFileInfoParams) => {
    const identifier = params.path || params.url || params.filename
    if (!identifier) return

    queryClient.prefetchQuery({
      queryKey: queryKeys.files.info(identifier),
      queryFn: () => filesApi.getFileInfo(params),
      staleTime: 5 * 60 * 1000,
    })
  }
}

/**
 * Hook pour obtenir les informations d'un fichier depuis le cache
 */
export function useCachedFileInfo(identifier: string): any {
  const queryClient = useQueryClient()
  
  const cachedData = queryClient.getQueryData<APIResponse<any>>(
    queryKeys.files.info(identifier)
  )
  
  return cachedData?.data
}

/**
 * Hook pour invalider manuellement le cache des fichiers
 */
export function useInvalidateFiles() {
  return {
    all: invalidateQueries.files,
    info: (identifier: string) => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ queryKey: queryKeys.files.info(identifier) })
    },
    usage: (filename: string) => {
      const queryClient = useQueryClient()
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.files.all, "usage", filename] 
      })
    }
  }
}

// =====================================================
// HOOKS SPÉCIALISÉS
// =====================================================

/**
 * Hook pour uploader plusieurs images en une fois
 */
export function useUploadMultipleImages() {
  const uploadImage = useUploadImage()
  
  return {
    ...uploadImage,
    uploadMultiple: async (files: UploadImageData[]) => {
      const results = await Promise.allSettled(
        files.map(fileData =>
          new Promise<any>((resolve, reject) => {
            uploadImage.mutate(fileData, {
              onSuccess: resolve,
              onError: reject
            })
          })
        )
      )
      
      return results
    }
  }
}

/**
 * Hook pour uploader avec progress (simulé)
 */
export function useUploadWithProgress() {
  const uploadImage = useUploadImage()
  const uploadVideo = useUploadVideo()
  
  return {
    uploadImage: (data: UploadImageData, onProgress?: (progress: number) => void) => {
      // Simuler le progress
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress > 90) progress = 90
        onProgress?.(progress)
      }, 200)
      
      uploadImage.mutate(data, {
        onSuccess: () => {
          clearInterval(interval)
          onProgress?.(100)
        },
        onError: () => {
          clearInterval(interval)
        }
      })
    },
    
    uploadVideo: (data: UploadVideoData, onProgress?: (progress: number) => void) => {
      // Simuler le progress pour les vidéos
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15 // Plus lent pour les vidéos
        if (progress > 85) progress = 85
        onProgress?.(progress)
      }, 500)
      
      uploadVideo.mutate(data, {
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
 * Hook pour valider les fichiers avant upload
 */
export function useFileValidation() {
  const validateImage = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Fichier trop volumineux (max 10MB)' }
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Type de fichier non supporté' }
    }
    
    return { valid: true }
  }
  
  const validateVideo = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Fichier trop volumineux (max 100MB)' }
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Type de fichier non supporté' }
    }
    
    return { valid: true }
  }
  
  return {
    validateImage,
    validateVideo,
    validateFile: (file: File, type: 'image' | 'video') => {
      return type === 'image' ? validateImage(file) : validateVideo(file)
    }
  }
}

// =====================================================
// TYPES POUR LES HOOKS
// =====================================================

export type FileInfoQueryResult = UseQueryResult<APIResponse<FileInfo>, Error>
export type FileUsageQueryResult = UseQueryResult<APIResponse<{
  components: Array<{
    id: UUID
    name: string
    slug: string
    usage: string
  }>
  versions: Array<{
    id: UUID
    componentId: UUID
    versionNumber: string
    usage: string
  }>
  totalUsage: number
  canDelete: boolean
  warnings?: string[]
}>, Error>

export type UploadImageMutation = UseMutationResult<
  APIResponse<UploadedImage>, 
  Error, 
  UploadImageData
>

export type UploadVideoMutation = UseMutationResult<
  APIResponse<UploadedVideo>, 
  Error, 
  UploadVideoData
>

export type DeleteFileMutation = UseMutationResult<
  APIResponse<{
    deleted: {
      filename: string
      path: string
      size: number
    }
    variants?: Array<{
      filename: string
      path: string
      size: number
    }>
    totalSize: number
    message: string
  }>, 
  Error, 
  DeleteFileData
>