import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * Middleware d'authentification optimiste selon les recommandations Better-auth
 *
 * Utilise getSessionCookie pour une redirection rapide sans appel API
 * La vérification complète de session se fait dans chaque page/route
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPaths = ["/login"]
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // Si c'est une page publique, laisser passer
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Vérification optimiste de l'existence du cookie de session
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "ona-ui" // Correspond à notre configuration Better-auth
  })

  console.log(`🔍 [MIDDLEWARE] Vérification cookie pour: ${pathname}`)
  console.log(`🔍 [MIDDLEWARE] Cookie de session trouvé:`, !!sessionCookie)

  // Si pas de cookie de session, rediriger vers login
  if (!sessionCookie) {
    console.log(`🛡️  [MIDDLEWARE] ❌ Pas de cookie de session - Redirection vers /login`)
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Cookie trouvé, laisser passer (la vérification complète se fait dans la page)
  console.log(`🛡️  [MIDDLEWARE] ✅ Cookie de session présent - Accès autorisé`)
  return NextResponse.next()
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