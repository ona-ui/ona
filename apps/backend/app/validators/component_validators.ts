/**
 * Validators de composants et versions pour l'application Ona UI
 * 
 * Ce fichier contient tous les schémas de validation pour la gestion
 * des composants, leurs versions, et toutes les opérations associées.
 */

import vine from '@vinejs/vine'
import {
  slugSchema,
  descriptionSchema,
  uuidSchema,
  paginationSchema,
  tagsSchema,
  dependenciesSchema,
  configRequiredSchema,
  integrationsSchema,
  componentFilesSchema,
  integrationCodeSchema,
  versionNumberSchema,
  frameworkTypeSchema,
  cssFrameworkSchema,
  componentStatusSchema,
  licenseTierSchema,
  accessTypeSchema,
  copiedTargetSchema,
  urlSchema,
  optionalUrlSchema,
} from './common_validators.js'

/* =====================================================
   VALIDATORS DE COMPOSANTS
   ===================================================== */

/**
 * Schéma de validation pour la création d'un composant
 */
export const createComponentSchema = vine.object({
  subcategoryId: uuidSchema,
  name: vine.string().trim().minLength(1).maxLength(255),
  slug: slugSchema,
  description: descriptionSchema,
  
  // Configuration d'accès
  isFree: vine.boolean().optional(),
  requiredTier: licenseTierSchema.optional(),
  accessType: accessTypeSchema.optional(),
  
  // Statut et flags
  status: componentStatusSchema.optional(),
  isNew: vine.boolean().optional(),
  isFeatured: vine.boolean().optional(),
  
  // Métadonnées de conversion
  conversionRate: vine.number().min(0).max(100).optional(),
  testedCompanies: vine.array(vine.string().trim().minLength(1)).optional(),
  
  // Médias
  previewImageLarge: urlSchema.optional(),
  previewImageSmall: urlSchema.optional(),
  previewVideoUrl: urlSchema.optional(),
  
  // Tags et organisation
  tags: tagsSchema,
  sortOrder: vine.number().min(0).optional(),
})

/**
 * Schéma de validation pour la mise à jour d'un composant
 */
export const updateComponentSchema = vine.object({
  name: vine.string().trim().minLength(1).maxLength(255).optional(),
  slug: slugSchema.optional(),
  description: descriptionSchema,
  
  // Configuration d'accès
  isFree: vine.boolean().optional(),
  requiredTier: licenseTierSchema.optional(),
  accessType: accessTypeSchema.optional(),
  
  // Statut et flags
  status: componentStatusSchema.optional(),
  isNew: vine.boolean().optional(),
  isFeatured: vine.boolean().optional(),
  
  // Métadonnées de conversion
  conversionRate: vine.number().min(0).max(100).optional(),
  testedCompanies: vine.array(vine.string().trim().minLength(1)).optional(),
  
  // Médias
  previewImageLarge: urlSchema.optional(),
  previewImageSmall: urlSchema.optional(),
  previewVideoUrl: urlSchema.optional(),
  
  // Tags et organisation
  tags: tagsSchema,
  sortOrder: vine.number().min(0).optional(),
})

/* =====================================================
   VALIDATORS DE VERSIONS DE COMPOSANTS
   ===================================================== */

/**
 * Schéma de validation pour la création d'une version de composant
 */
export const createVersionSchema = vine.object({
  componentId: uuidSchema,
  versionNumber: versionNumberSchema,
  framework: frameworkTypeSchema,
  cssFramework: cssFrameworkSchema,
  
  // Code
  codePreview: vine.string().trim().optional(),
  codeFull: vine.string().trim().optional(),
  codeEncrypted: vine.string().trim().optional(),
  
  // Configuration
  dependencies: dependenciesSchema,
  configRequired: configRequiredSchema,
  
  // Mode sombre
  supportsDarkMode: vine.boolean().optional(),
  darkModeCode: vine.string().trim().optional(),
  
  // Intégrations
  integrations: integrationsSchema,
  integrationCode: integrationCodeSchema,
  
  // Fichiers
  files: componentFilesSchema,
  
  // Flags
  isDefault: vine.boolean().optional(),
})

/**
 * Schéma de validation pour la mise à jour d'une version de composant
 */
