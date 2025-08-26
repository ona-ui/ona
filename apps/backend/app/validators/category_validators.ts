/**
 * Validators de catégories et sous-catégories pour l'application Ona UI
 * 
 * Ce fichier contient tous les schémas de validation pour la gestion
 * des produits, catégories et sous-catégories.
 */

import vine from '@vinejs/vine'
import {
  slugSchema,
  descriptionSchema,
  uuidSchema,
  paginationSchema,
} from './common_validators.js'

/* =====================================================
   VALIDATORS DE PRODUITS
   ===================================================== */

/**
 * Schéma de validation pour la création d'un produit
 */
export const createProductSchema = vine.object({
  name: vine.string().trim().minLength(1).maxLength(100),
  slug: slugSchema,
  description: descriptionSchema,
  sortOrder: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

/**
 * Schéma de validation pour la mise à jour d'un produit
 */
export const updateProductSchema = vine.object({
  name: vine.string().trim().minLength(1).maxLength(100).optional(),
  slug: slugSchema.optional(),
  description: descriptionSchema,
  sortOrder: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

/* =====================================================
   VALIDATORS DE CATÉGORIES
   ===================================================== */

/**
 * Schéma de validation pour la création d'une catégorie
 */
export const createCategorySchema = vine.object({
  productId: uuidSchema,
  name: vine.string().trim().minLength(1).maxLength(100),
  slug: slugSchema,
  description: descriptionSchema,
  iconName: vine.string().trim().maxLength(50).optional(),
  sortOrder: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

/**
 * Schéma de validation pour la mise à jour d'une catégorie
 */
export const updateCategorySchema = vine.object({
  name: vine.string().trim().minLength(1).maxLength(100).optional(),
  slug: slugSchema.optional(),
  description: descriptionSchema,
  iconName: vine.string().trim().maxLength(50).optional(),
  sortOrder: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

/**
 * Schéma de validation pour la recherche de catégories
 */
export const searchCategoriesSchema = vine.object({
  productId: uuidSchema.optional(),
  q: vine.string().trim().minLength(1).maxLength(255).optional(),
  isActive: vine.boolean().optional(),
  
  // Pagination et tri
  ...paginationSchema.getProperties(),
  sortBy: vine.enum(['name', 'slug', 'sortOrder', 'createdAt', 'updatedAt']).optional(),
  sortOrder: vine.enum(['asc', 'desc']).optional(),
})

/* =====================================================
   VALIDATORS DE SOUS-CATÉGORIES
   ===================================================== */

/**
 * Schéma de validation pour la création d'une sous-catégorie
 */
export const createSubcategorySchema = vine.object({
  categoryId: uuidSchema,
  name: vine.string().trim().minLength(1).maxLength(100),
  slug: slugSchema,
  description: descriptionSchema,
  sortOrder: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

/**
 * Schéma de validation pour la mise à jour d'une sous-catégorie
 */
export const updateSubcategorySchema = vine.object({
  name: vine.string().trim().minLength(1).maxLength(100).optional(),
  slug: slugSchema.optional(),
  description: descriptionSchema,
  sortOrder: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

/**
 * Schéma de validation pour la recherche de sous-catégories
 */
export const searchSubcategoriesSchema = vine.object({
  categoryId: uuidSchema.optional(),
  q: vine.string().trim().minLength(1).maxLength(255).optional(),
  isActive: vine.boolean().optional(),
  
  // Pagination et tri
  ...paginationSchema.getProperties(),
  sortBy: vine.enum(['name', 'slug', 'sortOrder', 'createdAt', 'updatedAt']).optional(),
  sortOrder: vine.enum(['asc', 'desc']).optional(),
})

/* =====================================================
   VALIDATORS DE NAVIGATION
   ===================================================== */

/**
 * Schéma de validation pour obtenir la structure de navigation
 */
export const getNavigationSchema = vine.object({
  productId: uuidSchema.optional(),
  includeInactive: vine.boolean().optional(),
  includeComponentCounts: vine.boolean().optional(),
})

/* =====================================================
   VALIDATORS DE RÉORGANISATION
   ===================================================== */

/**
 * Schéma de validation pour réorganiser les catégories
 */
export const reorderCategoriesSchema = vine.object({
  categories: vine.array(
    vine.object({
      id: uuidSchema,
      sortOrder: vine.number().min(0),
    })
  ).minLength(1),
})

/**
 * Schéma de validation pour réorganiser les sous-catégories
 */
export const reorderSubcategoriesSchema = vine.object({
  subcategories: vine.array(
    vine.object({
      id: uuidSchema,
      sortOrder: vine.number().min(0),
    })
  ).minLength(1),
})

/* =====================================================
   VALIDATORS DE STATISTIQUES
   ===================================================== */

/**
 * Schéma de validation pour obtenir les statistiques de catégories
 */
export const getCategoryStatsSchema = vine.object({
  categoryId: uuidSchema.optional(),
  includeSubcategories: vine.boolean().optional(),
  includeComponentStats: vine.boolean().optional(),
  dateFrom: vine.date().optional(),
  dateTo: vine.date().optional(),
})

/**
 * Schéma de validation pour obtenir les statistiques de sous-catégories
 */
export const getSubcategoryStatsSchema = vine.object({
  subcategoryId: uuidSchema.optional(),
  includeComponentStats: vine.boolean().optional(),
  dateFrom: vine.date().optional(),
  dateTo: vine.date().optional(),
})

/* =====================================================
   VALIDATORS D'IMPORT/EXPORT
   ===================================================== */

/**
 * Schéma de validation pour l'import de catégories
 */
export const importCategoriesSchema = vine.object({
  productId: uuidSchema,
  categories: vine.array(
    vine.object({
      name: vine.string().trim().minLength(1).maxLength(100),
      slug: slugSchema,
      description: descriptionSchema,
      iconName: vine.string().trim().maxLength(50).optional(),
      sortOrder: vine.number().min(0).optional(),
      subcategories: vine.array(
        vine.object({
          name: vine.string().trim().minLength(1).maxLength(100),
          slug: slugSchema,
          description: descriptionSchema,
          sortOrder: vine.number().min(0).optional(),
        })
      ).optional(),
    })
  ).minLength(1),
  overwriteExisting: vine.boolean().optional(),
})

/* =====================================================
   VALIDATORS DE VALIDATION AVANCÉE
   ===================================================== */

/**
 * Schéma de validation pour vérifier l'unicité d'un slug de catégorie
 */
export const checkCategorySlugSchema = vine.object({
  productId: uuidSchema,
  slug: slugSchema,
  excludeId: uuidSchema.optional(), // Pour exclure lors de la mise à jour
})

/**
 * Schéma de validation pour vérifier l'unicité d'un slug de sous-catégorie
 */
export const checkSubcategorySlugSchema = vine.object({
  categoryId: uuidSchema,
  slug: slugSchema,
  excludeId: uuidSchema.optional(), // Pour exclure lors de la mise à jour
})

/* =====================================================
   VALIDATORS DE FILTRAGE AVANCÉ
   ===================================================== */

/**
 * Schéma de validation pour les filtres avancés de catégories
 */
export const advancedCategoryFiltersSchema = vine.object({
  productIds: vine.array(uuidSchema).optional(),
  hasComponents: vine.boolean().optional(),
  hasActiveComponents: vine.boolean().optional(),
  componentCountMin: vine.number().min(0).optional(),
  componentCountMax: vine.number().min(0).optional(),
  createdAfter: vine.date().optional(),
  createdBefore: vine.date().optional(),
  updatedAfter: vine.date().optional(),
  updatedBefore: vine.date().optional(),
})

/**
 * Schéma de validation pour les filtres avancés de sous-catégories
 */
export const advancedSubcategoryFiltersSchema = vine.object({
  categoryIds: vine.array(uuidSchema).optional(),
  hasComponents: vine.boolean().optional(),
  hasActiveComponents: vine.boolean().optional(),
  componentCountMin: vine.number().min(0).optional(),
  componentCountMax: vine.number().min(0).optional(),
  createdAfter: vine.date().optional(),
  createdBefore: vine.date().optional(),
  updatedAfter: vine.date().optional(),
  updatedBefore: vine.date().optional(),
})