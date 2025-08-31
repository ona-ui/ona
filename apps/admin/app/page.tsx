"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

/**
 * Page racine qui redirige automatiquement
 * Cette page existe pour éviter les erreurs 404 lors des redirections
 */
export default function RootRedirect() {
  const router = useRouter()
  const { user, isLoading, canAccessDashboard } = useAuth()

  console.log("🔍 [ROOT REDIRECT] État:", {
    isLoading,
    hasUser: !!user,
    userRole: user?.role,
    canAccess: canAccessDashboard(),
    timestamp: new Date().toISOString()
  })

  useEffect(() => {
    if (!isLoading) {
      if (user && canAccessDashboard()) {
        console.log("✅ [ROOT REDIRECT] Redirection vers dashboard admin")
        // Redirection vers une route admin spécifique qui existe
        router.replace("/categories")
      } else {
        console.log("🚫 [ROOT REDIRECT] Redirection vers login")
        router.replace("/login")
      }
    }
  }, [user, isLoading, canAccessDashboard, router])

  // Affichage de chargement pendant la redirection
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Redirection...</p>
      </div>
    </div>
  )
}