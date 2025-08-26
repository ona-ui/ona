import { BaseService, ValidationError, ConflictError } from './base_service.js';
import { categoryRepository, subcategoryRepository } from '../repositories/index.js';
import type { PaginationOptions } from '../repositories/base_repository.js';
import { categories, subcategories } from '../db/schema.js';

// Types locaux basés sur le schéma de base de données
type Category = typeof categories.$inferSelect;
type CreateCategoryData = typeof categories.$inferInsert;
type UpdateCategoryData = Partial<typeof categories.$inferInsert>;
type Subcategory = typeof subcategories.$inferSelect;
type CreateSubcategoryData = typeof subcategories.$inferInsert;
type UpdateSubcategoryData = Partial<typeof subcategories.$inferInsert>;

export interface CategoryWithStats extends Category {
  subcategoriesCount: number;
  componentsCount: number;
}

export interface CategoryHierarchy extends Category {
  subcategories: SubcategoryWithStats[];
}

export interface SubcategoryWithStats extends Subcategory {
  componentsCount: number;
}

export interface NavigationStructure {
  categories: CategoryHierarchy[];
  totalCategories: number;
  totalSubcategories: number;
  totalComponents: number;
}

export interface GlobalStats {
  totalCategories: number;
  activeCategories: number;
  totalSubcategories: number;
  activeSubcategories: number;
  totalComponents: number;
  publishedComponents: number;
  totalUsers: number;
  totalViews: number;
  totalDownloads: number;
  totalCopies: number;
  totalRevenue: number;
  avgComponentsPerCategory: number;
  avgSubcategoriesPerCategory: number;
  topCategories: Array<{
    id: string;
    name: string;
    slug: string;
    componentCount: number;
    viewCount: number;
    downloadCount: number;
    copyCount: number;
  }>;
  recentActivity: {
    viewsLast7Days: number;
    downloadsLast7Days: number;
    copiesLast7Days: number;
    newUsersLast7Days: number;
  };
  chartData: {
    viewsOverTime: Array<{ date: string; views: number }>;
    downloadsOverTime: Array<{ date: string; downloads: number }>;
    copiesOverTime: Array<{ date: string; copies: number }>;
    revenueOverTime: Array<{ date: string; revenue: number }>;
  };
}

/**
 * Service de gestion des catégories et sous-catégories
 * Gère la hiérarchie, la validation des slugs et les statistiques
 */
export class CategoryService extends BaseService {
  /**
   * Récupère une catégorie par ID avec ses sous-catégories
   */
  async getCategoryById(id: string, includeSubcategories: boolean = false): Promise<Category | CategoryHierarchy> {
    this.logOperation('getCategoryById', { id, includeSubcategories });

    const category = await categoryRepository.findById(id);
    this.validateExists(category, 'Catégorie');

    if (includeSubcategories) {
      const categoryWithSubs = await categoryRepository.findWithSubcategories(id);
      this.validateExists(categoryWithSubs, 'Catégorie avec sous-catégories');

      // Ajouter les statistiques pour chaque sous-catégorie
      const subcategoriesWithStats = await Promise.all(
        categoryWithSubs!.subcategories.map(async (sub) => ({
          ...sub,
          componentsCount: await this.getSubcategoryComponentsCount(sub.id),
        }))
      );

      return {
        ...categoryWithSubs!,
        subcategories: subcategoriesWithStats,
      };
    }

    return category!;
  }

  /**
   * Récupère une catégorie par slug
   */
  async getCategoryBySlug(slug: string, productId?: string): Promise<Category> {
    this.logOperation('getCategoryBySlug', { slug, productId });

    const category = await categoryRepository.findBySlug(slug, productId);
    this.validateExists(category, 'Catégorie');

    return category!;
  }

  /**
   * Récupère toutes les catégories d'un produit
   */
  async getCategoriesByProduct(productId: string): Promise<Category[]> {
    this.logOperation('getCategoriesByProduct', { productId });

    return await categoryRepository.findByProductId(productId);
  }

