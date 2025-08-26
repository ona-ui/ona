/**
 * Index des seeders Ona UI
 * 
 * Ce fichier exporte tous les seeders disponibles pour faciliter leur utilisation
 * dans différents contextes (développement, tests, production).
 */

// Utilitaires
export { SeederHelpers } from './utils/seeder_helpers.js'

// Classe de base
export { BaseSeeder } from './base_seeder.js'

// Seeders individuels
export { ProductSeeder } from './product_seeder.js'
export { UserSeeder } from './user_seeder.js'
export { LicenseSeeder } from './license_seeder.js'
export { CategorySeeder } from './category_seeder.js'
export { SubcategorySeeder } from './subcategory_seeder.js'
export { ComponentSeeder } from './component_seeder.js'
export { ComponentVersionSeeder } from './component_version_seeder.js'

// Seeder principal
export { MainSeeder, runMainSeeder } from './main_seeder.js'

/**
 * Configuration des seeders par environnement
 */
export const SEEDER_CONFIG = {
  development: {
    // Environnement de développement - données complètes
    users: 7,
    freeComponents: 30,
    premiumComponents: 220,
    categories: 12,
    subcategories: 40,
    versionsPerComponent: 3
  },
  
  test: {
    // Environnement de test - données minimales
    users: 5,
    freeComponents: 10,
    premiumComponents: 20,
    categories: 5,
    subcategories: 15,
    versionsPerComponent: 2
  },
  
  staging: {
    // Environnement de staging - données réalistes mais réduites
    users: 10,
    freeComponents: 25,
    premiumComponents: 100,
    categories: 10,
    subcategories: 30,
    versionsPerComponent: 2
  },
  
  production: {
    // Production - pas de seeding automatique
    users: 0,
    freeComponents: 0,
    premiumComponents: 0,
    categories: 0,
    subcategories: 0,
    versionsPerComponent: 0
  }
}

/**
 * Obtient la configuration pour l'environnement actuel
 */
export function getSeederConfig() {
  const env = process.env.NODE_ENV || 'development'
  return SEEDER_CONFIG[env as keyof typeof SEEDER_CONFIG] || SEEDER_CONFIG.development
}

/**
 * Types pour les données de seeding
 */
export interface SeederData {
  productIds?: string[]
  mainProductId?: string
  userIds?: string[]
  adminUserId?: string
  editorUserId?: string
  proUserId?: string
  teamUserId?: string
  freeUserId?: string
  licenseIds?: string[]
  proLicenseId?: string
  teamLicenseId?: string
  enterpriseLicenseId?: string
  categoryIds?: string[]
  categories?: Record<string, string>
  subcategoryIds?: string[]
  subcategories?: Record<string, string>
  componentIds?: string[]
  freeComponentIds?: string[]
  premiumComponentIds?: string[]
  versionIds?: string[]
}

/**
 * Déclaration globale pour TypeScript
 */
declare global {
  var seederData: SeederData
}