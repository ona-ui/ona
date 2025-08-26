import type { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import { FileService } from '../../services/file_service.js'
import { BatchUploadService } from '../../services/batch_upload_service.js'
import { readFileSync } from 'fs'

export default class FilesController {
  private fileService: FileService
  private batchUploadService: BatchUploadService

  constructor() {
    this.fileService = new FileService()
    this.batchUploadService = new BatchUploadService()
  }

  /**
   * Upload d'une image avec optimisation et stratégie R2
   * POST /admin/files/images
   */
  async uploadImage({ request, response }: HttpContext) {
    try {
      const image = request.file('image', {
        size: '10mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
      })

      if (!image) {
        return response.badRequest({
          success: false,
          message: 'Aucune image fournie',
        })
      }

      // Convertir le fichier en buffer pour le FileService
      const buffer = readFileSync(image.tmpPath!)
      const userId = 'admin' // TODO: Récupérer l'utilisateur du contexte auth

      // Upload avec le FileService qui gère la stratégie R2
      const uploadedImage = await this.fileService.uploadImage(
        buffer,
        image.clientName,
        image.type!,
        userId,
        {
          generateVariants: true,
          optimize: true,
          folder: 'uploads',
          isPublic: true
        }
      )

      return response.ok({
        success: true,
        data: {
          filename: uploadedImage.filename,
          originalName: uploadedImage.originalName,
          url: uploadedImage.url,
          size: uploadedImage.size,
          mimeType: uploadedImage.mimeType,
          variants: uploadedImage.variants || [],
          optimized: uploadedImage.isOptimized || false,
          disk: uploadedImage.disk
        },
        message: 'Image uploadée avec succès',
      })
    } catch (error) {
      console.error('Erreur upload image:', error)
      
      // Fallback vers l'ancienne méthode en cas d'échec
      try {
        const image = request.file('image')
        if (image) {
          const key = `uploads/fallback-${cuid()}.${image.extname}`
          await image.moveToDisk(key, 'public')
          
          return response.ok({
            success: true,
            data: {
              filename: image.fileName,
              originalName: image.clientName,
              url: image.meta.url,
              size: image.size,
              mimeType: image.type,
              fallback: true
            },
            message: 'Image uploadée avec succès (mode fallback)',
          })
        }
      } catch (fallbackError) {
        console.error('Erreur fallback upload image:', fallbackError)
      }

      return response.internalServerError({
        success: false,
        message: 'Erreur lors de l\'upload de l\'image',
        error: error.message,
      })
    }
  }

  /**
   * Upload d'une vidéo avec stratégie R2
   * POST /admin/files/videos
   */
  async uploadVideo({ request, response }: HttpContext) {
    try {
      const video = request.file('video', {
        size: '100mb',
        extnames: ['mp4', 'webm', 'mov'],
      })

      if (!video) {
        return response.badRequest({
          success: false,
          message: 'Aucune vidéo fournie',
        })
      }

      // Convertir le fichier en buffer pour le FileService
      const buffer = readFileSync(video.tmpPath!)
      const userId = 'admin' // TODO: Récupérer l'utilisateur du contexte auth

      // Upload avec le FileService qui gère la stratégie R2
      const uploadedVideo = await this.fileService.uploadVideo(
        buffer,
        video.clientName,
        video.type!,
        userId,
        'videos'
      )

      return response.ok({
        success: true,
        data: {
          filename: uploadedVideo.filename,
          originalName: uploadedVideo.originalName,
          url: uploadedVideo.url,
          size: uploadedVideo.size,
          mimeType: uploadedVideo.mimeType,
          disk: uploadedVideo.disk
        },
        message: 'Vidéo uploadée avec succès',
      })
    } catch (error) {
      console.error('Erreur upload vidéo:', error)
      
      // Fallback vers l'ancienne méthode en cas d'échec
      try {
        const video = request.file('video')
        if (video) {
          const key = `videos/fallback-${cuid()}.${video.extname}`
          await video.moveToDisk(key, 'public')
          
          return response.ok({
            success: true,
            data: {
              filename: video.fileName,
              originalName: video.clientName,
              url: video.meta.url,
              size: video.size,
              mimeType: video.type,
              fallback: true
            },
            message: 'Vidéo uploadée avec succès (mode fallback)',
          })
        }
      } catch (fallbackError) {
        console.error('Erreur fallback upload vidéo:', fallbackError)
      }

      return response.internalServerError({
        success: false,
        message: 'Erreur lors de l\'upload de la vidéo',
        error: error.message,
      })
    }
  }

  /**
   * Informations sur un fichier
   * GET /admin/files/:path/info
   */
  async getFileInfo({ params, response }: HttpContext) {
    try {
      const filePath = params.path
      const exists = await drive.use('public').exists(filePath)
      
      if (!exists) {
        return response.notFound({
          success: false,
          message: 'Fichier non trouvé',
        })
      }

      const url = await drive.use('public').getUrl(filePath)

      return response.ok({
        success: true,
        data: {
          path: filePath,
          url,
          exists: true,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la récupération des informations',
        error: error.message,
      })
    }
  }

  /**
   * Suppression d'un fichier
   * DELETE /admin/files/:path
   */
  async deleteFile({ params, response }: HttpContext) {
    try {
      const filePath = params.path
      const exists = await drive.use('public').exists(filePath)
      
      if (!exists) {
        return response.notFound({
          success: false,
          message: 'Fichier non trouvé',
        })
      }

      await drive.use('public').delete(filePath)

      return response.ok({
        success: true,
        message: 'Fichier supprimé avec succès',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la suppression',
        error: error.message,
      })
    }
  }

  /**
   * Upload en batch d'assets pour le system d'optimisation CDN
   * POST /admin/files/batch-upload
   */
  async batchUpload({ request, response }: HttpContext) {
    try {
      const { assets, userId = 'system-cdn-optimizer', options = {} } = request.body()

      if (!assets || !Array.isArray(assets)) {
        return response.badRequest({
          success: false,
          message: 'Liste d\'assets requise',
        })
      }

      // Valider que tous les assets ont les champs requis
      for (const asset of assets) {
        if (!asset.path || !asset.filename || !asset.hash) {
          return response.badRequest({
            success: false,
            message: 'Champs manquants dans les assets (path, filename, hash requis)',
          })
        }
      }

      // Upload via BatchUploadService avec userId système
      const result = await this.batchUploadService.uploadAssets(
        assets,
        userId, // system-cdn-optimizer sera reconnu par le FileService
        {
          concurrency: options.concurrency || 10,
          retryAttempts: options.retryAttempts || 3,
          skipExisting: options.skipExisting !== false,
          generateThumbnails: options.generateThumbnails || false,
          optimizeImages: options.optimizeImages || false,
          cacheHeaders: options.cacheHeaders || {}
        }
      )

      return response.ok({
        success: true,
        data: {
          uploadedAssets: result.uploadedAssets,
          skippedAssets: result.skippedAssets,
          totalUploaded: result.totalUploaded,
          totalSkipped: result.totalSkipped,
          totalSize: result.totalSize,
          uploadDuration: result.uploadDuration,
          errors: result.errors
        },
        message: `Upload terminé: ${result.totalUploaded} assets uploadés, ${result.totalSkipped} ignorés`,
      })
    } catch (error) {
      console.error('Erreur batch upload:', error)
      
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de l\'upload en batch',
        error: error.message,
      })
    }
  }
}