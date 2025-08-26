import { BaseService, ValidationError, ConflictError, PremiumRequiredError, UnauthorizedError } from './base_service.js';
import { componentRepository, subcategoryRepository, userRepository } from '../repositories/index.js';
import type { PaginationOptions } from '../repositories/base_repository.js';
import type { ComponentFilters } from '../repositories/component_repository.js';
import { components } from '../db/schema.js';

// Types locaux basés sur le schéma de base de données
type Component = typeof components.$inferSelect;
type CreateComponentData = typeof components.$inferInsert;
type UpdateComponentData = Partial<typeof components.$inferInsert>;

export interface ComponentWithAccess extends Component {
  hasAccess: boolean;
  accessType: 'preview_only' | 'copy' | 'full_access' | 'download';
  canViewCode: boolean;
  canCopy: boolean;
  canDownload: boolean;
}

export interface ComponentSearchFilters extends ComponentFilters {
  frameworks?: string[];
  cssFrameworks?: string[];
  tags?: string[];
  sortBy?: 'newest' | 'popular' | 'conversion' | 'name';
  sortDirection?: 'asc' | 'desc';
}

export interface ComponentStats {
  totalComponents: number;
  freeComponents: number;
  premiumComponents: number;
  publishedComponents: number;
  draftComponents: number;
  averageConversionRate: number;
  topCategories: Array<{ name: string; count: number }>;
  topFrameworks: Array<{ name: string; count: number }>;
}

export interface ComponentRecommendations {
  similar: Component[];
  trending: Component[];
  newComponents: Component[];
  highConversion: Component[];
}

/**
 * Service de gestion des composants
 * Gère la protection premium, le filtrage intelligent et les recommandations
 */
export class ComponentService extends BaseService {
  /**
   * Récupère un composant par ID avec contrôle d'accès
   */
  async getComponentById(id: string, userId?: string): Promise<ComponentWithAccess> {
    this.logOperation('getComponentById', { id, userId });

    const component = await componentRepository.findById(id);
    this.validateExists(component, 'Composant');

    return await this.addAccessControl(component!, userId);
  }

  /**
   * Récupère un composant par slug avec contrôle d'accès
   */
  async getComponentBySlug(slug: string, subcategoryId?: string, userId?: string): Promise<ComponentWithAccess> {
    this.logOperation('getComponentBySlug', { slug, subcategoryId, userId });

    const component = await componentRepository.findBySlug(slug, subcategoryId);
    this.validateExists(component, 'Composant');

    return await this.addAccessControl(component!, userId);
  }

  /**
   * Liste les composants avec filtrage intelligent et contrôle d'accès
   */
  async listComponents(
    filters: ComponentSearchFilters = {},
    options: PaginationOptions = {},
    userId?: string
  ) {
    this.logOperation('listComponents', { filters, options, userId });

    const validatedOptions = this.validatePaginationOptions(options);
    
    // Convertir les filtres de recherche en filtres de repository
    const repositoryFilters = this.convertSearchFilters(filters);
    
    const result = await componentRepository.paginate(validatedOptions, repositoryFilters);

    // Ajouter le contrôle d'accès pour chaque composant
    const componentsWithAccess = await Promise.all(
      result.data.map(component => this.addAccessControl(component, userId))
    );

    return this.createPaginatedResponse({
      ...result,
      data: componentsWithAccess
    }, 'Composants récupérés avec succès');
  }

