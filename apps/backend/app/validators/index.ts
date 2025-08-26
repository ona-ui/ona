/**
 * Index centralisé des validators pour l'application Ona UI
 * 
 * Ce fichier exporte tous les schémas de validation de manière organisée
 * pour faciliter l'importation dans les contrôleurs et services.
 */

/* =====================================================
   EXPORTS - VALIDATORS COMMUNS
   ===================================================== */

export {
  // Validators de base
  uuidSchema,
  slugSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  descriptionSchema,
  
  // Validators de pagination et tri
  paginationSchema,
  sortingSchema,
  idParamSchema,
  slugParamSchema,
  
  // Validators d'enums
  userRoleSchema,
  authProviderSchema,
  paymentStatusSchema,
  licenseTierSchema,
  componentStatusSchema,
  frameworkTypeSchema,
  cssFrameworkSchema,
  accessTypeSchema,
  tokenTypeSchema,
  teamRoleSchema,
  copiedTargetSchema,
  
  // Validators de métadonnées
  tagsSchema,
  dependenciesSchema,
  configRequiredSchema,
  integrationsSchema,
  componentFilesSchema,
  integrationCodeSchema,
  
  // Validators de recherche
  searchComponentsSchema,
  
  // Validators de fichiers
  imageTypesSchema,
  videoTypesSchema,
  fileSizeSchema,
  
  // Validators de dates et URLs
  dateSchema,
  optionalDateSchema,
  urlSchema,
  optionalUrlSchema,
  versionNumberSchema,
} from './common_validators.js'

/* =====================================================
   EXPORTS - VALIDATORS D'AUTHENTIFICATION
   ===================================================== */

export {
  // Authentification de base
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  confirmResetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  
  // Gestion du profil
  updateUserSchema,
  updateAvatarSchema,
  
  // Administration des utilisateurs
  createUserSchema,
  adminUpdateUserSchema,
  
  // Tokens et sessions
  createApiTokenSchema,
  revokeTokenSchema,
  
  // Authentification sociale
  oauthCallbackSchema,
  linkSocialAccountSchema,
  
  // Recherche et filtrage
  searchUsersSchema,
  
  // Invitations et vérifications
  resendVerificationSchema,
  inviteUserSchema,
  acceptInvitationSchema,
} from './auth_validators.js'

/* =====================================================
   EXPORTS - VALIDATORS DE CATÉGORIES
   ===================================================== */

export {
  // Produits
  createProductSchema,
  updateProductSchema,
  
  // Catégories
  createCategorySchema,
  updateCategorySchema,
  searchCategoriesSchema,
  
  // Sous-catégories
  createSubcategorySchema,
  updateSubcategorySchema,
  searchSubcategoriesSchema,
  
  // Navigation
  getNavigationSchema,
  
  // Réorganisation
  reorderCategoriesSchema,
  reorderSubcategoriesSchema,
  
  // Statistiques
  getCategoryStatsSchema,
  getSubcategoryStatsSchema,
  
  // Import/Export
  importCategoriesSchema,
  
  // Validation avancée
  checkCategorySlugSchema,
  checkSubcategorySlugSchema,
  
  // Filtrage avancé
  advancedCategoryFiltersSchema,
  advancedSubcategoryFiltersSchema,
} from './category_validators.js'

/* =====================================================
   EXPORTS - VALIDATORS DE COMPOSANTS
   ===================================================== */

export {
  // Composants de base
  createComponentSchema,
  updateComponentSchema,
  
  // Versions de composants
  createVersionSchema,
  updateVersionSchema,
  
  // Interactions utilisateur
  copyComponentSchema,
  downloadComponentSchema,
  addToFavoritesSchema,
  removeFromFavoritesSchema,
  
  // Demandes de composants
  createComponentRequestSchema,
  voteComponentRequestSchema,
  updateComponentRequestSchema,
  
  // Statistiques
  getComponentStatsSchema,
  getGlobalStatsSchema,
  
  // Validation avancée
  checkComponentSlugSchema,
  validateComponentCodeSchema,
  checkVersionCompatibilitySchema,
  
  // Import/Export
  importComponentsSchema,
  
  // Publication et archivage
  publishComponentSchema,
  archiveComponentSchema,
  
  // Duplication
  duplicateComponentSchema,
} from './component_validators.js'

/* =====================================================
   EXPORTS - VALIDATORS DE FICHIERS
   ===================================================== */

