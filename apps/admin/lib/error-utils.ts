/**
 * Utilitaires pour le formatage et la gestion des messages d'erreur
 */

/**
 * Types d'erreurs API
 */
export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNKNOWN_ERROR'

/**
 * Interface pour les erreurs formatées
 */
export interface FormattedError {
  type: ErrorType
  title: string
  message: string
  details?: any
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Messages d'erreur par défaut pour chaque type d'erreur
 */
const DEFAULT_ERROR_MESSAGES: Record<ErrorType, { title: string; message: string }> = {
  NETWORK_ERROR: {
    title: "Erreur réseau",
    message: "Impossible de communiquer avec le serveur. Vérifiez votre connexion internet."
  },
  VALIDATION_ERROR: {
    title: "Erreur de validation",
    message: "Les données saisies ne sont pas valides. Veuillez vérifier les champs du formulaire."
  },
  AUTHENTICATION_ERROR: {
    title: "Erreur d'authentification",
    message: "Votre session a expiré. Veuillez vous reconnecter."
  },
  AUTHORIZATION_ERROR: {
    title: "Erreur d'autorisation",
    message: "Vous n'avez pas les permissions nécessaires pour effectuer cette action."
  },
  NOT_FOUND: {
    title: "Ressource introuvable",
    message: "La ressource demandée n'existe pas ou a été supprimée."
  },
  CONFLICT: {
    title: "Conflit de données",
    message: "Une ressource avec ces informations existe déjà."
  },
  INTERNAL_ERROR: {
    title: "Erreur interne",
    message: "Une erreur inattendue s'est produite. Veuillez réessayer plus tard."
  },
  RATE_LIMIT_EXCEEDED: {
    title: "Limite dépassée",
    message: "Trop de requêtes ont été effectuées. Veuillez patienter avant de réessayer."
  },
  UNKNOWN_ERROR: {
    title: "Erreur inconnue",
    message: "Une erreur inattendue s'est produite. Veuillez réessayer."
  }
}

/**
 * Détermine le type d'erreur à partir d'une erreur API
 */
export function getErrorType(error: any): ErrorType {
  if (!error || !error.error) return 'UNKNOWN_ERROR'
  
  const { code } = error.error
  
  // Conversion des codes d'erreur en types
  switch (code) {
    case 'NETWORK_ERROR':
      return 'NETWORK_ERROR'
    case 'VALIDATION_ERROR':
    case '422':
      return 'VALIDATION_ERROR'
    case 'UNAUTHORIZED':
    case '401':
      return 'AUTHENTICATION_ERROR'
    case 'FORBIDDEN':
    case '403':
      return 'AUTHORIZATION_ERROR'
    case 'NOT_FOUND':
    case '404':
      return 'NOT_FOUND'
    case 'CONFLICT':
    case '409':
      return 'CONFLICT'
    case 'INTERNAL_ERROR':
    case '500':
      return 'INTERNAL_ERROR'
    case 'RATE_LIMIT_EXCEEDED':
    case '429':
      return 'RATE_LIMIT_EXCEEDED'
    default:
      return 'UNKNOWN_ERROR'
  }
}

/**
 * Extrait les détails de validation d'une erreur
 */
export function getValidationDetails(error: any): Record<string, string> | undefined {
  if (error?.error?.code === 'VALIDATION_ERROR' && error?.error?.details) {
    return error.error.details
  }
  return undefined
}

/**
 * Formate un message d'erreur pour l'affichage
 */
export function formatErrorMessage(
  error: any,
  customMessage?: string,
  context?: string
): FormattedError {
  const errorType = getErrorType(error)
  const defaultMessages = DEFAULT_ERROR_MESSAGES[errorType]
  
  // Construction du message personnalisé
  let message = customMessage || defaultMessages.message
  
  // Ajout du contexte si fourni
  if (context) {
    message = `${context} : ${message}`
  }
  
  // Gestion des détails de validation
  let details: any = undefined
  if (errorType === 'VALIDATION_ERROR') {
    details = getValidationDetails(error)
  } else if (error?.error?.details) {
    details = error.error.details
  }
  
  // Gestion des actions spécifiques
  let action: FormattedError['action'] = undefined
  
  if (errorType === 'AUTHENTICATION_ERROR') {
    action = {
      label: "Se reconnecter",
      onClick: () => {
        // Redirection vers la page de connexion
        window.location.href = '/auth/login'
      }
    }
  } else if (errorType === 'NETWORK_ERROR') {
    action = {
      label: "Réessayer",
      onClick: () => {
        window.location.reload()
      }
    }
  }
  
  return {
    type: errorType,
    title: defaultMessages.title,
    message,
    details,
    action
  }
}

/**
 * Formate les erreurs de validation pour l'affichage dans un formulaire
 */
export function formatValidationErrors(validationErrors: Record<string, string>): Record<string, string> {
  const formattedErrors: Record<string, string> = {}
  
  Object.entries(validationErrors).forEach(([field, message]) => {
    // Formattage plus convivial des noms de champs
    const fieldName = formatFieldName(field)
    formattedErrors[field] = `${fieldName} : ${message}`
  })
  
  return formattedErrors
}

/**
 * Formate le nom d'un champ pour l'affichage
 */
function formatFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    name: "Nom",
    slug: "Slug",
    description: "Description",
    categoryId: "Catégorie",
    iconName: "Icône",
    sortOrder: "Ordre d'affichage",
    isActive: "Statut actif",
    email: "Email",
    password: "Mot de passe",
    confirmPassword: "Confirmation du mot de passe"
  }
  
  return fieldNames[field] || field
}

/**
 * Crée un message d'erreur convivial pour les opérations CRUD
 */
export function getCRUDErrorMessage(
  operation: 'create' | 'update' | 'delete',
  resourceType: string,
  resourceName?: string
): string {
  const actions = {
    create: "créer",
    update: "mettre à jour",
    delete: "supprimer"
  }
  
  const resourceTypeFormatted = resourceType.toLowerCase()
  
  if (resourceName) {
    return `Impossible de ${actions[operation]} ${resourceTypeFormatted} "${resourceName}"`
  }
  
  return `Impossible de ${actions[operation]} ${resourceTypeFormatted}`
}

/**
 * Détermine si une erreur est critique et nécessite une action immédiate
 */
export function isCriticalError(error: any): boolean {
  const criticalErrorTypes: ErrorType[] = [
    'AUTHENTICATION_ERROR',
    'AUTHORIZATION_ERROR',
    'INTERNAL_ERROR'
  ]
  
  const errorType = getErrorType(error)
  return criticalErrorTypes.includes(errorType)
}

/**
 * Extrait le code d'erreur HTTP d'une erreur
 */
export function getHttpStatusCode(error: any): number | undefined {
  if (error?.error?.code && typeof error.error.code === 'string') {
    const code = parseInt(error.error.code)
    if (!isNaN(code)) {
      return code
    }
  }
  return undefined
}