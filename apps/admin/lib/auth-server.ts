import { betterAuth, BetterAuthOptions } from "better-auth"
import { openAPI, customSession } from "better-auth/plugins"

/**
 * Instance Better-auth côté serveur pour le middleware Next.js
 *
 * Cette configuration doit être identique à celle du backend AdonisJS
 * pour pouvoir lire les mêmes sessions/cookies
 */
const options = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333",
  trustedOrigins: [
    'http://localhost:3000',  // Frontend Next.js
    'http://localhost:3333',  // Backend Adonis
    'http://localhost:5173',  // Autre origine si nécessaire
  ],
  // Utiliser la même base de données que le backend pour lire les sessions
  database: {
    provider: 'pg',
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ona_ui',
  },
  advanced: {
    cookiePrefix: "ona-ui",
    database: {
      generateId: false,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  // 🔧 Même configuration utilisateur que le backend
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  plugins: [
    openAPI(),
  ]
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    // 🔧 Même configuration de session personnalisée que le backend
    customSession(async ({ user, session }, ctx) => {
      return {
        user: {
          ...user,
          role: user.role || "user",
        },
        session: {
          ...session,
        }
      };
    }, options),
  ]
});

/**
 * Utilitaires d'authentification côté serveur
 */
export const serverAuthUtils = {
  /**
   * Vérifie si l'utilisateur peut accéder à l'admin dashboard
   * Maintenant utilise correctement le champ role personnalisé
   */
  canAccessAdminDashboard(user: any): boolean {
    if (!user) return false
    
    console.log("🔍 [SERVER AUTH UTILS] Vérification accès pour user:", {
      id: user.id,
      email: user.email,
      role: user.role
    })
    
    // Logique basée sur le rôle personnalisé
    const hasValidRole = (
      user.role === "admin" ||
      user.role === "super_admin"
    )
    
    // Logique temporaire basée sur l'email en fallback
    const hasAdminEmail = user.email?.includes("admin")
    
    const canAccess = hasValidRole || hasAdminEmail
    
    console.log("🔍 [SERVER AUTH UTILS] Résultat vérification:", {
      hasValidRole,
      hasAdminEmail,
      canAccess
    })
    
    return canAccess
  }
}