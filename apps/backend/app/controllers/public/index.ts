/**
 * Index des contrôleurs publics pour l'application Ona UI
 * 
 * Ce fichier exporte tous les contrôleurs publics pour faciliter les imports
 * et maintenir une structure organisée.
 */

// Contrôleur de base
export { default as BasePublicController } from './base_public_controller.js'

// Contrôleurs spécialisés
export { default as CategoriesController } from './categories_controller.js'
export { default as ComponentsController } from './components_controller.js'

/**
 * Types et interfaces utiles pour les contrôleurs publics
 */
export type { OptionalAuthHttpContext } from './base_public_controller.js'

/**
 * Services utilisés par les contrôleurs publics
 */
export { CategoryService } from '../../services/category_service.js'
export { ComponentService } from '../../services/component_service.js'

/**
 * Middleware utilisé par les contrôleurs publics
 */
export { default as OptionalAuthMiddleware } from '../../middleware/optional_auth_middleware.js'

/**
 * Types depuis les services locaux
 */
export type {
  // Types de composants depuis ComponentService
  ComponentWithAccess,
  ComponentSearchFilters,
  ComponentStats,
  ComponentRecommendations,
} from '../../services/component_service.js'

export type {
  // Types de catégories depuis CategoryService
  CategoryWithStats,
  CategoryHierarchy,
  SubcategoryWithStats,
  NavigationStructure,
} from '../../services/category_service.js'

/**
 * Exemple d'utilisation des contrôleurs publics
 *
 * ```typescript
 * import {
 *   CategoriesController,
 *   ComponentsController,
 *   OptionalAuthMiddleware
 * } from './controllers/public/index.js'
 *
 * // Dans les routes publiques
 * router.get('/public/categories', [CategoriesController, 'index'])
 *   .use([OptionalAuthMiddleware.handle()])
 *
 * router.get('/public/components', [ComponentsController, 'index'])
 *   .use([OptionalAuthMiddleware.withPersonalization()])
 *
 * router.get('/public/components/:id', [ComponentsController, 'show'])
 *   .use([OptionalAuthMiddleware.withRateLimit()])
 * ```
 */
