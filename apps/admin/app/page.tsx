import { redirect } from "next/navigation"

/**
 * Page racine - redirection côté serveur simple
 * Redirige vers le dashboard admin, le layout se chargera de l'auth
 */
export default function RootPage() {
  // Redirection côté serveur vers le dashboard
  redirect("/categories")
}