export {
  // Upload de fichiers
  uploadImageSchema,
  updateImageMetadataSchema,
  uploadVideoSchema,
  updateVideoMetadataSchema,
  uploadDocumentSchema,
  
  // Métadonnées de fichiers
  fileMetadataSchema,
  
  // Traitement d'images
  resizeImageSchema,
  generateThumbnailSchema,
  
  // Gestion de fichiers
  deleteFileSchema,
  searchFilesSchema,
  
  // Optimisation
  optimizeImageSchema,
  compressVideoSchema,
  
  // Validation de contenu
  validateCodeFileSchema,
  validateFileSecuritySchema,
  
  // Opérations en lot
  batchFileOperationSchema,
} from './file_validators.js'

/* =====================================================
   EXPORTS GROUPÉS PAR DOMAINE
   ===================================================== */

// Import des schémas pour les objets groupés
import * as AuthSchemas from './auth_validators.js'
import * as CategorySchemas from './category_validators.js'
import * as ComponentSchemas from './component_validators.js'
import * as FileSchemas from './file_validators.js'
import * as CommonSchemas from './common_validators.js'

/**
 * Tous les validators d'authentification et utilisateurs
 */
export const AuthValidators = {
  login: AuthSchemas.loginSchema,
  register: AuthSchemas.registerSchema,
  resetPassword: AuthSchemas.resetPasswordSchema,
  confirmResetPassword: AuthSchemas.confirmResetPasswordSchema,
  changePassword: AuthSchemas.changePasswordSchema,
  verifyEmail: AuthSchemas.verifyEmailSchema,
  updateUser: AuthSchemas.updateUserSchema,
  updateAvatar: AuthSchemas.updateAvatarSchema,
  createUser: AuthSchemas.createUserSchema,
  adminUpdateUser: AuthSchemas.adminUpdateUserSchema,
  createApiToken: AuthSchemas.createApiTokenSchema,
  revokeToken: AuthSchemas.revokeTokenSchema,
  oauthCallback: AuthSchemas.oauthCallbackSchema,
  linkSocialAccount: AuthSchemas.linkSocialAccountSchema,
  searchUsers: AuthSchemas.searchUsersSchema,
  resendVerification: AuthSchemas.resendVerificationSchema,
  inviteUser: AuthSchemas.inviteUserSchema,
  acceptInvitation: AuthSchemas.acceptInvitationSchema,
} as const

/**
 * Tous les validators de catégories et produits
 */
export const CategoryValidators = {
  createProduct: CategorySchemas.createProductSchema,
  updateProduct: CategorySchemas.updateProductSchema,
  createCategory: CategorySchemas.createCategorySchema,
  updateCategory: CategorySchemas.updateCategorySchema,
  searchCategories: CategorySchemas.searchCategoriesSchema,
  createSubcategory: CategorySchemas.createSubcategorySchema,
  updateSubcategory: CategorySchemas.updateSubcategorySchema,
  searchSubcategories: CategorySchemas.searchSubcategoriesSchema,
  getNavigation: CategorySchemas.getNavigationSchema,
  reorderCategories: CategorySchemas.reorderCategoriesSchema,
  reorderSubcategories: CategorySchemas.reorderSubcategoriesSchema,
  getCategoryStats: CategorySchemas.getCategoryStatsSchema,
  getSubcategoryStats: CategorySchemas.getSubcategoryStatsSchema,
  importCategories: CategorySchemas.importCategoriesSchema,
  checkCategorySlug: CategorySchemas.checkCategorySlugSchema,
  checkSubcategorySlug: CategorySchemas.checkSubcategorySlugSchema,
  advancedCategoryFilters: CategorySchemas.advancedCategoryFiltersSchema,
  advancedSubcategoryFilters: CategorySchemas.advancedSubcategoryFiltersSchema,
} as const

/**
 * Tous les validators de composants
 */
export const ComponentValidators = {
  createComponent: ComponentSchemas.createComponentSchema,
  updateComponent: ComponentSchemas.updateComponentSchema,
  createVersion: ComponentSchemas.createVersionSchema,
  updateVersion: ComponentSchemas.updateVersionSchema,
  searchComponents: ComponentSchemas.searchComponentsSchema,
  copyComponent: ComponentSchemas.copyComponentSchema,
  downloadComponent: ComponentSchemas.downloadComponentSchema,
  addToFavorites: ComponentSchemas.addToFavoritesSchema,
  removeFromFavorites: ComponentSchemas.removeFromFavoritesSchema,
  createComponentRequest: ComponentSchemas.createComponentRequestSchema,
  voteComponentRequest: ComponentSchemas.voteComponentRequestSchema,
  updateComponentRequest: ComponentSchemas.updateComponentRequestSchema,
  getComponentStats: ComponentSchemas.getComponentStatsSchema,
  getGlobalStats: ComponentSchemas.getGlobalStatsSchema,
  checkComponentSlug: ComponentSchemas.checkComponentSlugSchema,
  validateComponentCode: ComponentSchemas.validateComponentCodeSchema,
  checkVersionCompatibility: ComponentSchemas.checkVersionCompatibilitySchema,
  importComponents: ComponentSchemas.importComponentsSchema,
  publishComponent: ComponentSchemas.publishComponentSchema,
  archiveComponent: ComponentSchemas.archiveComponentSchema,
  duplicateComponent: ComponentSchemas.duplicateComponentSchema,
} as const

