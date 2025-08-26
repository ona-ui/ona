import vine from '@vinejs/vine'
import BaseAdminController from './base_admin_controller.js'
import { CategoryService } from '../../services/category_service.js'
import {
  createCategorySchema,
  updateCategorySchema,
  searchCategoriesSchema,
  reorderCategoriesSchema,
  getCategoryStatsSchema
} from '../../validators/category_validators.js'
import type { AdminHttpContext } from '../../types/http_context.js'

/**
 * Contrôleur admin pour la gestion des catégories
 * Gère le CRUD complet, la hiérarchie, l'ordre et les statistiques
 */
export default class CategoriesController extends BaseAdminController {
  private categoryService: CategoryService

  constructor() {
    super()
    this.categoryService = new CategoryService()
  }

  /**
   * Liste paginée des catégories avec statistiques
   * GET /admin/categories
   */
  async index(ctx: AdminHttpContext) {
    try {
      // Validation des paramètres de requête
      const query = await vine.validate({
        schema: searchCategoriesSchema,
        data: ctx.request.qs(),
      })

      // Paramètres de pagination
      const paginationParams = this.validatePaginationParams(query)
      const includeSubcategories = ctx.request.input('includeSubcategories', false)

      // Log de l'action
      this.logAdminAction(ctx, 'list', 'categories', undefined, {
        filters: query,
        pagination: paginationParams,
        includeSubcategories
      })

      // Récupération des catégories avec pagination
      const result = await this.categoryService.listCategories(paginationParams)

      // Enrichir avec les statistiques et sous-catégories si demandé
      const enrichedCategories = await Promise.all(
        result.data.map(async (category: any) => {
          const baseCategory = { ...category }

          if (includeSubcategories) {
            // Récupérer les sous-catégories
            const subcategories = await this.categoryService.getSubcategoriesByCategory(category.id)
            baseCategory.subcategories = subcategories
            baseCategory.subcategoriesCount = subcategories.length
          } else {
            // Juste compter les sous-catégories
            const subcategories = await this.categoryService.getSubcategoriesByCategory(category.id)
            baseCategory.subcategoriesCount = subcategories.length
          }

          baseCategory.componentsCount = 0 // Sera implémenté avec ComponentService
          return baseCategory
        })
      )

      return this.paginatedResponse(
        ctx,
        enrichedCategories,
        result.pagination.total,
        paginationParams.page,
        paginationParams.limit,
        'Catégories récupérées avec succès'
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Détails d'une catégorie avec ses sous-catégories
   * GET /admin/categories/:id
   */
  async show(ctx: AdminHttpContext) {
    try {
      const categoryId = ctx.request.param('id')
      const includeSubcategories = ctx.request.input('includeSubcategories', true)

      // Log de l'action
      this.logAdminAction(ctx, 'show', 'category', categoryId)

      // Récupération de la catégorie
      const category = await this.categoryService.getCategoryById(
        categoryId,
        includeSubcategories
      )

      return this.success(
        ctx,
        category,
        'Catégorie récupérée avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Catégorie')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Création d'une nouvelle catégorie
   * POST /admin/categories
   */
  async store(ctx: AdminHttpContext) {
    try {
      // Validation des données
      const data = await vine.validate({
        schema: createCategorySchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'create', 'category', undefined, {
        name: data.name,
        productId: data.productId
      })

      // Création de la catégorie
      const category = await this.categoryService.createCategory(
        data,
        this.getUserId(ctx)!
      )

      return this.created(
        ctx,
        category,
        'Catégorie créée avec succès'
      )

    } catch (error) {
      if (error.code === 'CONFLICT') {
        return this.conflict(ctx, error.message)
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Mise à jour d'une catégorie
   * PUT /admin/categories/:id
   */
  async update(ctx: AdminHttpContext) {
    try {
      const categoryId = ctx.request.param('id')

      // Validation des données
      const data = await vine.validate({
        schema: updateCategorySchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'update', 'category', categoryId, data)

      // Mise à jour de la catégorie
      const category = await this.categoryService.updateCategory(
        categoryId,
        data,
        this.getUserId(ctx)!
      )

      return this.updated(
        ctx,
        category,
        'Catégorie mise à jour avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Catégorie')
      }
      if (error.code === 'CONFLICT') {
        return this.conflict(ctx, error.message)
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Suppression d'une catégorie
   * DELETE /admin/categories/:id
   */
  async destroy(ctx: AdminHttpContext) {
    try {
      const categoryId = ctx.request.param('id')

      // Log de l'action
      this.logAdminAction(ctx, 'delete', 'category', categoryId)

      // Suppression de la catégorie
      await this.categoryService.deleteCategory(
        categoryId,
        this.getUserId(ctx)!
      )

      return this.deleted(
        ctx,
        'Catégorie supprimée avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Catégorie')
      }
      if (error.message.includes('sous-catégories')) {
        return this.conflict(ctx, error.message)
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Réorganisation de l'ordre des catégories
   * POST /admin/categories/reorder
   */
  async reorder(ctx: AdminHttpContext) {
    try {
      // Validation des données
      const data = await vine.validate({
        schema: reorderCategoriesSchema,
        data: ctx.request.body(),
      })

      // Extraire les IDs dans l'ordre
      const categoryIds = data.categories.map(cat => cat.id)

      // Log de l'action
      this.logAdminAction(ctx, 'reorder', 'categories', undefined, {
        categoryIds,
        count: categoryIds.length
      })

      // Réorganisation
      await this.categoryService.reorderCategories(
        categoryIds,
        this.getUserId(ctx)!
      )

      return this.success(
        ctx,
        { reordered: true, count: categoryIds.length },
        'Catégories réorganisées avec succès'
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Statistiques globales des catégories avec données enrichies
   * GET /admin/categories/global-stats
   */
  async getGlobalStats(ctx: AdminHttpContext) {
    try {
      // Log de l'action
      this.logAdminAction(ctx, 'global-stats', 'categories')

      // Récupération des statistiques globales enrichies
      const globalStats = await this.categoryService.getGlobalStats()

      return this.success(
        ctx,
        globalStats,
        'Statistiques globales récupérées avec succès'
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Statistiques détaillées par catégorie
   * GET /admin/categories/stats
   */
  async getStats(ctx: AdminHttpContext) {
    try {
      // Validation des paramètres
      const query = await vine.validate({
        schema: getCategoryStatsSchema,
        data: ctx.request.qs(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'stats', 'categories', query.categoryId)

      let stats: any

      if (query.categoryId) {
        // Statistiques pour une catégorie spécifique
        const category = await this.categoryService.getCategoryById(
          query.categoryId,
          true
        )

        const subcategories = await this.categoryService.getSubcategoriesByCategory(
          query.categoryId
        )

        stats = {
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            subcategoriesCount: subcategories.length,
            componentsCount: 0, // Sera implémenté avec ComponentService
            isActive: category.isActive,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
          },
          subcategories: subcategories.map(sub => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            componentsCount: 0, // Sera implémenté avec ComponentService
            isActive: sub.isActive,
          })),
        }
      } else {
        // Statistiques globales
        const navigation = await this.categoryService.getNavigationStructure()

        stats = {
          global: {
            totalCategories: navigation.totalCategories,
            totalSubcategories: navigation.totalSubcategories,
            totalComponents: navigation.totalComponents,
            averageComponentsPerCategory: navigation.totalCategories > 0
              ? Math.round(navigation.totalComponents / navigation.totalCategories * 100) / 100
              : 0,
            averageSubcategoriesPerCategory: navigation.totalCategories > 0
              ? Math.round(navigation.totalSubcategories / navigation.totalCategories * 100) / 100
              : 0,
          },
          categories: navigation.categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            subcategoriesCount: cat.subcategories.length,
            componentsCount: cat.subcategories.reduce(
              (sum, sub) => sum + sub.componentsCount, 0
            ),
            isActive: cat.isActive,
          })),
        }
      }

      return this.success(
        ctx,
        stats,
        'Statistiques récupérées avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Catégorie')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Vérification de l'unicité d'un slug
   * POST /admin/categories/check-slug
   */
  async checkSlug(ctx: AdminHttpContext) {
    try {
      const { productId, slug, excludeId } = ctx.request.body()

      // Log de l'action
      this.logAdminAction(ctx, 'check-slug', 'category', undefined, {
        productId,
        slug,
        excludeId
      })

      try {
        const existingCategory = await this.categoryService.getCategoryBySlug(
          slug,
          productId
        )

        // Si on trouve une catégorie et que ce n'est pas celle qu'on exclut
        const isAvailable = excludeId && existingCategory.id === excludeId

        return this.success(ctx, {
          available: isAvailable,
          slug,
          existingCategory: isAvailable ? null : {
            id: existingCategory.id,
            name: existingCategory.name,
          },
        })

      } catch (error) {
        if (error.code === 'NOT_FOUND') {
          // Le slug est disponible
          return this.success(ctx, {
            available: true,
            slug,
            existingCategory: null,
          })
        }
        throw error
      }

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Export des catégories au format JSON
   * GET /admin/categories/export
   */
  async export(ctx: AdminHttpContext) {
    try {
      const productId = ctx.request.input('productId')

      // Log de l'action
      this.logAdminAction(ctx, 'export', 'categories', undefined, { productId })

      // Récupération de la structure complète
      const navigation = await this.categoryService.getNavigationStructure(productId)

      const exportData = {
        exportedAt: new Date().toISOString(),
        productId,
        categories: navigation.categories.map(cat => ({
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          iconName: cat.iconName,
          sortOrder: cat.sortOrder,
          isActive: cat.isActive,
          subcategories: cat.subcategories.map(sub => ({
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
            sortOrder: sub.sortOrder,
            isActive: sub.isActive,
          })),
        })),
        stats: {
          totalCategories: navigation.totalCategories,
          totalSubcategories: navigation.totalSubcategories,
          totalComponents: navigation.totalComponents,
        },
      }

      // Définir les headers pour le téléchargement
      ctx.response.header('Content-Type', 'application/json')
      ctx.response.header(
        'Content-Disposition',
        `attachment; filename="categories-export-${new Date().toISOString().split('T')[0]}.json"`
      )

      return this.success(
        ctx,
        exportData,
        'Export des catégories généré avec succès'
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Opérations en lot sur les catégories
   * POST /admin/categories/batch
   */
  async batch(ctx: AdminHttpContext) {
    try {
      const { operation, categoryIds, data } = ctx.request.body()

      // Log de l'action
      this.logAdminAction(ctx, 'batch', 'categories', undefined, {
        operation,
        categoryIds,
        count: categoryIds?.length
      })

      let result: any

      switch (operation) {
        case 'activate':
          result = await this.batchActivate(categoryIds, true)
          break
        case 'deactivate':
          result = await this.batchActivate(categoryIds, false)
          break
        case 'delete':
          result = await this.batchDelete(categoryIds)
          break
        case 'update':
          result = await this.batchUpdate(categoryIds, data)
          break
        default:
          return this.error(ctx, 'Opération non supportée', 400)
      }

      return this.success(
        ctx,
        result,
        `Opération en lot "${operation}" effectuée avec succès`
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Activation/désactivation en lot
   */
  private async batchActivate(categoryIds: string[], isActive: boolean) {
    const results = []
    const errors = []

    for (const categoryId of categoryIds) {
      try {
        const category = await this.categoryService.updateCategory(
          categoryId,
          { isActive },
          'system' // ID système pour les opérations en lot
        )
        results.push({ id: categoryId, success: true, category })
      } catch (error) {
        errors.push({ id: categoryId, error: error.message })
      }
    }

    return {
      operation: isActive ? 'activate' : 'deactivate',
      processed: categoryIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }

  /**
   * Suppression en lot
   */
  private async batchDelete(categoryIds: string[]) {
    const results = []
    const errors = []

    for (const categoryId of categoryIds) {
      try {
        await this.categoryService.deleteCategory(categoryId, 'system')
        results.push({ id: categoryId, success: true })
      } catch (error) {
        errors.push({ id: categoryId, error: error.message })
      }
    }

    return {
      operation: 'delete',
      processed: categoryIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }

  /**
   * Mise à jour en lot
   */
  private async batchUpdate(categoryIds: string[], updateData: any) {
    const results = []
    const errors = []

    for (const categoryId of categoryIds) {
      try {
        const category = await this.categoryService.updateCategory(
          categoryId,
          updateData,
          'system'
        )
        results.push({ id: categoryId, success: true, category })
      } catch (error) {
        errors.push({ id: categoryId, error: error.message })
      }
    }

    return {
      operation: 'update',
      processed: categoryIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }
}
