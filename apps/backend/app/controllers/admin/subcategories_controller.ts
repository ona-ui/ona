import vine from '@vinejs/vine'
import BaseAdminController from './base_admin_controller.js'
import { CategoryService } from '../../services/category_service.js'
import { 
  createSubcategorySchema,
  updateSubcategorySchema,
  searchSubcategoriesSchema,
  reorderSubcategoriesSchema,
  getSubcategoryStatsSchema
} from '../../validators/category_validators.js'
import type { AdminHttpContext } from '../../types/http_context.js'

/**
 * Contrôleur admin pour la gestion des sous-catégories
 * Gère le CRUD complet, les associations avec les catégories parentes,
 * l'ordre au sein de chaque catégorie et les opérations de déplacement
 */
export default class SubcategoriesController extends BaseAdminController {
  private categoryService: CategoryService

  constructor() {
    super()
    this.categoryService = new CategoryService()
  }

  /**
   * Liste des sous-catégories par catégorie parente avec pagination
   * GET /admin/subcategories
   */
  async index(ctx: AdminHttpContext) {
    try {
      // Validation des paramètres de requête
      const query = await vine.validate({
        schema: searchSubcategoriesSchema,
        data: ctx.request.qs(),
      })

      // Paramètres de pagination
      const paginationParams = this.validatePaginationParams(query)

      // Log de l'action
      this.logAdminAction(ctx, 'list', 'subcategories', undefined, { 
        filters: query,
        pagination: paginationParams 
      })

      let subcategories: any[]

      if (query.categoryId) {
        // Récupération des sous-catégories d'une catégorie spécifique
        subcategories = await this.categoryService.getSubcategoriesByCategory(query.categoryId)
        
        // Filtrage et pagination manuelle pour une catégorie spécifique
        let filteredSubcategories = subcategories

        if (query.q) {
          filteredSubcategories = subcategories.filter(sub => 
            sub.name.toLowerCase().includes(query.q!.toLowerCase()) ||
            sub.slug.toLowerCase().includes(query.q!.toLowerCase())
          )
        }

        if (query.isActive !== undefined) {
          filteredSubcategories = filteredSubcategories.filter(sub => 
            sub.isActive === query.isActive
          )
        }

        // Tri
        filteredSubcategories.sort((a, b) => {
          const field = paginationParams.sortBy
          const order = paginationParams.sortOrder === 'asc' ? 1 : -1
          
          if (field === 'sortOrder') {
            return (a.sortOrder - b.sortOrder) * order
          }
          if (field === 'name') {
            return a.name.localeCompare(b.name) * order
          }
          if (field === 'createdAt') {
            return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order
          }
          return 0
        })

        // Pagination manuelle
        const total = filteredSubcategories.length
        const startIndex = (paginationParams.page - 1) * paginationParams.limit
        const endIndex = startIndex + paginationParams.limit
        const paginatedSubcategories = filteredSubcategories.slice(startIndex, endIndex)

        // Enrichir avec les statistiques
        const enrichedSubcategories = await Promise.all(
          paginatedSubcategories.map(async (subcategory: any) => ({
            ...subcategory,
            componentsCount: 0, // Sera implémenté avec ComponentService
          }))
        )

        return this.paginatedResponse(
          ctx,
          enrichedSubcategories,
          total,
          paginationParams.page,
          paginationParams.limit,
          'Sous-catégories récupérées avec succès'
        )

      } else {
        // Récupération de toutes les sous-catégories avec leurs catégories parentes
        // Pour l'instant, on retourne une liste vide car le service n'a pas cette méthode
        return this.paginatedResponse(
          ctx,
          [],
          0,
          paginationParams.page,
          paginationParams.limit,
          'Aucune sous-catégorie trouvée'
        )
      }

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Détails d'une sous-catégorie avec ses composants
   * GET /admin/subcategories/:id
   */
  async show(ctx: AdminHttpContext) {
    try {
      const subcategoryId = ctx.request.param('id')
      const includeCategory = ctx.request.input('includeCategory', true)

      // Log de l'action
      this.logAdminAction(ctx, 'show', 'subcategory', subcategoryId)

      // Récupération de la sous-catégorie
      const subcategory = await this.categoryService.getSubcategoryById(
        subcategoryId, 
        includeCategory
      )

      // Enrichir avec les statistiques
      const enrichedSubcategory = {
        ...subcategory,
        componentsCount: 0, // Sera implémenté avec ComponentService
      }

      return this.success(
        ctx,
        enrichedSubcategory,
        'Sous-catégorie récupérée avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Sous-catégorie')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Création d'une nouvelle sous-catégorie
   * POST /admin/subcategories
   */
  async store(ctx: AdminHttpContext) {
    try {
      // Validation des données
      const data = await vine.validate({
        schema: createSubcategorySchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'create', 'subcategory', undefined, { 
        name: data.name,
        slig: data.slug,
        categoryId: data.categoryId 
      })

      // Création de la sous-catégorie
      const subcategory = await this.categoryService.createSubcategory(
        data,
        this.getUserId(ctx)!
      )

      return this.created(
        ctx,
        subcategory,
        'Sous-catégorie créée avec succès'
      )

    } catch (error) {
      if (error.code === 'CONFLICT') {
        return this.conflict(ctx, error.message)
      }
      if (error.message.includes('Catégorie parent')) {
        return this.notFound(ctx, 'Catégorie parente')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Mise à jour d'une sous-catégorie
   * PUT /admin/subcategories/:id
   */
  async update(ctx: AdminHttpContext) {
    try {
      const subcategoryId = ctx.request.param('id')
      
      // Validation des données
      const data = await vine.validate({
        schema: updateSubcategorySchema,
        data: ctx.request.body(),
      })

      // Log de l'action
      this.logAdminAction(ctx, 'update', 'subcategory', subcategoryId, data)

      // Mise à jour de la sous-catégorie
      const subcategory = await this.categoryService.updateSubcategory(
        subcategoryId,
        data,
        this.getUserId(ctx)!
      )

      return this.updated(
        ctx,
        subcategory,
        'Sous-catégorie mise à jour avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Sous-catégorie')
      }
      if (error.code === 'CONFLICT') {
        return this.conflict(ctx, error.message)
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Suppression d'une sous-catégorie
   * DELETE /admin/subcategories/:id
   */
  async destroy(ctx: AdminHttpContext) {
    try {
      const subcategoryId = ctx.request.param('id')

      // Log de l'action
      this.logAdminAction(ctx, 'delete', 'subcategory', subcategoryId)

      // Suppression de la sous-catégorie
      await this.categoryService.deleteSubcategory(
        subcategoryId,
        this.getUserId(ctx)!
      )

      return this.deleted(
        ctx,
        'Sous-catégorie supprimée avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Sous-catégorie')
      }
      if (error.message.includes('composants')) {
        return this.conflict(ctx, error.message)
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Réorganisation de l'ordre des sous-catégories au sein d'une catégorie
   * POST /admin/subcategories/reorder
   */
  async reorder(ctx: AdminHttpContext) {
    try {
      // Validation des données
      const data = await vine.validate({
        schema: reorderSubcategoriesSchema,
        data: ctx.request.body(),
      })

      // Extraire les IDs dans l'ordre
      const subcategoryIds = data.subcategories.map(sub => sub.id)

      // Log de l'action
      this.logAdminAction(ctx, 'reorder', 'subcategories', undefined, { 
        subcategoryIds,
        count: subcategoryIds.length 
      })

      // Réorganisation
      await this.categoryService.reorderSubcategories(
        subcategoryIds,
        this.getUserId(ctx)!
      )

      return this.success(
        ctx,
        { reordered: true, count: subcategoryIds.length },
        'Sous-catégories réorganisées avec succès'
      )

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Déplacement d'une sous-catégorie vers une autre catégorie parente
   * POST /admin/subcategories/:id/move
   */
  async move(ctx: AdminHttpContext) {
    try {
      const subcategoryId = ctx.request.param('id')
      const { targetCategoryId, newSortOrder } = ctx.request.body()

      // Validation des paramètres
      if (!targetCategoryId) {
        return this.error(ctx, 'ID de la catégorie cible requis', 400)
      }

      // Log de l'action
      this.logAdminAction(ctx, 'move', 'subcategory', subcategoryId, { 
        targetCategoryId,
        newSortOrder 
      })

      // Vérifier que la sous-catégorie existe
      await this.categoryService.getSubcategoryById(subcategoryId)

      // Vérifier que la catégorie cible existe
      await this.categoryService.getCategoryById(targetCategoryId)

      // Effectuer le déplacement
      const updatedSubcategory = await this.categoryService.updateSubcategory(
        subcategoryId,
        { 
          categoryId: targetCategoryId,
          sortOrder: newSortOrder 
        },
        this.getUserId(ctx)!
      )

      return this.success(
        ctx,
        updatedSubcategory,
        'Sous-catégorie déplacée avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Sous-catégorie ou catégorie cible')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Statistiques détaillées d'une sous-catégorie
   * GET /admin/subcategories/:id/stats
   */
  async getStats(ctx: AdminHttpContext) {
    try {
      const subcategoryId = ctx.request.param('id')

      // Validation des paramètres
      await vine.validate({
        schema: getSubcategoryStatsSchema,
        data: { subcategoryId, ...ctx.request.qs() },
      })

      // Log de l'action
      this.logAdminAction(ctx, 'stats', 'subcategory', subcategoryId)

      // Récupération de la sous-catégorie avec sa catégorie parente
      const subcategory = await this.categoryService.getSubcategoryById(
        subcategoryId, 
        true
      )

      // Statistiques de la sous-catégorie
      const stats = {
        subcategory: {
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
          componentsCount: 0, // Sera implémenté avec ComponentService
          isActive: subcategory.isActive,
          sortOrder: subcategory.sortOrder,
          createdAt: subcategory.createdAt,
          updatedAt: subcategory.updatedAt,
        },
        parentCategory: subcategory.category ? {
          id: subcategory.category.id,
          name: subcategory.category.name,
          slug: subcategory.category.slug,
        } : null,
        components: [], // Sera implémenté avec ComponentService
        usage: {
          totalViews: 0,
          totalDownloads: 0,
          totalCopies: 0,
          popularityScore: 0,
        },
      }

      return this.success(
        ctx,
        stats,
        'Statistiques de la sous-catégorie récupérées avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Sous-catégorie')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Vérification de l'unicité d'un slug dans une catégorie
   * POST /admin/subcategories/check-slug
   */
  async checkSlug(ctx: AdminHttpContext) {
    try {
      const { categoryId, slug, excludeId } = ctx.request.body()

      // Validation des paramètres
      if (!categoryId || !slug) {
        return this.error(ctx, 'ID de catégorie et slug requis', 400)
      }

      // Log de l'action
      this.logAdminAction(ctx, 'check-slug', 'subcategory', undefined, { 
        categoryId, 
        slug, 
        excludeId 
      })

      try {
        const existingSubcategory = await this.categoryService.getSubcategoryBySlug(
          slug, 
          categoryId
        )

        // Si on trouve une sous-catégorie et que ce n'est pas celle qu'on exclut
        const isAvailable = excludeId && existingSubcategory.id === excludeId

        return this.success(ctx, {
          available: isAvailable,
          slug,
          existingSubcategory: isAvailable ? null : {
            id: existingSubcategory.id,
            name: existingSubcategory.name,
          },
        })

      } catch (error) {
        if (error.code === 'NOT_FOUND') {
          // Le slug est disponible
          return this.success(ctx, {
            available: true,
            slug,
            existingSubcategory: null,
          })
        }
        throw error
      }

    } catch (error) {
      return this.handleError(ctx, error)
    }
  }

  /**
   * Opérations en lot sur les sous-catégories
   * POST /admin/subcategories/batch
   */
  async batch(ctx: AdminHttpContext) {
    try {
      const { operation, subcategoryIds, data } = ctx.request.body()

      // Log de l'action
      this.logAdminAction(ctx, 'batch', 'subcategories', undefined, { 
        operation, 
        subcategoryIds, 
        count: subcategoryIds?.length 
      })

      let result: any

      switch (operation) {
        case 'activate':
          result = await this.batchActivate(subcategoryIds, true)
          break
        case 'deactivate':
          result = await this.batchActivate(subcategoryIds, false)
          break
        case 'delete':
          result = await this.batchDelete(subcategoryIds)
          break
        case 'move':
          result = await this.batchMove(subcategoryIds, data.targetCategoryId)
          break
        case 'update':
          result = await this.batchUpdate(subcategoryIds, data)
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
   * Export des sous-catégories d'une catégorie au format JSON
   * GET /admin/subcategories/export
   */
  async export(ctx: AdminHttpContext) {
    try {
      const categoryId = ctx.request.input('categoryId')

      if (!categoryId) {
        return this.error(ctx, 'ID de catégorie requis', 400)
      }

      // Log de l'action
      this.logAdminAction(ctx, 'export', 'subcategories', undefined, { categoryId })

      // Récupération de la catégorie et de ses sous-catégories
      const category = await this.categoryService.getCategoryById(categoryId, true) as any

      const subcategories = category.subcategories || []

      const exportData = {
        exportedAt: new Date().toISOString(),
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        subcategories: subcategories.map((sub: any) => ({
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          sortOrder: sub.sortOrder,
          isActive: sub.isActive,
        })),
        stats: {
          totalSubcategories: subcategories.length,
          activeSubcategories: subcategories.filter((sub: any) => sub.isActive).length,
        },
      }

      // Définir les headers pour le téléchargement
      ctx.response.header('Content-Type', 'application/json')
      ctx.response.header(
        'Content-Disposition', 
        `attachment; filename="subcategories-${category.slug}-export-${new Date().toISOString().split('T')[0]}.json"`
      )

      return this.success(
        ctx,
        exportData,
        'Export des sous-catégories généré avec succès'
      )

    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return this.notFound(ctx, 'Catégorie')
      }
      return this.handleError(ctx, error)
    }
  }

  /**
   * Activation/désactivation en lot
   */
  private async batchActivate(subcategoryIds: string[], isActive: boolean) {
    const results = []
    const errors = []

    for (const subcategoryId of subcategoryIds) {
      try {
        const subcategory = await this.categoryService.updateSubcategory(
          subcategoryId,
          { isActive },
          'system' // ID système pour les opérations en lot
        )
        results.push({ id: subcategoryId, success: true, subcategory })
      } catch (error) {
        errors.push({ id: subcategoryId, error: error.message })
      }
    }

    return {
      operation: isActive ? 'activate' : 'deactivate',
      processed: subcategoryIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }

  /**
   * Suppression en lot
   */
  private async batchDelete(subcategoryIds: string[]) {
    const results = []
    const errors = []

    for (const subcategoryId of subcategoryIds) {
      try {
        await this.categoryService.deleteSubcategory(subcategoryId, 'system')
        results.push({ id: subcategoryId, success: true })
      } catch (error) {
        errors.push({ id: subcategoryId, error: error.message })
      }
    }

    return {
      operation: 'delete',
      processed: subcategoryIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }

  /**
   * Déplacement en lot vers une nouvelle catégorie
   */
  private async batchMove(subcategoryIds: string[], targetCategoryId: string) {
    const results = []
    const errors = []

    // Vérifier que la catégorie cible existe
    try {
      await this.categoryService.getCategoryById(targetCategoryId)
    } catch (error) {
      throw new Error('Catégorie cible non trouvée')
    }

    for (const subcategoryId of subcategoryIds) {
      try {
        const subcategory = await this.categoryService.updateSubcategory(
          subcategoryId,
          { categoryId: targetCategoryId },
          'system'
        )
        results.push({ id: subcategoryId, success: true, subcategory })
      } catch (error) {
        errors.push({ id: subcategoryId, error: error.message })
      }
    }

    return {
      operation: 'move',
      processed: subcategoryIds.length,
      successful: results.length,
      failed: errors.length,
      targetCategoryId,
      results,
      errors,
    }
  }

  /**
   * Mise à jour en lot
   */
  private async batchUpdate(subcategoryIds: string[], updateData: any) {
    const results = []
    const errors = []

    for (const subcategoryId of subcategoryIds) {
      try {
        const subcategory = await this.categoryService.updateSubcategory(
          subcategoryId,
          updateData,
          'system'
        )
        results.push({ id: subcategoryId, success: true, subcategory })
      } catch (error) {
        errors.push({ id: subcategoryId, error: error.message })
      }
    }

    return {
      operation: 'update',
      processed: subcategoryIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    }
  }
}