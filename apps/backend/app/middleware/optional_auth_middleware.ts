import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'
import { auth } from '../lib/auth.js'
import { UserService } from '../services/user_service.js'

/**
 * Middleware d'authentification optionnelle
 * Ajoute les informations utilisateur au contexte si disponibles, 
 * mais n'interrompt pas la requête si l'utilisateur n'est pas connecté
 */
export default class OptionalAuthMiddleware {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const { request } = ctx

    console.log('🔍 [OPTIONAL AUTH] Middleware appelé pour:', request.url())

    try {
      // Convertir les headers AdonisJS en format Headers pour better-auth
      const headers = new Headers()
      const requestHeaders = request.headers()
      
      Object.entries(requestHeaders).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v))
          } else {
            headers.set(key, value)
          }
        }
      })

      // 🔧 DEBUG: Afficher les cookies pour diagnostiquer
      console.log('🔍 [OPTIONAL AUTH] Headers cookie:', headers.get('cookie'))
      console.log('🔍 [OPTIONAL AUTH] Headers authorization:', headers.get('authorization'))

      // Tenter de récupérer la session
      const session = await auth.api.getSession({
        headers
      })

      console.log('🔍 [OPTIONAL AUTH] Session récupérée:', session ? 'OUI' : 'NON')

      if (session?.user) {
        console.log('✅ [OPTIONAL AUTH] Session utilisateur trouvée:', session.user.id)
        try {
          // Récupérer les informations complètes de l'utilisateur
          const fullUser = await this.userService.getUserById(session.user.id)
          console.log('✅ [OPTIONAL AUTH] Utilisateur récupéré:', fullUser.id, fullUser.role)
          
          // Récupérer les informations d'abonnement
          const subscriptionInfo = await this.userService.getUserSubscriptionInfo(session.user.id)
          console.log('✅ [OPTIONAL AUTH] Subscription info:', subscriptionInfo)
          
          // Récupérer les permissions
          const permissions = await this.userService.getUserPermissions(session.user.id)
          console.log('✅ [OPTIONAL AUTH] Permissions:', permissions)

          // Ajouter toutes les informations au contexte
          ;(ctx as any).user = fullUser
          ;(ctx as any).authSession = session
          ;(ctx as any).subscriptionInfo = subscriptionInfo
          ;(ctx as any).permissions = permissions
          ;(ctx as any).isAuthenticated = true
          ;(ctx as any).isPremium = permissions.canAccessPremium || subscriptionInfo.hasActiveSubscription
          ;(ctx as any).isAdmin = fullUser.role === 'admin' || fullUser.role === 'super_admin'
          ;(ctx as any).isSuperAdmin = fullUser.role === 'super_admin'

          console.log('✅ [OPTIONAL AUTH] Contexte enrichi - isPremium:', (ctx as any).isPremium)

          // Mettre à jour la dernière connexion (de manière asynchrone pour ne pas ralentir)
          this.userService.updateLastLogin(session.user.id).catch(error => {
            logger.debug('Failed to update last login', { userId: session.user.id, error: error.message })
          })

          logger.debug('Optional auth - user authenticated', {
            userId: fullUser.id,
            userRole: fullUser.role,
            tier: subscriptionInfo.tier,
            url: request.url()
          })

        } catch (userError) {
          // Si on ne peut pas récupérer les infos utilisateur, on log mais on continue
          logger.warn('Optional auth - failed to get user details', {
            userId: session.user.id,
            error: userError.message,
            url: request.url()
          })

          // Ajouter au moins les informations de base
          ;(ctx as any).user = session.user
          ;(ctx as any).authSession = session
          ;(ctx as any).isAuthenticated = true
        }
      } else {
        console.log('❌ [OPTIONAL AUTH] Aucune session utilisateur trouvée')
        // Aucune session trouvée - ajouter des valeurs par défaut
        ;(ctx as any).user = null
        ;(ctx as any).authSession = null
        ;(ctx as any).subscriptionInfo = null
        ;(ctx as any).permissions = null
        ;(ctx as any).isAuthenticated = false
        ;(ctx as any).isPremium = false
        ;(ctx as any).isAdmin = false
        ;(ctx as any).isSuperAdmin = false

        logger.debug('Optional auth - no user session', {
          url: request.url(),
          ip: request.ip()
        })
      }

    } catch (error) {
      // En cas d'erreur, on log mais on continue avec des valeurs par défaut
      console.log('❌ [OPTIONAL AUTH] Erreur lors de la récupération de session:', error.message)
      logger.debug('Optional auth - error retrieving session', {
        error: error.message,
        url: request.url(),
        ip: request.ip()
      })

      // Ajouter des valeurs par défaut
      ;(ctx as any).user = null
      ;(ctx as any).authSession = null
      ;(ctx as any).subscriptionInfo = null
      ;(ctx as any).permissions = null
      ;(ctx as any).isAuthenticated = false
      ;(ctx as any).isPremium = false
      ;(ctx as any).isAdmin = false
      ;(ctx as any).isSuperAdmin = false
    }

    return next()
  }

  /**
   * Middleware statique pour une utilisation facile
   */
  static handle() {
    return async (ctx: HttpContext, next: NextFn) => {
      const middleware = new OptionalAuthMiddleware()
      return middleware.handle(ctx, next)
    }
  }

  /**
   * Middleware qui enrichit le contexte avec des informations personnalisées
   * basées sur l'état d'authentification
   */
  static withPersonalization() {
    return async (ctx: HttpContext, next: NextFn) => {
      const middleware = new OptionalAuthMiddleware()
      await middleware.handle(ctx, next)

      // Ajouter des informations de personnalisation
      const user = (ctx as any).user
      const subscriptionInfo = (ctx as any).subscriptionInfo

      if (user) {
        // Informations de personnalisation pour utilisateur connecté
        ;(ctx as any).personalization = {
          preferredFramework: user.preferredFramework || 'react',
          preferredCss: user.preferredCss || 'tailwind_v3',
          darkModeDefault: user.darkModeDefault || false,
          showPremiumFeatures: subscriptionInfo?.hasActiveSubscription || false,
          maxApiCalls: subscriptionInfo ? middleware.getMaxApiCalls(subscriptionInfo.tier) : 100,
          canAccessPremium: subscriptionInfo?.hasActiveSubscription || false
        }
      } else {
        // Informations par défaut pour utilisateur non connecté
        ;(ctx as any).personalization = {
          preferredFramework: 'react',
          preferredCss: 'tailwind_v3',
          darkModeDefault: false,
          showPremiumFeatures: false,
          maxApiCalls: 10, // Limite très basse pour les non-connectés
          canAccessPremium: false
        }
      }

      return next()
    }
  }

  /**
   * Middleware qui ajoute des informations de limitation de taux
   */
  static withRateLimit() {
    return async (ctx: HttpContext, next: NextFn) => {
      const middleware = new OptionalAuthMiddleware()
      await middleware.handle(ctx, next)

      const user = (ctx as any).user
      const subscriptionInfo = (ctx as any).subscriptionInfo

      // Définir les limites selon le statut de l'utilisateur
      let rateLimits = {
        requestsPerHour: 100,
        requestsPerDay: 1000,
        downloadPerDay: 10,
        apiCallsPerHour: 50
      }

      if (user && subscriptionInfo?.hasActiveSubscription) {
        // Limites premium
        rateLimits = {
          requestsPerHour: 1000,
          requestsPerDay: 10000,
          downloadPerDay: 1000,
          apiCallsPerHour: middleware.getMaxApiCalls(subscriptionInfo.tier)
        }
      } else if (user) {
        // Limites utilisateur connecté gratuit
        rateLimits = {
          requestsPerHour: 200,
          requestsPerDay: 2000,
          downloadPerDay: 50,
          apiCallsPerHour: 100
        }
      }
      // Sinon, garder les limites par défaut (non connecté)

      ;(ctx as any).rateLimits = rateLimits

      return next()
    }
  }

  /**
   * Détermine le nombre maximum d'appels API selon le tier
   */
  private getMaxApiCalls(tier: string): number {
    const limits = {
      free: 100,
      pro: 1000,
      team: 5000,
      enterprise: 50000,
    }

    return limits[tier as keyof typeof limits] || limits.free
  }
}