  /**
   * Recherche des composants avec filtrage avancé
   */
  async searchComponents(
    query: string,
    filters: ComponentSearchFilters = {},
    options: PaginationOptions = {},
    userId?: string
  ) {
    this.logOperation('searchComponents', { query, filters, options, userId });

    if (!query || query.trim().length < 2) {
      throw new ValidationError('La recherche doit contenir au moins 2 caractères');
    }

    // Recherche textuelle de base
    const components = await componentRepository.search(query.trim());
    
    // Appliquer les filtres supplémentaires
    let filteredComponents = this.applyAdvancedFilters(components, filters);
    
    // Trier les résultats
    filteredComponents = this.sortComponents(filteredComponents, filters.sortBy, filters.sortDirection);

    // Pagination manuelle (à optimiser avec une vraie recherche full-text)
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const paginatedComponents = filteredComponents.slice(offset, offset + limit);

    // Ajouter le contrôle d'accès
    const componentsWithAccess = await Promise.all(
      paginatedComponents.map(component => this.addAccessControl(component, userId))
    );

    const totalPages = Math.ceil(filteredComponents.length / limit);

    return this.createPaginatedResponse({
      data: componentsWithAccess,
      pagination: {
        page,
        limit,
        total: filteredComponents.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    }, 'Résultats de recherche récupérés avec succès');
  }

  /**
   * Récupère les composants gratuits
   */
  async getFreeComponents(options: PaginationOptions = {}) {
    this.logOperation('getFreeComponents', { options });

    const components = await componentRepository.findFree();
    
    // Pagination manuelle
    const validatedOptions = this.validatePaginationOptions(options);
    const offset = (validatedOptions.page! - 1) * validatedOptions.limit!;
    const paginatedComponents = components.slice(offset, offset + validatedOptions.limit!);

    const totalPages = Math.ceil(components.length / validatedOptions.limit!);

    // Les composants gratuits sont toujours accessibles
    const componentsWithAccess = paginatedComponents.map(component => ({
      ...component,
      hasAccess: true,
      accessType: 'full_access' as const,
      canViewCode: true,
      canCopy: true,
      canDownload: true,
    }));

    return this.createPaginatedResponse({
      data: componentsWithAccess,
      pagination: {
        page: validatedOptions.page!,
        limit: validatedOptions.limit!,
        total: components.length,
        totalPages,
        hasNext: validatedOptions.page! < totalPages,
        hasPrev: validatedOptions.page! > 1,
      }
    }, 'Composants gratuits récupérés avec succès');
  }

  /**
   * Récupère les composants premium (avec contrôle d'accès)
   */
  async getPremiumComponents(options: PaginationOptions = {}, userId?: string) {
    this.logOperation('getPremiumComponents', { options, userId });

    const components = await componentRepository.findPremium();
    
    // Pagination manuelle
    const validatedOptions = this.validatePaginationOptions(options);
    const offset = (validatedOptions.page! - 1) * validatedOptions.limit!;
    const paginatedComponents = components.slice(offset, offset + validatedOptions.limit!);

    const totalPages = Math.ceil(components.length / validatedOptions.limit!);

    // Ajouter le contrôle d'accès pour les composants premium
    const componentsWithAccess = await Promise.all(
      paginatedComponents.map(component => this.addAccessControl(component, userId))
    );

    return this.createPaginatedResponse({
      data: componentsWithAccess,
      pagination: {
        page: validatedOptions.page!,
        limit: validatedOptions.limit!,
        total: components.length,
        totalPages,
        hasNext: validatedOptions.page! < totalPages,
        hasPrev: validatedOptions.page! > 1,
      }
    }, 'Composants premium récupérés avec succès');
  }

  /**
   * Crée un nouveau composant
   */
  async createComponent(componentData: CreateComponentData, requestingUserId: string): Promise<Component> {
    this.logOperation('createComponent', { name: componentData.name, subcategoryId: componentData.subcategoryId });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    // Validation des données
    this.validateInput(componentData, ['name', 'subcategoryId']);

    // Vérifier que la sous-catégorie existe
    const subcategory = await subcategoryRepository.findById(componentData.subcategoryId);
    this.validateExists(subcategory, 'Sous-catégorie');

    // Générer le slug si non fourni
    if (!componentData.slug) {
      componentData.slug = this.generateSlug(componentData.name);
    }

    // Valider le format du slug
    if (!this.validateSlugFormat(componentData.slug)) {
      throw new ValidationError('Format de slug invalide');
    }

    // Vérifier l'unicité du slug dans la sous-catégorie
    const existingComponent = await componentRepository.findBySlug(componentData.slug, componentData.subcategoryId);
    this.validateUniqueSlug(existingComponent, componentData.slug, 'ce composant');

    // Déterminer l'ordre de tri si non fourni
    if (componentData.sortOrder === undefined) {
      const existingComponents = await componentRepository.findBySubcategoryId(componentData.subcategoryId);
      componentData.sortOrder = existingComponents.length + 1;
    }

    // Préparer les données pour l'insertion
    const componentToCreate = {
      id: this.generateId(),
      subcategoryId: componentData.subcategoryId,
      name: componentData.name,
      slug: componentData.slug,
      description: componentData.description || null,
      isFree: componentData.isFree ?? false,
      requiredTier: componentData.requiredTier || 'pro',
      accessType: componentData.accessType || 'preview_only',
      status: componentData.status || 'draft',
      isNew: componentData.isNew ?? true,
      isFeatured: componentData.isFeatured ?? false,
      conversionRate: componentData.conversionRate || null,
      testedCompanies: componentData.testedCompanies || null,
      previewImageLarge: componentData.previewImageLarge || null,
      previewImageSmall: componentData.previewImageSmall || null,
      previewVideoUrl: componentData.previewVideoUrl || null,
      tags: componentData.tags || null,
      sortOrder: componentData.sortOrder,
      viewCount: 0,
      copyCount: 0,
      publishedAt: componentData.status === 'published' ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
    };

    const createdComponent = await componentRepository.create(componentToCreate);
    
    this.logOperation('createComponent success', { componentId: createdComponent.id });
    return createdComponent;
  }

  /**
   * Met à jour un composant
   */
  async updateComponent(id: string, componentData: UpdateComponentData, requestingUserId: string): Promise<Component> {
    this.logOperation('updateComponent', { id });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    const existingComponent = await componentRepository.findById(id);
    this.validateExists(existingComponent, 'Composant');

    // Valider le slug si modifié
    if (componentData.slug && componentData.slug !== existingComponent!.slug) {
      if (!this.validateSlugFormat(componentData.slug)) {
        throw new ValidationError('Format de slug invalide');
      }

      const existingBySlug = await componentRepository.findBySlug(componentData.slug, existingComponent!.subcategoryId);
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictError('Ce slug est déjà utilisé dans cette sous-catégorie');
      }
    }

    // Gérer la publication
    if (componentData.status === 'published' && existingComponent!.status !== 'published') {
      componentData.publishedAt = new Date();
    }

    // Nettoyer les données
    const allowedFields = [
      'name', 'slug', 'description', 'isFree', 'requiredTier', 'accessType', 'status',
      'isNew', 'isFeatured', 'conversionRate', 'testedCompanies', 'previewImageLarge',
      'previewImageSmall', 'previewVideoUrl', 'tags', 'sortOrder', 'publishedAt', 'archivedAt'
    ];
    const sanitizedData = this.sanitizeInput<UpdateComponentData>(componentData, allowedFields);

    const updatedComponent = await componentRepository.update(id, sanitizedData);
    this.validateExists(updatedComponent, 'Composant mis à jour');

    this.logOperation('updateComponent success', { componentId: id });
    return updatedComponent!;
  }

