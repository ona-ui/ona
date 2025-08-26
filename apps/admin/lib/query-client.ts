import { QueryClient, DefaultOptions } from "@tanstack/react-query"
import type { APIErrorResponse } from "@workspace/types/api"
import { toast } from "../components/admin/error-toast"

/**
 * Configuration par défaut pour TanStack Query optimisée pour l'admin dashboard
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Cache pendant 5 minutes pour les données admin
    staleTime: 5 * 60 * 1000,
    // Garde en cache pendant 10 minutes
    gcTime: 10 * 60 * 1000,
    // Refetch au focus de la fenêtre
    refetchOnWindowFocus: true,
    // Refetch à la reconnexion
    refetchOnReconnect: true,
  }
}

/**
 * Messages d'erreur pré-définis pour les codes d'erreur courants
 */
const ERROR_MESSAGES: Record<string, { message: string; type: "error" | "warning" | "info" }> = {
  UNAUTHORIZED: {
    message: "Votre session a expiré. Veuillez vous reconnecter.",
    type: "error" as const
  },
  FORBIDDEN: {
    message: "Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
    type: "error" as const
  },
  VALIDATION_ERROR: {
    message: "Les données fournies sont invalides.",
    type: "warning" as const
  },
  BAD_REQUEST: {
    message: "La requête est invalide.",
    type: "warning" as const
  },
  NOT_FOUND: {
    message: "La ressource demandée n'existe pas.",
    type: "warning" as const
  },
  CONFLICT: {
    message: "Un conflit est survenu lors de l'opération.",
    type: "warning" as const
  },
  NETWORK_ERROR: {
    message: "Une erreur réseau est survenue. Vérifiez votre connexion.",
    type: "error" as const
  },
  INTERNAL_ERROR: {
    message: "Une erreur interne est survenue. Veuillez réessayer plus tard.",
    type: "error" as const
  },
  TIMEOUT_ERROR: {
    message: "La requête a expiré. Veuillez réessayer.",
    type: "warning" as const
  },
  RATE_LIMIT_EXCEEDED: {
    message: "Trop de requêtes. Veuillez attendre avant de réessayer.",
    type: "warning" as const
  },
  PREMIUM_REQUIRED: {
    message: "Cette fonctionnalité nécessite un compte premium.",
    type: "info" as const
  },
  INSUFFICIENT_QUOTA: {
    message: "Vous avez atteint votre quota maximal.",
    type: "warning" as const
  },
}

/**
 * Formate un message d'erreur en fonction du code d'erreur
 */
function formatErrorMessage(error: APIErrorResponse): string {
  const { error: apiError } = error
  
  // Si l'erreur a des détails de validation, on les formate spécifiquement
  if (apiError.code === "VALIDATION_ERROR" && apiError.details) {
    if (Array.isArray(apiError.details)) {
      return apiError.details.map((detail: any) => detail.message || detail).join(", ")
    }
    if (typeof apiError.details === "object") {
      return Object.values(apiError.details).flat().join(", ")
    }
  }
  
  // Utiliser le message prédéfini pour ce code d'erreur
  return ERROR_MESSAGES[apiError.code]?.message || apiError.message || "Une erreur inconnue est survenue."
}

/**
 * Gestionnaire d'erreur global pour les requêtes
 */
const handleQueryError = (error: unknown): void => {
  console.error("Query Error:", error)
  
  // Si c'est une erreur API structurée
  if (isAPIErrorResponse(error)) {
    const { error: apiError } = error
    const errorConfig = ERROR_MESSAGES[apiError.code]
    
    switch (apiError.code) {
      case "UNAUTHORIZED":
        console.warn("Session expirée, redirection vers login...")
        toast.error("Session expirée", "Redirection vers la page de connexion...", {
          duration: 5000,
          action: {
            label: "Se connecter",
            onClick: () => {
              window.location.href = "/login?reason=session_expired"
            }
          }
        })
        // Redirection automatique après un court délai
        setTimeout(() => {
          window.location.href = "/login?reason=session_expired"
        }, 5000)
        break
      case "FORBIDDEN":
        toast.error("Accès refusé", errorConfig?.message || "Vous n'avez pas les permissions nécessaires")
        break
      case "VALIDATION_ERROR":
        // Les erreurs de validation sont gérées au niveau des formulaires, mais on peut afficher un toast général
        const validationMessage = formatErrorMessage(error)
        toast.warning("Erreur de validation", validationMessage)
        break
      case "NETWORK_ERROR":
        toast.error("Erreur réseau", errorConfig?.message || "Une erreur réseau est survenue", {
          action: {
            label: "Réessayer",
            onClick: () => window.location.reload()
          }
        })
        break
      default:
        // Pour les autres erreurs, utiliser la configuration appropriée
        const message = formatErrorMessage(error)
        if (errorConfig) {
          toast[errorConfig.type]("Erreur", message)
        } else {
          toast.error("Erreur", message)
        }
    }
  } else if (error instanceof Error) {
    // Erreurs JavaScript standard
    toast.error("Erreur", error.message)
  } else {
    // Erreurs inconnues
    toast.error("Erreur", "Une erreur inconnue est survenue.")
  }
}

