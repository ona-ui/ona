import vine from '@vinejs/vine'
import BaseAdminController from './base_admin_controller.js'
import { ComponentVersionService } from '../../services/component_version_service.js'
import { ComponentService } from '../../services/component_service.js'
import { FileService } from '../../services/file_service.js'
import {
  createVersionSchema,
  updateVersionSchema,
  validateComponentCodeSchema
} from '../../validators/component_validators.js'
import type { AdminHttpContext } from '../../types/http_context.js'
import { readFileSync } from 'fs'

/**
 * Contrôleur admin pour la gestion complète des versions de composants
 * Gère le CRUD, le versioning automatique intelligent, les variantes multi-framework et la compilation des previews
 */
export default class ComponentVersionsController extends BaseAdminController {
  private componentVersionService: ComponentVersionService
  private componentService: ComponentService
  private fileService: FileService

  constructor() {
    super()
    this.componentVersionService = new ComponentVersionService()
    this.componentService = new ComponentService()
    this.fileService = new FileService()
  }

  /**
   * Liste des versions d'un composant avec comparaisons
   * GET /admin/components/:componentId/versions
   */
  async index(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const includeComparisons = ctx.request.input('includeComparisons', false)
      
      // Paramètres de pagination
      const paginationParams = this.validatePaginationParams(ctx.request.qs())

      // Log de l'action
      this.logAdminAction(ctx, 'list', 'component-versions', componentId, { 
        includeComparisons,
        pagination: paginationParams 
      })

      // Vérifier que le composant existe
      await this.componentService.getComponentById(componentId, this.getUserId(ctx) || undefined)

      // Récupération des versions avec pagination
      const result = await this.componentVersionService.getComponentVersions(
        componentId,
        paginationParams,
        this.getUserId(ctx) || undefined
      )

      // Enrichir avec les comparaisons si demandé
      let enrichedVersions = result.data
      if (includeComparisons && result.data.length > 1) {
        enrichedVersions = await this.addVersionComparisons(result.data)
      }

      return this.paginatedResponse(
        ctx,
        enrichedVersions,
        result.pagination.total,
        paginationParams.page,
        paginationParams.limit,
        'Versions du composant récupérées avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Détails d'une version avec code et métadonnées
   * GET /admin/components/:componentId/versions/:id
   */
  async show(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const versionId = ctx.request.param('id')
      const includeCode = ctx.request.input('includeCode', true)
      const includeStats = ctx.request.input('includeStats', true)

      // Log de l'action
      this.logAdminAction(ctx, 'show', 'component-version', versionId, { componentId })

      // Récupération de la version avec contrôle d'accès admin
      const version = await this.componentVersionService.getVersionById(
        versionId, 
        this.getUserId(ctx) || undefined
      )

      // Vérifier que la version appartient au bon composant
      if (version.componentId !== componentId) {
        return this.notFound(ctx, 'Version dans ce composant')
      }

      let enrichedVersion: any = { ...version }

      // Ajouter les statistiques si demandé
      if (includeStats) {
        const stats = await this.componentVersionService.getVersionStats(componentId)
        enrichedVersion.stats = {
          totalVersions: stats.totalVersions,
          frameworkBreakdown: stats.frameworkBreakdown,
          isLatest: version.versionNumber === stats.latestVersion,
          isDefault: version.isDefault,
        }
      }

      // Masquer le code sensible si nécessaire (même pour admin, on peut vouloir des niveaux)
      if (!includeCode) {
        enrichedVersion.codeFull = null
        enrichedVersion.codeEncrypted = null
      }

      return this.success(
        ctx,
        enrichedVersion,
        'Version du composant récupérée avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version du composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Création d'une nouvelle version avec versioning automatique
   * POST /admin/components/:componentId/versions
   */
  async store(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const forceNewVersion = ctx.request.input('forceNewVersion', false)
      
      // Validation des données
      const data = await vine.validate({
        schema: createVersionSchema,
        data: { ...ctx.request.body(), componentId },
      })

      // Log de l'action
      this.logAdminAction(ctx, 'create', 'component-version', undefined, { 
        componentId,
        framework: data.framework,
        cssFramework: data.cssFramework,
        forceNewVersion
      })

      // Vérifier que le composant existe
      await this.componentService.getComponentById(componentId, this.getUserId(ctx) || undefined)

      // Création de la version avec versioning automatique
      const version = await this.componentVersionService.createVersion(
        data,
        this.getUserId(ctx)!,
        forceNewVersion
      )

      // Compiler automatiquement le preview
      try {
        await this.componentVersionService.compilePreview(version.id)
        
        return this.created(
          ctx,
          {
            ...version,
            compiledPreview: {
              previewUrl: `/previews/${version.componentId}-${version.id}-preview.html`,
              status: 'compiled'
            }
          },
          'Version créée et compilée avec succès'
        )
      } catch (compileError) {
        // La version est créée mais la compilation a échoué
        return this.created(
          ctx,
          {
            ...version,
            compiledPreview: {
              status: 'compilation_failed',
              error: compileError.message
            }
          },
          'Version créée mais compilation échouée'
        )
      }

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
   * Mise à jour d'une version avec détection des changements réels
   * PUT /admin/components/:componentId/versions/:id
   */
  async update(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const versionId = ctx.request.param('id')
      
      // Validation des données
      const data = await vine.validate({
        schema: updateVersionSchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'update', 'component-version', versionId, { componentId })

      // Vérifier que la version existe et appartient au composant
      const existingVersion = await this.componentVersionService.getVersionById(
        versionId,
        this.getUserId(ctx) || undefined
      )

      if (existingVersion.componentId !== componentId) {
        return this.notFound(ctx, 'Version dans ce composant')
      }

      // Mise à jour de la version
      const version = await this.componentVersionService.updateVersion(
        versionId,
        data,
        this.getUserId(ctx)!
      )

      // Recompiler le preview si le code a changé
      if (data.codePreview || data.codeFull) {
        try {
          await this.componentVersionService.compilePreview(version.id)
        } catch (compileError) {
          console.warn('Erreur lors de la recompilation du preview:', compileError)
        }
      }

      return this.updated(
        ctx,
        version,
        'Version mise à jour avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version du composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Suppression d'une version avec protection de la version active
   * DELETE /admin/components/:componentId/versions/:id
   */
  async destroy(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const versionId = ctx.request.param('id')

      // Log de l'action
      this.logAdminAction(ctx, 'delete', 'component-version', versionId, { componentId })

      // Vérifier que la version existe et appartient au composant
      const version = await this.componentVersionService.getVersionById(
        versionId,
        this.getUserId(ctx) || undefined
      )


      if (version.componentId !== componentId) {
        return this.notFound(ctx, 'Version dans ce composant')
      }

      // Suppression de la version (avec protection intégrée dans le service)
      await this.componentVersionService.deleteVersion(
        versionId,
        this.getUserId(ctx)!
      )

      return this.deleted(
        ctx,
        'Version supprimée avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version du composant')
      }
      if (error.message.includes('version par défaut')) {
        return this.conflict(ctx, error.message)
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Comparaison entre deux versions (diff du code)
   * GET /admin/components/:componentId/versions/:id/compare/:compareId
   */
  async compare(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const versionId = ctx.request.param('id')
      const compareId = ctx.request.param('compareId')

      // Log de l'action
      this.logAdminAction(ctx, 'compare', 'component-versions', versionId, { 
        componentId, 
        compareId 
      })

      // Récupérer les deux versions
      const [version1, version2] = await Promise.all([
        this.componentVersionService.getVersionById(versionId, this.getUserId(ctx) || undefined),
        this.componentVersionService.getVersionById(compareId, this.getUserId(ctx) || undefined)
      ])

      // Vérifier que les versions appartiennent au même composant
      if (version1.componentId !== componentId || version2.componentId !== componentId) {
        return this.notFound(ctx, 'Versions dans ce composant')
      }

      // Générer la comparaison
      const comparison = this.generateVersionComparison(version1, version2)

      return this.success(
        ctx,
        comparison,
        'Comparaison des versions générée avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version du composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Définir une version comme version par défaut
   * POST /admin/components/:componentId/versions/:id/set-default
   */
  async setActive(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const versionId = ctx.request.param('id')

      // Log de l'action
      this.logAdminAction(ctx, 'set-default', 'component-version', versionId, { componentId })

      // Vérifier que la version existe et appartient au composant
      const version = await this.componentVersionService.getVersionById(
        versionId,
        this.getUserId(ctx) || undefined
      )

      if (version.componentId !== componentId) {
        return this.notFound(ctx, 'Version dans ce composant')
      }

      // Définir comme version par défaut
      await this.componentVersionService.setAsDefault(
        versionId,
        this.getUserId(ctx)!
      )

      return this.success(
        ctx,
        { 
          versionId, 
          isDefault: true,
          versionNumber: version.versionNumber 
        },
        'Version définie comme version par défaut avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version du composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Compilation manuelle des previews
   * POST /admin/components/:componentId/versions/:id/compile
   */
  async compile(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const versionId = ctx.request.param('id')

      // Log de l'action
      this.logAdminAction(ctx, 'compile', 'component-version', versionId, { componentId })

      // Vérifier que la version existe et appartient au composant
      const version = await this.componentVersionService.getVersionById(
        versionId,
        this.getUserId(ctx) || undefined
      )

      if (version.componentId !== componentId) {
        return this.notFound(ctx, 'Version dans ce composant')
      }

      // Compilation du preview
      await this.componentVersionService.compilePreview(versionId)

      return this.success(
        ctx,
        {
          versionId,
          previewUrl: `/previews/${componentId}-${versionId}-preview.html`,
          compiledAt: new Date().toISOString(),
          status: 'compiled'
        },
        'Preview compilé avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version du composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Liste des frameworks disponibles pour ce composant
   * GET /admin/components/:componentId/frameworks
   */
  async getFrameworks(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')

      // Log de l'action
      this.logAdminAction(ctx, 'get-frameworks', 'component', componentId)

      // Vérifier que le composant existe
      await this.componentService.getComponentById(componentId, this.getUserId(ctx) || undefined)

      // Récupérer les variantes disponibles
      const variants = await this.componentVersionService.getFrameworkVariants(componentId)

      // Organiser par framework et CSS framework
      const frameworksData = this.organizeFrameworkVariants(variants)

      return this.success(
        ctx,
        frameworksData,
        'Frameworks disponibles récupérés avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Création d'une variante pour un nouveau framework
   * POST /admin/components/:componentId/frameworks/:framework/variants
   */
  async createVariant(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const framework = ctx.request.param('framework')
      const { cssFramework, baseVersionId } = ctx.request.body()

      // Validation du framework
      const validFrameworks = ['html', 'react', 'vue', 'svelte', 'alpine', 'angular']
      if (!validFrameworks.includes(framework)) {
        return this.error(ctx, 'Framework non supporté', 400)
      }

      // Log de l'action
      this.logAdminAction(ctx, 'create-variant', 'component-version', undefined, { 
        componentId, 
        framework, 
        cssFramework,
        baseVersionId 
      })

      // Vérifier que le composant existe
      await this.componentService.getComponentById(componentId, this.getUserId(ctx) || undefined)

      // Récupérer la version de base si fournie
      let baseVersion = null
      if (baseVersionId) {
        baseVersion = await this.componentVersionService.getVersionById(
          baseVersionId,
          this.getUserId(ctx) || undefined
        )
      }

      // Créer la variante (conversion automatique du code de base)
      const variantData = {
        componentId,
        versionNumber: '1.0.0', // Sera généré automatiquement par le service
        framework: framework as any,
        cssFramework: cssFramework || 'tailwind_v4',
        codePreview: baseVersion ? this.convertCodeToFramework(baseVersion.codePreview, framework) : '',
        codeFull: baseVersion ? this.convertCodeToFramework(baseVersion.codeFull, framework) : null,
        dependencies: this.getFrameworkDependencies(framework),
        supportsDarkMode: baseVersion?.supportsDarkMode || false,
        isDefault: false,
      }

      const variant = await this.componentVersionService.createVersion(
        variantData,
        this.getUserId(ctx)!,
        true // Force nouvelle version
      )

      return this.created(
        ctx,
        variant,
        `Variante ${framework} créée avec succès`
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant ou version de base')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Validation du code d'une version
   * POST /admin/components/:componentId/versions/:id/validate
   */
  async validateCode(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const versionId = ctx.request.param('id')
      
      // Validation des paramètres
      const data = await vine.validate({
        schema: validateComponentCodeSchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'validate-code', 'component-version', versionId, { 
        componentId,
        framework: data.framework 
      })

      // Récupérer la version
      const version = await this.componentVersionService.getVersionById(
        versionId,
        this.getUserId(ctx) || undefined
      )

      if (version.componentId !== componentId) {
        return this.notFound(ctx, 'Version dans ce composant')
      }

      // Validation du code
      const validationResult = this.validateVersionCode(version, data)

      return this.success(
        ctx,
        validationResult,
        'Validation du code terminée'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version du composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Upload d'assets pour une version de composant
   * POST /admin/components/:componentId/versions/:id/assets
   */
  async uploadAssets(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const versionId = ctx.request.param('id')
      
      // Log de l'action
      this.logAdminAction(ctx, 'upload-assets', 'component-version', versionId, { componentId })

      // Vérifier que la version existe et appartient au composant
      const version = await this.componentVersionService.getVersionById(
        versionId,
        this.getUserId(ctx) || undefined
      )

      if (version.componentId !== componentId) {
        return this.notFound(ctx, 'Version dans ce composant')
      }

      // Traitement des fichiers uploadés
      const files = ctx.request.files('assets', {
        size: '50mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp4', 'webm']
      })

      if (!files || files.length === 0) {
        return this.error(ctx, 'Aucun fichier fourni', 400)
      }

      const uploadedAssets = []
      const userId = this.getUserId(ctx)!

      // Upload chaque fichier
      for (const file of files) {
        try {
          const buffer = readFileSync(file.tmpPath!)
          
          let uploadedFile
          if (file.type?.startsWith('image/')) {
            // Upload d'image avec optimisation
            uploadedFile = await this.fileService.uploadImage(
              buffer,
              file.clientName,
              file.type,
              userId,
              {
                generateVariants: true,
                optimize: true,
                folder: `versions/${versionId}/assets`,
                isPublic: true
              }
            )
          } else if (file.type?.startsWith('video/')) {
            // Upload de vidéo
            uploadedFile = await this.fileService.uploadVideo(
              buffer,
              file.clientName,
              file.type,
              userId,
              `versions/${versionId}/assets`
            )
          } else {
            // Autre type de fichier - utiliser l'upload générique
            uploadedFile = await this.fileService.uploadFile(
              buffer,
              file.clientName,
              file.type || 'application/octet-stream',
              userId,
              {
                folder: `versions/${versionId}/assets`,
                isPublic: true
              }
            )
          }

          // Déterminer le type d'asset
          let assetType = 'file'
          if (file.type?.startsWith('image/')) {
            assetType = 'image'
          } else if (file.type?.startsWith('video/')) {
            assetType = 'video'
          }

          uploadedAssets.push({
            filename: uploadedFile.filename,
            originalName: uploadedFile.originalName,
            url: uploadedFile.url,
            size: uploadedFile.size,
            mimeType: uploadedFile.mimeType,
            type: assetType
          })
        } catch (uploadError) {
          console.error(`Erreur upload asset ${file.clientName}:`, uploadError)
          // Continuer avec les autres fichiers
        }
      }

      // Mettre à jour le champ files de la version avec les nouveaux assets
      let currentFiles: any = { assets: [] }
      if (version.files) {
        try {
          // Si c'est déjà un objet, l'utiliser directement
          if (typeof version.files === 'object') {
            currentFiles = version.files
          } else {
            // Sinon tenter de parser le JSON
            currentFiles = JSON.parse(version.files as string)
          }
        } catch (error) {
          console.warn('Erreur lors du parsing des files, utilisation de la valeur par défaut:', error)
          currentFiles = { assets: [] }
        }
      }
      const updatedFiles = {
        ...currentFiles,
        assets: [...(currentFiles.assets || []), ...uploadedAssets]
      }

      await this.componentVersionService.updateVersion(
        versionId,
        { files: JSON.stringify(updatedFiles) },
        userId
      )

      return this.success(
        ctx,
        {
          uploadedAssets,
          totalAssets: updatedFiles.assets.length,
          versionId
        },
        'Assets uploadés avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version du composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Récupérer les assets d'une version
   * GET /admin/components/:componentId/versions/:id/assets
   */
  async getAssets(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const versionId = ctx.request.param('id')

      // Log de l'action
      this.logAdminAction(ctx, 'get-assets', 'component-version', versionId, { componentId })

      // Récupérer la version
      const version = await this.componentVersionService.getVersionById(
        versionId,
        this.getUserId(ctx) || undefined
      )

      if (version.componentId !== componentId) {
        return this.notFound(ctx, 'Version dans ce composant')
      }

      // Extraire les assets du champ files
      let files: any = { assets: [] }
      if (version.files) {
        try {
          // Si c'est déjà un objet, l'utiliser directement
          if (typeof version.files === 'object') {
            files = version.files
          } else {
            // Sinon tenter de parser le JSON
            files = JSON.parse(version.files as string)
          }
        } catch (error) {
          console.warn('Erreur lors du parsing des files, utilisation de la valeur par défaut:', error)
          files = { assets: [] }
        }
      }
      const assets = files.assets || []

      return this.success(
        ctx,
        {
          versionId,
          componentId,
          assets,
          totalAssets: assets.length
        },
        'Assets récupérés avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version du composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Supprimer un asset d'une version
   * DELETE /admin/components/:componentId/versions/:id/assets/:filename
   */
  async deleteAsset(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const versionId = ctx.request.param('id')
      const filename = ctx.request.param('filename')

      // Log de l'action
      this.logAdminAction(ctx, 'delete-asset', 'component-version', versionId, { componentId, filename })

      // Récupérer la version
      const version = await this.componentVersionService.getVersionById(
        versionId,
        this.getUserId(ctx) || undefined
      )

      if (version.componentId !== componentId) {
        return this.notFound(ctx, 'Version dans ce composant')
      }

      // Extraire les assets du champ files
      let files: any = { assets: [] }
      if (version.files) {
        try {
          // Si c'est déjà un objet, l'utiliser directement
          if (typeof version.files === 'object') {
            files = version.files
          } else {
            // Sinon tenter de parser le JSON
            files = JSON.parse(version.files as string)
          }
        } catch (error) {
          console.warn('Erreur lors du parsing des files, utilisation de la valeur par défaut:', error)
          files = { assets: [] }
        }
      }
      const assets = files.assets || []

      // Trouver et supprimer l'asset
      const assetIndex = assets.findIndex((asset: any) => asset.filename === filename)
      if (assetIndex === -1) {
        return this.notFound(ctx, 'Asset')
      }

      const assetToDelete = assets[assetIndex]
      assets.splice(assetIndex, 1)

      // Mettre à jour la version
      const updatedFiles = { ...files, assets }
      await this.componentVersionService.updateVersion(
        versionId,
        { files: JSON.stringify(updatedFiles) },
        this.getUserId(ctx)!
      )

      // Supprimer le fichier physique
      try {
        const filePath = assetToDelete.url.split('/').pop() // Extraire le chemin
        await this.fileService.deleteFile(filePath, this.getUserId(ctx)!)
      } catch (fileError) {
        console.warn('Erreur lors de la suppression du fichier physique:', fileError)
        // Ne pas faire échouer la suppression pour ça
      }

      return this.success(
        ctx,
        {
          deletedAsset: assetToDelete,
          remainingAssets: assets.length
        },
        'Asset supprimé avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version ou asset')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Opérations en lot sur les versions
   * POST /admin/components/:componentId/versions/batch
   */
  async batch(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      const { operation, versionIds, data } = ctx.request.body()

      // Validation des paramètres
      if (!operation || !versionIds || !Array.isArray(versionIds)) {
        return this.error(ctx, 'Paramètres invalides pour l\'opération en lot', 400)
      }

      // Log de l'action
      this.logAdminAction(ctx, 'batch', 'component-versions', undefined, {
        componentId,
        operation,
        versionIds,
        count: versionIds.length
      })

      let result: any

      switch (operation) {
        case 'compile':
          result = await this.batchCompile(componentId, versionIds)
          break
        case 'delete':
          result = await this.batchDelete(componentId, versionIds)
          break
        case 'update':
          result = await this.batchUpdate(componentId, versionIds, data)
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
   * Ajoute les comparaisons entre versions
   */
  private async addVersionComparisons(versions: any[]) {
    const enrichedVersions = []
    
    for (let i = 0; i < versions.length; i++) {
      const version = versions[i]
      const enrichedVersion = { ...version, comparisons: {} }
      
      // Comparer avec la version précédente
      if (i > 0) {
        const previousVersion = versions[i - 1]
        enrichedVersion.comparisons.previous = this.generateVersionComparison(version, previousVersion)
      }
      
      enrichedVersions.push(enrichedVersion)
    }
    
    return enrichedVersions
  }

  /**
   * Génère une comparaison entre deux versions
   */
  private generateVersionComparison(version1: any, version2: any) {
    const changes = []
    
    // Comparer les champs importants
    if (version1.codePreview !== version2.codePreview) {
      changes.push({
        field: 'codePreview',
        type: 'modified',
        oldValue: version2.codePreview?.substring(0, 100) + '...',
        newValue: version1.codePreview?.substring(0, 100) + '...'
      })
    }
    
    if (version1.codeFull !== version2.codeFull) {
      changes.push({
        field: 'codeFull',
        type: 'modified',
        oldValue: version2.codeFull ? 'Code complet modifié' : null,
        newValue: version1.codeFull ? 'Code complet modifié' : null
      })
    }
    
    if (version1.dependencies !== version2.dependencies) {
      changes.push({
        field: 'dependencies',
        type: 'modified',
        oldValue: version2.dependencies,
        newValue: version1.dependencies
      })
    }
    
    return {
      version1: {
        id: version1.id,
        versionNumber: version1.versionNumber,
        createdAt: version1.createdAt
      },
      version2: {
        id: version2.id,
        versionNumber: version2.versionNumber,
        createdAt: version2.createdAt
      },
      changes,
      hasChanges: changes.length > 0,
      changeCount: changes.length
    }
  }

  /**
   * Organise les variantes par framework
   */
  private organizeFrameworkVariants(variants: any[]) {
    const organized: any = {}
    
    variants.forEach(variant => {
      if (!organized[variant.framework]) {
        organized[variant.framework] = {
          framework: variant.framework,
          cssFrameworks: {},
          isAvailable: false
        }
      }
      
      organized[variant.framework].cssFrameworks[variant.cssFramework] = {
        cssFramework: variant.cssFramework,
        version: variant.version,
        isAvailable: variant.isAvailable
      }
      
      if (variant.isAvailable) {
        organized[variant.framework].isAvailable = true
      }
    })
    
    return Object.values(organized)
  }

  /**
   * Convertit le code vers un framework spécifique (conversion basique)
   */
  private convertCodeToFramework(code: string | null, targetFramework: string): string {
    if (!code) return ''
    
    // Conversion basique - dans une implémentation complète, 
    // il faudrait un système de conversion plus sophistiqué
    switch (targetFramework) {
      case 'react':
        return code.replace(/class=/g, 'className=')
      case 'vue':
        return code.replace(/className=/g, 'class=')
      default:
        return code
    }
  }

  /**
   * Récupère les dépendances par défaut pour un framework
   */
  private getFrameworkDependencies(framework: string): string | null {
    const dependencies: Record<string, string> = {
      'react': JSON.stringify(['react', 'react-dom']),
      'vue': JSON.stringify(['vue']),
      'svelte': JSON.stringify(['svelte']),
      'alpine': JSON.stringify(['alpinejs']),
      'angular': JSON.stringify(['@angular/core', '@angular/common'])
    }
    
    return dependencies[framework] || null
  }

  /**
   * Valide le code d'une version
   */
  private validateVersionCode(version: any, validationOptions: any) {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Validation basique du HTML
    if (version.codePreview) {
      if (!version.codePreview.includes('<')) {
        errors.push('Le code preview ne semble pas contenir de HTML valide')
      }
    }
    
    // Validation des dépendances
    if (validationOptions.validateDependencies && version.dependencies) {
      try {
        const deps = JSON.parse(version.dependencies)
        if (!Array.isArray(deps)) {
          errors.push('Les dépendances doivent être un tableau')
        }
      } catch {
        errors.push('Format des dépendances invalide')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
      framework: version.framework,
      cssFramework: version.cssFramework
    }
  }

  /**
   * Compilation en lot
   */
  private async batchCompile(componentId: string, versionIds: string[]) {
    const results = []
    const errors = []

    for (const versionId of versionIds) {
      try {
        await this.componentVersionService.compilePreview(versionId)
        results.push({
          id: versionId,
          success: true,
          previewUrl: `/previews/${componentId}-${versionId}-preview.html`
        })
      } catch (error) {
        errors.push({ id: versionId, error: error.message })
      }
    }

    return {
      operation: 'compile',
      processed: versionIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }

  /**
   * Suppression en lot
   */
  private async batchDelete(_componentId: string, versionIds: string[]) {
    const results = []
    const errors = []
    const userId = this.getUserId({ user: { id: 'admin' } } as any)! // TODO: Récupérer l'ID utilisateur du contexte

    for (const versionId of versionIds) {
      try {
        await this.componentVersionService.deleteVersion(versionId, userId)
        results.push({ id: versionId, success: true })
      } catch (error) {
        errors.push({ id: versionId, error: error.message })
      }
    }

    return {
      operation: 'delete',
      processed: versionIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }

  /**
   * Mise à jour en lot
   */
  private async batchUpdate(_componentId: string, versionIds: string[], updateData: any) {
    const results = []
    const errors = []
    const userId = this.getUserId({ user: { id: 'admin' } } as any)! // TODO: Récupérer l'ID utilisateur du contexte

    for (const versionId of versionIds) {
      try {
        const version = await this.componentVersionService.updateVersion(
          versionId,
          updateData,
          userId
        )
        results.push({ id: versionId, success: true, version })
      } catch (error) {
        errors.push({ id: versionId, error: error.message })
      }
    }

    return {
      operation: 'update',
      processed: versionIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }
}