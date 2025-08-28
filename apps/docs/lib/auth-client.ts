import { createAuthClient } from "better-auth/client";
import { magicLinkClient } from "better-auth/client/plugins";

// 🔧 DEBUG: Log des variables d'environnement pour l'auth
console.log('🔍 [AUTH-CLIENT] Variables d\'environnement chargées:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV,
  authBaseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"
})

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333",
  plugins: [
    magicLinkClient()
  ]
}) as any;

export type AuthClient = typeof authClient;

// Types pour les fonctions d'authentification
export interface SignInMagicLinkOptions {
  email: string;
  name?: string;
  callbackURL?: string;
  newUserCallbackURL?: string;
  errorCallbackURL?: string;
}

// Wrapper pour l'authentification par magic link
export const signInWithMagicLink = async (options: SignInMagicLinkOptions) => {
  try {
    const result = await authClient.signIn.magicLink({
      email: options.email,
      name: options.name,
      callbackURL: options.callbackURL || "/dashboard",
      newUserCallbackURL: options.newUserCallbackURL || "/welcome",
      errorCallbackURL: options.errorCallbackURL || "/auth/error"
    });
    
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du magic link:', error);
    throw error;
  }
};

// Fonction pour vérifier un magic link token
export const verifyMagicLink = async (token: string, callbackURL?: string) => {
  try {
    const result = await authClient.magicLink.verify({
      token,
      callbackURL
    });
    
    return result;
  } catch (error) {
    console.error('Erreur lors de la vérification du magic link:', error);
    throw error;
  }
};

// Fonction pour récupérer la session (pas de hook React natif dans better-auth)
export const getAuthSession = async () => {
  return await authClient.getSession();
};

// Fonction pour se déconnecter
export const signOut = async () => {
  try {
    await authClient.signOut();
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    throw error;
  }
};

// Fonction pour obtenir la session actuelle
export const getSession = async () => {
  try {
    return await authClient.getSession();
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return null;
  }
};