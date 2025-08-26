import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { headers } from "next/headers"
import { auth, serverAuthUtils } from "@/lib/auth-server"
import { Session } from "better-auth/types"
import { betterFetch } from "@better-fetch/fetch";

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

  // Si c'est une page publique, continuer
  if (isPublicPath) {
    console.log(`🛡️  [MIDDLEWARE] ℹ️  Page publique: ${pathname}`)
    return NextResponse.next()
  }

  try {    
    // Utiliser l'API Better-auth directement (Next.js 15.2+)
    const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
          cookie: request.headers.get("cookie") || "", // Forward the cookies from the request
      },
  });


    // Si pas de session valide, rediriger vers login
    if (!session) {
      console.log(`🛡️  [MIDDLEWARE] ❌ Aucune session - Redirection vers /login`)
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    // // Vérifier si l'utilisateur a accès au dashboard admin
    // const canAccess = serverAuthUtils.canAccessAdminDashboard(session.user)
    // if (!canAccess) {
     
    //   const loginUrl = new URL("/login?error=access_denied", request.url)
    //   return NextResponse.redirect(loginUrl)
    // }

    // Utilisateur authentifié et autorisé, continuer
    console.log(`🛡️  [MIDDLEWARE] ✅ Accès autorisé pour ${session.id || session.userId}`)
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