import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import BasePublicController, { type OptionalAuthHttpContext } from './base_public_controller.js'
import { CategoryService } from '../../services/category_service.js'
import { ComponentService } from '../../services/component_service.js'

/**
 * Contrôleur public pour la gestion des catégories
 * Permet la navigation et la découverte des catégories sans authentification
 */
@inject()
export default class CategoriesController extends BasePublicController {
  constructor(
    private categoryService: CategoryService,
    private componentService: ComponentService
  ) {
    super()
  }

  /**
   * Liste complète des catégories avec sous-catégories et compteurs
   * GET /public/categories
   */
  async index(ctx: OptionalAuthHttpContext) {
    try {
      const { request } = ctx
      const query = request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          productId: vine.string().uuid().optional(),
          includeSubcategories: vine.boolean().optional(),
          includeStats: vine.boolean().optional(),
          sortBy: vine.enum(['name', 'sortOrder', 'componentCount']).optional(),
          sortOrder: vine.enum(['asc', 'desc']).optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'list', 'categories', undefined, {
        productId: data.productId,
        includeSubcategories: data.includeSubcategories,
        includeStats: data.includeStats,
      })

      // Récupérer la structure de navigation complète
      const navigationStructure = await this.categoryService.getNavigationStructure(data.productId)

      // Enrichir avec les statistiques si demandé
      let enrichedCategories = navigationStructure.categories

      if (data.includeStats) {
        // Optimisation: traiter les catégories par batch pour éviter trop de requêtes simultanées
        const batchSize = 5; // Traiter 5 catégories à la fois
        const batches = [];
        
        for (let i = 0; i < navigationStructure.categories.length; i += batchSize) {
          batches.push(navigationStructure.categories.slice(i, i + batchSize));
        }

        enrichedCategories = [];
        
        for (const batch of batches) {
          const batchResults = await Promise.all(
            batch.map(async (category) => {
              try {
                // Utiliser une seule requête pour obtenir tous les composants de la catégorie
                const allComponents = await this.componentService.listComponents(
                  { categoryId: category.id, status: 'published' },
                  { page: 1, limit: 1000 } // Limite élevée pour obtenir le count total
                );

                const totalCount = allComponents.pagination?.total || 0;
                
                // Compter les composants gratuits et premium en une seule passe
                let freeCount = 0;
                let premiumCount = 0;
                
                if (allComponents.data && allComponents.data.length > 0) {
                  // Si on a les données, compter directement
                  for (const component of allComponents.data) {
                    if (component.isFree) {
                      freeCount++;
                    } else {
                      premiumCount++;
                    }
                  }
                } else if (totalCount > 0) {
                  // Sinon, faire des requêtes séparées mais optimisées
                  const [freeResult, premiumResult] = await Promise.all([
                    this.componentService.listComponents(
                      { categoryId: category.id, status: 'published', isFree: true },
                      { page: 1, limit: 1 }
                    ),
                    this.componentService.listComponents(
                      { categoryId: category.id, status: 'published', isFree: false },
                      { page: 1, limit: 1 }
                    )
                  ]);
                  
                  freeCount = freeResult.pagination?.total || 0;
                  premiumCount = premiumResult.pagination?.total || 0;
                }

                return {
                  ...category,
                  publicComponentsCount: totalCount,
                  freeComponentsCount: freeCount,
                  premiumComponentsCount: premiumCount,
                };
              } catch (error) {
                // En cas d'erreur sur une catégorie, continuer avec des valeurs par défaut
                console.error(`Error processing category ${category.id}:`, error);
                return {
                  ...category,
                  publicComponentsCount: 0,
                  freeComponentsCount: 0,
                  premiumComponentsCount: 0,
                };
              }
            })
          );
          
          enrichedCategories.push(...batchResults);
        }
      }

      // Trier si demandé
      if (data.sortBy) {
        enrichedCategories = this.sortCategories(enrichedCategories, data.sortBy, data.sortOrder || 'asc')
      }

      const responseData = {
        categories: enrichedCategories,
        totalCategories: navigationStructure.totalCategories,
        totalSubcategories: navigationStructure.totalSubcategories,
        totalComponents: navigationStructure.totalComponents,
        metadata: {
          includeSubcategories: data.includeSubcategories !== false,
          includeStats: data.includeStats === true,
          productId: data.productId,
        }
      }

      // Cache pour 30 minutes
      const cacheKey = `categories:${data.productId || 'all'}:${data.includeStats}:${data.sortBy || 'default'}`
      
      return this.success(
        ctx,
        responseData,
        'Catégories récupérées avec succès',
        200,
        { ttl: 1800, key: cacheKey }
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Détails d'une catégorie avec ses composants publics
   * GET /public/categories/:id
   */
  async show(ctx: OptionalAuthHttpContext) {
    try {
      const categoryId = ctx.request.param('id')
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          includeSubcategories: vine.boolean().optional(),
          includeComponents: vine.boolean().optional(),
          componentsPage: vine.number().min(1).optional(),
          componentsLimit: vine.number().min(1).max(50).optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'show', 'category', categoryId, data)

      // Récupérer la catégorie avec ses sous-catégories
      const category = await this.categoryService.getCategoryById(
        categoryId,
        data.includeSubcategories !== false
      )

      // Enrichir avec les composants si demandé
      let enrichedCategory: any = category

      if (data.includeComponents) {
        const componentsPage = data.componentsPage || 1
        const componentsLimit = data.componentsLimit || 20

        // Récupérer les composants publics de cette catégorie
        const componentsResult = await this.componentService.listComponents(
          { 
            categoryId: categoryId,
            status: 'published'
          },
          { 
            page: componentsPage,
            limit: componentsLimit
          },
          this.getUserId(ctx) || undefined
        )

        enrichedCategory = {
          ...category,
          components: componentsResult.data,
          componentsPagination: componentsResult.pagination,
        }
      }

      // Ajouter les statistiques publiques
      const stats = await this.getCategoryPublicStats(categoryId)
      enrichedCategory.stats = stats

      // Métadonnées SEO
      this.addSEOMetadata(ctx, {
        title: `${category.name} - Composants UI`,
        description: category.description || `Découvrez les composants UI de la catégorie ${category.name}`,
        canonical: `/categories/${category.slug}`,
      })

      // Cache pour 15 minutes
      const cacheKey = `category:${categoryId}:${data.includeComponents}:${data.componentsPage || 1}`

      return this.success(
        ctx,
        enrichedCategory,
        'Catégorie récupérée avec succès',
        200,
        { ttl: 900, key: cacheKey }
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Catégorie')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Structure de navigation complète pour le frontend
   * GET /public/categories/navigation
   */
  async getNavigation(ctx: OptionalAuthHttpContext) {
    try {
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          productId: vine.string().uuid().optional(),
          includeComponentCounts: vine.boolean().optional(),
          maxDepth: vine.number().min(1).max(3).optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'navigation', 'categories', undefined, data)

      // Récupérer la structure de navigation
      const navigationStructure = await this.categoryService.getNavigationStructure(data.productId)

      // Formater pour la navigation frontend
      const navigation = {
        categories: navigationStructure.categories.map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          iconName: category.iconName,
          componentCount: data.includeComponentCounts ? category.subcategories.reduce(
            (sum, sub) => sum + sub.componentsCount, 0
          ) : undefined,
          subcategories: category.subcategories.map(sub => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            componentCount: data.includeComponentCounts ? sub.componentsCount : undefined,
          })),
        })),
        breadcrumbs: this.generateBreadcrumbs(data.productId),
        metadata: {
          totalCategories: navigationStructure.totalCategories,
          totalSubcategories: navigationStructure.totalSubcategories,
          totalComponents: navigationStructure.totalComponents,
          lastUpdated: new Date().toISOString(),
        }
      }

