import type { APIResponse } from "@workspace/types/api"
import type { UUID } from "@workspace/types/common"
import { apiRequest } from "@/lib/query-client"

/**
 * Service API pour la gestion des fichiers (Admin)
 * Implémente toutes les 4 routes admin identifiées
 */
export const filesApi = {
  /**
   * 1. POST /api/admin/files/upload-image - Upload d'image
   */
  async uploadImage(data: {
    file: File
    category?: "component" | "preview" | "avatar" | "general"
    componentId?: UUID
    versionId?: UUID
    maxWidth?: number
    maxHeight?: number
    quality?: number
    formats?: ("webp" | "jpeg" | "png")[]
  }): Promise<APIResponse<{
    original: {
      filename: string
      url: string
      size: number
      width: number
      height: number
      mimetype: string
    }
    variants?: Array<{
      format: string
      url: string
      size: number
      width: number
      height: number
    }>
    metadata: {
      uploadedAt: string
      category: string
      componentId?: UUID
      versionId?: UUID
    }
  }>> {
    const formData = new FormData()
    formData.append("file", data.file)
    
    if (data.category) formData.append("category", data.category)
    if (data.componentId) formData.append("componentId", data.componentId)
    if (data.versionId) formData.append("versionId", data.versionId)
    if (data.maxWidth) formData.append("maxWidth", data.maxWidth.toString())
    if (data.maxHeight) formData.append("maxHeight", data.maxHeight.toString())
    if (data.quality) formData.append("quality", data.quality.toString())
    if (data.formats) formData.append("formats", data.formats.join(","))

    return apiRequest<APIResponse<{
      original: {
        filename: string
        url: string
        size: number
        width: number
        height: number
        mimetype: string
      }
      variants?: Array<{
        format: string
        url: string
        size: number
        width: number
        height: number
      }>
      metadata: {
        uploadedAt: string
        category: string
        componentId?: UUID
        versionId?: UUID
      }
    }>>("/api/admin/files/upload-image", {
      method: "POST",
      body: formData,
      headers: {
        // Ne pas définir Content-Type pour FormData
      },
    })
  },

  /**
   * 2. POST /api/admin/files/upload-video - Upload de vidéo
   */
  async uploadVideo(data: {
    file: File
    category?: "component" | "preview" | "demo" | "tutorial"
    componentId?: UUID
    versionId?: UUID
    maxDuration?: number
    maxSize?: number
    generateThumbnail?: boolean
    thumbnailTime?: number
  }): Promise<APIResponse<{
    video: {
      filename: string
      url: string
      size: number
      duration: number
      width: number
      height: number
      mimetype: string
      bitrate?: number
    }
    thumbnail?: {
      url: string
      size: number
      width: number
      height: number
      mimetype: string
    }
    metadata: {
      uploadedAt: string
      category: string
      componentId?: UUID
      versionId?: UUID
    }
  }>> {
    const formData = new FormData()
    formData.append("file", data.file)
    
    if (data.category) formData.append("category", data.category)
    if (data.componentId) formData.append("componentId", data.componentId)
    if (data.versionId) formData.append("versionId", data.versionId)
    if (data.maxDuration) formData.append("maxDuration", data.maxDuration.toString())
    if (data.maxSize) formData.append("maxSize", data.maxSize.toString())
    if (data.generateThumbnail !== undefined) formData.append("generateThumbnail", data.generateThumbnail.toString())
    if (data.thumbnailTime) formData.append("thumbnailTime", data.thumbnailTime.toString())

    return apiRequest<APIResponse<{
      video: {
        filename: string
        url: string
        size: number
        duration: number
        width: number
        height: number
        mimetype: string
        bitrate?: number
      }
      thumbnail?: {
        url: string
        size: number
        width: number
        height: number
        mimetype: string
      }
      metadata: {
        uploadedAt: string
        category: string
        componentId?: UUID
        versionId?: UUID
      }
    }>>("/api/admin/files/upload-video", {
      method: "POST",
      body: formData,
      headers: {
        // Ne pas définir Content-Type pour FormData
      },
    })
  },

  /**
   * 3. GET /api/admin/files/info - Obtenir les informations d'un fichier
   */
  async getFileInfo(params: {
    path?: string
    url?: string
    filename?: string
  }): Promise<APIResponse<{
    file: {
      filename: string
      originalName: string
      path: string
      url: string
      size: number
      mimetype: string
      category?: string
      createdAt: string
      updatedAt: string
    }
    metadata?: {
      width?: number
      height?: number
      duration?: number
      bitrate?: number
      format?: string
      colorSpace?: string
      compression?: string
    }
    usage?: {
      componentId?: UUID
      versionId?: UUID
      usageCount: number
      lastUsed?: string
    }
    variants?: Array<{
      type: string
      url: string
      size: number
      format?: string
    }>
  }>> {
    const searchParams = new URLSearchParams()
    
    if (params.path) searchParams.set("path", params.path)
    if (params.url) searchParams.set("url", params.url)
    if (params.filename) searchParams.set("filename", params.filename)

    const queryString = searchParams.toString()
    const endpoint = `/api/admin/files/info${queryString ? `?${queryString}` : ""}`
    
    return apiRequest<APIResponse<{
      file: {
        filename: string
        originalName: string
        path: string
        url: string
        size: number
        mimetype: string
        category?: string
        createdAt: string
        updatedAt: string
      }
      metadata?: {
        width?: number
        height?: number
        duration?: number
        bitrate?: number
        format?: string
        colorSpace?: string
        compression?: string
      }
      usage?: {
        componentId?: UUID
        versionId?: UUID
        usageCount: number
        lastUsed?: string
      }
      variants?: Array<{
        type: string
        url: string
        size: number
        format?: string
      }>
    }>>(endpoint)
  },

  /**
   * 4. DELETE /api/admin/files - Supprimer un fichier
   */
  async deleteFile(data: {
    path?: string
    url?: string
    filename?: string
    deleteVariants?: boolean
    forceDelete?: boolean
  }): Promise<APIResponse<{
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
  }>> {
    return apiRequest<APIResponse<{
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
    }>>("/api/admin/files", {
      method: "DELETE",
      body: JSON.stringify(data),
    })
  },

  /**
   * Utilitaires supplémentaires pour la gestion des fichiers
   */

  /**
   * Obtenir les informations d'usage d'un fichier
   */
  async getFileUsage(filename: string): Promise<APIResponse<{
    components: Array<{
      id: UUID
      name: string
      slug: string
      usage: "preview_image" | "preview_video" | "asset" | "source_file"
    }>
    versions: Array<{
      id: UUID
      componentId: UUID
      versionNumber: string
      usage: "source_file" | "asset" | "dependency"
    }>
    totalUsage: number
    canDelete: boolean
    warnings?: string[]
  }>> {
    return apiRequest<APIResponse<{
      components: Array<{
        id: UUID
        name: string
        slug: string
        usage: "preview_image" | "preview_video" | "asset" | "source_file"
      }>
      versions: Array<{
        id: UUID
        componentId: UUID
        versionNumber: string
        usage: "source_file" | "asset" | "dependency"
      }>
      totalUsage: number
      canDelete: boolean
      warnings?: string[]
    }>>(`/api/admin/files/${encodeURIComponent(filename)}/usage`)
  },

  /**
   * Nettoyer les fichiers orphelins
   */
  async cleanupOrphanedFiles(data?: {
    dryRun?: boolean
    olderThan?: string // ISO date string
    categories?: string[]
  }): Promise<APIResponse<{
    orphanedFiles: Array<{
      filename: string
      path: string
      size: number
      createdAt: string
      category?: string
    }>
    totalSize: number
    deleted: number
    dryRun: boolean
    message: string
  }>> {
    return apiRequest<APIResponse<{
      orphanedFiles: Array<{
        filename: string
        path: string
        size: number
        createdAt: string
        category?: string
      }>
      totalSize: number
      deleted: number
      dryRun: boolean
      message: string
    }>>("/api/admin/files/cleanup", {
      method: "POST",
      body: JSON.stringify(data || {}),
    })
  },
}

