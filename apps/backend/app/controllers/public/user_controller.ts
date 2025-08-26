import type { HttpContext } from '@adonisjs/core/http'
import BasePublicController from './base_public_controller.js'
import { auth } from '../../lib/auth.js'
import { userService } from '../../services/index.js'
import { licenseService } from '../../services/license_service.js'
import type { licenses } from '../../db/schema.js'

// Types pour les licences
type License = typeof licenses.$inferSelect

/**
 * Contrôleur utilisateur pour le dashboard
 * Gère les données utilisateur et les informations de licence
 */
export default class UserController extends BasePublicController {

  /**
   * Récupère les informations complètes de l'utilisateur connecté pour le dashboard
   * GET /api/public/user/dashboard
   */
  async getDashboardData({ request, response }: HttpContext) {
    try {
      this.logPublicAction(
        { request, response } as HttpContext,
        'get_dashboard_data',
        'user'
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

      const userId = session.user.id

      // Récupérer les informations utilisateur détaillées
      const user = await userService.getUserById(userId)
      
      // Récupérer les licences actives de l'utilisateur
      const activeLicenses = await licenseService.getUserActiveLicenses(userId)
      
      // Récupérer la licence la plus élevée
      const highestLicense = await licenseService.getUserHighestLicense(userId)
      
      // Récupérer les permissions utilisateur
      const permissions = await userService.getUserPermissions(userId)
      
      // Récupérer les informations d'abonnement
      const subscriptionInfo = await userService.getUserSubscriptionInfo(userId)

      // Préparer les données de réponse
      const dashboardData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          emailVerified: user.emailVerified,
          image: user.image,
          bio: user.bio,
          website: user.website,
          company: user.company,
          location: user.location,
          twitterHandle: user.twitterHandle,
          githubUsername: user.githubUsername,
          preferredFramework: user.preferredFramework,
          preferredCss: user.preferredCss,
          darkModeDefault: user.darkModeDefault,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        licenses: {
          active: activeLicenses.map((license: License) => ({
            id: license.id,
            licenseKey: license.licenseKey,
            tier: license.tier,
            isActive: license.isActive,
            isLifetime: license.isLifetime,
            seatsAllowed: license.seatsAllowed,
            seatsUsed: license.seatsUsed,
            validFrom: license.validFrom,
            validUntil: license.validUntil,
            paymentStatus: license.paymentStatus,
            amountPaid: license.amountPaid,
            currency: license.currency,
            createdAt: license.createdAt,
          })),
          highest: highestLicense ? {
            id: highestLicense.id,
            licenseKey: highestLicense.licenseKey,
            tier: highestLicense.tier,
            isActive: highestLicense.isActive,
            isLifetime: highestLicense.isLifetime,
            seatsAllowed: highestLicense.seatsAllowed,
            seatsUsed: highestLicense.seatsUsed,
            validFrom: highestLicense.validFrom,
            validUntil: highestLicense.validUntil,
            paymentStatus: highestLicense.paymentStatus,
            amountPaid: highestLicense.amountPaid,
            currency: highestLicense.currency,
            createdAt: highestLicense.createdAt,
          } : null,
          count: activeLicenses.length,
        },
        permissions: {
          canAccessPremium: permissions.canAccessPremium,
          canManageUsers: permissions.canManageUsers,
          canManageComponents: permissions.canManageComponents,
          canManageCategories: permissions.canManageCategories,
          maxApiCalls: permissions.maxApiCalls,
          teamSeats: permissions.teamSeats,
        },
        subscription: {
          hasActiveSubscription: subscriptionInfo.hasActiveSubscription,
          tier: subscriptionInfo.tier,
          expiresAt: subscriptionInfo.expiresAt,
          teamSeats: subscriptionInfo.teamSeats,
          usedSeats: subscriptionInfo.usedSeats,
        },
        stats: {
          totalLicenses: activeLicenses.length,
          isPremium: permissions.canAccessPremium,
          isAdmin: permissions.canManageUsers,
          accountAge: user.createdAt ? Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0, // en jours
        }
      }

      return this.success(
        { request, response } as HttpContext,
        dashboardData,
        'Données du dashboard récupérées avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Récupère uniquement les informations de profil utilisateur
   * GET /api/public/user/profile
   */
  async getProfile({ request, response }: HttpContext) {
    try {
      this.logPublicAction(
        { request, response } as HttpContext,
        'get_profile',
        'user'
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

      const userId = session.user.id
      const user = await userService.getUserById(userId)

      const profileData = {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
        image: user.image,
        bio: user.bio,
        website: user.website,
        company: user.company,
        location: user.location,
        twitterHandle: user.twitterHandle,
        githubUsername: user.githubUsername,
        preferredFramework: user.preferredFramework,
        preferredCss: user.preferredCss,
        darkModeDefault: user.darkModeDefault,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }

      return this.success(
        { request, response } as HttpContext,
        profileData,
        'Profil utilisateur récupéré avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Récupère uniquement les informations de licence de l'utilisateur
   * GET /api/public/user/licenses
   */
  async getLicenses({ request, response }: HttpContext) {
    try {
      this.logPublicAction(
        { request, response } as HttpContext,
        'get_licenses',
        'user'
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

      const userId = session.user.id

      // Récupérer les licences actives de l'utilisateur
      const activeLicenses = await licenseService.getUserActiveLicenses(userId)
      
      // Récupérer la licence la plus élevée
      const highestLicense = await licenseService.getUserHighestLicense(userId)

      const licensesData = {
        active: activeLicenses.map((license: License) => ({
          id: license.id,
          licenseKey: license.licenseKey,
          tier: license.tier,
          isActive: license.isActive,
          isLifetime: license.isLifetime,
          seatsAllowed: license.seatsAllowed,
          seatsUsed: license.seatsUsed,
          validFrom: license.validFrom,
          validUntil: license.validUntil,
          paymentStatus: license.paymentStatus,
          amountPaid: license.amountPaid,
          currency: license.currency,
          isEarlyBird: license.isEarlyBird,
          discountPercentage: license.discountPercentage,
          discountCode: license.discountCode,
          createdAt: license.createdAt,
        })),
        highest: highestLicense ? {
          id: highestLicense.id,
          licenseKey: highestLicense.licenseKey,
          tier: highestLicense.tier,
          isActive: highestLicense.isActive,
          isLifetime: highestLicense.isLifetime,
          seatsAllowed: highestLicense.seatsAllowed,
          seatsUsed: highestLicense.seatsUsed,
          validFrom: highestLicense.validFrom,
          validUntil: highestLicense.validUntil,
          paymentStatus: highestLicense.paymentStatus,
          amountPaid: highestLicense.amountPaid,
          currency: highestLicense.currency,
          isEarlyBird: highestLicense.isEarlyBird,
          discountPercentage: highestLicense.discountPercentage,
          discountCode: highestLicense.discountCode,
          createdAt: highestLicense.createdAt,
        } : null,
        count: activeLicenses.length,
        summary: {
          totalActive: activeLicenses.length,
          currentTier: highestLicense?.tier || 'free',
          isPremium: activeLicenses.length > 0,
          totalSeats: activeLicenses.reduce((sum: number, license: License) => sum + (license.seatsAllowed || 0), 0),
          usedSeats: activeLicenses.reduce((sum: number, license: License) => sum + (license.seatsUsed || 0), 0),
        }
      }

      return this.success(
        { request, response } as HttpContext,
        licensesData,
        'Licences utilisateur récupérées avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Récupère les statistiques utilisateur
   * GET /api/public/user/stats
   */
  async getStats({ request, response }: HttpContext) {
    try {
      this.logPublicAction(
        { request, response } as HttpContext,
        'get_stats',
        'user'
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

      const userId = session.user.id
      const user = await userService.getUserById(userId)
      const activeLicenses = await licenseService.getUserActiveLicenses(userId)
      const permissions = await userService.getUserPermissions(userId)

      const statsData = {
        account: {
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          accountAge: user.createdAt ? Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0, // en jours
          emailVerified: user.emailVerified,
        },
        licenses: {
          total: activeLicenses.length,
          currentTier: activeLicenses.length > 0 ? activeLicenses[0].tier : 'free',
          isPremium: permissions.canAccessPremium,
          totalSpent: activeLicenses.reduce((sum: number, license: License) => sum + (license.amountPaid || 0), 0),
          currency: activeLicenses.length > 0 ? activeLicenses[0].currency : 'EUR',
        },
        permissions: {
          canAccessPremium: permissions.canAccessPremium,
          canManageUsers: permissions.canManageUsers,
          canManageComponents: permissions.canManageComponents,
          canManageCategories: permissions.canManageCategories,
          maxApiCalls: permissions.maxApiCalls,
          teamSeats: permissions.teamSeats,
        },
        usage: {
          // Ces statistiques pourraient être étendues avec des données réelles d'usage
          apiCallsThisMonth: 0, // À implémenter avec de vraies données
          componentsDownloaded: 0, // À implémenter avec de vraies données
          favoriteComponents: 0, // À implémenter avec de vraies données
        }
      }

      return this.success(
        { request, response } as HttpContext,
        statsData,
        'Statistiques utilisateur récupérées avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Récupère uniquement les permissions de l'utilisateur connecté
   * GET /api/user/permissions
   */
  async getPermissions({ request, response }: HttpContext) {
    try {
      this.logPublicAction(
        { request, response } as HttpContext,
        'get_permissions',
        'user'
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

      const userId = session.user.id
      const permissions = await userService.getUserPermissions(userId)

      const permissionsData = {
        canAccessPremium: permissions.canAccessPremium,
        canManageUsers: permissions.canManageUsers,
        canManageComponents: permissions.canManageComponents,
        canManageCategories: permissions.canManageCategories,
        maxApiCalls: permissions.maxApiCalls,
        teamSeats: permissions.teamSeats,
      }

      return this.success(
        { request, response } as HttpContext,
        permissionsData,
        'Permissions utilisateur récupérées avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Récupère uniquement les informations d'abonnement de l'utilisateur connecté
   * GET /api/user/subscription
   */
  async getSubscription({ request, response }: HttpContext) {
    try {
      this.logPublicAction(
        { request, response } as HttpContext,
        'get_subscription',
        'user'
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

      const userId = session.user.id
      const subscriptionInfo = await userService.getUserSubscriptionInfo(userId)

      const subscriptionData = {
        hasActiveSubscription: subscriptionInfo.hasActiveSubscription,
        tier: subscriptionInfo.tier,
        expiresAt: subscriptionInfo.expiresAt,
        teamSeats: subscriptionInfo.teamSeats,
        usedSeats: subscriptionInfo.usedSeats,
      }

      return this.success(
        { request, response } as HttpContext,
        subscriptionData,
        'Informations d\'abonnement récupérées avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }
}