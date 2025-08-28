import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { createHash } from 'node:crypto'

/**
 * Types pour les réponses API publiques
 */
interface PublicAPIResponse<T = any> {
  success: true
  data: T
  message?: string
  timestamp: string
  cache?: {
    ttl: number
    key: string
  }
}

interface PublicAPIErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details?: any
  }
  timestamp: string
}

/**
 * Interface pour le contexte HTTP avec authentification optionnelle
 */
export interface OptionalAuthHttpContext extends HttpContext {
  user?: any
  authSession?: any
  subscriptionInfo?: any
  permissions?: any
  isAuthenticated?: boolean
  isPremium?: boolean
  isAdmin?: boolean
  isSuperAdmin?: boolean
  personalization?: {
    preferredFramework: string
    preferredCss: string
    darkModeDefault: boolean
    showPremiumFeatures: boolean
    maxApiCalls: number
    canAccessPremium: boolean
  }
  rateLimits?: {
    requestsPerHour: number
    requestsPerDay: number
    downloadPerDay: number
    apiCallsPerHour: number
  }
}

/**
 * Contrôleur de base pour tous les contrôleurs publics
 * Fournit des méthodes communes pour la gestion des réponses, erreurs et cache
 * Optimisé pour l'accès public sans authentification obligatoire
 */
export default abstract class BasePublicController {
  /**
   * Crée une réponse de succès standardisée pour l'API publique
   */
  protected success<T>(
    ctx: HttpContext,
    data: T,
    message?: string,
    statusCode: number = 200,
    cacheOptions?: { ttl: number; key: string }
  ) {

    const response: PublicAPIResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      cache: cacheOptions,
    }


    // Ajouter les headers de cache si spécifiés
    if (cacheOptions) {
      try {
        ctx.response.header('Cache-Control', `public, max-age=${cacheOptions.ttl}`)
        
        const etag = this.generateETag(cacheOptions.key)
        ctx.response.header('ETag', etag)
      } catch (cacheError) {
        console.error('[DEBUG] Erreur lors de l\'ajout des headers de cache:', cacheError)
        throw cacheError
      }
    }

    // Headers CORS pour l'API publique (seulement si pas déjà définis par AdonisJS)
    if (!ctx.response.getHeader('Access-Control-Allow-Origin')) {
      const origin = ctx.request.header('origin')
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3333',
        'http://localhost:5173',
        'https://ona-ui.com'
      ]

      // Utiliser l'origine spécifique si elle est autorisée pour éviter les conflits avec credentials
      if (origin && allowedOrigins.includes(origin)) {
        ctx.response.header('Access-Control-Allow-Origin', origin)
        ctx.response.header('Access-Control-Allow-Credentials', 'true')
      } else {
        // Pour les requêtes sans credentials
        ctx.response.header('Access-Control-Allow-Origin', '*')
      }
      