      // Cache pour 1 heure
      const cacheKey = `navigation:${data.productId || 'all'}:${data.includeComponentCounts}`

      return this.success(
        ctx,
        navigation,
        'Structure de navigation récupérée avec succès',
        200,
        { ttl: 3600, key: cacheKey }
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Statistiques publiques des catégories
   * GET /public/categories/stats
   */
  async getStats(ctx: OptionalAuthHttpContext) {
    try {
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          productId: vine.string().uuid().optional(),
          includeBreakdown: vine.boolean().optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'stats', 'categories', undefined, data)

      // Récupérer les statistiques globales
      const componentStats = await this.componentService.getComponentStats()
      const navigationStructure = await this.categoryService.getNavigationStructure(data.productId)

      const stats = {
        overview: {
          totalCategories: navigationStructure.totalCategories,
          totalSubcategories: navigationStructure.totalSubcategories,
          totalComponents: navigationStructure.totalComponents,
          freeComponents: componentStats.freeComponents,
          premiumComponents: componentStats.premiumComponents,
          averageConversionRate: componentStats.averageConversionRate,
        },
        breakdown: data.includeBreakdown ? await this.getCategoriesBreakdown(data.productId) : undefined,
        trends: {
          popularCategories: await this.getPopularCategories(5),
          recentlyUpdated: await this.getRecentlyUpdatedCategories(5),
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          cacheExpiry: new Date(Date.now() + 1800000).toISOString(), // 30 minutes
        }
      }

      // Cache pour 30 minutes
      const cacheKey = `categories:stats:${data.productId || 'all'}:${data.includeBreakdown}`

      return this.success(
        ctx,
        stats,
        'Statistiques des catégories récupérées avec succès',
        200,
        { ttl: 1800, key: cacheKey }
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Recherche dans les catégories et sous-catégories
   * GET /public/categories/search
   */
  async search(ctx: OptionalAuthHttpContext) {
    try {
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          q: vine.string().minLength(2).maxLength(100),
          productId: vine.string().uuid().optional(),
          includeSubcategories: vine.boolean().optional(),
          limit: vine.number().min(1).max(50).optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'search', 'categories', undefined, {
        query: data.q,
        productId: data.productId,
      })

      // Recherche dans les catégories
      const allCategories = await this.categoryService.getNavigationStructure(data.productId)
      
      const searchResults = this.searchInCategories(
        allCategories.categories,
        data.q,
        data.includeSubcategories !== false,
        data.limit || 20
      )

      const responseData = {
        query: data.q,
        results: searchResults,
        totalResults: searchResults.length,
        metadata: {
          searchIn: data.includeSubcategories !== false ? 'categories_and_subcategories' : 'categories_only',
          productId: data.productId,
        }
      }

      // Cache pour 10 minutes
      const cacheKey = `categories:search:${data.q}:${data.productId || 'all'}:${data.includeSubcategories}`

      return this.success(
        ctx,
        responseData,
        'Résultats de recherche récupérés avec succès',
        200,
        { ttl: 600, key: cacheKey }
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  // =====================================================
  // MÉTHODES PRIVÉES
  // =====================================================


  /**
   * Compte tous les composants d'une catégorie avec répartition gratuit/premium
   */
  private async getCategoryComponentStats(categoryId: string): Promise<{
    total: number;
    free: number;
    premium: number;
  }> {
    try {
      // Faire une seule requête pour obtenir tous les composants
      const allComponents = await this.componentService.listComponents(
        { categoryId, status: 'published' },
        { page: 1, limit: 1000 } // Limite élevée pour obtenir tous les composants
      );

      const total = allComponents.pagination?.total || 0;
      let free = 0;
      let premium = 0;

      if (allComponents.data && allComponents.data.length > 0) {
        // Compter directement depuis les données
        for (const component of allComponents.data) {
          if (component.isFree) {
            free++;
          } else {
            premium++;
          }
        }
      } else if (total > 0) {
        // Fallback: requêtes séparées si les données ne sont pas disponibles
        const [freeResult, premiumResult] = await Promise.all([
          this.componentService.listComponents(
            { categoryId, isFree: true, status: 'published' },
            { page: 1, limit: 1 }
          ),
          this.componentService.listComponents(
            { categoryId, isFree: false, status: 'published' },
            { page: 1, limit: 1 }
          )
        ]);

        free = freeResult.pagination?.total || 0;
        premium = premiumResult.pagination?.total || 0;
      }

      return { total, free, premium };
    } catch (error) {
      console.error(`[CategoriesController] Error getting component stats for category ${categoryId}:`, error);
      return { total: 0, free: 0, premium: 0 };
    }
  }

  /**
   * Récupère les statistiques publiques d'une catégorie (optimisée)
   */
  private async getCategoryPublicStats(categoryId: string) {
    // Utiliser la méthode optimisée pour obtenir les stats en une seule fois
    const stats = await this.getCategoryComponentStats(categoryId);

    return {
      totalComponents: stats.total,
      freeComponents: stats.free,
      premiumComponents: stats.premium,
      lastUpdated: new Date().toISOString(),
    }
  }

  /**
   * Trie les catégories selon les critères spécifiés
   */
  private sortCategories(categories: any[], sortBy: string, sortOrder: string) {
    return [...categories].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'sortOrder':
          comparison = (a.sortOrder || 0) - (b.sortOrder || 0)
          break
        case 'componentCount':
          const aCount = a.subcategories?.reduce((sum: number, sub: any) => sum + (sub.componentsCount || 0), 0) || 0
          const bCount = b.subcategories?.reduce((sum: number, sub: any) => sum + (sub.componentsCount || 0), 0) || 0
          comparison = aCount - bCount
          break
        default:
          comparison = (a.sortOrder || 0) - (b.sortOrder || 0)
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })
  }

  /**
   * Génère les breadcrumbs pour la navigation
   */
  private generateBreadcrumbs(productId?: string) {
    const breadcrumbs = [
      { name: 'Accueil', slug: '/', current: false }
    ]

    if (productId) {
      breadcrumbs.push(
        { name: 'Produits', slug: '/products', current: false },
        { name: 'Catégories', slug: `/products/${productId}/categories`, current: true }
      )
    } else {
      breadcrumbs.push(
        { name: 'Catégories', slug: '/categories', current: true }
      )
    }

    return breadcrumbs
  }

  /**
   * Récupère la répartition détaillée des catégories
   */
  private async getCategoriesBreakdown(productId?: string) {
    const navigationStructure = await this.categoryService.getNavigationStructure(productId)
    
    return navigationStructure.categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      subcategoriesCount: category.subcategories.length,
      componentsCount: category.subcategories.reduce((sum, sub) => sum + sub.componentsCount, 0),
      freeComponentsCount: 0, // À calculer si nécessaire
      premiumComponentsCount: 0, // À calculer si nécessaire
    }))
  }

