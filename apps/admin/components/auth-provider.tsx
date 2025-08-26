"use client"

import * as React from "react"
import { authClient } from "@/lib/auth"

/**
 * Contexte d'authentification pour l'admin dashboard
 */
interface AuthContextType {
  user: any | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

/**
 * Hook pour utiliser le contexte d'authentification
 */
export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

/**
 * Provider d'authentification utilisant Better-auth
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession()

  // 🔍 [DEBUG] Logs pour diagnostiquer l'état d'authentification
  React.useEffect(() => {
    console.log("🔄 [AUTH PROVIDER] État session changé:", {
      hasUser: !!session.data?.user,
      isLoading: session.isPending,
      userEmail: session.data?.user?.email,
      userId: session.data?.user?.id
    })
  }, [session.data?.user, session.isPending])

  const contextValue: AuthContextType = {
    user: session.data?.user || null,
    isLoading: session.isPending,
    error: session.error || null,
    refetch: () => {
      console.log("🔄 [AUTH PROVIDER] Refetch demandé")
      session.refetch()
    }
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}