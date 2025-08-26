'use client'

import { useEffect, useState, useRef } from 'react'
import { authClient, getAuthSession } from '@/lib/auth-client'

// Cache global pour éviter les requêtes en double
let globalAuthState: AuthState | null = null
let globalAuthPromise: Promise<AuthState> | null = null
let authListeners: Set<(state: AuthState) => void> = new Set()

// Fonction pour notifier tous les listeners
const notifyListeners = (state: AuthState) => {
  globalAuthState = state
  authListeners.forEach(listener => listener(state))
}

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  role?: string
  emailVerified?: boolean
}

export interface UserPermissions {
  canAccessPremium: boolean
  canManageUsers: boolean
  canManageComponents: boolean
  canManageCategories: boolean
  maxApiCalls: number
  teamSeats: number
}

export interface UserSubscriptionInfo {
  hasActiveSubscription: boolean
  tier: 'free' | 'pro' | 'team' | 'enterprise'
  expiresAt?: string
  teamSeats?: number
  usedSeats?: number
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  permissions: UserPermissions | null
  subscription: UserSubscriptionInfo | null
  isPremium: boolean
  refreshAuth?: () => void
}

// Fonction centralisée pour récupérer les données d'authentification
const fetchAuthData = async (): Promise<AuthState> => {
  try {
    // Récupérer la session avec better-auth
    const sessionResponse = await getAuthSession()
    
    // Better-auth retourne { data: { user, session }, error }
    const session = sessionResponse?.data || sessionResponse
    
    
    if (session?.user) {
      // Récupérer les informations détaillées de l'utilisateur
      const [permissionsRes, subscriptionRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"}/api/user/permissions`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"}/api/user/subscription`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(() => null)
      ])

      let permissions: UserPermissions | null = null
      let subscription: UserSubscriptionInfo | null = null

      if (permissionsRes?.ok) {
        const permissionsData = await permissionsRes.json()
        permissions = permissionsData.data || permissionsData
      }

      if (subscriptionRes?.ok) {
        const subscriptionData = await subscriptionRes.json()
        subscription = subscriptionData.data || subscriptionData
      }

      // Fallback si les APIs ne sont pas disponibles
      if (!permissions) {
        permissions = {
          canAccessPremium: false,
          canManageUsers: false,
          canManageComponents: false,
          canManageCategories: false,
          maxApiCalls: 100,
          teamSeats: 1
        }
      }

      if (!subscription) {
        subscription = {
          hasActiveSubscription: false,
          tier: 'free',
          teamSeats: 1,
          usedSeats: 1
        }
      }

      return {
        user: session.user as User,
        isLoading: false,
        isAuthenticated: true,
        permissions,
        subscription,
        isPremium: subscription.hasActiveSubscription
      }
    } else {
      return {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        permissions: null,
        subscription: null,
        isPremium: false
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error)
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      permissions: null,
      subscription: null,
      isPremium: false
    }
  }
}

// Fonction pour récupérer les données avec cache
const getAuthData = async (): Promise<AuthState> => {
  // Si on a déjà une promesse en cours, l'attendre
  if (globalAuthPromise) {
    return globalAuthPromise
  }

  // Si on a des données en cache et qu'elles sont récentes, les retourner
  if (globalAuthState) {
    return globalAuthState
  }

  // Sinon, faire la requête
  globalAuthPromise = fetchAuthData()
  const result = await globalAuthPromise
  globalAuthPromise = null
  
  notifyListeners(result)
  return result
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Utiliser le cache global s'il existe
    return globalAuthState || {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      permissions: null,
      subscription: null,
      isPremium: false
    }
  })

  useEffect(() => {
    let mounted = true

    // S'abonner aux changements globaux
    const handleAuthChange = (newState: AuthState) => {
      if (mounted) {
        setAuthState(newState)
      }
    }

    authListeners.add(handleAuthChange)

    // Charger les données si pas encore en cache
    if (!globalAuthState) {
      getAuthData().then(handleAuthChange)
    }

    // Écouter les changements de focus de la fenêtre pour rafraîchir la session
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        // Invalider le cache et recharger
        globalAuthState = null
        getAuthData().then(handleAuthChange)
      }
    }

    // Rafraîchir seulement quand l'utilisateur revient sur l'onglet
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      mounted = false
      authListeners.delete(handleAuthChange)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  // Fonction pour forcer un refresh
  const refreshAuth = async () => {
    // Invalider le cache global
    globalAuthState = null
    globalAuthPromise = null
    
    // Mettre à jour l'état local en loading
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    // Récupérer les nouvelles données
    const newState = await getAuthData()
    setAuthState(newState)
  }

  return { ...authState, refreshAuth }
}

// Hook pour forcer la reconnexion
export function useAuthRefresh() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return { refresh, refreshTrigger }
}