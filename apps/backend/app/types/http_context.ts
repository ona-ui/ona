import type { HttpContext as BaseHttpContext } from '@adonisjs/core/http'
import type { UserPermissions, UserSubscriptionInfo } from '../services/user_service.js'
import type { Permission } from '../middleware/permissions_middleware.js'

/**
 * Extension du contexte HTTP d'AdonisJS avec les informations d'authentification
 * et d'autorisation spécifiques à Ona UI
 */
declare module '@adonisjs/core/http' {
  interface HttpContext {
    // Informations utilisateur
    user?: {
      id: string
      email: string
      name?: string
      username?: string
      fullName?: string
      image?: string
      avatarUrl?: string
      role: 'user' | 'admin' | 'super_admin'
      emailVerified: boolean
      emailVerifiedAt?: Date
      bio?: string
      website?: string
      company?: string
      location?: string
      twitterHandle?: string
      githubUsername?: string
      preferredFramework?: string
      preferredCss?: string
      darkModeDefault?: boolean
      lastLoginAt?: Date
      createdAt: Date
      updatedAt: Date
      deletedAt?: Date
    }

    // Session Better Auth (utilise un nom différent pour éviter les conflits)
    authSession?: {
      id: string
      userId: string
      expiresAt: Date
      token: string
      ipAddress?: string
      userAgent?: string
      createdAt: Date
      updatedAt: Date
    }

    // Informations d'abonnement
    subscriptionInfo?: UserSubscriptionInfo

    // Permissions utilisateur
    permissions?: UserPermissions

    // Flags d'authentification et d'autorisation
    isAuthenticated?: boolean
    isPremium?: boolean
    isAdmin?: boolean
    isSuperAdmin?: boolean
    isPreviewAccess?: boolean

    // Informations de permission spécifique accordée
    grantedPermission?: Permission
    userPermissions?: Permission[]

    // Informations premium
    premiumTier?: string

    // Informations de personnalisation
    personalization?: {
      preferredFramework: string
      preferredCss: string
      darkModeDefault: boolean
      showPremiumFeatures: boolean
      maxApiCalls: number
      canAccessPremium: boolean
    }

    // Limites de taux
    rateLimits?: {
      requestsPerHour: number
      requestsPerDay: number
      downloadPerDay: number
      apiCallsPerHour: number
    }

    // Informations de licence (pour les middlewares premium)
    license?: {
      id: string
      userId: string
      licenseKey: string
      tier: string
      seatsAllowed: number
      seatsUsed: number
      validFrom: Date
      validUntil?: Date
      isLifetime: boolean
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }
  }
}

/**
 * Type helper pour les contextes authentifiés
 */
export interface AuthenticatedHttpContext extends BaseHttpContext {
  user: NonNullable<BaseHttpContext['user']>
  authSession: NonNullable<BaseHttpContext['authSession']>
  subscriptionInfo: NonNullable<BaseHttpContext['subscriptionInfo']>
  permissions: NonNullable<BaseHttpContext['permissions']>
  isAuthenticated: true
}

/**
 * Type helper pour les contextes admin
 */
export interface AdminHttpContext extends AuthenticatedHttpContext {
  isAdmin: true
  user: AuthenticatedHttpContext['user'] & {
    role: 'admin' | 'super_admin'
  }
}

/**
 * Type helper pour les contextes super admin
 */
export interface SuperAdminHttpContext extends AdminHttpContext {
  isSuperAdmin: true
  user: AdminHttpContext['user'] & {
    role: 'super_admin'
  }
}

/**
 * Type helper pour les contextes premium
 */
export interface PremiumHttpContext extends AuthenticatedHttpContext {
  isPremium: true
  premiumTier: string
  subscriptionInfo: AuthenticatedHttpContext['subscriptionInfo'] & {
    hasActiveSubscription: true
  }
}

/**
 * Type helper pour les contextes avec permissions spécifiques
 */
export interface PermissionHttpContext extends AuthenticatedHttpContext {
  grantedPermission: Permission
  userPermissions: Permission[]
}

/**
 * Utilitaires de type guards pour vérifier le contexte
 */
export function isAuthenticatedContext(ctx: BaseHttpContext): ctx is AuthenticatedHttpContext {
  return !!(ctx as any).isAuthenticated && !!(ctx as any).user
}

export function isAdminContext(ctx: BaseHttpContext): ctx is AdminHttpContext {
  return isAuthenticatedContext(ctx) && !!(ctx as any).isAdmin
}

export function isSuperAdminContext(ctx: BaseHttpContext): ctx is SuperAdminHttpContext {
  return isAdminContext(ctx) && !!(ctx as any).isSuperAdmin
}

export function isPremiumContext(ctx: BaseHttpContext): ctx is PremiumHttpContext {
  return isAuthenticatedContext(ctx) && !!(ctx as any).isPremium
}

export function hasPermission(ctx: BaseHttpContext, permission: Permission): ctx is PermissionHttpContext {
  const userPermissions = (ctx as any).userPermissions as Permission[] | undefined
  return isAuthenticatedContext(ctx) && !!userPermissions?.includes(permission)
}

/**
 * Utilitaire pour extraire les informations utilisateur du contexte de manière sûre
 */
export function getUserFromContext(ctx: BaseHttpContext) {
  return (ctx as any).user || null
}

export function getSubscriptionFromContext(ctx: BaseHttpContext) {
  return (ctx as any).subscriptionInfo || null
}

export function getPermissionsFromContext(ctx: BaseHttpContext) {
  return (ctx as any).permissions || null
}

export function getPersonalizationFromContext(ctx: BaseHttpContext) {
  return (ctx as any).personalization || null
}

export function getRateLimitsFromContext(ctx: BaseHttpContext) {
  return (ctx as any).rateLimits || null
}