/**
 * Vérifie si l'erreur est une réponse d'erreur API
 */
function isAPIErrorResponse(error: unknown): error is APIErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "success" in error &&
    error.success === false &&
    "error" in error
  )
}

/**
 * Client QueryClient configuré pour l'admin dashboard
 */
export const queryClient = new QueryClient({
  defaultOptions,
})

/**
 * Configuration de base pour les requêtes API
 */
export const apiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333",
  timeout: 30000, // 30 secondes
  credentials: "include" as const,
  headers: {
    "Content-Type": "application/json",
  },
} as const

/**
 * Fonction utilitaire pour faire des requêtes API avec configuration standard
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${apiConfig.baseURL}${endpoint}`
  
  // Si le body est un FormData, ne pas définir Content-Type
  // Le navigateur le définira automatiquement avec le boundary
  const isFormData = options.body instanceof FormData
  
  // Construire les headers conditionnellement
  const defaultHeaders = isFormData
    ? {} // Pas de Content-Type pour FormData
    : apiConfig.headers
  
  const config: RequestInit = {
    ...options,
    credentials: apiConfig.credentials,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    // Si la réponse n'est pas ok, on lance une erreur
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        success: false,
        error: {
          code: response.status.toString(),
          message: errorData.message || response.statusText,
          details: errorData,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      } as APIErrorResponse
    }

    return await response.json()
  } catch (error) {
    // Si c'est déjà une erreur API formatée, on la relance
    if (isAPIErrorResponse(error)) {
      throw error
    }
    
    // Sinon on formate l'erreur
    throw {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Erreur réseau",
        details: error,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    } as APIErrorResponse
  }
}

/**
 * Clés de requête standardisées pour l'organisation du cache
 */
export const queryKeys = {
  // Catégories
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
    stats: () => [...queryKeys.categories.all, "stats"] as const,
  },
  
  // Sous-catégories
  subcategories: {
    all: ["subcategories"] as const,
    lists: () => [...queryKeys.subcategories.all, "list"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.subcategories.lists(), filters] as const,
    details: () => [...queryKeys.subcategories.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.subcategories.details(), id] as const,
    stats: () => [...queryKeys.subcategories.all, "stats"] as const,
  },
  
  // Composants
  components: {
    all: ["components"] as const,
    lists: () => [...queryKeys.components.all, "list"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.components.lists(), filters] as const,
    details: () => [...queryKeys.components.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.components.details(), id] as const,
    stats: () => [...queryKeys.components.all, "stats"] as const,
    preview: (id: string, versionId: string) => [...queryKeys.components.detail(id), "preview", versionId] as const,
  },
  
  // Versions
  versions: {
    all: ["versions"] as const,
    lists: () => [...queryKeys.versions.all, "list"] as const,
    list: (componentId: string) => [...queryKeys.versions.lists(), componentId] as const,
    details: () => [...queryKeys.versions.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.versions.details(), id] as const,
    compare: (id1: string, id2: string) => [...queryKeys.versions.all, "compare", id1, id2] as const,
  },
  
  // Fichiers
  files: {
    all: ["files"] as const,
    upload: ["files", "upload"] as const,
    info: (path: string) => [...queryKeys.files.all, "info", path] as const,
  },
  
  // Statistiques globales
  stats: {
    global: ["stats", "global"] as const,
    dashboard: ["stats", "dashboard"] as const,
  },
} as const

/**
 * Utilitaires pour invalider le cache
 */
export const invalidateQueries = {
  categories: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
  subcategories: () => queryClient.invalidateQueries({ queryKey: queryKeys.subcategories.all }),
  components: () => queryClient.invalidateQueries({ queryKey: queryKeys.components.all }),
  versions: () => queryClient.invalidateQueries({ queryKey: queryKeys.versions.all }),
  files: () => queryClient.invalidateQueries({ queryKey: queryKeys.files.all }),
  stats: () => queryClient.invalidateQueries({ queryKey: queryKeys.stats.global }),
  all: () => queryClient.invalidateQueries(),
} as const