      ctx.response.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }
    try {
      ctx.response.status(statusCode).json(response)
    } catch (responseError) {
      console.error('[DEBUG] Erreur lors de l\'envoi de la réponse:', responseError)
      throw responseError
    }

    return response
  }

  /**
   * Crée une réponse d'erreur standardisée pour l'API publique
   */
  protected error(
    ctx: HttpContext,
    message: string,
    statusCode: number = 400,
    code?: string,
    details?: any
  ) {
    const response: PublicAPIErrorResponse = {
      success: false,
      error: {
        message,
        code: code || this.getErrorCodeFromStatus(statusCode),
        details,
      },
      timestamp: new Date().toISOString(),
    }

    // Log de l'erreur (sans informations sensibles)
    logger.warn('Public API error', {
      message,
      statusCode,
      code,
      url: ctx.request.url(),
      method: ctx.request.method(),
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
    })

    // Headers CORS même en cas d'erreur (seulement si pas déjà définis par AdonisJS)
    if (!ctx.response.getHeader('Access-Control-Allow-Origin')) {
      const origin = ctx.request.header('origin')
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3333',
        'http://localhost:5173',
        'https://ona-ui.com'
      ]

      // Utiliser l'origine spécifique si elle est autorisée pour éviter les conflits avec credentials
      if (origin && allowedOrigins.includes(origin)) {
        ctx.response.header('Access-Control-Allow-Origin', origin)
        ctx.response.header('Access-Control-Allow-Credentials', 'true')
      } else {
        // Pour les requêtes sans credentials
        ctx.response.header('Access-Control-Allow-Origin', '*')
      }
      
      ctx.response.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }

    ctx.response.status(statusCode).json(response)
    return response
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
   * Gère les erreurs d'accès premium requis
   */
  protected premiumRequired(
    ctx: HttpContext,
    message: string = 'Accès premium requis pour cette fonctionnalité'
  ) {
    return this.error(ctx, message, 402, 'PREMIUM_REQUIRED')
  }

  /**
   * Gère les erreurs de limite de taux dépassée
   */
  protected rateLimitExceeded(
    ctx: HttpContext,
    message: string = 'Limite de requêtes dépassée'
  ) {
    return this.error(ctx, message, 429, 'RATE_LIMIT_EXCEEDED')
  }

  /**
   * Récupère l'utilisateur depuis le contexte (peut être null)
   */
  protected getUser(ctx: OptionalAuthHttpContext) {
    return ctx.user || null
  }

  /**
   * Récupère l'ID de l'utilisateur depuis le contexte (peut être null)
   */
  protected getUserId(ctx: OptionalAuthHttpContext): string | null {
    return ctx.user?.id || null
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  protected isAuthenticated(ctx: OptionalAuthHttpContext): boolean {
    return ctx.isAuthenticated === true
  }

  /**
   * Vérifie si l'utilisateur a un accès premium
   */
  protected isPremium(ctx: OptionalAuthHttpContext): boolean {
    return ctx.isPremium === true
  }

  /**
   * Vérifie si l'utilisateur est admin
   */
  protected isAdmin(ctx: OptionalAuthHttpContext): boolean {
    return ctx.isAdmin === true
  }

  /**
   * Valide les paramètres de pagination avec des limites publiques
   */
  protected validatePaginationParams(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20)) // Limite plus basse pour l'API publique
    const offset = (page - 1) * limit

    return {
      page,
      limit,
      offset,
      sortBy: query.sortBy || 'publishedAt',
      sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
    }
  }

  /**
   * Crée une réponse paginée standardisée pour l'API publique
   */
  protected paginatedResponse<T>(
    ctx: HttpContext,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string,
    cacheOptions?: { ttl: number; key: string }
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
    }, message, 200, cacheOptions)
  }

  /**
   * Gère les erreurs de manière centralisée pour l'API publique
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
        case 'PREMIUM_REQUIRED':
          return this.premiumRequired(ctx, error.message)
        case 'RATE_LIMIT_EXCEEDED':
          return this.rateLimitExceeded(ctx, error.message)
        default:
          return this.internalError(ctx, error)
      }
    }

    // Erreurs génériques
    return this.internalError(ctx, error)
  }

  /**
   * Gère les erreurs internes du serveur (sans exposer d'informations sensibles)
   */
  protected internalError(
    ctx: HttpContext,
    error: Error,
    message: string = 'Une erreur interne s\'est produite'
  ) {
    // Log détaillé de l'erreur (côté serveur seulement)
    logger.error({
      error: error.message,
      stack: error.stack,
      url: ctx.request.url(),
      method: ctx.request.method(),
      ip: ctx.request.ip(),
    }, 'Internal server error in public controller')

    // Réponse générique pour l'utilisateur (sans détails sensibles)
    return this.error(ctx, message, 500, 'INTERNAL_ERROR')
  }

  /**
   * Log une action publique (anonymisée)
   */
  protected logPublicAction(
    ctx: HttpContext,
    action: string,
    resource: string,
    resourceId?: string,
    details?: any
  ) {
    logger.info('Public API action', {
      action,
      resource,
      resourceId,
      details,
      userId: this.getUserId(ctx as OptionalAuthHttpContext) || 'anonymous',
      isAuthenticated: this.isAuthenticated(ctx as OptionalAuthHttpContext),
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      url: ctx.request.url(),
      method: ctx.request.method(),
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Génère un ETag pour le cache
   */
  private generateETag(key: string): string {
    const hash = createHash('md5').update(key).digest('hex')
    return `"${hash}"`
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
      case 402:
        return 'PREMIUM_REQUIRED'
      case 403:
        return 'FORBIDDEN'
      case 404:
        return 'NOT_FOUND'
      case 422:
        return 'VALIDATION_ERROR'
      case 429:
        return 'RATE_LIMIT_EXCEEDED'
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
   * Vérifie si la requête provient d'un bot/crawler
   */
  protected isBot(ctx: HttpContext): boolean {
    const userAgent = ctx.request.header('user-agent') || ''
    const botPatterns = [
      'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
      'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot'
    ]
    
    return botPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern)
    )
  }

  /**
   * Ajoute des métadonnées SEO à la réponse
   */
  protected addSEOMetadata(ctx: HttpContext, metadata: {
    title?: string
    description?: string
    canonical?: string
    ogImage?: string
  }) {
    if (metadata.title) {
      ctx.response.header('X-SEO-Title', metadata.title)
    }
    if (metadata.description) {
      ctx.response.header('X-SEO-Description', metadata.description)
    }
    if (metadata.canonical) {
      ctx.response.header('X-SEO-Canonical', metadata.canonical)
    }
    if (metadata.ogImage) {
      ctx.response.header('X-SEO-OG-Image', metadata.ogImage)
    }
  }
}