  /**
   * Crée une nouvelle catégorie
   */
  async createCategory(categoryData: CreateCategoryData, requestingUserId: string): Promise<Category> {
    this.logOperation('createCategory', { name: categoryData.name, productId: categoryData.productId });

    // Valider les permissions
    await this.validateAdminPermissions(requestingUserId);

    // Validation des données
    this.validateInput(categoryData, ['name', 'productId']);

    // Générer le slug si non fourni
    if (!categoryData.slug) {
      categoryData.slug = this.generateSlug(categoryData.name);
    }

    // Valider le format du slug
    if (!this.validateSlugFormat(categoryData.slug)) {
      throw new ValidationError('Format de slug invalide');
    }

    // Vérifier l'unicité du slug dans le produit
    const existingCategory = await categoryRepository.findBySlug(categoryData.slug, categoryData.productId);
    this.validateUniqueSlug(existingCategory, categoryData.slug, 'cette catégorie');

    // Déterminer l'ordre de tri si non fourni
    if (categoryData.sortOrder === undefined) {
      const existingCategories = await categoryRepository.findByProductId(categoryData.productId);
      categoryData.sortOrder = existingCategories.length + 1;
    }

    // Préparer les données pour l'insertion
    const categoryToCreate = {
      id: this.generateId(),
      productId: categoryData.productId,
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description || null,
      iconName: categoryData.iconName || null,
      sortOrder: categoryData.sortOrder,
      isActive: categoryData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdCategory = await categoryRepository.create(categoryToCreate);

    this.logOperation('createCategory success', { categoryId: createdCategory.id });
    return createdCategory;
  }

  /**
   * Met à jour une catégorie
   */
  async updateCategory(id: string, categoryData: UpdateCategoryData, requestingUserId: string): Promise<Category> {
    this.logOperation('updateCategory', { id });

    // Valider les permissions
    await this.validateAdminPermissions(requestingUserId);

    const existingCategory = await categoryRepository.findById(id);
    this.validateExists(existingCategory, 'Catégorie');

    // Valider le slug si modifié
    if (categoryData.slug && categoryData.slug !== existingCategory!.slug) {
      if (!this.validateSlugFormat(categoryData.slug)) {
        throw new ValidationError('Format de slug invalide');
      }

      const existingBySlug = await categoryRepository.findBySlug(categoryData.slug, existingCategory!.productId);
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictError('Ce slug est déjà utilisé dans ce produit');
      }
    }

    // Nettoyer les données
    const allowedFields = ['name', 'slug', 'description', 'iconName', 'sortOrder', 'isActive'];
    const sanitizedData = this.sanitizeInput<UpdateCategoryData>(categoryData, allowedFields);

    const updatedCategory = await categoryRepository.update(id, sanitizedData);
    this.validateExists(updatedCategory, 'Catégorie mise à jour');

    this.logOperation('updateCategory success', { categoryId: id });
    return updatedCategory!;
  }

  /**
   * Supprime une catégorie (avec vérification des dépendances)
   */
  async deleteCategory(id: string, requestingUserId: string): Promise<void> {
    this.logOperation('deleteCategory', { id });

    // Valider les permissions
    await this.validateAdminPermissions(requestingUserId);

    const category = await categoryRepository.findById(id);
    this.validateExists(category, 'Catégorie');

    // Vérifier qu'il n'y a pas de sous-catégories
    const subcategories = await subcategoryRepository.findByCategoryId(id);
    if (subcategories.length > 0) {
      throw new ValidationError('Impossible de supprimer une catégorie qui contient des sous-catégories');
    }

    await categoryRepository.delete(id);
    this.logOperation('deleteCategory success', { categoryId: id });
  }

  /**
   * Liste les catégories avec pagination
   */
  async listCategories(options: PaginationOptions) {
    this.logOperation('listCategories', { options });

    const validatedOptions = this.validatePaginationOptions(options);
    const result = await categoryRepository.paginate(validatedOptions);

    return this.createPaginatedResponse(result, 'Catégories récupérées avec succès');
  }

