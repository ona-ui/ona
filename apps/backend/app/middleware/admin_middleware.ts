import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'

/**
 * Middleware d'autorisation admin
 * Vérifie que l'utilisateur est connecté et a les permissions admin
 */
export default class AdminMiddleware {
  constructor() {}

  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    try {
      // Vérifier si l'utilisateur est présent dans le contexte
      const user = (ctx as any).user
      
      if (!user) {
        logger.warn('Admin access attempt without authentication', {
          ip: request.ip(),
          userAgent: request.header('user-agent'),
          url: request.url(),
          method: request.method()
        })

        return response.unauthorized({
          error: 'Authentication required',
          message: 'Vous devez être connecté pour accéder à cette ressource'
        })
      }

      // Vérifier le rôle admin
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        logger.warn('Admin access attempt by non-admin user', {
          userId: user.id,
          userRole: user.role,
          ip: request.ip(),
          userAgent: request.header('user-agent'),
          url: request.url(),
          method: request.method()
        })

        return response.forbidden({
          error: 'Insufficient permissions',
          message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource'
        })
      }

      // Vérifier que le compte n'est pas désactivé
      if (user.deletedAt) {
        logger.warn('Admin access attempt by deleted user', {
          userId: user.id,
          deletedAt: user.deletedAt,
          ip: request.ip()
        })

        return response.forbidden({
          error: 'Account disabled',
          message: 'Votre compte a été désactivé'
        })
      }

      // Log de l'accès admin réussi
      logger.info('Admin access granted', {
        userId: user.id,
        userRole: user.role,
        url: request.url(),
        method: request.method(),
        ip: request.ip()
      })

      // Ajouter des informations admin au contexte
      ;(ctx as any).isAdmin = true
      ;(ctx as any).isSuperAdmin = user.role === 'super_admin'

      return next()

    } catch (error) {
      logger.error({
        error: error.message,
        stack: error.stack,
        url: request.url(),
        method: request.method(),
        ip: request.ip()
      }, 'Error in admin middleware')

      return response.status(500).send({
        error: 'Internal server error',
        message: 'Une erreur interne s\'est produite'
      })
    }
  }

  /**
   * Middleware spécifique pour les super admins uniquement
   */
  static superAdminOnly() {
    return async (ctx: HttpContext, next: NextFn) => {
      const user = (ctx as any).user

      if (!user) {
        return ctx.response.unauthorized({
          error: 'Authentication required',
          message: 'Vous devez être connecté pour accéder à cette ressource'
        })
      }

      if (user.role !== 'super_admin') {
        logger.warn('Super admin access attempt by non-super-admin', {
          userId: user.id,
          userRole: user.role,
          ip: ctx.request.ip(),
          url: ctx.request.url()
        })

        return ctx.response.forbidden({
          error: 'Super admin required',
          message: 'Seuls les super administrateurs peuvent accéder à cette ressource'
        })
      }

      ;(ctx as any).isSuperAdmin = true
      return next()
    }
  }
}