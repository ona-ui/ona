import { useCallback } from "react"
import { toast } from "sonner"
import type { APIErrorResponse } from "@workspace/types/api"
import {
  formatErrorMessage as formatAppErrorMessage,
  getCRUDErrorMessage,
  formatValidationErrors,
  isCriticalError
} from "@/lib/error-utils"

/**
 * Types pour les erreurs personnalisées
 */
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

/**
 * Types pour les options de gestion des erreurs
 */
export interface ErrorHandlerOptions {
  /**
   * Afficher une notification toast pour cette erreur
   */
  showToast?: boolean
  /**
   * Message personnalisé pour le toast
   */
  customMessage?: string
  /**
   * Durée d'affichage du toast en ms
   */
  duration?: number
  /**
   * Action à exécuter en cas d'erreur
   */
  onError?: (error: AppError) => void
  /**
   * Type d'opération CRUD (pour les messages d'erreur contextualisés)
   */
  operation?: 'create' | 'update' | 'delete'
  /**
   * Type de ressource concernée (pour les messages d'erreur contextualisés)
   */
  resourceType?: string
  /**
   * Nom de la ressource concernée (pour les messages d'erreur contextualisés)
   */
  resourceName?: string
}

/**
 * Messages d'erreur pré-définis pour les codes d'erreur courants
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Erreurs d'authentification
  UNAUTHORIZED: "Votre session a expiré. Veuillez vous reconnecter.",
  FORBIDDEN: "Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
  
  // Erreurs de validation
  VALIDATION_ERROR: "Les données fournies sont invalides.",
  BAD_REQUEST: "La requête est invalide.",
  
  // Erreurs de ressource
  NOT_FOUND: "La ressource demandée n'existe pas.",
  CONFLICT: "Un conflit est survenu lors de l'opération.",
  
  // Erreurs réseau et serveur
  NETWORK_ERROR: "Une erreur réseau est survenue. Vérifiez votre connexion.",
  INTERNAL_ERROR: "Une erreur interne est survenue. Veuillez réessayer plus tard.",
  TIMEOUT_ERROR: "La requête a expiré. Veuillez réessayer.",
  RATE_LIMIT_EXCEEDED: "Trop de requêtes. Veuillez attendre avant de réessayer.",
  
  // Erreurs métier
  PREMIUM_REQUIRED: "Cette fonctionnalité nécessite un compte premium.",
  INSUFFICIENT_QUOTA: "Vous avez atteint votre quota maximal.",
}

/**
 * Formate un message d'erreur en fonction du code d'erreur
 */
function formatErrorMessage(error: AppError): string {
  // Utiliser le nouvel utilitaire de formatage
  const formatted = formatAppErrorMessage(error)
  return formatted.message
}

/**
 * Détermine le type de toast à afficher en fonction du code d'erreur
 */
function getToastType(error: AppError): "error" | "warning" | "info" {
  switch (error.code) {
    case "UNAUTHORIZED":
    case "FORBIDDEN":
    case "INTERNAL_ERROR":
    case "NETWORK_ERROR":
      return "error"
    
    case "VALIDATION_ERROR":
    case "BAD_REQUEST":
    case "CONFLICT":
    case "RATE_LIMIT_EXCEEDED":
      return "warning"
    
    default:
      return "error"
  }
}

/**
 * Hook pour la gestion centralisée des erreurs dans l'admin dashboard
 */
export function useErrorHandler() {
  /**
   * Gère une erreur de manière centralisée
   */
  const handleError = useCallback((error: unknown, options: ErrorHandlerOptions = {}) => {
    const {
      showToast = true,
      customMessage,
      duration = 5000,
      onError,
      operation,
      resourceType,
      resourceName,
    } = options

    let appError: AppError

    // Si l'erreur est déjà une erreur API formatée
    if (isAPIErrorResponse(error)) {
      appError = {
        code: error.error.code,
        message: error.error.message,
        details: error.error.details,
        timestamp: error.timestamp.toString(),
      }
    }
    // Si c'est une erreur standard JavaScript
    else if (error instanceof Error) {
      appError = {
        code: "UNKNOWN_ERROR",
        message: error.message,
        timestamp: new Date().toISOString(),
      }
    }
    // Si c'est un objet d'erreur générique
    else if (typeof error === "object" && error !== null) {
      appError = {
        code: (error as any).code || "UNKNOWN_ERROR",
        message: (error as any).message || "Une erreur inconnue est survenue.",
        details: (error as any).details,
        timestamp: (error as any).timestamp || new Date().toISOString(),
      }
    }
    // Pour tout autre type d'erreur
    else {
      appError = {
        code: "UNKNOWN_ERROR",
        message: "Une erreur inconnue est survenue.",
        timestamp: new Date().toISOString(),
      }
    }

    // Logger l'erreur pour le débogage
    console.error("Application Error:", {
      error: appError,
      operation,
      resourceType,
      resourceName,
      timestamp: new Date().toISOString()
    })

    // Exécuter le callback onError si fourni
    if (onError) {
      onError(appError)
    }

    // Formatage du message d'erreur avec les utilitaires
    let message = customMessage
    if (!message && operation && resourceType) {
      message = getCRUDErrorMessage(operation, resourceType, resourceName)
    }

    // Utilisation du formatage d'erreur avancé
    const formattedError = formatAppErrorMessage(appError, message)

    // Afficher une notification toast si demandé
    if (showToast) {
      const toastType = getToastType(appError)
      
      // Pour les erreurs critiques, on utilise une durée plus longue
      const errorDuration = isCriticalError(appError) ? 10000 : duration

      toast[toastType](formattedError.message, {
        duration: errorDuration,
        description: appError.code !== "VALIDATION_ERROR" ? `Code: ${appError.code}` : undefined,
      })
    }

    return appError
  }, [])

  /**
   * Gère spécifiquement les erreurs de validation
   */
  const handleValidationError = useCallback((error: unknown, field?: string) => {
    const appError = handleError(error, {
      showToast: false, // Pas de toast pour les erreurs de validation (gérées dans le formulaire)
    })

    // Si un champ spécifique est demandé, extraire l'erreur pour ce champ
    if (field && appError.details && typeof appError.details === "object") {
      const fieldErrors = formatValidationErrors(appError.details as Record<string, string>)
      return fieldErrors[field] || appError.message
    }

    return appError.message
  }, [handleError])

  /**
   * Gère les erreurs réseau de manière spécifique
   */
  const handleNetworkError = useCallback((error: unknown) => {
    return handleError(error, {
      showToast: true,
      customMessage: "Problème de connexion. Vérifiez votre réseau et réessayez.",
    })
  }, [handleError])

  /**
   * Gère les erreurs d'authentification
   */
  const handleAuthError = useCallback((error: unknown) => {
    const appError = handleError(error, {
      showToast: true,
    })

    // Rediriger vers la page de login en cas d'erreur d'authentification
    if (appError.code === "UNAUTHORIZED") {
      setTimeout(() => {
        window.location.href = "/login?reason=session_expired"
      }, 2000)
    }

    return appError
  }, [handleError])

  return {
    handleError,
    handleValidationError,
    handleNetworkError,
    handleAuthError,
  }
}

/**
 * Vérifie si une erreur est une réponse d'erreur API
 */
function isAPIErrorResponse(error: unknown): error is APIErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "success" in error &&
    error.success === false &&
    "error" in error &&
    typeof (error as any).error === "object"
  )
}