/**
 * Types pour les paramètres des requêtes fichiers
 */
export interface UploadImageData {
  file: File
  category?: "component" | "preview" | "avatar" | "general"
  componentId?: UUID
  versionId?: UUID
  maxWidth?: number
  maxHeight?: number
  quality?: number
  formats?: ("webp" | "jpeg" | "png")[]
}

export interface UploadVideoData {
  file: File
  category?: "component" | "preview" | "demo" | "tutorial"
  componentId?: UUID
  versionId?: UUID
  maxDuration?: number
  maxSize?: number
  generateThumbnail?: boolean
  thumbnailTime?: number
}

export interface GetFileInfoParams {
  path?: string
  url?: string
  filename?: string
}

export interface DeleteFileData {
  path?: string
  url?: string
  filename?: string
  deleteVariants?: boolean
  forceDelete?: boolean
}

export interface CleanupOrphanedFilesData {
  dryRun?: boolean
  olderThan?: string
  categories?: string[]
}

/**
 * Types de réponse pour les opérations de fichiers
 */
export interface UploadedFile {
  filename: string
  url: string
  size: number
  mimetype: string
}

export interface UploadedImage extends UploadedFile {
  width: number
  height: number
  variants?: Array<{
    format: string
    url: string
    size: number
    width: number
    height: number
  }>
}

export interface UploadedVideo extends UploadedFile {
  duration: number
  width: number
  height: number
  bitrate?: number
  thumbnail?: {
    url: string
    size: number
    width: number
    height: number
    mimetype: string
  }
}

export interface FileInfo {
  filename: string
  originalName: string
  path: string
  url: string
  size: number
  mimetype: string
  category?: string
  createdAt: string
  updatedAt: string
  metadata?: {
    width?: number
    height?: number
    duration?: number
    bitrate?: number
    format?: string
    colorSpace?: string
    compression?: string
  }
  usage?: {
    componentId?: UUID
    versionId?: UUID
    usageCount: number
    lastUsed?: string
  }
  variants?: Array<{
    type: string
    url: string
    size: number
    format?: string
  }>
}