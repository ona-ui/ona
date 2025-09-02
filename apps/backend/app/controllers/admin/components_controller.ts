import vine from '@vinejs/vine'
import BaseAdminController from './base_admin_controller.js'
import { ComponentService } from '../../services/component_service.js'
import { FileService } from '../../services/file_service.js'
import drive from '@adonisjs/drive/services/main'
import {
  createComponentSchema,
  updateComponentSchema,
  searchComponentsSchema,
  duplicateComponentSchema,
  checkComponentSlugSchema,
  getComponentStatsSchema
} from '../../validators/component_validators.js'
import type { AdminHttpContext } from '../../types/http_context.js'

/**
 * Contrôleur admin pour la gestion complète des composants
 * Gère le CRUD, le versioning automatique, les variantes multi-framework et la protection premium
 */
export default class ComponentsController extends BaseAdminController {
  private componentService: ComponentService
  private fileService: FileService

  constructor() {
    super()
    this.componentService = new ComponentService()
    this.fileService = new FileService()
  }

  /**
   * Liste paginée des composants avec filtres avancés
   * GET /admin/components
   */
  async index(ctx: AdminHttpContext) {
    try {
      // Validation des paramètres de requête
      const query = await vine.validate({
        schema: searchComponentsSchema,
        data: ctx.request.qs(),
      })

      // Paramètres de pagination
      const paginationParams = this.validatePaginationParams(query)
      const includeVersions = ctx.request.input('includeVersions', false)

      // Log de l'action
      this.logAdminAction(ctx, 'list', 'components', undefined, {
        filters: query,
        pagination: paginationParams,
        includeVersions
      })

      // Convertir les filtres pour correspondre au service
      const serviceFilters = {
        ...query,
        sortBy: this.convertSortBy(query.sortBy)
      }

      // Récupération des composants avec filtres (TOUS les statuts pour l'admin)
      const result = await this.componentService.listAllComponentsForAdmin(
        serviceFilters,
        paginationParams,
        this.getUserId(ctx) || undefined
      )

      // Enrichir avec les versions si demandé
      let enrichedComponents = result.data
      if (includeVersions) {
        const { VersionService } = await import('../../services/version_service.js')
        const versionService = new VersionService()

        enrichedComponents = await Promise.all(
          result.data.map(async (component: any) => {
            const versions = await versionService.getVersionsByComponentId(component.id)
            return {
              ...component,
              versions,
              versionsCount: versions.length
            }
          })
        )
      }

      return this.paginatedResponse(
        ctx,
        enrichedComponents,
        result.pagination.total,
        paginationParams.page,
        paginationParams.limit,
        'Composants récupérés avec succès'
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Détails complets d'un composant avec toutes ses versions et statistiques
   * GET /admin/components/:id
   */
  async show(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      const includeVersions = ctx.request.input('includeVersions', true)
      const includeStats = ctx.request.input('includeStats', true)

      // Log de l'action
      this.logAdminAction(ctx, 'show', 'component', componentId)

      // Récupération du composant avec contrôle d'accès admin
      const component = await this.componentService.getComponentById(
        componentId,
        this.getUserId(ctx) || undefined
      )

      let enrichedComponent: any = { ...component }

      // Ajouter les versions si demandé
      if (includeVersions) {
        const { VersionService } = await import('../../services/version_service.js')
        const versionService = new VersionService()

        const versions = await versionService.getVersionsByComponentId(componentId)
        enrichedComponent.versions = versions
        enrichedComponent.versionsCount = versions.length
      }

      // Ajouter les statistiques si demandé
      if (includeStats) {
        enrichedComponent.stats = {
          viewCount: component.viewCount || 0,
          copyCount: component.copyCount || 0,
          conversionRate: component.conversionRate || null,
          lastViewedAt: null, // À implémenter avec analytics
          popularityScore: this.calculatePopularityScore(component),
        }
      }

      return this.success(
        ctx,
        enrichedComponent,
        'Composant récupéré avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Création d'un nouveau composant avec upload de fichiers et génération de la première version
   * POST /admin/components
   */
  async store(ctx: AdminHttpContext) {
    try {
      // Validation des données
      const data = await vine.validate({
        schema: createComponentSchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'create', 'component', undefined, { 
        name: data.name,
        subcategoryId: data.subcategoryId,
        isFree: data.isFree 
      })

      // Convertir conversionRate en string si présent
      const componentData = {
        ...data,
        conversionRate: data.conversionRate ? data.conversionRate.toString() : undefined
      }

      // Création du composant
      const component = await this.componentService.createComponent(
        componentData,
        this.getUserId(ctx)!
      )

      // Traitement des fichiers uploadés si présents
      const files = ctx.request.files('files', { size: '10mb', extnames: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'] })
      if (files && files.length > 0) {
        const uploadedFiles = await this.processUploadedFiles(files, component.id)
        
        // Mettre à jour le composant avec les URLs des fichiers
        if (uploadedFiles.previewImageLarge) {
          await this.componentService.updateComponent(
            component.id,
            { previewImageLarge: uploadedFiles.previewImageLarge },
            this.getUserId(ctx)!
          )
        }
      }

      return this.created(
        ctx,
        component,
        'Composant créé avec succès'
      )

    } catch (error) {
      if (error.code === 'CONFLICT') {
        return this.conflict(ctx, error.message)
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Mise à jour d'un composant avec détection automatique des changements
   * PUT /admin/components/:id
   */
  async update(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      
      // Validation des données
      const data = await vine.validate({
        schema: updateComponentSchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'update', 'component', componentId, data)

      // Convertir conversionRate en string si présent
      const updateData = {
        ...data,
        conversionRate: data.conversionRate ? data.conversionRate.toString() : undefined
      }

      // Mise à jour du composant
      const component = await this.componentService.updateComponent(
        componentId,
        updateData,
        this.getUserId(ctx)!
      )

      // Traitement des nouveaux fichiers si présents
      const files = ctx.request.files('files')
      if (files && files.length > 0) {
        await this.processUploadedFiles(files, componentId)
      }

      return this.updated(
        ctx,
        component,
        'Composant mis à jour avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      if (error.code === 'CONFLICT') {
        return this.conflict(ctx, error.message)
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Suppression d'un composant avec nettoyage des fichiers associés
   * DELETE /admin/components/:id
   */
  async destroy(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('id')

      // Log de l'action
      this.logAdminAction(ctx, 'delete', 'component', componentId)

      // Récupérer le composant pour nettoyer les fichiers
      const component = await this.componentService.getComponentById(
        componentId,
        this.getUserId(ctx) || undefined
      )

      // Supprimer les fichiers associés
      await this.cleanupComponentFiles(component)

      // Suppression du composant
      await this.componentService.deleteComponent(
        componentId,
        this.getUserId(ctx)!
      )

      return this.deleted(
        ctx,
        'Composant supprimé avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Duplication d'un composant avec nouvelle version
   * POST /admin/components/:id/duplicate
   */
  async duplicate(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      
      // Validation des données
      const data = await vine.validate({
        schema: duplicateComponentSchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'duplicate', 'component', componentId, {
        newName: data.newName,
        newSlug: data.newSlug
      })

      // Récupérer le composant original
      const originalComponent = await this.componentService.getComponentById(
        componentId,
        this.getUserId(ctx) || undefined
      )

      // Créer le nouveau composant
      const duplicatedComponent = await this.componentService.createComponent({
        subcategoryId: data.targetSubcategoryId || originalComponent.subcategoryId,
        name: data.newName,
        slug: data.newSlug,
        description: originalComponent.description,
        isFree: originalComponent.isFree,
        requiredTier: originalComponent.requiredTier,
        accessType: originalComponent.accessType,
        status: 'draft', // Toujours créer en draft
        isNew: true,
        isFeatured: false,
        conversionRate: data.duplicateStats ? originalComponent.conversionRate : null,
        testedCompanies: originalComponent.testedCompanies,
        previewImageLarge: originalComponent.previewImageLarge,
        previewImageSmall: originalComponent.previewImageSmall,
        previewVideoUrl: originalComponent.previewVideoUrl,
        tags: originalComponent.tags,
      }, this.getUserId(ctx)!)

      // TODO: Dupliquer les versions si demandé (nécessite ComponentVersionService)

      return this.created(
        ctx,
        duplicatedComponent,
        'Composant dupliqué avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant original')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Changement de statut d'un composant (draft → published → archived)
   * POST /admin/components/:id/status
   */
  async changeStatus(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      const { status, reason } = ctx.request.body()

      // Validation du statut
      const validStatuses = ['draft', 'published', 'archived']
      if (!validStatuses.includes(status)) {
        return this.error(ctx, 'Statut invalide', 400)
      }

      // Log de l'action
      this.logAdminAction(ctx, 'change-status', 'component', componentId, {
        newStatus: status,
        reason
      })

      // Mise à jour du statut
      const updateData: any = { status }
      
      if (status === 'published') {
        updateData.publishedAt = new Date()
      } else if (status === 'archived') {
        updateData.archivedAt = new Date()
      }

      const component = await this.componentService.updateComponent(
        componentId,
        updateData,
        this.getUserId(ctx)!
      )

      return this.updated(
        ctx,
        component,
        `Statut du composant changé vers "${status}" avec succès`
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Statistiques détaillées d'un composant (vues, copies, téléchargements)
   * GET /admin/components/:id/stats
   */
  async getStats(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      
      // Validation des paramètres
      await vine.validate({
        schema: getComponentStatsSchema,
        data: ctx.request.qs(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'stats', 'component', componentId)

      // Récupérer le composant
      const component = await this.componentService.getComponentById(
        componentId,
        this.getUserId(ctx) || undefined
      )

      // Calculer les statistiques
      const stats = {
        component: {
          id: component.id,
          name: component.name,
          slug: component.slug,
          status: component.status,
          isFree: component.isFree,
          createdAt: component.createdAt,
          publishedAt: component.publishedAt,
        },
        metrics: {
          viewCount: component.viewCount || 0,
          copyCount: component.copyCount || 0,
          conversionRate: component.conversionRate || null,
          popularityScore: this.calculatePopularityScore(component),
        },
        performance: {
          viewsPerDay: 0, // À implémenter avec analytics
          copiesPerDay: 0, // À implémenter avec analytics
          peakViewDate: null, // À implémenter avec analytics
          trendsLast30Days: [], // À implémenter avec analytics
        },
        versions: {
          totalVersions: 0, // À implémenter avec ComponentVersionService
          frameworkBreakdown: [], // À implémenter avec ComponentVersionService
          latestVersion: '1.0.0', // À implémenter avec ComponentVersionService
        }
      }

      return this.success(
        ctx,
        stats,
        'Statistiques du composant récupérées avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Upload d'images et vidéos avec optimisation
   * POST /admin/components/:id/upload
   */
  async uploadFiles(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      
      // Vérifier que le composant existe
      await this.componentService.getComponentById(componentId, this.getUserId(ctx) || undefined)

      // Log de l'action
      this.logAdminAction(ctx, 'upload-files', 'component', componentId)

      // Traitement des fichiers
      const files = ctx.request.files('files', { 
        size: '50mb', 
        extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm'] 
      })

      if (!files || files.length === 0) {
        return this.error(ctx, 'Aucun fichier fourni', 400)
      }

      const uploadedFiles = await this.processUploadedFiles(files, componentId)

      return this.success(
        ctx,
        uploadedFiles,
        'Fichiers uploadés avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Génération et récupération des previews compilés
   * GET /admin/components/:id/preview
   */
  async getPreview(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      const versionId = ctx.request.input('versionId')
      const framework = ctx.request.input('framework', 'react')
      const cssFramework = ctx.request.input('cssFramework', 'tailwind_v4')

      // Log de l'action
      this.logAdminAction(ctx, 'get-preview', 'component', componentId, {
        versionId,
        framework,
        cssFramework
      })

      // TODO: Intégrer avec ComponentVersionService pour récupérer la version
      // Pour le MVP, on simule la compilation
      const previewData = {
        componentId,
        versionId: versionId || 'default',
        framework,
        cssFramework,
        previewUrl: `/previews/${componentId}-${versionId || 'default'}-preview.html`,
        thumbnailUrl: `/thumbnails/${componentId}-${versionId || 'default'}-thumb.jpg`,
        compiledAt: new Date().toISOString(),
        status: 'ready'
      }

      return this.success(
        ctx,
        previewData,
        'Preview généré avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Vérification de l'unicité d'un slug de composant
   * POST /admin/components/check-slug
   */
  async checkSlug(ctx: AdminHttpContext) {
    try {
      // Validation des données
      const data = await vine.validate({
        schema: checkComponentSlugSchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'check-slug', 'component', undefined, data)

      try {
        const existingComponent = await this.componentService.getComponentBySlug(
          data.slug,
          data.subcategoryId
        )

        // Si on trouve un composant et que ce n'est pas celui qu'on exclut
        const isAvailable = data.excludeId && existingComponent.id === data.excludeId

        return this.success(ctx, {
          available: isAvailable,
          slug: data.slug,
          existingComponent: isAvailable ? null : {
            id: existingComponent.id,
            name: existingComponent.name,
          },
        })

      } catch (error) {
        if (error.code === 'NOT_FOUND') {
          // Le slug est disponible
          return this.success(ctx, {
            available: true,
            slug: data.slug,
            existingComponent: null,
          })
        }
        throw error
      }

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Opérations en lot sur les composants
   * POST /admin/components/batch
   */
  async batch(ctx: AdminHttpContext) {
    try {
      const { operation, componentIds, data } = ctx.request.body()

      // Validation des paramètres
      if (!operation || !componentIds || !Array.isArray(componentIds)) {
        return this.error(ctx, 'Paramètres invalides pour l\'opération en lot', 400)
      }

      // Log de l'action
      this.logAdminAction(ctx, 'batch', 'components', undefined, { 
        operation, 
        componentIds, 
        count: componentIds.length 
      })

      let result: any

      switch (operation) {
        case 'publish':
          result = await this.batchChangeStatus(componentIds, 'published')
          break
        case 'archive':
          result = await this.batchChangeStatus(componentIds, 'archived')
          break
        case 'draft':
          result = await this.batchChangeStatus(componentIds, 'draft')
          break
        case 'delete':
          result = await this.batchDelete(componentIds)
          break
        case 'update':
          result = await this.batchUpdate(componentIds, data)
          break
        case 'generate-previews':
          result = await this.batchGeneratePreviews(componentIds)
          break
        default:
          return this.error(ctx, 'Opération non supportée', 400)
      }

      return this.success(
        ctx,
        result,
        `Opération en lot "${operation}" effectuée avec succès`
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Traite les fichiers uploadés avec structure R2 et versioning
   */
  private async processUploadedFiles(files: any[], componentId: string, version: string = '1.0.0') {
    const uploadedFiles: any = {}
    const userId = 'admin' // TODO: Récupérer l'ID utilisateur du contexte

    // Récupérer les informations du composant pour la structure R2
    const component = await this.componentService.getComponentById(componentId, userId)
    const r2Path = this.buildR2ComponentPath(component, version)

    for (const file of files) {
      try {
        const buffer = await file.buffer()
        
        if (file.type?.startsWith('image/')) {
          const uploadedImage = await this.fileService.uploadImage(
            buffer,
            file.clientName,
            file.type,
            userId,
            {
              generateVariants: true,
              optimize: true,
              folder: `${r2Path}/images`,
              disk: this.getStorageDisk(true)
            }
          )
          
          // Déterminer le type d'image selon sa taille
          if (file.size > 500000) { // > 500KB = grande image
            uploadedFiles.previewImageLarge = uploadedImage.url
          } else {
            uploadedFiles.previewImageSmall = uploadedImage.url
          }
          
        } else if (file.type?.startsWith('video/')) {
          const uploadedVideo = await this.fileService.uploadVideo(
            buffer,
            file.clientName,
            file.type,
            userId,
            `${r2Path}/videos`
          )
          
          uploadedFiles.previewVideoUrl = uploadedVideo.url
        }
      } catch (error) {
        console.error(`Erreur lors de l'upload du fichier ${file.clientName}:`, error)
        // En cas d'erreur R2, tenter le fallback S3 legacy
        try {
          await this.uploadFileLegacyFallback(file, componentId, userId)
        } catch (fallbackError) {
          console.error(`Échec du fallback S3 pour ${file.clientName}:`, fallbackError)
        }
      }
    }

    // Générer les métadonnées de composant après upload
    try {
      await this.generateComponentMetadata(component, version, r2Path, uploadedFiles)
    } catch (error) {
      console.error('Erreur lors de la génération des métadonnées:', error)
    }

    return uploadedFiles
  }

  /**
   * Nettoie les fichiers associés à un composant
   */
  private async cleanupComponentFiles(component: any) {
    const userId = 'admin' // TODO: Récupérer l'ID utilisateur du contexte
    
    try {
      // Supprimer les images
      if (component.previewImageLarge) {
        const imagePath = this.extractPathFromUrl(component.previewImageLarge)
        if (imagePath) {
          await this.fileService.deleteFile(imagePath, userId)
        }
      }
      
      if (component.previewImageSmall) {
        const imagePath = this.extractPathFromUrl(component.previewImageSmall)
        if (imagePath) {
          await this.fileService.deleteFile(imagePath, userId)
        }
      }
      
      // Supprimer les vidéos
      if (component.previewVideoUrl) {
        const videoPath = this.extractPathFromUrl(component.previewVideoUrl)
        if (videoPath) {
          await this.fileService.deleteFile(videoPath, userId)
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des fichiers:', error)
    }
  }

  /**
   * Extrait le chemin d'un fichier depuis son URL
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      // Logique pour extraire le chemin depuis l'URL
      // Dépend de la configuration d'AdonisJS Drive
      return url.replace(/^.*\/storage\//, '')
    } catch {
      return null
    }
  }

  /**
   * Calcule le score de popularité d'un composant
   */
  private calculatePopularityScore(component: any): number {
    const viewWeight = 1
    const copyWeight = 5
    const conversionWeight = 10
    
    const views = component.viewCount || 0
    const copies = component.copyCount || 0
    const conversion = parseFloat(component.conversionRate || '0')
    
    return Math.round(
      (views * viewWeight) + 
      (copies * copyWeight) + 
      (conversion * conversionWeight)
    )
  }

  /**
   * Changement de statut en lot
   */
  private async batchChangeStatus(componentIds: string[], status: string) {
    const results = []
    const errors = []
    const userId = 'admin' // TODO: Récupérer l'ID utilisateur du contexte

    for (const componentId of componentIds) {
      try {
        const updateData: any = { status }
        
        if (status === 'published') {
          updateData.publishedAt = new Date()
        } else if (status === 'archived') {
          updateData.archivedAt = new Date()
        }

        const component = await this.componentService.updateComponent(
          componentId,
          updateData,
          userId
        )
        results.push({ id: componentId, success: true, component })
      } catch (error) {
        errors.push({ id: componentId, error: error.message })
      }
    }

    return {
      operation: `change-status-${status}`,
      processed: componentIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }

  /**
   * Suppression en lot
   */
  private async batchDelete(componentIds: string[]) {
    const results = []
    const errors = []
    const userId = 'admin' // TODO: Récupérer l'ID utilisateur du contexte

    for (const componentId of componentIds) {
      try {
        // Récupérer le composant pour nettoyer les fichiers
        const component = await this.componentService.getComponentById(componentId, userId)
        await this.cleanupComponentFiles(component)
        
        await this.componentService.deleteComponent(componentId, userId)
        results.push({ id: componentId, success: true })
      } catch (error) {
        errors.push({ id: componentId, error: error.message })
      }
    }

    return {
      operation: 'delete',
      processed: componentIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }

  /**
   * Mise à jour en lot
   */
  private async batchUpdate(componentIds: string[], updateData: any) {
    const results = []
    const errors = []
    const userId = 'admin' // TODO: Récupérer l'ID utilisateur du contexte

    for (const componentId of componentIds) {
      try {
        const component = await this.componentService.updateComponent(
          componentId,
          updateData,
          userId
        )
        results.push({ id: componentId, success: true, component })
      } catch (error) {
        errors.push({ id: componentId, error: error.message })
      }
    }

    return {
      operation: 'update',
      processed: componentIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }

  /**
   * Génération de previews en lot
   */
  private async batchGeneratePreviews(componentIds: string[]) {
    const results = []
    const errors = []

    for (const componentId of componentIds) {
      try {
        // TODO: Intégrer avec ComponentVersionService pour générer les previews
        // Pour le MVP, on simule la génération
        const previewData = {
          componentId,
          previewUrl: `/previews/${componentId}-default-preview.html`,
          thumbnailUrl: `/thumbnails/${componentId}-default-thumb.jpg`,
          generatedAt: new Date().toISOString()
        }
        
        results.push({ id: componentId, success: true, preview: previewData })
      } catch (error) {
        errors.push({ id: componentId, error: error.message })
      }
    }

    return {
      operation: 'generate-previews',
      processed: componentIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }

  /**
   * Convertit les valeurs de tri du validator vers le service
   */
  private convertSortBy(sortBy?: string): 'name' | 'conversion' | 'newest' | 'popular' | undefined {
    const sortMapping: Record<string, 'name' | 'conversion' | 'newest' | 'popular'> = {
      'name': 'name',
      'slug': 'name', // slug -> name
      'createdAt': 'newest',
      'updatedAt': 'newest',
      'publishedAt': 'newest',
      'viewCount': 'popular',
      'copyCount': 'popular',
      'conversionRate': 'conversion',
      'sortOrder': 'newest'
    }

    return sortBy ? sortMapping[sortBy] || 'newest' : undefined
  }

  /**
   * Construit le chemin R2 pour un composant selon la spécification
   * Format: /components/{category}/{number}/v{version}/
   */
  private buildR2ComponentPath(component: any, version: string): string {
    // Extraire category et number depuis le slug ou l'ID
    const category = this.extractCategoryFromComponent(component)
    const number = this.extractNumberFromComponent(component)
    
    return `components/${category}/${number}/v${version}`
  }

  /**
   * Extrait la catégorie depuis les informations du composant
   */
  private extractCategoryFromComponent(component: any): string {
    // Si on a une subcategory avec un nom, l'utiliser
    if (component.subcategory?.name) {
      return component.subcategory.name.toLowerCase()
    }
    
    // Sinon essayer d'extraire depuis le slug
    if (component.slug) {
      const parts = component.slug.split('-')
      return parts[0] || 'misc'
    }
    
    return 'misc' // Fallback
  }

  /**
   * Extrait le numéro depuis les informations du composant
   */
  private extractNumberFromComponent(component: any): number {
    // Si on a un componentNumber explicite, l'utiliser
    if (component.componentNumber) {
      return component.componentNumber
    }
    
    // Sinon essayer d'extraire depuis le slug
    if (component.slug) {
      const match = component.slug.match(/-(\d+)$/)
      if (match) {
        return parseInt(match[1], 10)
      }
    }
    
    // Sinon utiliser l'ID comme fallback
    return parseInt(component.id.toString().slice(-2), 10) || 1
  }

  /**
   * Détermine le disque de stockage à utiliser selon la stratégie
   */
  private getStorageDisk(isPublic: boolean = true): 'fs' | 'public' | 's3' | 's3_private' | 'r2' | 'r2_private' {
    const storageProvider = process.env.STORAGE_PROVIDER || 's3'
    
    switch (storageProvider) {
      case 'r2':
        return isPublic ? 'r2' : 'r2_private'
      case 'dual':
      case 's3':
      default:
        return isPublic ? 's3' : 's3_private'
    }
  }

  /**
   * Upload de fallback vers S3 legacy en cas d'échec R2
   */
  private async uploadFileLegacyFallback(file: any, componentId: string, userId: string): Promise<void> {
    const buffer = await file.buffer()
    
    if (file.type?.startsWith('image/')) {
      await this.fileService.uploadImage(
        buffer,
        file.clientName,
        file.type,
        userId,
        {
          generateVariants: false,
          optimize: false,
          folder: `components/${componentId}/images`,
          disk: 's3' // Force S3 pour le fallback
        }
      )
    } else if (file.type?.startsWith('video/')) {
      await this.fileService.uploadVideo(
        buffer,
        file.clientName,
        file.type,
        userId,
        `components/${componentId}/videos`
      )
    }
  }

  /**
   * Génère les métadonnées du composant selon la spec R2
   */
  private async generateComponentMetadata(
    component: any,
    version: string,
    r2Path: string,
    uploadedFiles: any
  ): Promise<void> {
    try {
      const metadata = {
        component: {
          id: component.slug || component.id,
          category: this.extractCategoryFromComponent(component),
          number: this.extractNumberFromComponent(component),
          version,
          name: component.name,
          description: component.description,
          frameworks: ['react', 'vue', 'html'], // À adapter selon les données réelles
          cssFrameworks: ['tailwind_v4', 'tailwind_v3'],
          isFree: component.isFree,
          isPremium: !component.isFree,
          tags: component.tags || []
        },
        assets: {
          preview: {
            large: uploadedFiles.previewImageLarge || null,
            small: uploadedFiles.previewImageSmall || null,
            video: uploadedFiles.previewVideoUrl || null
          },
          files: [], // À remplir avec la liste des assets
          compiled: {
            html: `${r2Path}/preview.html`,
            thumbnail: `${r2Path}/thumbnail.jpg`
          }
        },
        stats: {
          fileSize: 0, // À calculer
          assetCount: 0, // À compter
          conversionRate: component.conversionRate || null,
          viewCount: component.viewCount || 0,
          copyCount: component.copyCount || 0
        },
        created: component.createdAt,
        updated: new Date().toISOString()
      }

      // Upload des métadonnées vers R2 via drive directement
      const metadataPath = `${r2Path}/metadata.json`
      const metadataContent = JSON.stringify(metadata, null, 2)
      
      await this.uploadMetadataFile(metadataPath, metadataContent)
      
      console.log(`Métadonnées générées pour le composant ${component.id} v${version}`)
    } catch (error) {
      console.error('Erreur lors de la génération des métadonnées R2:', error)
      // Ne pas faire échouer l'upload pour une erreur de métadonnées
    }
  }

  /**
   * Upload d'un fichier de métadonnées avec gestion de la stratégie de stockage
   */
  private async uploadMetadataFile(path: string, content: string): Promise<void> {
    const buffer = Buffer.from(content, 'utf-8')
    const storageProvider = process.env.STORAGE_PROVIDER || 's3'
    
    try {
      switch (storageProvider) {
        case 'r2':
          // Upload uniquement vers R2
          await drive.use('r2').put(path, buffer, { contentType: 'application/json' })
          break
          
        case 'dual':
          // Upload vers R2 (principal) et S3 (fallback)
          try {
            await drive.use('r2').put(path, buffer, { contentType: 'application/json' })
          } catch (r2Error) {
            console.warn('Échec upload R2 pour métadonnées, fallback vers S3:', r2Error)
            await drive.use('s3').put(path, buffer, { contentType: 'application/json' })
          }
          
          // Tenter également S3 en background (ne pas échouer si S3 fail)
          try {
            await drive.use('s3').put(path, buffer, { contentType: 'application/json' })
          } catch (s3Error) {
            console.warn('Échec upload S3 en background pour métadonnées:', s3Error)
          }
          break
          
        case 's3':
        default:
          // Upload uniquement vers S3
          await drive.use('s3').put(path, buffer, { contentType: 'application/json' })
          break
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload des métadonnées:', error)
      throw error
    }
  }
}