export const updateVersionSchema = vine.object({
  versionNumber: versionNumberSchema.optional(),
  
  // Code
  codePreview: vine.string().trim().optional(),
  codeFull: vine.string().trim().optional(),
  codeEncrypted: vine.string().trim().optional(),
  
  // Configuration
  dependencies: dependenciesSchema,
  configRequired: configRequiredSchema,
  
  // Mode sombre
  supportsDarkMode: vine.boolean().optional(),
  darkModeCode: vine.string().trim().optional(),
  
  // Intégrations
  integrations: integrationsSchema,
  integrationCode: integrationCodeSchema,
  
  // Fichiers
  files: componentFilesSchema,
  
  // Flags
  isDefault: vine.boolean().optional(),
})

/* =====================================================
   VALIDATORS DE RECHERCHE ET FILTRAGE
   ===================================================== */

/**
 * Schéma de validation pour la recherche de composants
 */
export const searchComponentsSchema = vine.object({
  // Recherche textuelle
  q: vine.string().trim().minLength(1).maxLength(255).optional(),
  
  // Filtres de catégorisation
  subcategoryId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  productId: uuidSchema.optional(),
  
  // Filtres techniques
  framework: frameworkTypeSchema.optional(),
  cssFramework: cssFrameworkSchema.optional(),
  supportsDarkMode: vine.boolean().optional(),
  
  // Filtres d'accès
  isFree: vine.boolean().optional(),
  requiredTier: licenseTierSchema.optional(),
  accessType: accessTypeSchema.optional(),
  
  // Filtres de statut
  status: componentStatusSchema.optional(),
  isNew: vine.boolean().optional(),
  isFeatured: vine.boolean().optional(),
  
  // Filtres par tags
  tags: vine.array(vine.string()).optional(),
  tagsMode: vine.enum(['any', 'all']).optional(), // any = OR, all = AND
  
  // Filtres de performance
  minConversionRate: vine.number().min(0).max(100).optional(),
  maxConversionRate: vine.number().min(0).max(100).optional(),
  
  // Filtres d'intégration
  hasStripeIntegration: vine.boolean().optional(),
  hasPosthogIntegration: vine.boolean().optional(),
  hasSupabaseIntegration: vine.boolean().optional(),
  hasClerkIntegration: vine.boolean().optional(),
  hasNextauthIntegration: vine.boolean().optional(),
  
  // Filtres de dates
  publishedAfter: vine.date().optional(),
  publishedBefore: vine.date().optional(),
  createdAfter: vine.date().optional(),
  createdBefore: vine.date().optional(),
  
  // Pagination et tri
  ...paginationSchema.getProperties(),
  sortBy: vine.enum([
    'name', 'slug', 'createdAt', 'updatedAt', 'publishedAt',
    'viewCount', 'copyCount', 'conversionRate', 'sortOrder'
  ]).optional(),
  sortOrder: vine.enum(['asc', 'desc']).optional(),
})

/* =====================================================
   VALIDATORS D'INTERACTIONS UTILISATEUR
   ===================================================== */

/**
 * Schéma de validation pour copier un composant
 */
export const copyComponentSchema = vine.object({
  componentId: uuidSchema,
  versionId: uuidSchema.optional(),
  copiedTarget: copiedTargetSchema.optional(),
  snippetName: vine.string().trim().maxLength(255).optional(),
})

/**
 * Schéma de validation pour télécharger un composant
 */
export const downloadComponentSchema = vine.object({
  componentId: uuidSchema,
  versionId: uuidSchema,
  format: vine.enum(['zip', 'tar', 'individual']).optional(),
  includeAssets: vine.boolean().optional(),
  includeReadme: vine.boolean().optional(),
})

/**
 * Schéma de validation pour ajouter aux favoris
 */
export const addToFavoritesSchema = vine.object({
  componentId: uuidSchema,
})

/**
 * Schéma de validation pour supprimer des favoris
 */
export const removeFromFavoritesSchema = vine.object({
  componentId: uuidSchema,
})

/* =====================================================
   VALIDATORS DE DEMANDES DE COMPOSANTS
   ===================================================== */

/**
 * Schéma de validation pour créer une demande de composant
 */
export const createComponentRequestSchema = vine.object({
  title: vine.string().trim().minLength(1).maxLength(255),
  description: descriptionSchema,
  referenceUrl: optionalUrlSchema,
  categorySuggestion: vine.string().trim().maxLength(100).optional(),
})

/**
 * Schéma de validation pour voter pour une demande
 */
