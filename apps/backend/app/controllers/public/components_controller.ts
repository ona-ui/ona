import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import BasePublicController, { type OptionalAuthHttpContext } from './base_public_controller.js'
import { ComponentService } from '../../services/component_service.js'
import { CategoryService } from '../../services/category_service.js'
import { FileService } from '../../services/file_service.js'

/**
 * Contrôleur public pour la gestion des composants
 * Permet la découverte et l'accès aux composants avec protection premium
 */
@inject()
export default class ComponentsController extends BasePublicController {
  constructor(
    private componentService: ComponentService,
    private categoryService: CategoryService,
    private fileService: FileService
  ) {
    super()
  }

  /**
   * Liste paginée des composants avec filtres avancés
   * GET /public/components
   */
  async index(ctx: OptionalAuthHttpContext) {
    try {
      const { request } = ctx
      const query = request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          page: vine.number().min(1).optional(),
          limit: vine.number().min(1).max(50).optional(),
          categoryId: vine.string().uuid().optional(),
          subcategoryId: vine.string().uuid().optional(),
          isFree: vine.boolean().optional(),
          status: vine.enum(['published', 'draft', 'archived']).optional(),
          isNew: vine.boolean().optional(),
          isFeatured: vine.boolean().optional(),
          framework: vine.enum(['react', 'vue', 'html', 'angular']).optional(),
          cssFramework: vine.enum(['tailwind_v3', 'tailwind_v4', 'bootstrap', 'css']).optional(),
          tags: vine.array(vine.string()).optional(),
          search: vine.string().minLength(2).maxLength(100).optional(),
          sortBy: vine.enum(['newest', 'popular', 'conversion', 'name']).optional(),
          sortDirection: vine.enum(['asc', 'desc']).optional(),
          hasConversionRate: vine.boolean().optional(),
          minConversionRate: vine.number().min(0).max(100).optional(),
          includeVersions: vine.boolean().optional(),
        }),
        data: query,
      })

      const includeVersions = data.includeVersions || false

      // Paramètres de pagination
      const paginationParams = this.validatePaginationParams(data)

      // Log de l'action
      this.logPublicAction(ctx, 'list', 'components', undefined, {
        filters: data,
        pagination: paginationParams,
        userId: this.getUserId(ctx),
      })

      // Filtres pour les composants publics seulement
      const filters = {
        ...data,
        status: 'published' as const, // Forcer les composants publiés seulement
      }

      // Récupérer les composants avec contrôle d'accès
      const result = await this.componentService.listComponents(
        filters,
        {
          page: paginationParams.page,
          limit: paginationParams.limit,
        },
        this.getUserId(ctx) || undefined
      )

      

      // Enrichir avec des métadonnées publiques et URLs R2
      let enrichedComponents = await Promise.all(result.data.map(async (component) => {
        // Exclure les champs viewCount et copyCount de la réponse publique
        const { viewCount, copyCount,publishedAt,createdAt,testedCompanies, ...componentWithoutCounts } = component as any
        // Récupérer les URLs des assets pour chaque composant
        let componentUrls: {
          preview: string;
          thumbnail: string;
          assets: string[];
        } = {
          preview: '',
          thumbnail: '',
          assets: []
        };

        // Enrichir avec les versions si demandé
        let enrichedComponent = { ...componentWithoutCounts };
        if (includeVersions) {
          try {
            const { VersionService } = await import('../../services/version_service.js')
            const versionService = new VersionService()
            const versions = await versionService.getVersionsByComponentId(component.id, this.getUserId(ctx) || undefined)
            enrichedComponent = {
              ...enrichedComponent,
              versions,
              versionsCount: versions.length
            } as any
          } catch (error) {
            // En cas d'erreur, on continue sans les versions
            enrichedComponent = {
              ...enrichedComponent,
              versions: [],
              versionsCount: 0
            } as any
          }
        }

        try {
          await this.fileService.resolveComponentPath(component.slug || component.id, 'preview');
          // const componentFiles = await this.fileService.getComponentFiles(
          //   paths.category,
          //   paths.number,
          //   paths.version
          // );
          
          // componentUrls = {
          //   preview: componentFiles.preview.url,
          //   thumbnail: componentFiles.thumbnail.url,
          //   assets: componentFiles.assets.map(asset => asset.url)
          // };
        } catch (error) {
          // Ignorer les erreurs pour la liste, les URLs restent vides
        }

        return {
          ...enrichedComponent,
          // Masquer le code premium si pas d'accès (note: codePreview n'existe pas sur ComponentWithAccess)
          // codePreview: component.hasAccess || component.isFree ? component.codePreview : undefined,
          // Ajouter des indicateurs visuels
          accessIndicator: this.getAccessIndicator(component, this.isPremium(ctx)),
          // URLs des fichiers avec stratégie R2-first
          urls: componentUrls
        };
      }))

      
    

      const responseData = {
        components: enrichedComponents,
        pagination: result.pagination,
        filters: {
          applied: data,
          available: await this.getAvailableFilters(),
        },
        metadata: {
          totalFree: await this.getFreeComponentsCount(data),
          totalPremium: await this.getPremiumComponentsCount(data),
          userAccess: {
            isAuthenticated: this.isAuthenticated(ctx),
            isPremium: this.isPremium(ctx),
            canAccessPremium: this.isPremium(ctx),
          },
        }
      }

      // Cache pour 5 minutes
      const cacheKey = `components:list:${JSON.stringify(data)}:${this.getUserId(ctx) || 'anonymous'}`

      return this.success(
        ctx,
        responseData,
        'Composants récupérés avec succès',
        200,
        { ttl: 300, key: cacheKey }
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Détails d'un composant avec protection premium
   * GET /public/components/:id
   */
  async show(ctx: OptionalAuthHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          includeVersions: vine.boolean().optional(),
          includeRecommendations: vine.boolean().optional(),
          trackView: vine.boolean().optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'show', 'component', componentId, data)

      // Récupérer le composant avec contrôle d'accès
      const component = await this.componentService.getComponentById(
        componentId,
        this.getUserId(ctx) || undefined
      )

      // Incrémenter le compteur de vues si demandé
      if (data.trackView !== false) {
        await this.componentService.incrementViewCount(componentId)
      }

      // Récupérer les fichiers du composant avec stratégie R2-first
      let componentFiles;
      try {
        const paths = await this.fileService.resolveComponentPath(component.slug || component.id, 'preview');
        componentFiles = await this.fileService.getComponentFiles(
          paths.category,
          paths.number,
          paths.version,
          this.getUserId(ctx) || undefined
        );
      } catch (error) {
        this.logPublicAction(ctx, 'show-files-error', 'component', componentId, { error: error.message });
        componentFiles = {
          metadata: null,
          preview: { url: '', exists: false },
          thumbnail: { url: '', exists: false },
          assets: []
        };
      }

      // Enrichir avec des données supplémentaires
      let enrichedComponent: any = {
        ...component,
        // Protection du code premium (note: codePreview n'existe pas sur ComponentWithAccess)
        // codePreview: component.hasAccess || component.isFree ? component.codePreview : undefined,
        accessIndicator: this.getAccessIndicator(component, this.isPremium(ctx)),
        // URLs des fichiers avec stratégie R2-first
        urls: {
          preview: componentFiles.preview.url,
          thumbnail: componentFiles.thumbnail.url,
          assets: componentFiles.assets.map(asset => asset.url)
        },
        // Métadonnées enrichies depuis R2
        r2Metadata: componentFiles.metadata,
        // Métadonnées publiques
        metadata: {
          canAccess: component.hasAccess,
          requiresPremium: !component.isFree && !component.hasAccess,
          accessType: component.accessType,
          filesFound: {
            preview: componentFiles.preview.exists,
            thumbnail: componentFiles.thumbnail.exists,
            assetCount: componentFiles.assets.length
          }
        }
      }

      // Ajouter les versions si demandé
      if (data.includeVersions) {
        try {
          const { VersionService } = await import('../../services/version_service.js')
          const versionService = new VersionService()
          const versions = await versionService.getVersionsByComponentId(componentId, this.getUserId(ctx) || undefined)
          enrichedComponent.versions = versions
          enrichedComponent.versionsCount = versions.length
        } catch (error) {
          enrichedComponent.versions = []
          enrichedComponent.versionsCount = 0
        }
      }

      // Ajouter les recommandations si demandé
      if (data.includeRecommendations) {
        const recommendations = await this.componentService.getComponentRecommendations(
          componentId,
          this.getUserId(ctx) || undefined
        )
        enrichedComponent.recommendations = recommendations
      }

      // Métadonnées SEO
      this.addSEOMetadata(ctx, {
        title: `${component.name} - Composant UI`,
        description: component.description || `Découvrez le composant ${component.name}`,
        canonical: `/components/${component.slug}`,
        ogImage: component.previewImageLarge || undefined,
      })

      // Cache pour 10 minutes
      const cacheKey = `component:${componentId}:${this.getUserId(ctx) || 'anonymous'}:${data.includeRecommendations}`

      return this.success(
        ctx,
        enrichedComponent,
        'Composant récupéré avec succès',
        200,
        { ttl: 600, key: cacheKey }
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Recherche full-text dans les composants publics
   * GET /public/components/search
   */
  async search(ctx: OptionalAuthHttpContext) {
    try {
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          q: vine.string().minLength(2).maxLength(100),
          page: vine.number().min(1).optional(),
          limit: vine.number().min(1).max(50).optional(),
          categoryId: vine.string().uuid().optional(),
          subcategoryId: vine.string().uuid().optional(),
          isFree: vine.boolean().optional(),
          tags: vine.array(vine.string()).optional(),
          sortBy: vine.enum(['relevance', 'newest', 'popular', 'conversion', 'name']).optional(),
          sortDirection: vine.enum(['asc', 'desc']).optional(),
        }),
        data: query,
      })

      // Paramètres de pagination
      const paginationParams = this.validatePaginationParams(data)

      // Log de l'action
      this.logPublicAction(ctx, 'search', 'components', undefined, {
        query: data.q,
        filters: data,
        userId: this.getUserId(ctx),
      })

      // Recherche avec filtres
      const filters = {
        ...data,
        status: 'published' as const, // Composants publiés seulement
        search: data.q,
        sortBy: data.sortBy === 'relevance' ? 'newest' : data.sortBy, // Convertir relevance en newest
      }

      const result = await this.componentService.searchComponents(
        data.q,
        filters,
        {
          page: paginationParams.page,
          limit: paginationParams.limit,
        },
        this.getUserId(ctx) || undefined
      )

      // Enrichir les résultats
      const enrichedResults = result.data.map(component => ({
        ...component,
        // codePreview: component.hasAccess || component.isFree ? component.codePreview : undefined,
        accessIndicator: this.getAccessIndicator(component, this.isPremium(ctx)),
        relevanceScore: this.calculateRelevanceScore(component, data.q),
      }))

      const responseData = {
        query: data.q,
        results: enrichedResults,
        pagination: result.pagination,
        suggestions: await this.getSearchSuggestions(data.q),
        metadata: {
          searchTime: Date.now(), // Placeholder pour le temps de recherche
          totalResults: result.pagination?.total || 0,
          hasMore: result.pagination?.hasNext || false,
        }
      }

      // Cache pour 5 minutes
      const cacheKey = `components:search:${data.q}:${JSON.stringify(data)}:${this.getUserId(ctx) || 'anonymous'}`

      return this.success(
        ctx,
        responseData,
        'Résultats de recherche récupérés avec succès',
        200,
        { ttl: 300, key: cacheKey }
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Preview compilé pour iframe (toujours accessible)
   * GET /public/components/:id/preview
   */
  async getPreview(ctx: OptionalAuthHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          framework: vine.enum(['react', 'vue', 'html', 'angular']).optional(),
          cssFramework: vine.enum(['tailwind_v3', 'tailwind_v4', 'bootstrap', 'css']).optional(),
          theme: vine.enum(['light', 'dark']).optional(),
          width: vine.number().min(200).max(1920).optional(),
          height: vine.number().min(200).max(1080).optional(),
          optimized: vine.boolean().optional(),
          fallback: vine.boolean().optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'preview', 'component', componentId, data)

      // Récupérer le composant (preview toujours accessible)
      const component = await this.componentService.getComponentById(
        componentId,
        this.getUserId(ctx) || undefined
      )

      // Essayer de récupérer le preview depuis R2 avec fallback
      let previewContent;
      let source = 'generated';

      try {
        const previewResult = await this.fileService.getComponentWithFallback(
          component.slug || component.id,
          'preview'
        );
        previewContent = previewResult.content;
        source = previewResult.source;

        // Si c'est du HTML compilé, le retourner directement
        if (typeof previewContent === 'string' && previewContent.includes('<!DOCTYPE html>')) {
          ctx.response.header('X-Frame-Options', 'SAMEORIGIN')
          ctx.response.header('Content-Security-Policy', "frame-ancestors 'self'")
          ctx.response.header('Content-Type', 'text/html; charset=utf-8')
          ctx.response.header('X-Preview-Source', source)
          
          return ctx.response.send(previewContent);
        }
      } catch (error) {
        this.logPublicAction(ctx, 'preview-fallback', 'component', componentId, {
          error: error.message,
          fallbackToGenerated: true
        });
      }


      // Headers pour iframe
      ctx.response.header('X-Frame-Options', 'SAMEORIGIN')
      ctx.response.header('Content-Security-Policy', "frame-ancestors 'self'")
      ctx.response.header('X-Preview-Source', 'generated')

      // Cache pour 1 heure
      const cacheKey = `component:preview:${componentId}:${JSON.stringify(data)}`

      return this.success(
        ctx,
        "",
        'Preview généré avec succès',
        200,
        { ttl: 3600, key: cacheKey }
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Recommandations de composants similaires ou populaires
   * GET /public/components/:id/recommendations
   */
  async getRecommendations(ctx: OptionalAuthHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          type: vine.enum(['similar', 'trending', 'new', 'high_conversion', 'all']).optional(),
          limit: vine.number().min(1).max(20).optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'recommendations', 'component', componentId, data)

      // Récupérer les recommandations
      const recommendations = await this.componentService.getComponentRecommendations(
        componentId,
        this.getUserId(ctx) || undefined
      )

      // Filtrer selon le type demandé
      let filteredRecommendations: any = recommendations
      if (data.type && data.type !== 'all') {
        filteredRecommendations = {
          [data.type]: recommendations[data.type as keyof typeof recommendations] || []
        }
      }

      // Limiter le nombre de résultats
      const limit = data.limit || 4
      Object.keys(filteredRecommendations).forEach(key => {
        filteredRecommendations[key] = filteredRecommendations[key].slice(0, limit)
      })

      // Enrichir avec le contrôle d'accès
      const enrichedRecommendations: any = {}
      for (const [key, components] of Object.entries(filteredRecommendations)) {
        enrichedRecommendations[key] = await Promise.all(
          (components as any[]).map(async (comp) => {
            const componentWithAccess = await this.componentService.getComponentById(
              comp.id,
              this.getUserId(ctx) || undefined
            )
            return {
              ...componentWithAccess,
              // codePreview: componentWithAccess.hasAccess || componentWithAccess.isFree ? componentWithAccess.codePreview : undefined,
              accessIndicator: this.getAccessIndicator(componentWithAccess, this.isPremium(ctx)),
            }
          })
        )
      }

      // Cache pour 15 minutes
      const cacheKey = `component:recommendations:${componentId}:${data.type || 'all'}:${this.getUserId(ctx) || 'anonymous'}`

      return this.success(
        ctx,
        enrichedRecommendations,
        'Recommandations récupérées avec succès',
        200,
        { ttl: 900, key: cacheKey }
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Composants d'une catégorie spécifique
   * GET /public/components/category/:categoryId
   */
  async getByCategory(ctx: OptionalAuthHttpContext) {
    try {
      const categoryId = ctx.request.param('categoryId')
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          page: vine.number().min(1).optional(),
          limit: vine.number().min(1).max(50).optional(),
          subcategoryId: vine.string().uuid().optional(),
          isFree: vine.boolean().optional(),
          sortBy: vine.enum(['newest', 'popular', 'conversion', 'name']).optional(),
          sortDirection: vine.enum(['asc', 'desc']).optional(),
        }),
        data: query,
      })

      // Paramètres de pagination
      const paginationParams = this.validatePaginationParams(data)

      // Log de l'action
      this.logPublicAction(ctx, 'by-category', 'components', categoryId, data)

      // Vérifier que la catégorie existe
      const category = await this.categoryService.getCategoryById(categoryId)

      // Récupérer les composants de la catégorie
      const filters = {
        categoryId,
        subcategoryId: data.subcategoryId,
        isFree: data.isFree,
        status: 'published' as const,
        sortBy: data.sortBy,
        sortDirection: data.sortDirection,
      }

      const result = await this.componentService.listComponents(
        filters,
        {
          page: paginationParams.page,
          limit: paginationParams.limit,
        },
        this.getUserId(ctx) || undefined
      )

      // Enrichir les composants
      const enrichedComponents = result.data.map(component => ({
        ...component,
        // codePreview: component.hasAccess || component.isFree ? component.codePreview : undefined,
        accessIndicator: this.getAccessIndicator(component, this.isPremium(ctx)),
      }))

      const responseData = {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
        },
        components: enrichedComponents,
        pagination: result.pagination,
        stats: {
          totalComponents: result.pagination?.total || 0,
          freeComponents: await this.getFreeComponentsCount({ categoryId }),
          premiumComponents: await this.getPremiumComponentsCount({ categoryId }),
        }
      }

      // Métadonnées SEO
      this.addSEOMetadata(ctx, {
        title: `${category.name} - Composants UI`,
        description: category.description || `Découvrez les composants UI de la catégorie ${category.name}`,
        canonical: `/components/category/${category.slug}`,
      })

      // Cache pour 10 minutes
      const cacheKey = `components:category:${categoryId}:${JSON.stringify(data)}:${this.getUserId(ctx) || 'anonymous'}`

      return this.success(
        ctx,
        responseData,
        'Composants de la catégorie récupérés avec succès',
        200,
        { ttl: 600, key: cacheKey }
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Catégorie')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Composants mis en avant
   * GET /public/components/featured
   */
  async getFeatured(ctx: OptionalAuthHttpContext) {
    try {
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          limit: vine.number().min(1).max(20).optional(),
          categoryId: vine.string().uuid().optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'featured', 'components', undefined, data)

      // Récupérer les composants mis en avant
      const filters = {
        isFeatured: true,
        status: 'published' as const,
        categoryId: data.categoryId,
      }

      const result = await this.componentService.listComponents(
        filters,
        {
          page: 1,
          limit: data.limit || 10,
        },
        this.getUserId(ctx) || undefined
      )

      // Enrichir les composants
      const enrichedComponents = result.data.map(component => ({
        ...component,
        // codePreview: component.hasAccess || component.isFree ? component.codePreview : undefined,
        accessIndicator: this.getAccessIndicator(component, this.isPremium(ctx)),
      }))

      const responseData = {
        featured: enrichedComponents,
        metadata: {
          total: result.pagination?.total || 0,
          categoryFilter: data.categoryId,
        }
      }

      // Cache pour 30 minutes
      const cacheKey = `components:featured:${data.categoryId || 'all'}:${this.getUserId(ctx) || 'anonymous'}`

      return this.success(
        ctx,
        responseData,
        'Composants mis en avant récupérés avec succès',
        200,
        { ttl: 1800, key: cacheKey }
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Composants les plus populaires
   * GET /public/components/popular
   */
  async getPopular(ctx: OptionalAuthHttpContext) {
    try {
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          limit: vine.number().min(1).max(20).optional(),
          period: vine.enum(['day', 'week', 'month', 'all']).optional(),
          categoryId: vine.string().uuid().optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'popular', 'components', undefined, data)

      // Récupérer les composants populaires
      const filters = {
        status: 'published' as const,
        categoryId: data.categoryId,
        sortBy: 'popular' as const,
        sortDirection: 'desc' as const,
      }

      const result = await this.componentService.listComponents(
        filters,
        {
          page: 1,
          limit: data.limit || 10,
        },
        this.getUserId(ctx) || undefined
      )

      // Enrichir les composants
      const enrichedComponents = result.data.map(component => ({
        ...component,
        // Note: codePreview n'existe pas sur ComponentWithAccess
        accessIndicator: this.getAccessIndicator(component, this.isPremium(ctx)),
        popularityScore: (component.viewCount || 0) + ((component.copyCount || 0) * 2), // Score de popularité simple
      }))

      const responseData = {
        popular: enrichedComponents,
        metadata: {
          total: result.pagination?.total || 0,
          period: data.period || 'all',
          categoryFilter: data.categoryId,
        }
      }

      // Cache pour 15 minutes
      const cacheKey = `components:popular:${data.period || 'all'}:${data.categoryId || 'all'}:${this.getUserId(ctx) || 'anonymous'}`

      return this.success(
        ctx,
        responseData,
        'Composants populaires récupérés avec succès',
        200,
        { ttl: 900, key: cacheKey }
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Récupère tous les assets d'un composant (images, vidéos, etc.)
   * GET /public/components/:id/assets
   */
  async getComponentAssets(ctx: OptionalAuthHttpContext) {
    try {
      const componentId = ctx.request.param('id')
      const query = ctx.request.qs()

      // Validation des paramètres
      const data = await vine.validate({
        schema: vine.object({
          type: vine.enum(['image', 'video', 'icon', 'asset', 'all']).optional(),
          format: vine.enum(['json', 'urls']).optional(),
        }),
        data: query,
      })

      // Log de l'action
      this.logPublicAction(ctx, 'assets', 'component', componentId, data)

      // Récupérer le composant pour valider l'existence et l'accès
      const component = await this.componentService.getComponentById(
        componentId,
        this.getUserId(ctx) || undefined
      )

      // Récupérer les assets avec stratégie R2-first
      let componentFiles;
      try {
        const paths = await this.fileService.resolveComponentPath(component.slug || component.id, 'assets');
        componentFiles = await this.fileService.getComponentFiles(
          paths.category,
          paths.number,
          paths.version,
          this.getUserId(ctx) || undefined
        );
      } catch (error) {
        this.logPublicAction(ctx, 'assets-error', 'component', componentId, { error: error.message });
        componentFiles = {
          metadata: null,
          preview: { url: '', exists: false },
          thumbnail: { url: '', exists: false },
          assets: []
        };
      }

      // Filtrer les assets selon le type demandé
      let filteredAssets = componentFiles.assets;
      if (data.type && data.type !== 'all') {
        filteredAssets = componentFiles.assets.filter(asset => asset.type === data.type);
      }

      // Formater la réponse selon le format demandé
      const responseData = data.format === 'urls'
        ? filteredAssets.map(asset => asset.url)
        : {
            component: {
              id: component.id,
              slug: component.slug,
              name: component.name
            },
            assets: filteredAssets,
            metadata: {
              total: filteredAssets.length,
              byType: this.groupAssetsByType(filteredAssets),
              preview: {
                url: componentFiles.preview.url,
                exists: componentFiles.preview.exists
              },
              thumbnail: {
                url: componentFiles.thumbnail.url,
                exists: componentFiles.thumbnail.exists
              }
            }
          };

      // Cache pour 30 minutes
      const cacheKey = `component:assets:${componentId}:${data.type || 'all'}:${data.format || 'json'}`

      return this.success(
        ctx,
        responseData,
        'Assets du composant récupérés avec succès',
        200,
        { ttl: 1800, key: cacheKey }
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Incrémente le compteur de copies d'un composant
   * POST /public/components/:id/copy
   */
  async incrementCopyCount(ctx: OptionalAuthHttpContext) {
    try {
      const componentId = ctx.request.param('id')

      // Log de l'action
      this.logPublicAction(ctx, 'copy', 'component', componentId, {
        userId: this.getUserId(ctx),
        userAgent: ctx.request.header('user-agent'),
        ip: ctx.request.ip()
      })

      // Incrémenter le compteur avec vérification d'accès
      await this.componentService.incrementCopyCount(
        componentId,
        this.getUserId(ctx) || undefined
      )

      return this.success(
        ctx,
        {
          componentId,
          message: 'Compteur de copies incrémenté avec succès'
        },
        'Copie enregistrée avec succès',
        200
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Composant')
      }
      if (error.code === 'PREMIUM_REQUIRED') {
        return this.premiumRequired(ctx, 'Licence premium requise pour copier ce composant')
      }
      return this.handleError(ctx, error)
    }
  }

  // =====================================================
  // MÉTHODES PRIVÉES
  // =====================================================

  /**
   * Génère un indicateur d'accès pour l'interface utilisateur
   */
  private getAccessIndicator(component: any, isPremium: boolean) {
    if (component.isFree) {
      return {
        type: 'free',
        label: 'Gratuit',
        canAccess: true,
        icon: 'free',
      }
    }

    if (component.hasAccess || isPremium) {
      return {
        type: 'premium_accessible',
        label: 'Premium',
        canAccess: true,
        icon: 'premium',
      }
    }

    return {
      type: 'premium_locked',
      label: 'Premium',
      canAccess: false,
      icon: 'lock',
      upgradeRequired: true,
    }
  }

  /**
   * Récupère les filtres disponibles pour l'interface
   */
  private async getAvailableFilters() {
    // Implémentation simplifiée - à améliorer avec de vraies données
    return {
      categories: [], // À récupérer depuis CategoryService
      frameworks: ['react', 'vue', 'html', 'angular'],
      cssFrameworks: ['tailwind_v3', 'tailwind_v4', 'bootstrap', 'css'],
      tags: [], // À récupérer depuis les composants populaires
      sortOptions: ['newest', 'popular', 'conversion', 'name'],
    }
  }

  /**
   * Compte les composants gratuits avec filtres
   */
  private async getFreeComponentsCount(filters: any = {}): Promise<number> {
    try {
      const result = await this.componentService.listComponents(
        { ...filters, isFree: true, status: 'published' },
        { page: 1, limit: 1 }
      )
      return result.pagination?.total || 0
    } catch {
      return 0
    }
  }

  /**
   * Compte les composants premium avec filtres
   */
  private async getPremiumComponentsCount(filters: any = {}): Promise<number> {
    try {
      const result = await this.componentService.listComponents(
        { ...filters, isFree: false, status: 'published' },
        { page: 1, limit: 1 }
      )
      return result.pagination?.total || 0
    } catch {
      return 0
    }
  }

  /**
   * Calcule un score de pertinence pour la recherche
   */
  private calculateRelevanceScore(component: any, query: string): number {
    const searchTerm = query.toLowerCase()
    let score = 0

    // Score basé sur le nom
    if (component.name.toLowerCase().includes(searchTerm)) {
      score += 10
    }

    // Score basé sur la description
    if (component.description && component.description.toLowerCase().includes(searchTerm)) {
      score += 5
    }

    // Score basé sur les tags
    if (component.tags) {
      try {
        const tags = typeof component.tags === 'string' ? JSON.parse(component.tags) : component.tags
        if (tags.some((tag: string) => tag.toLowerCase().includes(searchTerm))) {
          score += 3
        }
      } catch {
        // Ignore les erreurs de parsing
      }
    }

    // Bonus pour les composants populaires
    score += Math.min(component.viewCount / 100, 5)

    return score
  }

  /**
   * Génère des suggestions de recherche
   */
  private async getSearchSuggestions(query: string): Promise<string[]> {
    // Implémentation simplifiée - à améliorer avec de vraies suggestions
    const commonSuggestions = [
      'button', 'card', 'modal', 'form', 'navigation', 'hero', 'footer', 'header'
    ]

    return commonSuggestions
      .filter(suggestion => suggestion.includes(query.toLowerCase()))
      .slice(0, 5)
  }

  /**
   * Groupe les assets par type pour les métadonnées
   */
  private groupAssetsByType(assets: Array<{ filename: string; url: string; type: string }>): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    for (const asset of assets) {
      grouped[asset.type] = (grouped[asset.type] || 0) + 1;
    }
    
    return grouped;
  }
}