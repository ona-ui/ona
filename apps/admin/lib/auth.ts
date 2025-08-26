import { createAuthClient } from "better-auth/react"
import { customSessionClient } from "better-auth/client/plugins"

/**
 * Configuration du client Better-auth pour l'admin dashboard
 * Avec support des sessions personnalisées pour inclure le rôle
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    // 🔧 Plugin pour supporter les champs personnalisés de session (role)
    customSessionClient(),
  ],
})

console.log("🔧 [AUTH CLIENT DEBUG] Configuration Better-auth:", {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333",
  credentials: "include"
})

/**
 * Export des fonctions d'authentification Better-auth
 */
export const { signIn, signOut, signUp, useSession } = authClient

/**
 * Types d'erreur d'authentification
 */
export type AuthError = {
  message: string
  code?: string
}

/**
 * Utilitaires d'authentification
 */
export const authUtils = {
  /**
   * Vérifie si une erreur est une erreur d'authentification
   */
  isAuthError(error: unknown): error is AuthError {
    return typeof error === "object" && error !== null && "message" in error
  },

  /**
   * Formate une erreur d'authentification
   */
  formatAuthError(error: unknown): AuthError {
    if (this.isAuthError(error)) {
      return error
    }
    
    if (error instanceof Error) {
      return { message: error.message }
    }
    
    return { message: "Une erreur d'authentification s'est produite" }
  },

  /**
   * Vérifie si l'utilisateur peut accéder à l'admin dashboard
   * Utilise maintenant le système de rôles personnalisé Better-auth
   */
  canAccessAdminDashboard(user: any): boolean {
    if (!user) return false
    
    console.log("🔍 [AUTH UTILS] Vérification accès admin pour user:", {
      id: user.id,
      email: user.email,
      role: user.role
    })
    
    // Logique basée sur le rôle personnalisé de Better-auth
    const hasValidRole = (
      user.role === "admin" ||
      user.role === "super_admin"
    )
    
    // Fallback temporaire basé sur l'email (à retirer en production)
    const hasAdminEmail = user.email?.includes("admin")
    
    const canAccess = hasValidRole || hasAdminEmail
    
    console.log("🔍 [AUTH UTILS] Résultat vérification:", {
      hasValidRole,
      hasAdminEmail,
      canAccess
    })
    
    return canAccess
  }
}