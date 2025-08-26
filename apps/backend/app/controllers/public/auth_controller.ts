import type { HttpContext } from '@adonisjs/core/http'
import BasePublicController from './base_public_controller.js'
import { auth } from '../../lib/auth.js'
import vine from '@vinejs/vine'

/**
 * Schéma de validation pour l'envoi d'un magic link
 */
const sendMagicLinkSchema = vine.object({
  email: vine.string().email(),
  name: vine.string().optional(),
  callbackURL: vine.string().url().optional(),
  newUserCallbackURL: vine.string().url().optional(),
  errorCallbackURL: vine.string().url().optional(),
})

/**
 * Contrôleur d'authentification utilisant Better Auth
 * Gère l'authentification par magic link et les sessions utilisateur
 */
export default class AuthController extends BasePublicController {

  /**
   * Envoie un magic link à l'utilisateur
   * POST /api/public/auth/magic-link
   */
  async sendMagicLink({ request, response }: HttpContext) {
    try {
      // Validation des données d'entrée
      const payload = await vine.validate({
        schema: sendMagicLinkSchema,
        data: request.body(),
      })

      this.logPublicAction(
        { request, response } as HttpContext,
        'send_magic_link',
        'auth',
        payload.email,
        { 
          email: payload.email,
          hasName: !!payload.name 
        }
      )

      // URLs par défaut si non fournies
      const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
      const callbackURL = payload.callbackURL || `${baseUrl}/dashboard`
      const newUserCallbackURL = payload.newUserCallbackURL || `${baseUrl}/welcome`
      const errorCallbackURL = payload.errorCallbackURL || `${baseUrl}/auth/error`

      // Convertir les headers AdonisJS en format Headers pour Better Auth
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

      // Envoyer le magic link via Better Auth
      await auth.api.signInMagicLink({
        body: {
          email: payload.email,
          name: payload.name,
          callbackURL,
          newUserCallbackURL,
          errorCallbackURL,
        },
        headers,
      })

      return this.success(
        { request, response } as HttpContext,
        {
          message: 'Magic link envoyé avec succès',
          email: payload.email,
        },
        'Magic link envoyé à votre adresse email',
        200
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Vérifie un magic link
   * GET /api/public/auth/verify
   */
  async verifyMagicLink({ request, response }: HttpContext) {
    try {
      const token = request.input('token')
      const callbackURL = request.input('callbackURL')

      if (!token) {
        return this.validationError(
          { request, response } as HttpContext,
          { token: ['Token de vérification requis'] }
        )
      }

      this.logPublicAction(
        { request, response } as HttpContext,
        'verify_magic_link',
        'auth',
        token.substring(0, 8) + '...' // Log partiel du token pour sécurité
      )

      // Convertir les headers AdonisJS en format Headers pour Better Auth
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

      // Vérifier le magic link via Better Auth
      const result = await auth.api.magicLinkVerify({
        query: {
          token,
          callbackURL,
        },
        headers,
      })

      if (callbackURL) {
        // Rediriger vers l'URL de callback
        return response.redirect(callbackURL)
      }

      return this.success(
        { request, response } as HttpContext,
        {
          verified: true,
          user: result.user,
          token: result.token,
        },
        'Magic link vérifié avec succès'
      )

    } catch (error) {
      const errorCallbackURL = request.input('errorCallbackURL')
      if (errorCallbackURL) {
        return response.redirect(`${errorCallbackURL}?error=verification_failed`)
      }
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Récupère la session utilisateur actuelle
   * GET /api/public/auth/session
   */
  async getSession({ request, response }: HttpContext) {
    try {
      this.logPublicAction(
        { request, response } as HttpContext,
        'get_session',
        'auth'
      )

      // Convertir les headers AdonisJS en format Headers pour Better Auth
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

      // Récupérer la session via Better Auth
      const session = await auth.api.getSession({
        headers,
      })

      if (!session) {
        return this.success(
          { request, response } as HttpContext,
          {
            authenticated: false,
            user: null,
            session: null,
          },
          'Aucune session active'
        )
      }

      return this.success(
        { request, response } as HttpContext,
        {
          authenticated: true,
          user: session.user,
          session: {
            id: session.session.id,
            userId: session.session.userId,
            expiresAt: session.session.expiresAt,
            createdAt: session.session.createdAt,
            updatedAt: session.session.updatedAt,
          },
        },
        'Session récupérée avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Déconnecte l'utilisateur
   * POST /api/public/auth/logout
   */
  async logout({ request, response }: HttpContext) {
    try {
      this.logPublicAction(
        { request, response } as HttpContext,
        'logout',
        'auth'
      )

      // Convertir les headers AdonisJS en format Headers pour Better Auth
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

      // Déconnecter via Better Auth
      await auth.api.signOut({
        headers,
      })

      return this.success(
        { request, response } as HttpContext,
        {
          loggedOut: true,
        },
        'Déconnexion réussie'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Récupère les informations de l'utilisateur connecté
   * GET /api/public/auth/me
   */
  async me({ request, response }: HttpContext) {
    try {
      this.logPublicAction(
        { request, response } as HttpContext,
        'get_user_info',
        'auth'
      )

      // Convertir les headers AdonisJS en format Headers pour Better Auth
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

      // Récupérer la session via Better Auth
      const session = await auth.api.getSession({
        headers,
      })

      if (!session?.user) {
        return this.error(
          { request, response } as HttpContext,
          'Utilisateur non authentifié',
          401
        )
      }

      // Données publiques de l'utilisateur
      const userData = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role || 'user',
        emailVerified: session.user.emailVerified,
        image: session.user.image,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
      }

      return this.success(
        { request, response } as HttpContext,
        userData,
        'Informations utilisateur récupérées avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Endpoint de santé pour l'authentification
   * GET /api/public/auth/health
   */
  async health({ request, response }: HttpContext) {
    try {
      return this.success(
        { request, response } as HttpContext,
        {
          status: 'ok',
          service: 'Better Auth',
          timestamp: new Date().toISOString(),
          features: {
            magicLink: true,
            emailPassword: true,
            sessions: true,
          },
        },
        'Service d\'authentification opérationnel'
      )
    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }
}