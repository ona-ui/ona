import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { betterFetch } from "@better-fetch/fetch";
import { authUtils } from "@/lib/auth";

/**
 * Middleware d'authentification moderne pour protéger les routes admin
 *
 * Utilise Better-auth API directement avec le runtime Node.js (Next.js 15.2+)
 *
 * Ce middleware :
 * - Vérifie l'authentification sur toutes les routes sauf /login
 * - Redirige les utilisateurs non authentifiés vers /login
 * - Vérifie les permissions d'accès au dashboard admin
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPaths = ["/login"]
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  try {
    type BetterAuthUser = {
      id: string
      email?: string | null
      name?: string | null
      role?: string | null
    }
    type BetterAuthSession = {
      user?: BetterAuthUser | null
    }

    // Utiliser l'API Better-auth directement (Next.js 15.2+)
    const { data: session } = await betterFetch<BetterAuthSession>("/api/auth/get-session", {
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
          cookie: request.headers.get("cookie") || "", // Forward the cookies from the request
      },
    });

    // 🔧 GESTION SPÉCIALE POUR /login
    if (isPublicPath && pathname === "/login") {
      // Si l'utilisateur est déjà connecté et va sur /login, le rediriger
      if (session?.user && authUtils.canAccessAdminDashboard(session.user)) {
        console.log(`🛡️  [MIDDLEWARE] ✅ Utilisateur déjà connecté sur /login - Redirection vers /`)
        const dashboardUrl = new URL("/", request.url)
        return NextResponse.redirect(dashboardUrl)
      }
      // Sinon, laisser accéder à la page de login
      return NextResponse.next()
    }

    // Si c'est une autre page publique, continuer
    if (isPublicPath) {
      return NextResponse.next()
    }

    // Si pas de session valide, rediriger vers login
    if (!session) {
      console.log(`🛡️  [MIDDLEWARE] ❌ Aucune session - Redirection vers /login`)
      console.log(`🛡️  [MIDDLEWARE] URL demandée: ${request.url}`)
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    if (session && !session.user) {
      const loginUrl = new URL("/login?error=auth_error", request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Vérifier si l'utilisateur a accès au dashboard admin
    const canAccess = authUtils.canAccessAdminDashboard(session.user)

    if (!canAccess) {
       const loginUrl = new URL("/login?error=access_denied", request.url)
       return NextResponse.redirect(loginUrl)
     }

    // Utilisateur authentifié et autorisé, continuer
    console.log(`🛡️  [MIDDLEWARE] ✅ Accès autorisé pour ${session.user?.name || session.user?.email || session.user?.id}`)
    return NextResponse.next()

  } catch (error) {
    console.error("🛡️  [MIDDLEWARE] 💥 Erreur dans le middleware d'authentification:", error)
    
    // En cas d'erreur, rediriger vers login par sécurité
    const loginUrl = new URL("/login?error=auth_error", request.url)
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * Configuration des routes à protéger avec runtime Node.js
 *
 * Note: Le runtime nodejs est requis pour utiliser Better-auth dans le middleware
 */
export const config = {
  matcher: [
    /*
     * Appliquer le middleware à toutes les routes sauf :
     * - API routes autres que auth
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico
     */
    "/((?!api(?!/auth)|_next/static|_next/image|favicon.ico).*)",
  ],
}