export const voteComponentRequestSchema = vine.object({
  requestId: uuidSchema,
})

/**
 * Schéma de validation pour mettre à jour une demande (admin)
 */
export const updateComponentRequestSchema = vine.object({
  title: vine.string().trim().minLength(1).maxLength(255).optional(),
  description: descriptionSchema,
  status: vine.enum(['pending', 'in_progress', 'completed', 'rejected']).optional(),
  completedComponentId: uuidSchema.optional(),
  adminNotes: vine.string().trim().optional(),
})

/* =====================================================
   VALIDATORS DE STATISTIQUES
   ===================================================== */

/**
 * Schéma de validation pour obtenir les statistiques de composants
 */
export const getComponentStatsSchema = vine.object({
  componentId: uuidSchema.optional(),
  dateFrom: vine.date().optional(),
  dateTo: vine.date().optional(),
  groupBy: vine.enum(['day', 'week', 'month']).optional(),
  includeVersionStats: vine.boolean().optional(),
})

/**
 * Schéma de validation pour obtenir les statistiques globales
 */
export const getGlobalStatsSchema = vine.object({
  dateFrom: vine.date().optional(),
  dateTo: vine.date().optional(),
  includeUserStats: vine.boolean().optional(),
  includeComponentStats: vine.boolean().optional(),
  includeCategoryStats: vine.boolean().optional(),
})

/* =====================================================
   VALIDATORS DE VALIDATION AVANCÉE
   ===================================================== */

/**
 * Schéma de validation pour vérifier l'unicité d'un slug de composant
 */
export const checkComponentSlugSchema = vine.object({
  subcategoryId: uuidSchema,
  slug: slugSchema,
  excludeId: uuidSchema.optional(),
})

/**
 * Schéma de validation pour valider le code d'un composant
 */
export const validateComponentCodeSchema = vine.object({
  framework: frameworkTypeSchema,
  cssFramework: cssFrameworkSchema,
  code: vine.string().trim().minLength(1),
  validateSyntax: vine.boolean().optional(),
  validateDependencies: vine.boolean().optional(),
})

/**
 * Schéma de validation pour vérifier la compatibilité des versions
 */
export const checkVersionCompatibilitySchema = vine.object({
  componentId: uuidSchema,
  framework: frameworkTypeSchema,
  cssFramework: cssFrameworkSchema,
  versionNumber: versionNumberSchema,
})

/* =====================================================
   VALIDATORS D'IMPORT/EXPORT
   ===================================================== */

/**
 * Schéma de validation pour l'import de composants
 */
export const importComponentsSchema = vine.object({
  subcategoryId: uuidSchema,
  components: vine.array(
    vine.object({
      name: vine.string().trim().minLength(1).maxLength(255),
      slug: slugSchema,
      description: descriptionSchema,
      isFree: vine.boolean().optional(),
      tags: tagsSchema,
      versions: vine.array(
        vine.object({
          versionNumber: versionNumberSchema,
          framework: frameworkTypeSchema,
          cssFramework: cssFrameworkSchema,
          codePreview: vine.string().trim().optional(),
          codeFull: vine.string().trim().optional(),
        })
      ).minLength(1),
    })
  ).minLength(1),
  overwriteExisting: vine.boolean().optional(),
})

/* =====================================================
   VALIDATORS DE PUBLICATION
   ===================================================== */

/**
 * Schéma de validation pour publier un composant
 */
export const publishComponentSchema = vine.object({
  componentId: uuidSchema,
  publishedAt: vine.date().optional(),
  notifyUsers: vine.boolean().optional(),
})

/**
 * Schéma de validation pour archiver un composant
 */
export const archiveComponentSchema = vine.object({
  componentId: uuidSchema,
  reason: vine.string().trim().maxLength(500).optional(),
  redirectToComponentId: uuidSchema.optional(),
})

/* =====================================================
   VALIDATORS DE DUPLICATION
   ===================================================== */

/**
 * Schéma de validation pour dupliquer un composant
 */
export const duplicateComponentSchema = vine.object({
  componentId: uuidSchema,
  newName: vine.string().trim().minLength(1).maxLength(255),
  newSlug: slugSchema,
  targetSubcategoryId: uuidSchema.optional(),
  duplicateVersions: vine.boolean().optional(),
  duplicateStats: vine.boolean().optional(),
})