  /**
   * Supprime un composant
   */
  async deleteComponent(id: string, requestingUserId: string): Promise<void> {
    this.logOperation('deleteComponent', { id });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    const component = await componentRepository.findById(id);
    this.validateExists(component, 'Composant');

    await componentRepository.delete(id);
    this.logOperation('deleteComponent success', { componentId: id });
  }

  /**
   * Incrémente le compteur de vues d'un composant
   */
  async incrementViewCount(id: string): Promise<void> {
    this.logOperation('incrementViewCount', { id });

    const component = await componentRepository.findById(id);
    this.validateExists(component, 'Composant');

    await componentRepository.incrementViewCount(id);
  }

  /**
   * Incrémente le compteur de copies d'un composant (avec vérification d'accès)
   */
  async incrementCopyCount(id: string, userId?: string): Promise<void> {
    this.logOperation('incrementCopyCount', { id, userId });

    const component = await componentRepository.findById(id);
    this.validateExists(component, 'Composant');

    // Vérifier l'accès pour les composants premium
    if (!component!.isFree && userId) {
      const hasAccess = await this.checkPremiumAccess(userId);
      if (!hasAccess) {
        throw new PremiumRequiredError('Licence premium requise pour copier ce composant');
      }
    }

    await componentRepository.incrementCopyCount(id);
  }

  /**
   * Récupère les recommandations pour un composant
   */
  async getComponentRecommendations(componentId: string, userId?: string): Promise<ComponentRecommendations> {
    this.logOperation('getComponentRecommendations', { componentId, userId });

    const component = await componentRepository.findById(componentId);
    this.validateExists(component, 'Composant');

    // Composants similaires (même sous-catégorie)
    const similar = await componentRepository.findBySubcategoryId(component!.subcategoryId);
    const filteredSimilar = similar.filter(c => c.id !== componentId).slice(0, 4);

    // Composants tendance (plus vus récemment)
    const trending = await componentRepository.findPublic();
    const sortedTrending = trending
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 4);

    // Nouveaux composants
    const newComponents = await componentRepository.findPublic();
    const sortedNew = newComponents
      .filter(c => c.isNew)
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
      .slice(0, 4);

    // Composants avec haut taux de conversion
    const highConversion = await componentRepository.findWithFilters({
      hasConversionRate: true,
      minConversionRate: 5.0
    });
    const sortedHighConversion = highConversion
      .sort((a, b) => parseFloat(b.conversionRate || '0') - parseFloat(a.conversionRate || '0'))
      .slice(0, 4);

