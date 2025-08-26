/**
 * Types pour les produits, catégories et sous-catégories
 */

import type { UUID, Timestamp } from "./common.js";

// =====================================================
// TYPES PRODUIT
// =====================================================

/**
 * Produit (niveau le plus haut de la hiérarchie)
 */
export interface Product {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Produit avec ses catégories
 */
export interface ProductWithCategories extends Product {
  categories: CategoryWithSubcategories[];
  categoryCount: number;
  componentCount: number;
}

/**
 * Données pour créer un produit
 */
export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Données pour mettre à jour un produit
 */
export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// =====================================================
// TYPES CATÉGORIE
// =====================================================

/**
 * Catégorie de composants
 */
export interface Category {
  id: UUID;
  productId: UUID;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Catégorie avec son produit parent
 */
export interface CategoryWithProduct extends Category {
  product: Product;
}

/**
 * Catégorie avec ses sous-catégories
 */
export interface CategoryWithSubcategories extends Category {
  subcategories: SubcategoryWithComponents[];
  subcategoryCount: number;
  componentCount: number;
}

/**
 * Catégorie complète avec produit et sous-catégories
 */
export interface FullCategory extends Category {
  product: Product;
  subcategories: SubcategoryWithComponents[];
  subcategoryCount: number;
  componentCount: number;
}

/**
 * Données pour créer une catégorie
 */
export interface CreateCategoryData {
  productId: UUID;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Données pour mettre à jour une catégorie
 */
export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  iconName?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// =====================================================
// TYPES SOUS-CATÉGORIE
// =====================================================

/**
 * Sous-catégorie de composants
 */
export interface Subcategory {
  id: UUID;
  categoryId: UUID;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Sous-catégorie avec sa catégorie parent
 */
export interface SubcategoryWithCategory extends Subcategory {
  category: CategoryWithProduct;
}

/**
 * Sous-catégorie avec ses composants (référence circulaire évitée)
 */
export interface SubcategoryWithComponents extends Subcategory {
  componentCount: number;
  freeComponentCount: number;
  premiumComponentCount: number;
}

/**
 * Sous-catégorie complète avec hiérarchie
 */
export interface FullSubcategory extends Subcategory {
  category: CategoryWithProduct;
  componentCount: number;
  freeComponentCount: number;
  premiumComponentCount: number;
}

/**
 * Données pour créer une sous-catégorie
 */
export interface CreateSubcategoryData {
  categoryId: UUID;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Données pour mettre à jour une sous-catégorie
 */
export interface UpdateSubcategoryData {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// =====================================================
// TYPES DE NAVIGATION
// =====================================================

/**
 * Élément de navigation pour les catégories
 */
export interface CategoryNavItem {
  id: UUID;
  name: string;
  slug: string;
  iconName?: string;
  componentCount: number;
  subcategories: SubcategoryNavItem[];
}

/**
 * Élément de navigation pour les sous-catégories
 */
export interface SubcategoryNavItem {
  id: UUID;
  name: string;
  slug: string;
  componentCount: number;
}

/**
 * Structure de navigation complète
 */
export interface NavigationStructure {
  products: {
    id: UUID;
    name: string;
    slug: string;
    categories: CategoryNavItem[];
  }[];
}

// =====================================================
// TYPES DE STATISTIQUES
// =====================================================

/**
 * Statistiques d'une catégorie
 */
export interface CategoryStats {
  id: UUID;
  name: string;
  slug: string;
  totalComponents: number;
  freeComponents: number;
  premiumComponents: number;
  publishedComponents: number;
  draftComponents: number;
  subcategoryCount: number;
  averageConversionRate?: number;
  topTags: string[];
}

/**
 * Statistiques d'une sous-catégorie
 */
export interface SubcategoryStats {
  id: UUID;
  name: string;
  slug: string;
  totalComponents: number;
  freeComponents: number;
  premiumComponents: number;
  publishedComponents: number;
  draftComponents: number;
  averageConversionRate?: number;
  topTags: string[];
  viewCount: number;
  copyCount: number;
}

// =====================================================
// TYPES DE RECHERCHE ET FILTRAGE
// =====================================================

/**
 * Filtres pour les catégories
 */
export interface CategoryFilters {
  productId?: UUID;
  isActive?: boolean;
  hasComponents?: boolean;
  search?: string;
}

/**
 * Filtres pour les sous-catégories
 */
export interface SubcategoryFilters {
  categoryId?: UUID;
  productId?: UUID;
  isActive?: boolean;
  hasComponents?: boolean;
  search?: string;
}

/**
 * Options de tri pour les catégories
 */
export interface CategorySortOptions {
  field: "name" | "sortOrder" | "componentCount" | "createdAt" | "updatedAt";
  direction: "asc" | "desc";
}

/**
 * Options de tri pour les sous-catégories
 */
export interface SubcategorySortOptions {
  field: "name" | "sortOrder" | "componentCount" | "createdAt" | "updatedAt";
  direction: "asc" | "desc";
}