/**
 * Tous les validators de fichiers
 */
export const FileValidators = {
  uploadImage: FileSchemas.uploadImageSchema,
  updateImageMetadata: FileSchemas.updateImageMetadataSchema,
  uploadVideo: FileSchemas.uploadVideoSchema,
  updateVideoMetadata: FileSchemas.updateVideoMetadataSchema,
  uploadDocument: FileSchemas.uploadDocumentSchema,
  fileMetadata: FileSchemas.fileMetadataSchema,
  resizeImage: FileSchemas.resizeImageSchema,
  generateThumbnail: FileSchemas.generateThumbnailSchema,
  deleteFile: FileSchemas.deleteFileSchema,
  searchFiles: FileSchemas.searchFilesSchema,
  optimizeImage: FileSchemas.optimizeImageSchema,
  compressVideo: FileSchemas.compressVideoSchema,
  validateCodeFile: FileSchemas.validateCodeFileSchema,
  validateFileSecurity: FileSchemas.validateFileSecuritySchema,
  batchFileOperation: FileSchemas.batchFileOperationSchema,
} as const

/**
 * Tous les validators communs
 */
export const CommonValidators = {
  uuid: CommonSchemas.uuidSchema,
  slug: CommonSchemas.slugSchema,
  email: CommonSchemas.emailSchema,
  password: CommonSchemas.passwordSchema,
  name: CommonSchemas.nameSchema,
  description: CommonSchemas.descriptionSchema,
  pagination: CommonSchemas.paginationSchema,
  sorting: CommonSchemas.sortingSchema,
  idParam: CommonSchemas.idParamSchema,
  slugParam: CommonSchemas.slugParamSchema,
  tags: CommonSchemas.tagsSchema,
  dependencies: CommonSchemas.dependenciesSchema,
  configRequired: CommonSchemas.configRequiredSchema,
  integrations: CommonSchemas.integrationsSchema,
  componentFiles: CommonSchemas.componentFilesSchema,
  integrationCode: CommonSchemas.integrationCodeSchema,
  searchComponents: CommonSchemas.searchComponentsSchema,
  date: CommonSchemas.dateSchema,
  optionalDate: CommonSchemas.optionalDateSchema,
  url: CommonSchemas.urlSchema,
  optionalUrl: CommonSchemas.optionalUrlSchema,
  versionNumber: CommonSchemas.versionNumberSchema,
} as const

/* =====================================================
   TYPES UTILITAIRES
   ===================================================== */

/**
 * Type utilitaire pour extraire le type de données validées d'un schéma VineJS
 */
export type InferInput<T> = T extends { parse(data: infer U): any } ? U : never
export type InferOutput<T> = T extends { parse(data: any): infer U } ? U : never

/**
 * Types pour les données d'authentification
 */
export type LoginData = InferInput<typeof AuthSchemas.loginSchema>
export type RegisterData = InferInput<typeof AuthSchemas.registerSchema>
export type UpdateUserData = InferInput<typeof AuthSchemas.updateUserSchema>

/**
 * Types pour les données de composants
 */
export type CreateComponentData = InferInput<typeof ComponentSchemas.createComponentSchema>
export type UpdateComponentData = InferInput<typeof ComponentSchemas.updateComponentSchema>
export type CreateVersionData = InferInput<typeof ComponentSchemas.createVersionSchema>
export type SearchComponentsData = InferInput<typeof ComponentSchemas.searchComponentsSchema>

/**
 * Types pour les données de catégories
 */
export type CreateCategoryData = InferInput<typeof CategorySchemas.createCategorySchema>
export type UpdateCategoryData = InferInput<typeof CategorySchemas.updateCategorySchema>
export type CreateSubcategoryData = InferInput<typeof CategorySchemas.createSubcategorySchema>

/**
 * Types pour les données de fichiers
 */
export type UploadImageData = InferInput<typeof FileSchemas.uploadImageSchema>
export type UploadVideoData = InferInput<typeof FileSchemas.uploadVideoSchema>
export type FileMetadata = InferInput<typeof FileSchemas.fileMetadataSchema>

/* =====================================================
   EXPORT PAR DÉFAUT
   ===================================================== */

/**
 * Export par défaut contenant tous les validators organisés
 */
export default {
  Auth: AuthValidators,
  Category: CategoryValidators,
  Component: ComponentValidators,
  File: FileValidators,
  Common: CommonValidators,
} as const