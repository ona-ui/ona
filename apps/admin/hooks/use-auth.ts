"use client"

import { useAuth as useAuthProvider } from "@/components/auth-provider"
import { authClient } from "@/lib/auth"
import { authUtils } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

/**
 * Hook d'authentification principal avec actions utiles
 */
export function useAuth() {
  const auth = useAuthProvider()
  const router = useRouter()

  /**
   * Connexion avec email et mot de passe - Version simplifiée
   */
  const loginWithCredentials = useCallback(async (email: string, password: string, rememberMe = false) => {
    console.log("🔐 [AUTH HOOK] Début connexion pour:", email)
    
    try {
      await authClient.signIn.email({
        email,
        password,
        rememberMe,
      }, {
        onSuccess: () => {
          console.log("✅ [AUTH HOOK] Connexion réussie - redirection via window.location")
          // Redirection immédiate pour éviter les race conditions
          window.location.href = "/"
        },
        onError: (ctx) => {
          console.error("❌ [AUTH HOOK] Erreur de connexion:", ctx.error)
          throw new Error(ctx.error?.message || "Erreur de connexion")
        }
      })
    } catch (error) {
      console.error("💥 [AUTH HOOK] Exception lors de la connexion:", error)
      throw authUtils.formatAuthError(error)
    }
  }, [])

  /**
   * Déconnexion
   */
  const logout = useCallback(async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Rafraîchir les données de session
            auth.refetch()
            // Rediriger vers la page de connexion
            router.push("/login")
          }
        }
      })
    } catch (error) {
      console.error("Erreur de déconnexion:", error)
      throw authUtils.formatAuthError(error)
    }
  }, [auth, router])

  /**
   * Vérifie si l'utilisateur peut accéder au dashboard admin
   */
  const canAccessDashboard = useCallback(() => {
    return authUtils.canAccessAdminDashboard(auth.user)
  }, [auth.user])

  return {
    // Données de session
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    isAuthenticated: !!auth.user,
    
    // Actions
    loginWithCredentials,
    logout,
    refetch: auth.refetch,
    
    // Utilitaires
    canAccessDashboard,
  }
}

/**
 * Hook pour protéger les routes nécessitant une authentification
 */
export function useRequireAuth() {
  const auth = useAuth()
  const router = useRouter()

  // Rediriger vers login si pas authentifié
  if (!auth.isLoading && !auth.isAuthenticated) {
    router.push("/login")
    return null
  }

  // Rediriger vers login si l'utilisateur n'a pas accès au dashboard
  if (!auth.isLoading && auth.isAuthenticated && !auth.canAccessDashboard()) {
    router.push("/login?error=access_denied")
    return null
  }

  return auth
}

/**
 * Hook pour les pages publiques (rediriger si déjà connecté)
 */
export function useRedirectIfAuthenticated(redirectTo = "/") {
  const auth = useAuth()
  const router = useRouter()

  if (!auth.isLoading && auth.isAuthenticated && auth.canAccessDashboard()) {
    router.push(redirectTo)
    return null
  }

  return auth
}