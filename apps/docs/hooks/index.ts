// Hooks pour les catégories publiques
export {
  useCategories,
  useCategory,
  useCategoriesNavigation,
  useCategoriesStats,
  usePrefetchCategory,
  useCachedCategory,
  useInvalidateCategories,
  type CategoriesQueryResult,
  type CategoryQueryResult
} from './use-categories'

// Hooks pour les composants publiques
export {
  useComponents,
  useComponent,
  useSearchComponents,
  useFeaturedComponents,
  usePopularComponents,
  useComponentPreview,
  useComponentRecommendations,
  useComponentAssets,
  usePrefetchComponent,
  useCachedComponent,
  useInvalidateComponents,
  type ComponentsQueryResult,
  type ComponentQueryResult,
  type SearchComponentsQueryResult,
  type FeaturedComponentsQueryResult,
  type PopularComponentsQueryResult
} from './use-components'