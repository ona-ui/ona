import { authClient } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { authUtils } from "@/lib/auth"
import AdminDashboardClient from "./dashboard-client"

/**
 * Wrapper serveur pour vérifier la session selon les recommandations Better-auth
 * La vérification complète se fait côté serveur, pas dans le middleware
 */
export default async function DashboardWrapper() {
  try {
    // Vérification complète de la session côté serveur
    const sessionResponse = await authClient.getSession({
      fetchOptions: {
        headers: await headers()
      }
    })

    const session = sessionResponse?.data

    console.log("🔍 [DASHBOARD] Vérification session serveur:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role
    })

    // Si pas de session, rediriger vers login
    if (!session?.user) {
      console.log("🛡️  [DASHBOARD] ❌ Pas de session - Redirection vers /login")
      redirect("/login")
    }

    // Vérifier les permissions admin
    if (!authUtils.canAccessAdminDashboard(session.user)) {
      console.log("🛡️  [DASHBOARD] ❌ Pas d'accès admin - Redirection vers /login")
      redirect("/login?error=access_denied")
    }

    console.log("🛡️  [DASHBOARD] ✅ Accès autorisé pour:", session.user.email)

    // Rendre le dashboard client
    return <AdminDashboardClient />

  } catch (error) {
    console.error("🛡️  [DASHBOARD] 💥 Erreur vérification session:", error)
    redirect("/login?error=auth_error")
  }
}