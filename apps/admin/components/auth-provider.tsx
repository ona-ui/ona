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
   refetch: () => Promise<void>
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
   const [sessionData, setSessionData] = React.useState<{
     data: any
     error: any
   } | null>(null)
   const [isLoading, setIsLoading] = React.useState(true)

   const fetchSession = React.useCallback(async () => {
     try {
       console.log("🔄 [AUTH PROVIDER] Début fetchSession")
       setIsLoading(true)
       const result = await authClient.getSession()
       setSessionData(result)
     } catch (error) {
       console.error("❌ [AUTH PROVIDER] Erreur fetchSession:", error)
       setSessionData({ data: null, error })
     } finally {
       setIsLoading(false)
       console.log("✅ [AUTH PROVIDER] fetchSession terminé")
     }
   }, [])

   React.useEffect(() => {
     fetchSession()
   }, [fetchSession])

   // 🔍 [DEBUG] Logs pour diagnostiquer l'état d'authentification
   React.useEffect(() => {
     console.log("🔄 [AUTH PROVIDER] État session changé:", {
       hasUser: !!sessionData?.data?.user,
       isLoading,
       userEmail: sessionData?.data?.user?.email,
       userId: sessionData?.data?.user?.id
     })
   }, [sessionData?.data?.user, isLoading])

   const contextValue: AuthContextType = {
     user: sessionData?.data?.user || null,
     isLoading,
     error: sessionData?.error || null,
     refetch: async () => {
       console.log("🔄 [AUTH PROVIDER] Refetch demandé")
       await fetchSession()
       console.log("✅ [AUTH PROVIDER] Refetch terminé")
     }
   }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}