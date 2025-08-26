import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import type { AdminHttpContext } from '../../types/http_context.js'

/**
 * Types pour les réponses API
 */
interface APIResponse<T = any> {
  success: true
  data: T
  message?: string
  timestamp: string
}

interface APIErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details?: any
  }
  timestamp: string
}

/**
 * Contrôleur de base pour tous les contrôleurs admin
 * Fournit des méthodes communes pour la gestion des réponses, erreurs et logging
 */
export default abstract class BaseAdminController {
  /**
   * Crée une réponse de succès standardisée
   */
  protected success<T>(
    ctx: HttpContext,
    data: T,
    message?: string,
    statusCode: number = 200
  ) {
    const response: APIResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    }

    ctx.response.status(statusCode).json(response)
    return response
  }

  /**
   * Crée une réponse d'erreur standardisée
   */
  protected error(
    ctx: HttpContext,
    message: string,
    statusCode: number = 400,
    code?: string,
    details?: any
  ) {
    const response: APIErrorResponse = {
      success: false,
      error: {
        message,
        code: code || this.getErrorCodeFromStatus(statusCode),
        details,
      },
      timestamp: new Date().toISOString(),
    }

    // Log de l'erreur
    logger.error({
      message,
      statusCode,
      code,
      details,
      url: ctx.request.url(),
      method: ctx.request.method(),
      userId: this.getUserId(ctx),
      ip: ctx.request.ip(),
    }, 'Admin controller error')

    ctx.response.status(statusCode).json(response)
    return response
  }

  /**
   * Gère les erreurs de validation
   */
  protected validationError(
    ctx: HttpContext,
    errors: any,
    message: string = 'Données de validation invalides'
  ) {
    return this.error(ctx, message, 422, 'VALIDATION_ERROR', errors)
  }

  /**
   * Gère les erreurs de ressource non trouvée
   */
  protected notFound(
    ctx: HttpContext,
    resource: string = 'Ressource',
    message?: string
  ) {
    const errorMessage = message || `${resource} non trouvée`
    return this.error(ctx, errorMessage, 404, 'NOT_FOUND')
  }

  /**
   * Gère les erreurs de conflit (ressource déjà existante)
   */
  protected conflict(
    ctx: HttpContext,
    message: string,
    details?: any
  ) {
    return this.error(ctx, message, 409, 'CONFLICT', details)
  }

  /**
   * Gère les erreurs de permissions insuffisantes
   */
  protected forbidden(
    ctx: HttpContext,
    message: string = 'Permissions insuffisantes'
  ) {
    return this.error(ctx, message, 403, 'FORBIDDEN')
  }

  /**
   * Gère les erreurs internes du serveur
   */
  protected internalError(
    ctx: HttpContext,
    error: Error,
    message: string = 'Erreur interne du serveur'
  ) {
    // Log détaillé de l'erreur
    logger.error({
      error: error.message,
      stack: error.stack,
      url: ctx.request.url(),
      method: ctx.request.method(),
      userId: this.getUserId(ctx),
      ip: ctx.request.ip(),
    }, 'Internal server error in admin controller')

    return this.error(ctx, message, 500, 'INTERNAL_ERROR')
  }

  /**
   * Récupère l'ID de l'utilisateur depuis le contexte
   */
  protected getUserId(ctx: HttpContext): string | null {
    return (ctx as any).user?.id || null
  }

  /**
   * Récupère l'utilisateur complet depuis le contexte
   */
  protected getUser(ctx: AdminHttpContext) {
    return ctx.user
  }

  /**
   * Vérifie si l'utilisateur est super admin
   */
  protected isSuperAdmin(ctx: HttpContext): boolean {
    return (ctx as any).isSuperAdmin === true
  }

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  protected hasPermission(ctx: HttpContext, permission: string): boolean {
    const userPermissions = (ctx as any).userPermissions as string[] || []
    return userPermissions.includes(permission)
  }

  /**
   * Log une action administrative
   */
  protected logAdminAction(
    ctx: HttpContext,
    action: string,
    resource: string,
    resourceId?: string,
    details?: any
  ) {
    logger.info('Admin action performed', {
      action,
      resource,
      resourceId,
      details,
      userId: this.getUserId(ctx),
      userRole: (ctx as any).user?.role,
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      url: ctx.request.url(),
      method: ctx.request.method(),
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Valide les paramètres de pagination
   */
  protected validatePaginationParams(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20))
    const offset = (page - 1) * limit

    return {
      page,
      limit,
      offset,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
    }
  }

  /**
   * Crée une réponse paginée standardisée
   */
  protected paginatedResponse<T>(
    ctx: HttpContext,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ) {
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return this.success(ctx, {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    }, message)
  }

  /**
   * Gère les erreurs de manière centralisée
   */
  protected async handleError(ctx: HttpContext, error: any) {
    // Erreurs de validation VineJS
    if (error.messages) {
      return this.validationError(ctx, error.messages)
    }

    // Erreurs métier personnalisées
    if (error.code) {
      switch (error.code) {
        case 'VALIDATION_ERROR':
          return this.validationError(ctx, error.details, error.message)
        case 'NOT_FOUND':
          return this.notFound(ctx, 'Ressource', error.message)
        case 'CONFLICT':
          return this.conflict(ctx, error.message, error.details)
        case 'FORBIDDEN':
          return this.forbidden(ctx, error.message)
        default:
          return this.internalError(ctx, error)
      }
    }

    // Erreurs génériques
    return this.internalError(ctx, error)
  }

  /**
   * Génère un code d'erreur basé sur le statut HTTP
   */
  private getErrorCodeFromStatus(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST'
      case 401:
        return 'UNAUTHORIZED'
      case 403:
        return 'FORBIDDEN'
      case 404:
        return 'NOT_FOUND'
      case 409:
        return 'CONFLICT'
      case 422:
        return 'VALIDATION_ERROR'
      case 500:
        return 'INTERNAL_ERROR'
      default:
        return 'UNKNOWN_ERROR'
    }
  }

  /**
   * Valide et nettoie les données d'entrée
   */
  protected sanitizeInput<T extends Record<string, any>>(
    data: T,
    allowedFields: string[]
  ): Partial<T> {
    const sanitized: any = {}
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitized[field] = data[field]
      }
    }

    return sanitized as Partial<T>
  }

  /**
   * Valide qu'un utilisateur a les permissions nécessaires pour une action
   */
  protected validatePermissions(
    ctx: HttpContext,
    requiredPermissions: string[]
  ): boolean {
    const userPermissions = (ctx as any).userPermissions as string[] || []
    
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
  }

  /**
   * Crée une réponse de succès pour les opérations de création
   */
  protected created<T>(
    ctx: HttpContext,
    data: T,
    message?: string
  ) {
    return this.success(ctx, data, message, 201)
  }

  /**
   * Crée une réponse de succès pour les opérations de suppression
   */
  protected deleted(
    ctx: HttpContext,
    message: string = 'Ressource supprimée avec succès'
  ) {
    return this.success(ctx, { deleted: true }, message, 200)
  }

  /**
   * Crée une réponse de succès pour les opérations de mise à jour
   */
  protected updated<T>(
    ctx: HttpContext,
    data: T,
    message?: string
  ) {
    return this.success(ctx, data, message, 200)
  }
}