  /**
   * Récupère les catégories populaires
   */
  private async getPopularCategories(limit: number) {
    // Implémentation simplifiée - à améliorer avec de vraies métriques
    const navigationStructure = await this.categoryService.getNavigationStructure()
    
    return navigationStructure.categories
      .sort((a, b) => {
        const aComponents = a.subcategories.reduce((sum, sub) => sum + sub.componentsCount, 0)
        const bComponents = b.subcategories.reduce((sum, sub) => sum + sub.componentsCount, 0)
        return bComponents - aComponents
      })
      .slice(0, limit)
      .map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        componentsCount: category.subcategories.reduce((sum, sub) => sum + sub.componentsCount, 0),
      }))
  }

  /**
   * Récupère les catégories récemment mises à jour
   */
  private async getRecentlyUpdatedCategories(limit: number) {
    // Implémentation simplifiée - à améliorer avec de vraies dates de mise à jour
    const navigationStructure = await this.categoryService.getNavigationStructure()
    
    return navigationStructure.categories
      .slice(0, limit)
      .map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        updatedAt: new Date().toISOString(), // Placeholder
        componentsCount: category.subcategories.reduce((sum, sub) => sum + sub.componentsCount, 0),
      }))
  }

  /**
   * Recherche dans les catégories et sous-catégories
   */
  private searchInCategories(categories: any[], query: string, includeSubcategories: boolean, limit: number) {
    const results: any[] = []
    const searchTerm = query.toLowerCase()

    for (const category of categories) {
      // Recherche dans le nom et la description de la catégorie
      if (category.name.toLowerCase().includes(searchTerm) || 
          (category.description && category.description.toLowerCase().includes(searchTerm))) {
        results.push({
          type: 'category',
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          componentsCount: category.subcategories.reduce((sum: number, sub: any) => sum + sub.componentsCount, 0),
          match: 'name_or_description',
        })
      }

      // Recherche dans les sous-catégories si demandé
      if (includeSubcategories && category.subcategories) {
        for (const subcategory of category.subcategories) {
          if (subcategory.name.toLowerCase().includes(searchTerm) || 
              (subcategory.description && subcategory.description.toLowerCase().includes(searchTerm))) {
            results.push({
              type: 'subcategory',
              id: subcategory.id,
              name: subcategory.name,
              slug: subcategory.slug,
              description: subcategory.description,
              componentsCount: subcategory.componentsCount,
              category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
              },
              match: 'name_or_description',
            })
          }
        }
      }

      if (results.length >= limit) break
    }

    return results.slice(0, limit)
  }
}