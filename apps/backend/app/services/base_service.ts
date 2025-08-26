import { db } from '../repositories/base_repository.js';
import type { PaginationOptions, PaginationResult } from '../repositories/base_repository.js';

/**
 * Erreurs métier spécifiques pour les services
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string = 'Accès non autorisé', details?: any) {
    super(message, 'UNAUTHORIZED', 401, details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = 'Action interdite', details?: any) {
    super(message, 'FORBIDDEN', 403, details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string = 'Ressource non trouvée', details?: any) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string = 'Données invalides', details?: any) {
    super(message, 'VALIDATION_ERROR', 422, details);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string = 'Conflit de données', details?: any) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

export class PremiumRequiredError extends ServiceError {
  constructor(message: string = 'Licence premium requise', details?: any) {
    super(message, 'PREMIUM_REQUIRED', 402, details);
    this.name = 'PremiumRequiredError';
  }
}

/**
 * Interface de base pour tous les services
 * Fournit les fonctionnalités communes : logging, gestion d'erreurs, transactions
 */
export abstract class BaseService {
  protected logger = console; // Remplacer par un vrai logger si nécessaire

  /**
   * Exécute une opération dans une transaction
   */
  protected async withTransaction<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    return db.transaction(async (_tx) => {
      try {
        return await operation();
      } catch (error) {
        this.logger.error(error, 'Transaction failed:');
        throw error;
      }
    });
  }

  /**
   * Log une opération avec contexte
   */
  protected logOperation(operation: string, context?: any): void {
    this.logger.info(`[${this.constructor.name}] ${operation}`, context);
  }

  /**
   * Log une erreur avec contexte
   */
  protected logError(operation: string, error: Error, context?: any): void {
    this.logger.error({
      error: error.message,
      stack: error.stack,
      context,
    }, `[${this.constructor.name}] ${operation} failed:`);
  }

  /**
   * Valide qu'un utilisateur existe et est actif
   */
  protected validateUser(user: any): void {
    if (!user) {
      throw new UnauthorizedError('Utilisateur non authentifié');
    }
    if (user.deletedAt) {
      throw new UnauthorizedError('Compte utilisateur désactivé');
    }
  }

  /**
   * Valide qu'un utilisateur a les permissions requises
   */
  protected validatePermissions(user: any, requiredRole: 'user' | 'admin' | 'super_admin'): void {
    this.validateUser(user);
    
    const roleHierarchy = {
      'user': 0,
      'admin': 1,
      'super_admin': 2,
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] ?? -1;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      throw new ForbiddenError(`Rôle ${requiredRole} requis`);
    }
  }

  /**
   * Valide qu'une ressource existe
   */
  protected validateExists<T>(resource: T | null, resourceName: string): T {
    if (!resource) {
      throw new NotFoundError(`${resourceName} non trouvé(e)`);
    }
    return resource;
  }

  /**
   * Valide qu'un slug est unique
   */
  protected validateUniqueSlug(existingResource: any, slug: string, resourceName: string): void {
    if (existingResource) {
      throw new ConflictError(`Le slug "${slug}" est déjà utilisé pour ${resourceName}`);
    }
  }

  /**
   * Génère un slug à partir d'un nom
   */
  protected generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garde seulement lettres, chiffres, espaces et tirets
      .replace(/\s+/g, '-') // Remplace les espaces par des tirets
      .replace(/-+/g, '-') // Supprime les tirets multiples
      .replace(/^-|-$/g, ''); // Supprime les tirets en début/fin
  }

  /**
   * Valide les options de pagination
   */
  protected validatePaginationOptions(options: PaginationOptions): PaginationOptions {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    
    return { page, limit };
  }

  /**
   * Crée une réponse paginée standardisée
   */
  protected createPaginatedResponse<T>(
    result: PaginationResult<T>,
    message: string = 'Données récupérées avec succès'
  ) {
    return {
      success: true,
      message,
      data: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Crée une réponse de succès standardisée
   */
  protected createSuccessResponse<T>(
    data: T,
    message: string = 'Opération réussie'
  ) {
    return {
      success: true,
      message,
      data,
    };
  }

  /**
   * Valide les données d'entrée avec un schéma simple
   */
  protected validateInput(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Champs requis manquants: ${missingFields.join(', ')}`,
        { missingFields }
      );
    }
  }

  /**
   * Nettoie les données d'entrée en supprimant les champs non autorisés
   */
  protected sanitizeInput<T>(data: any, allowedFields: string[]): Partial<T> {
    const sanitized: any = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitized[field] = data[field];
      }
    }
    
    return sanitized;
  }

  /**
   * Valide un email
   */
  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valide un slug
   */
  protected validateSlugFormat(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    console.log("OUI : " + slug)
    return slugRegex.test(slug);
  }

  /**
   * Génère un ID unique (UUID v4 simple)
   */
  protected generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Calcule un hash simple pour comparer le contenu
   */
  protected calculateContentHash(content: string): string {
    let hash = 0;
    if (content.length === 0) return hash.toString();
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Formate une date pour l'affichage
   */
  protected formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Vérifie si une date est récente (moins de X jours)
   */
  protected isRecent(date: Date, days: number = 7): boolean {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  }
}

/**
 * Types utilitaires pour les services
 */
export interface ServiceContext {
  userId?: string;
  userRole?: 'user' | 'admin' | 'super_admin';
  ipAddress?: string;
  userAgent?: string;
}

export interface ServiceOptions {
  context?: ServiceContext;
  skipValidation?: boolean;
  skipLogging?: boolean;
}

export type ServiceResult<T> = {
  success: true;
  data: T;
  message?: string;
} | {
  success: false;
  error: ServiceError;
  message: string;
};