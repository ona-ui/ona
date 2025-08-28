import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'
import { auth } from '../lib/auth.js'
import { UserService } from '../services/user_service.js'

export default class BetterAuthMiddleware {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    // Si c'est une route d'authentification, traiter avec Better Auth
    if (request.url().startsWith('/api/auth')) {
      try {

        // 🔧 FIX: Créer un objet Request standard comme dans la doc Better Auth
        const pathname = request.url()
        const queryParams = request.qs()
        
        // Construire l'URL complète avec query parameters
        const queryString = new URLSearchParams(queryParams).toString()
        const fullUrl = queryString ? `${pathname}?${queryString}` : pathname
        const baseUrl = `${request.protocol()}://${request.header('host')}`
        const completeUrl = new URL(fullUrl, baseUrl)
        
        // Convertir les headers AdonisJS en Headers standard
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

        // Récupérer le body pour les requêtes POST/PUT
        let body: string | undefined = undefined
        if (['POST', 'PUT', 'PATCH'].includes(request.method())) {
          try {
            // 🔧 FIX: Parser le body directement depuis le stream pour Better Auth
            const getRawBody = await import('raw-body')
            const bodyBuffer = await getRawBody.default(request.request, {
              length: request.header('content-length'),
              limit: '1mb',
              encoding: 'utf8'
            })
            
            if (bodyBuffer) {
              body = bodyBuffer.toString()
              console.log('🔧 [BODY FIX] Body récupéré:', body);
            }
          } catch (error) {
            // Fallback: essayer de lire depuis request.body() si disponible
            try {
              const fallbackBody = request.body()
              if (fallbackBody && Object.keys(fallbackBody).length > 0) {
                body = JSON.stringify(fallbackBody)
                console.log('🔧 [BODY FALLBACK] Body récupéré via fallback:', body);
              }
            } catch (fallbackError) {
              console.log('⚠️ [BETTER AUTH MIDDLEWARE] Fallback échoué aussi:', fallbackError)
            }
          }
        }

        // Créer un objet Request standard comme dans la doc Better Auth
        const webRequest = new Request(completeUrl.toString(), {
          method: request.method(),
          headers,
          body
        })

  
        // Appeler Better Auth avec l'objet Request standard
        const authResponse = await auth.handler(webRequest)

        // Transférer la réponse Better Auth vers AdonisJS
        response.status(authResponse.status)

        // Copier les headers de la réponse
        authResponse.headers.forEach((value: string, key: string) => {
          response.header(key, value)
        })
        
        // Envoyer le body de la réponse
        const responseBody = await authResponse.text()
        if (responseBody) {
          response.send(responseBody)
        } else {
          response.send('')
        }
        return
        
      } catch (error) {
        logger.error(error, 'Error in Better Auth middleware')
        
        return response.status(500).send({
          error: 'Error processing Better Auth request',
          message: error.message,
          type: error.constructor.name,
          stack: error.stack
        })
      }
    }

    // Pour les autres routes, ajouter les informations utilisateur au contexte si disponibles
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

      const session = await auth.api.getSession({
        headers
      })

      if (session?.user) {
        // Récupérer les informations complètes de l'utilisateur
        const fullUser = await this.userService.getUserById(session.user.id)
        
        // Récupérer les informations d'abonnement
        const subscriptionInfo = await this.userService.getUserSubscriptionInfo(session.user.id)
        
        // Récupérer les permissions
        const permissions = await this.userService.getUserPermissions(session.user.id)
        
        // Ajouter toutes les informations au contexte (comme OptionalAuthMiddleware)
        ;(ctx as any).user = fullUser
        ;(ctx as any).authSession = session
        ;(ctx as any).subscriptionInfo = subscriptionInfo
        ;(ctx as any).permissions = permissions
        ;(ctx as any).isAuthenticated = true
        ;(ctx as any).isPremium = permissions.canAccessPremium || subscriptionInfo.hasActiveSubscription
        ;(ctx as any).isAdmin = fullUser.role === 'admin' || fullUser.role === 'super_admin'
        ;(ctx as any).isSuperAdmin = fullUser.role === 'super_admin'
        
        // Mettre à jour la dernière connexion
        await this.userService.updateLastLogin(session.user.id)
      } else {
        // Ajouter des valeurs par défaut si pas d'utilisateur
        ;(ctx as any).user = null
        ;(ctx as any).authSession = null
        ;(ctx as any).subscriptionInfo = null
        ;(ctx as any).permissions = null
        ;(ctx as any).isAuthenticated = false
        ;(ctx as any).isPremium = false
        ;(ctx as any).isAdmin = false
        ;(ctx as any).isSuperAdmin = false
      }
    } catch (error) {
      // Log l'erreur mais ne pas bloquer la requête
      logger.debug('Could not retrieve user session', error)
    }

    return next()
  }

} 