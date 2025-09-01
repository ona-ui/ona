import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { users as userTable, session, account, verification } from "../../app/db/schema.js";
import { openAPI, customSession, magicLink } from "better-auth/plugins"
import { apiKey } from "better-auth/plugins"
import { db } from "../db/index.js";
import { emailService } from "../services/email_service.js";

// 🔧 Configuration Better-auth avec types personnalisés
const options = {
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3333",
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',  // Frontend Next.js
    'http://localhost:3002',  // Frontend Next.js
    'http://localhost:3333',  // Backend Adonis
    'http://localhost:5173',  // Autre origine si nécessaire
    'https://ona-ui.com',
    'https://admin.ona-ui.com'
  ],
  
  // 🔍 Activer le mode verbose pour debugging
  logger: {
    level: "debug",
    disabled: false,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: userTable,
      session,
      account,
      verification,
    },
    
  }),
  advanced: {
    cookiePrefix: "ona-ui",
    database: {
      generateId: false,
    },
    crossSubDomainCookies: {
      enabled: true,
      domain: ".ona.com", // your domain
  },
  },
  // 🔧 Configuration pour cross-domain en production
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  // 🔧 Ajouter des champs personnalisés à l'utilisateur
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user", // Valeur par défaut
        input: false, // Ne pas permettre la modification via les inputs utilisateur
      },
    },
  },
  plugins: [
    openAPI(),
    apiKey(),
    magicLink({
      sendMagicLink: async ({ email, token }) => {
        try {
          // Créer une URL custom qui redirige vers notre page de vérification frontend
          const frontendBaseURL = process.env.FRONTEND_URL || "http://localhost:3000";
          const customUrl = `${frontendBaseURL}/auth/magic-link/verify?token=${token}`;

          await emailService.sendMagicLinkEmail({
            email,
            magicLink: customUrl,
            token
          });
          
          console.log(`✅ [MAGIC LINK] Magic link envoyé à ${email} avec URL custom: ${customUrl}`);
        } catch (error) {
          console.error('❌ [MAGIC LINK] Erreur lors de l\'envoi du magic link:', error);
          throw error;
        }
      },
      // Lien expire après 5 minutes (300 secondes)
      expiresIn: 300,
      // Permettre l'inscription automatique via magic link
      disableSignUp: true,
    })
  ]
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    // 🔧 Plugin pour personnaliser la session et inclure le rôle
    customSession(async ({ user, session }) => {
      // Maintenant le type du user inclut le champ role
      return {
        user: {
          ...user,
          role: user.role || "user", // Le rôle est maintenant correctement typé
        },
        session: {
          ...session,
        }
      };
    }, options), // Passer les options pour l'inférence des types
  ]
});