  /**
   * Récupère une sous-catégorie par ID
   */
  async getSubcategoryById(id: string, includeCategory: boolean = false): Promise<Subcategory | any> {
    this.logOperation('getSubcategoryById', { id, includeCategory });

    if (includeCategory) {
      const subcategoryWithCategory = await subcategoryRepository.findWithCategory(id);
      this.validateExists(subcategoryWithCategory, 'Sous-catégorie avec catégorie');
      return subcategoryWithCategory;
    }

    const subcategory = await subcategoryRepository.findById(id);
    this.validateExists(subcategory, 'Sous-catégorie');
    return subcategory!;
  }

  /**
   * Récupère une sous-catégorie par slug
   */
  async getSubcategoryBySlug(slug: string, categoryId?: string): Promise<Subcategory> {
    this.logOperation('getSubcategoryBySlug', { slug, categoryId });

    const subcategory = await subcategoryRepository.findBySlug(slug, categoryId);
    this.validateExists(subcategory, 'Sous-catégorie');

    return subcategory!;
  }

  /**
   * Récupère toutes les sous-catégories d'une catégorie
   */
  async getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]> {
    this.logOperation('getSubcategoriesByCategory', { categoryId });

    // Vérifier que la catégorie existe
    const category = await categoryRepository.findById(categoryId);
    this.validateExists(category, 'Catégorie');

    return await subcategoryRepository.findByCategoryId(categoryId);
  }

  /**
   * Crée une nouvelle sous-catégorie
   */
  async createSubcategory(subcategoryData: CreateSubcategoryData, requestingUserId: string): Promise<Subcategory> {
    this.logOperation('createSubcategory', { name: subcategoryData.name, categoryId: subcategoryData.categoryId });

    // Valider les permissions
    await this.validateAdminPermissions(requestingUserId);

    // Validation des données
    this.validateInput(subcategoryData, ['name', 'categoryId']);

    // Vérifier que la catégorie parent existe
    const parentCategory = await categoryRepository.findById(subcategoryData.categoryId);
    this.validateExists(parentCategory, 'Catégorie parent');

    // Générer le slug si non fourni
    if (!subcategoryData.slug) {
      subcategoryData.slug = this.generateSlug(subcategoryData.name);
    }

    // Valider le format du slug
    if (!this.validateSlugFormat(subcategoryData.slug)) {
      throw new ValidationError('Format de slug invalide');
    }

    // Vérifier l'unicité du slug dans la catégorie
    const existingSubcategory = await subcategoryRepository.findBySlug(subcategoryData.slug, subcategoryData.categoryId);
    this.validateUniqueSlug(existingSubcategory, subcategoryData.slug, 'cette sous-catégorie');

    // Déterminer l'ordre de tri si non fourni
    if (subcategoryData.sortOrder === undefined) {
      const existingSubcategories = await subcategoryRepository.findByCategoryId(subcategoryData.categoryId);
      subcategoryData.sortOrder = existingSubcategories.length + 1;
    }

    // Préparer les données pour l'insertion
    const subcategoryToCreate = {
      id: this.generateId(),
      categoryId: subcategoryData.categoryId,
      name: subcategoryData.name,
      slug: subcategoryData.slug,
      description: subcategoryData.description || null,
      sortOrder: subcategoryData.sortOrder,
      isActive: subcategoryData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdSubcategory = await subcategoryRepository.create(subcategoryToCreate);

    this.logOperation('createSubcategory success', { subcategoryId: createdSubcategory.id });
    return createdSubcategory;
  }

  /**
   * Met à jour une sous-catégorie
   */
  async updateSubcategory(id: string, subcategoryData: UpdateSubcategoryData, requestingUserId: string): Promise<Subcategory> {
    this.logOperation('updateSubcategory', { id });

    // Valider les permissions
    await this.validateAdminPermissions(requestingUserId);

    const existingSubcategory = await subcategoryRepository.findById(id);
    this.validateExists(existingSubcategory, 'Sous-catégorie');

    // Valider le slug si modifié
    if (subcategoryData.slug && subcategoryData.slug !== existingSubcategory!.slug) {
      if (!this.validateSlugFormat(subcategoryData.slug)) {
        throw new ValidationError('Format de slug invalide');
      }

      const existingBySlug = await subcategoryRepository.findBySlug(subcategoryData.slug, existingSubcategory!.categoryId);
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictError('Ce slug est déjà utilisé dans cette catégorie');
      }
    }

    // Nettoyer les données
    const allowedFields = ['name', 'slug', 'description', 'sortOrder', 'isActive'];
    const sanitizedData = this.sanitizeInput<UpdateSubcategoryData>(subcategoryData, allowedFields);

    const updatedSubcategory = await subcategoryRepository.update(id, sanitizedData);
    this.validateExists(updatedSubcategory, 'Sous-catégorie mise à jour');

    this.logOperation('updateSubcategory success', { subcategoryId: id });
    return updatedSubcategory!;
  }

  /**
   * Supprime une sous-catégorie (avec vérification des dépendances)
   */
  async deleteSubcategory(id: string, requestingUserId: string): Promise<void> {
    this.logOperation('deleteSubcategory', { id });

    // Valider les permissions
    await this.validateAdminPermissions(requestingUserId);

    const subcategory = await subcategoryRepository.findById(id);
    this.validateExists(subcategory, 'Sous-catégorie');

    // Vérifier qu'il n'y a pas de composants
    const componentsCount = await this.getSubcategoryComponentsCount(id);
    if (componentsCount > 0) {
      throw new ValidationError('Impossible de supprimer une sous-catégorie qui contient des composants');
    }

    await subcategoryRepository.delete(id);
    this.logOperation('deleteSubcategory success', { subcategoryId: id });
  }

  /**
   * Récupère la structure de navigation complète
   */
  async getNavigationStructure(productId?: string): Promise<NavigationStructure> {
    this.logOperation('getNavigationStructure', { productId });

    let categories: Category[];

    try {
      if (productId) {
        categories = await categoryRepository.findByProductId(productId);

        // Si aucune catégorie trouvée pour ce productId, essayer de récupérer le premier produit disponible
        if (categories.length === 0) {
          this.logOperation('getNavigationStructure fallback', {
            originalProductId: productId,
            reason: 'no_categories_found'
          });
          categories = await categoryRepository.findActive();
        }
      } else {
        categories = await categoryRepository.findActive();

        // Si aucune catégorie active, log le problème mais continuer avec un tableau vide
        if (categories.length === 0) {
          this.logOperation('getNavigationStructure fallback', {
            reason: 'no_active_categories'
          });
          // Pas de fallback supplémentaire - retourner une structure vide
        }
      }
    } catch (error) {
      this.logError('getNavigationStructure categories fetch', error as Error, { productId });
      // En cas d'erreur, retourner une structure vide plutôt que de faire échouer
      return {
        categories: [],
        totalCategories: 0,
        totalSubcategories: 0,
        totalComponents: 0,
      };
    }

    const categoriesWithSubcategories = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await subcategoryRepository.findByCategoryId(category.id);

        const subcategoriesWithStats = await Promise.all(
          subcategories.map(async (sub) => ({
            ...sub,
            componentsCount: await this.getSubcategoryComponentsCount(sub.id),
          }))
        );

        return {
          ...category,
          subcategories: subcategoriesWithStats,
        };
      })
    );

    const totalSubcategories = categoriesWithSubcategories.reduce(
      (sum, cat) => sum + cat.subcategories.length, 0
    );

    const totalComponents = categoriesWithSubcategories.reduce(
      (sum, cat) => sum + cat.subcategories.reduce((subSum, sub) => subSum + sub.componentsCount, 0), 0
    );

    return {
      categories: categoriesWithSubcategories,
      totalCategories: categories.length,
      totalSubcategories,
      totalComponents,
    };
  }

  /**
   * Réorganise l'ordre des catégories
   */
  async reorderCategories(categoryIds: string[], requestingUserId: string): Promise<void> {
    this.logOperation('reorderCategories', { categoryIds });

    // Valider les permissions
    await this.validateAdminPermissions(requestingUserId);

    await this.withTransaction(async () => {
      for (let i = 0; i < categoryIds.length; i++) {
        await categoryRepository.update(categoryIds[i], { sortOrder: i + 1 });
      }
    });

    this.logOperation('reorderCategories success');
  }

  /**
   * Réorganise l'ordre des sous-catégories
   */
  async reorderSubcategories(subcategoryIds: string[], requestingUserId: string): Promise<void> {
    this.logOperation('reorderSubcategories', { subcategoryIds });

    // Valider les permissions
    await this.validateAdminPermissions(requestingUserId);

    await this.withTransaction(async () => {
      for (let i = 0; i < subcategoryIds.length; i++) {
        await subcategoryRepository.update(subcategoryIds[i], { sortOrder: i + 1 });
      }
    });

    this.logOperation('reorderSubcategories success');
  }

  /**
   * Valide les permissions d'administration
   */
  private async validateAdminPermissions(userId: string): Promise<void> {
    // Cette méthode sera utilisée avec le UserService
    // Pour le moment, on fait une validation simple
    if (!userId) {
      throw new ValidationError('ID utilisateur requis');
    }
  }

  /**
   * Récupère les statistiques globales enrichies avec données temporelles
   */
  async getGlobalStats(): Promise<GlobalStats> {
    this.logOperation('getGlobalStats');

    try {
      // Import dynamique pour éviter les dépendances circulaires
      const { db } = await import('../db/index.js');
      const { categories, subcategories, components, componentViews, componentDownloads, componentCopies, users, licenses } = await import('../db/schema.js');
      const { count, sum, desc } = await import('drizzle-orm');
      const { eq, gte } = await import('drizzle-orm');

      // Date de référence pour les statistiques des 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Statistiques de base
      const [
        totalCategoriesResult,
        activeCategoriesResult,
        totalSubcategoriesResult,
        activeSubcategoriesResult,
        totalComponentsResult,
        publishedComponentsResult,
        totalUsersResult,
        totalViewsResult,
        totalDownloadsResult,
        totalCopiesResult,
        totalRevenueResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(categories),
        db.select({ count: count() }).from(categories).where(eq(categories.isActive, true)),
        db.select({ count: count() }).from(subcategories),
        db.select({ count: count() }).from(subcategories).where(eq(subcategories.isActive, true)),
        db.select({ count: count() }).from(components),
        db.select({ count: count() }).from(components).where(eq(components.status, 'published')),
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(componentViews),
        db.select({ count: count() }).from(componentDownloads),
        db.select({ count: count() }).from(componentCopies),
        db.select({ total: sum(licenses.amountPaid) }).from(licenses).where(eq(licenses.paymentStatus, 'completed')),
      ]);

      // Activité récente (7 derniers jours)
      const [
        recentViewsResult,
        recentDownloadsResult,
        recentCopiesResult,
        recentUsersResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(componentViews).where(gte(componentViews.viewedAt, sevenDaysAgo)),
        db.select({ count: count() }).from(componentDownloads).where(gte(componentDownloads.downloadedAt, sevenDaysAgo)),
        db.select({ count: count() }).from(componentCopies).where(gte(componentCopies.copiedAt, sevenDaysAgo)),
        db.select({ count: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
      ]);

      // Top catégories avec statistiques
      const topCategoriesResult = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          componentCount: count(components.id),
        })
        .from(categories)
        .leftJoin(subcategories, eq(categories.id, subcategories.categoryId))
        .leftJoin(components, eq(subcategories.id, components.subcategoryId))
        .where(eq(categories.isActive, true))
        .groupBy(categories.id, categories.name, categories.slug)
        .orderBy(desc(count(components.id)))
        .limit(10);

      // Enrichir les top catégories avec les statistiques de vues, téléchargements et copies
      const topCategories = await Promise.all(
        topCategoriesResult.map(async (category) => {
          const [viewsResult, downloadsResult, copiesResult] = await Promise.all([
            db
              .select({ count: count() })
              .from(componentViews)
              .leftJoin(components, eq(componentViews.componentId, components.id))
              .leftJoin(subcategories, eq(components.subcategoryId, subcategories.id))
              .where(eq(subcategories.categoryId, category.id)),
            db
              .select({ count: count() })
              .from(componentDownloads)
              .leftJoin(components, eq(componentDownloads.componentId, components.id))
              .leftJoin(subcategories, eq(components.subcategoryId, subcategories.id))
              .where(eq(subcategories.categoryId, category.id)),
            db
              .select({ count: count() })
              .from(componentCopies)
              .leftJoin(components, eq(componentCopies.componentId, components.id))
              .leftJoin(subcategories, eq(components.subcategoryId, subcategories.id))
              .where(eq(subcategories.categoryId, category.id)),
          ]);

          return {
            ...category,
            viewCount: viewsResult[0]?.count || 0,
            downloadCount: downloadsResult[0]?.count || 0,
            copyCount: copiesResult[0]?.count || 0,
          };
        })
      );

      // Données pour les graphiques (30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const chartData = await this.generateChartData(thirtyDaysAgo);

      // Calculs des moyennes
      const totalCats = totalCategoriesResult[0]?.count || 0;
      const totalComps = totalComponentsResult[0]?.count || 0;
      const totalSubs = totalSubcategoriesResult[0]?.count || 0;

      const globalStats: GlobalStats = {
        totalCategories: totalCats,
        activeCategories: activeCategoriesResult[0]?.count || 0,
        totalSubcategories: totalSubs,
        activeSubcategories: activeSubcategoriesResult[0]?.count || 0,
        totalComponents: totalComps,
        publishedComponents: publishedComponentsResult[0]?.count || 0,
        totalUsers: totalUsersResult[0]?.count || 0,
        totalViews: totalViewsResult[0]?.count || 0,
        totalDownloads: totalDownloadsResult[0]?.count || 0,
        totalCopies: totalCopiesResult[0]?.count || 0,
        totalRevenue: Number(totalRevenueResult[0]?.total) || 0,
        avgComponentsPerCategory: totalCats > 0 ? Math.round((totalComps / totalCats) * 100) / 100 : 0,
        avgSubcategoriesPerCategory: totalCats > 0 ? Math.round((totalSubs / totalCats) * 100) / 100 : 0,
        topCategories,
        recentActivity: {
          viewsLast7Days: recentViewsResult[0]?.count || 0,
          downloadsLast7Days: recentDownloadsResult[0]?.count || 0,
          copiesLast7Days: recentCopiesResult[0]?.count || 0,
          newUsersLast7Days: recentUsersResult[0]?.count || 0,
        },
        chartData,
      };

      this.logOperation('getGlobalStats success', {
        totalCategories: globalStats.totalCategories,
        totalComponents: globalStats.totalComponents,
        totalUsers: globalStats.totalUsers,
      });

      return globalStats;
    } catch (error) {
      this.logError('getGlobalStats', error as Error);

      // Retourner des statistiques par défaut en cas d'erreur
      return {
        totalCategories: 0,
        activeCategories: 0,
        totalSubcategories: 0,
        activeSubcategories: 0,
        totalComponents: 0,
        publishedComponents: 0,
        totalUsers: 0,
        totalViews: 0,
        totalDownloads: 0,
        totalCopies: 0,
        totalRevenue: 0,
        avgComponentsPerCategory: 0,
        avgSubcategoriesPerCategory: 0,
        topCategories: [],
        recentActivity: {
          viewsLast7Days: 0,
          downloadsLast7Days: 0,
          copiesLast7Days: 0,
          newUsersLast7Days: 0,
        },
        chartData: {
          viewsOverTime: [],
          downloadsOverTime: [],
          copiesOverTime: [],
          revenueOverTime: [],
        },
      };
    }
  }

  /**
   * Génère les données pour les graphiques temporels
   */
  private async generateChartData(_startDate: Date) {
    try {
      const { db } = await import('../db/index.js');
      const { componentViews, componentDownloads, componentCopies, licenses } = await import('../db/schema.js');
      const { sql, count, sum } = await import('drizzle-orm');
      const { gte, eq, and } = await import('drizzle-orm');

      // Générer les 30 derniers jours
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
      }

      // Récupérer les données pour chaque jour
      const [viewsData, downloadsData, copiesData, revenueData] = await Promise.all([
        Promise.all(
          days.map(async (day) => {
            const dayStart = new Date(day + 'T00:00:00.000Z');
            const dayEnd = new Date(day + 'T23:59:59.999Z');
            const result = await db
              .select({ count: count() })
              .from(componentViews)
              .where(and(gte(componentViews.viewedAt, dayStart), sql`${componentViews.viewedAt} < ${dayEnd}`));
            return { date: day, views: result[0]?.count || 0 };
          })
        ),
        Promise.all(
          days.map(async (day) => {
            const dayStart = new Date(day + 'T00:00:00.000Z');
            const dayEnd = new Date(day + 'T23:59:59.999Z');
            const result = await db
              .select({ count: count() })
              .from(componentDownloads)
              .where(and(gte(componentDownloads.downloadedAt, dayStart), sql`${componentDownloads.downloadedAt} < ${dayEnd}`));
            return { date: day, downloads: result[0]?.count || 0 };
          })
        ),
        Promise.all(
          days.map(async (day) => {
            const dayStart = new Date(day + 'T00:00:00.000Z');
            const dayEnd = new Date(day + 'T23:59:59.999Z');
            const result = await db
              .select({ count: count() })
              .from(componentCopies)
              .where(and(gte(componentCopies.copiedAt, dayStart), sql`${componentCopies.copiedAt} < ${dayEnd}`));
            return { date: day, copies: result[0]?.count || 0 };
          })
        ),
        Promise.all(
          days.map(async (day) => {
            const dayStart = new Date(day + 'T00:00:00.000Z');
            const dayEnd = new Date(day + 'T23:59:59.999Z');
            const result = await db
              .select({ total: sum(licenses.amountPaid) })
              .from(licenses)
              .where(
                and(
                  gte(licenses.createdAt, dayStart),
                  sql`${licenses.createdAt} < ${dayEnd}`,
                  eq(licenses.paymentStatus, 'completed')
                )
              );
            return { date: day, revenue: Number(result[0]?.total) || 0 };
          })
        ),
      ]);

      return {
        viewsOverTime: viewsData,
        downloadsOverTime: downloadsData,
        copiesOverTime: copiesData,
        revenueOverTime: revenueData,
      };
    } catch (error) {
      this.logError('generateChartData', error as Error);
      return {
        viewsOverTime: [],
        downloadsOverTime: [],
        copiesOverTime: [],
        revenueOverTime: [],
      };
    }
  }

  /**
   * Compte le nombre de composants dans une sous-catégorie
   */
  private async getSubcategoryComponentsCount(subcategoryId: string): Promise<number> {
    try {
      // Importer le ComponentService dynamiquement pour éviter les dépendances circulaires
      const { componentRepository } = await import('../repositories/index.js');

      // Compter les composants publiés dans cette sous-catégorie
      const components = await componentRepository.findBySubcategoryId(subcategoryId);
      const publishedComponents = components.filter(c => c.status === 'published');

      // this.logOperation('getSubcategoryComponentsCount', {
      //   subcategoryId,
      //   totalComponents: components.length,
      //   publishedComponents: publishedComponents.length
      // });

      return publishedComponents.length;
    } catch (error) {
      this.logError('getSubcategoryComponentsCount', error as Error, { subcategoryId });
      // En cas d'erreur, retourner 0 plutôt que de faire échouer toute la requête
      return 0;
    }
  }
}
