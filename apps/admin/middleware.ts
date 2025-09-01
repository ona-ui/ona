import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { authClient } from "./lib/auth";
 
export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "ona-ui"
}); 

console.log('SESSION : ' + sessionCookie)
    // THIS IS NOT SECURE!
    // This is the recommended approach to optimistically redirect users
    // We recommend handling auth checks in each page/route
	if (!sessionCookie) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return NextResponse.next();
}
 
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
};