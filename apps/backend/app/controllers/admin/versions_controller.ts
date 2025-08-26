import vine from '@vinejs/vine'
import BaseAdminController from './base_admin_controller.js'
import { VersionService } from '../../services/version_service.js'
import {
  createVersionSchema,
  updateVersionSchema
} from '../../validators/component_validators.js'
import { paginationSchema } from '../../validators/common_validators.js'
import type { AdminHttpContext } from '../../types/http_context.js'

// Schéma simple pour la recherche de versions
const searchVersionsSchema = vine.object({
  ...paginationSchema.getProperties(),
})

/**
 * Contrôleur admin pour la gestion des versions de composants
 * Gère le CRUD complet des versions avec support multi-framework
 */
export default class VersionsController extends BaseAdminController {
  private versionService: VersionService

  constructor() {
    super()
    this.versionService = new VersionService()
  }

  /**
   * Liste paginée des versions d'un composant
   * GET /admin/components/:componentId/versions
   */
  async index(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      
      // Validation des paramètres de requête
      const query = await vine.validate({
        schema: searchVersionsSchema,
        data: ctx.request.qs(),
      })

      // Paramètres de pagination
      const paginationParams = this.validatePaginationParams(query)

      // Log de l'action
      this.logAdminAction(ctx, 'list', 'versions', componentId, { 
        filters: query,
        pagination: paginationParams 
      })

      // Récupération des versions avec pagination
      const result = await this.versionService.listVersions(componentId, paginationParams)

      return this.paginatedResponse(
        ctx,
        result.data,
        result.pagination.total,
        paginationParams.page,
        paginationParams.limit,
        'Versions récupérées avec succès'
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Détails d'une version spécifique
   * GET /admin/versions/:id
   */
  async show(ctx: AdminHttpContext) {
    try {
      const versionId = ctx.request.param('id')

      // Log de l'action
      this.logAdminAction(ctx, 'show', 'version', versionId)

      // Récupération de la version
      const version = await this.versionService.getVersionById(versionId)

      return this.success(
        ctx,
        version,
        'Version récupérée avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Création d'une nouvelle version
   * POST /admin/components/:componentId/versions
   */
  async store(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')
      
      // Validation des données
      const data = await vine.validate({
        schema: createVersionSchema,
        data: { ...ctx.request.body(), componentId },
      })

      // Log de l'action
      this.logAdminAction(ctx, 'create', 'version', undefined, { 
        componentId: data.componentId,
        framework: data.framework,
        cssFramework: data.cssFramework 
      })

      // Création de la version
      const version = await this.versionService.createVersion(
        data,
        this.getUserId(ctx)!
      )

      return this.created(
        ctx,
        version,
        'Version créée avec succès'
      )

    } catch (error) {
      if (error.code === 'CONFLICT') {
        return this.conflict(ctx, error.message)
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Mise à jour d'une version
   * PUT /admin/versions/:id
   */
  async update(ctx: AdminHttpContext) {
    try {
      const versionId = ctx.request.param('id')
      
      // Validation des données
      const data = await vine.validate({
        schema: updateVersionSchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'update', 'version', versionId, data)

      // Mise à jour de la version
      const version = await this.versionService.updateVersion(
        versionId,
        data,
        this.getUserId(ctx)!
      )

      return this.updated(
        ctx,
        version,
        'Version mise à jour avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version')
      }
      if (error.code === 'CONFLICT') {
        return this.conflict(ctx, error.message)
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Suppression d'une version
   * DELETE /admin/versions/:id
   */
  async destroy(ctx: AdminHttpContext) {
    try {
      const versionId = ctx.request.param('id')

      // Log de l'action
      this.logAdminAction(ctx, 'delete', 'version', versionId)

      // Suppression de la version
      await this.versionService.deleteVersion(
        versionId,
        this.getUserId(ctx)!
      )

      return this.deleted(
        ctx,
        'Version supprimée avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Définit une version comme version par défaut
   * POST /admin/versions/:id/set-default
   */
  async setAsDefault(ctx: AdminHttpContext) {
    try {
      const versionId = ctx.request.param('id')

      // Log de l'action
      this.logAdminAction(ctx, 'set-default', 'version', versionId)

      // Définir comme version par défaut
      const version = await this.versionService.setAsDefault(
        versionId,
        this.getUserId(ctx)!
      )

      return this.success(
        ctx,
        version,
        'Version définie comme par défaut avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Version')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Récupère les statistiques des versions d'un composant
   * GET /admin/components/:componentId/versions/stats
   */
  async getStats(ctx: AdminHttpContext) {
    try {
      const componentId = ctx.request.param('componentId')

      // Log de l'action
      this.logAdminAction(ctx, 'stats', 'versions', componentId)

      // Récupération des statistiques
      const versionsCount = await this.versionService.getVersionsCount(componentId)
      const frameworkBreakdown = await this.versionService.getFrameworkBreakdown(componentId)

      const stats = {
        componentId,
        totalVersions: versionsCount,
        frameworkBreakdown,
      }

      return this.success(
        ctx,
        stats,
        'Statistiques des versions récupérées avec succès'
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }
}