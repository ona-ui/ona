/**
 * Index des contrôleurs admin pour l'application Ona UI
 * 
 * Ce fichier exporte tous les contrôleurs admin pour faciliter les imports
 * et maintenir une structure organisée.
 */

// Contrôleur de base
export { default as BaseAdminController } from './base_admin_controller.js'

// Contrôleurs spécialisés
export { default as CategoriesController } from './categories_controller.js'
export { default as SubcategoriesController } from './subcategories_controller.js'
export { default as ComponentsController } from './components_controller.js'
export { default as ComponentVersionsController } from './component_versions_controller.js'
export { default as FilesController } from './files_controller.js'

/**
 * Types et interfaces utiles pour les contrôleurs admin
 */
export type {
  AdminHttpContext,
  AuthenticatedHttpContext,
  SuperAdminHttpContext,
  PremiumHttpContext,
} from '../../types/http_context.js'
/**
 * Services utilisés par les contrôleurs
 */
export { CategoryService } from '../../services/category_service.js'
export { ComponentService } from '../../services/component_service.js'
export { ComponentVersionService } from '../../services/component_version_service.js'
export { FileService } from '../../services/file_service.js'

/**
 * Validators utilisés par les contrôleurs
 */
export {
  createCategorySchema,
  updateCategorySchema,
  searchCategoriesSchema,
  reorderCategoriesSchema,
  getCategoryStatsSchema,
  createSubcategorySchema,
  updateSubcategorySchema,
  searchSubcategoriesSchema,
  reorderSubcategoriesSchema,
  getSubcategoryStatsSchema,
  checkCategorySlugSchema,
  checkSubcategorySlugSchema
} from '../../validators/category_validators.js'

export {
  createComponentSchema,
  updateComponentSchema,
  searchComponentsSchema,
  duplicateComponentSchema,
  publishComponentSchema,
  archiveComponentSchema,
  checkComponentSlugSchema,
  getComponentStatsSchema,
  createVersionSchema,
  updateVersionSchema,
  checkVersionCompatibilitySchema,
  validateComponentCodeSchema,
  copyComponentSchema,
  downloadComponentSchema,
  addToFavoritesSchema,
  removeFromFavoritesSchema
} from '../../validators/component_validators.js'

/**
 * Middlewares utilisés par les contrôleurs
 */
export { default as AdminMiddleware } from '../../middleware/admin_middleware.js'

/**
 * Exemple d'utilisation des contrôleurs
 *
 * ```typescript
 * import {
 *   CategoriesController,
 *   SubcategoriesController,
 *   ComponentsController,
 *   ComponentVersionsController
 * } from './controllers/admin/index.js'
 *
 * // Dans les routes
 * router.get('/admin/categories', [CategoriesController, 'index'])
 * router.post('/admin/categories', [CategoriesController, 'store'])
 *
 * router.get('/admin/subcategories', [SubcategoriesController, 'index'])
 * router.post('/admin/subcategories', [SubcategoriesController, 'store'])
 *
 * router.get('/admin/components', [ComponentsController, 'index'])
 * router.post('/admin/components', [ComponentsController, 'store'])
 * router.get('/admin/components/:id', [ComponentsController, 'show'])
 * router.put('/admin/components/:id', [ComponentsController, 'update'])
 * router.delete('/admin/components/:id', [ComponentsController, 'destroy'])
 *
 * router.get('/admin/components/:componentId/versions', [ComponentVersionsController, 'index'])
 * router.post('/admin/components/:componentId/versions', [ComponentVersionsController, 'store'])
 * router.get('/admin/components/:componentId/versions/:id', [ComponentVersionsController, 'show'])
 * router.put('/admin/components/:componentId/versions/:id', [ComponentVersionsController, 'update'])
 * router.delete('/admin/components/:componentId/versions/:id', [ComponentVersionsController, 'destroy'])
 * ```
 */