    return {
      similar: filteredSimilar,
      trending: sortedTrending,
      newComponents: sortedNew,
      highConversion: sortedHighConversion,
    };
  }

  /**
   * Récupère les statistiques globales des composants
   */
  async getComponentStats(): Promise<ComponentStats> {
    this.logOperation('getComponentStats');

    const allComponents = await componentRepository.findPublic();
    const freeComponents = allComponents.filter(c => c.isFree);
    const premiumComponents = allComponents.filter(c => !c.isFree);

    // Calcul du taux de conversion moyen
    const componentsWithConversion = allComponents.filter(c => c.conversionRate);
    const averageConversionRate = componentsWithConversion.length > 0
      ? componentsWithConversion.reduce((sum, c) => sum + parseFloat(c.conversionRate || '0'), 0) / componentsWithConversion.length
      : 0;

    return {
      totalComponents: allComponents.length,
      freeComponents: freeComponents.length,
      premiumComponents: premiumComponents.length,
      publishedComponents: allComponents.length, // Tous sont publiés dans findPublic
      draftComponents: 0, // À calculer avec une requête séparée si nécessaire
      averageConversionRate,
      topCategories: [], // À implémenter avec des jointures
      topFrameworks: [], // À implémenter avec les versions
    };
  }

  /**
   * Ajoute le contrôle d'accès à un composant
   */
  private async addAccessControl(component: Component, userId?: string): Promise<ComponentWithAccess> {
    // Si le composant est gratuit, accès complet
    if (component.isFree) {
      return {
        ...component,
        hasAccess: true,
        accessType: 'full_access',
        canViewCode: true,
        canCopy: true,
        canDownload: true,
      };
    }

    // Si pas d'utilisateur, accès preview seulement
    if (!userId) {
      return {
        ...component,
        hasAccess: false,
        accessType: 'preview_only',
        canViewCode: false,
        canCopy: false,
        canDownload: false,
      };
    }

    // Vérifier l'accès premium
    const hasAccess = await this.checkPremiumAccess(userId);
    
    if (hasAccess) {
      return {
        ...component,
        hasAccess: true,
        accessType: 'full_access',
        canViewCode: true,
        canCopy: true,
        canDownload: true,
      };
    }

    return {
      ...component,
      hasAccess: false,
      accessType: 'preview_only',
      canViewCode: false,
      canCopy: false,
      canDownload: false,
    };
  }

  /**
   * Vérifie l'accès premium d'un utilisateur
   */
  private async checkPremiumAccess(userId: string): Promise<boolean> {
    try {
      return await userRepository.checkSubscription(userId);
    } catch (error) {
      this.logError('checkPremiumAccess', error as Error, { userId });
      return false;
    }
  }

  /**
   * Convertit les filtres de recherche en filtres de repository
   */
  private convertSearchFilters(filters: ComponentSearchFilters): ComponentFilters {
    return {
      subcategoryId: filters.subcategoryId,
      categoryId: filters.categoryId,
      productId: filters.productId,
      isFree: filters.isFree,
      status: filters.status,
      isNew: filters.isNew,
      isFeatured: filters.isFeatured,
      search: filters.search,
      hasConversionRate: filters.hasConversionRate,
      minConversionRate: filters.minConversionRate,
    };
  }

  /**
   * Applique des filtres avancés aux composants
   */
  private applyAdvancedFilters(components: Component[], filters: ComponentSearchFilters): Component[] {
    let filtered = [...components];

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(component => {
        if (!component.tags) return false;
        try {
          const componentTags = typeof component.tags === 'string'
            ? JSON.parse(component.tags)
            : component.tags;
          return filters.tags!.some(tag => componentTags.includes(tag));
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }

  /**
   * Trie les composants selon les critères spécifiés
   */
  private sortComponents(
    components: Component[],
    sortBy: string = 'newest',
    direction: string = 'desc'
  ): Component[] {
    const sorted = [...components];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'newest':
          comparison = new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
          break;
        case 'popular':
          comparison = (b.viewCount || 0) - (a.viewCount || 0);
          break;
        case 'conversion':
          const aRate = parseFloat(a.conversionRate || '0');
          const bRate = parseFloat(b.conversionRate || '0');
          comparison = bRate - aRate;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Valide les permissions d'administration
   */
  private async validateAdminPermissions(userId: string): Promise<void> {
    if (!userId) {
      throw new UnauthorizedError('Authentification requise');
    }

    const user = await userRepository.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      throw new UnauthorizedError('Permissions administrateur requises');
    }
  }
}