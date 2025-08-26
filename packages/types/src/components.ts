/**
 * Types pour les composants et leurs versions
 */

import type { 
  UUID, 
  Timestamp, 
  IPAddress, 
  Tags, 
  ComponentStatus, 
  LicenseTier, 
  AccessType, 
  FrameworkType, 
  CssFramework,
  ComponentDependencies,
  ComponentConfig,
  ComponentIntegrations,
  ComponentFiles,
  CopiedTarget
} from "./common.js";
import type { FullSubcategory } from "./categories.js";
import type { PublicUser } from "./auth.js";

// =====================================================
// TYPES COMPOSANT
// =====================================================

/**
 * Composant de base
 */
export interface Component {
  id: UUID;
  subcategoryId: UUID;
  name: string;
  slug: string;
  description?: string;

  // Accès et licence
  isFree: boolean;
  requiredTier: LicenseTier;
  accessType: AccessType;

  // Statut et métadonnées
  status: ComponentStatus;
  isNew: boolean;
  isFeatured: boolean;

  // Données de conversion
  conversionRate?: number;
  testedCompanies?: string[];

  // Médias
  previewImageLarge?: string;
  previewImageSmall?: string;
  previewVideoUrl?: string;

  // Organisation
  tags: Tags;
  sortOrder: number;

  // Statistiques
  viewCount: number;
  copyCount: number;

  // Dates
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt?: Timestamp;
}

/**
 * Composant avec sa sous-catégorie
 */
export interface ComponentWithSubcategory extends Component {
  subcategory: FullSubcategory;
}

/**
 * Composant avec ses versions
 */
export interface ComponentWithVersions extends Component {
  versions: ComponentVersion[];
  defaultVersion?: ComponentVersion;
  versionCount: number;
}

/**
 * Composant complet avec toutes les relations
 */
export interface FullComponent extends Component {
  subcategory: FullSubcategory;
  versions: ComponentVersion[];
  defaultVersion?: ComponentVersion;
  versionCount: number;
  isFavorited?: boolean;
  canAccess?: boolean;
}

/**
 * Composant pour l'affichage public (liste)
 */
export interface PublicComponent {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
  isFree: boolean;
  requiredTier: LicenseTier;
  accessType: AccessType;
  status: ComponentStatus;
  isNew: boolean;
  isFeatured: boolean;
  conversionRate?: number;
  testedCompanies?: string[];
  previewImageLarge?: string;
  previewImageSmall?: string;
  previewVideoUrl?: string;
  tags: Tags;
  viewCount: number;
  copyCount: number;
  publishedAt?: Timestamp;
  subcategory: {
    id: UUID;
    name: string;
    slug: string;
    category: {
      id: UUID;
      name: string;
      slug: string;
      product: {
        id: UUID;
        name: string;
        slug: string;
      };
    };
  };
  defaultVersion?: {
    id: UUID;
    framework: FrameworkType;
    cssFramework: CssFramework;
    supportsDarkMode: boolean;
  };
  isFavorited?: boolean;
  canAccess?: boolean;
}

/**
 * Données pour créer un composant
 */
export interface CreateComponentData {
  subcategoryId: UUID;
  name: string;
  slug: string;
  description?: string;
  isFree?: boolean;
  requiredTier?: LicenseTier;
  accessType?: AccessType;
  status?: ComponentStatus;
  isNew?: boolean;
  isFeatured?: boolean;
  conversionRate?: number;
  testedCompanies?: string[];
  previewImageLarge?: string;
  previewImageSmall?: string;
  previewVideoUrl?: string;
  tags?: Tags;
  sortOrder?: number;
}

/**
 * Données pour mettre à jour un composant
 */
export interface UpdateComponentData {
  name?: string;
  slug?: string;
  description?: string;
  isFree?: boolean;
  requiredTier?: LicenseTier;
  accessType?: AccessType;
  status?: ComponentStatus;
  isNew?: boolean;
  isFeatured?: boolean;
  conversionRate?: number;
  testedCompanies?: string[];
  previewImageLarge?: string;
  previewImageSmall?: string;
  previewVideoUrl?: string;
  tags?: Tags;
  sortOrder?: number;
}

// =====================================================
// TYPES VERSION DE COMPOSANT
// =====================================================

/**
 * Version d'un composant
 */
export interface ComponentVersion {
  id: UUID;
  componentId: UUID;
  versionNumber: string;
  framework: FrameworkType;
  cssFramework: CssFramework;

  // Code
  codePreview?: string;
  codeFull?: string;
  codeEncrypted?: string;

  // Configuration
  dependencies?: ComponentDependencies;
  configRequired?: ComponentConfig;

  // Mode sombre
  supportsDarkMode: boolean;
  darkModeCode?: string;

  // Intégrations
  integrations?: ComponentIntegrations;
  integrationCode?: Record<string, any>;

  // Fichiers
  files?: ComponentFiles;

  // Métadonnées
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Version avec son composant
 */
export interface ComponentVersionWithComponent extends ComponentVersion {
  component: PublicComponent;
}

/**
 * Données pour créer une version
 */
export interface CreateComponentVersionData {
  componentId: UUID;
  versionNumber: string;
  framework: FrameworkType;
  cssFramework: CssFramework;
  codePreview?: string;
  codeFull?: string;
  dependencies?: ComponentDependencies;
  configRequired?: ComponentConfig;
  supportsDarkMode?: boolean;
  darkModeCode?: string;
  integrations?: ComponentIntegrations;
  integrationCode?: Record<string, any>;
  files?: ComponentFiles;
  isDefault?: boolean;
}

/**
 * Données pour mettre à jour une version
 */
export interface UpdateComponentVersionData {
  versionNumber?: string;
  codePreview?: string;
  codeFull?: string;
  dependencies?: ComponentDependencies;
  configRequired?: ComponentConfig;
  supportsDarkMode?: boolean;
  darkModeCode?: string;
  integrations?: ComponentIntegrations;
  integrationCode?: Record<string, any>;
  files?: ComponentFiles;
  isDefault?: boolean;
}

// =====================================================
// TYPES D'INTERACTION UTILISATEUR
// =====================================================

/**
 * Favori utilisateur
 */
export interface UserFavorite {
  id: UUID;
  userId: UUID;
  componentId: UUID;
  createdAt: Timestamp;
}

/**
 * Téléchargement de composant
 */
export interface ComponentDownload {
  id: UUID;
  userId: UUID;
  componentId: UUID;
  versionId: UUID;
  licenseId?: UUID;
  ipAddress?: IPAddress;
  userAgent?: string;
  downloadedAt: Timestamp;
}

/**
 * Copie de composant
 */
export interface ComponentCopy {
  id: UUID;
  userId?: UUID;
  componentId: UUID;
  versionId: UUID;
  licenseId?: UUID;
  copiedTarget: CopiedTarget;
  snippetName?: string;
  sessionId?: string;
  ipAddress?: IPAddress;
  userAgent?: string;
  copiedAt: Timestamp;
}

/**
 * Vue de composant
 */
export interface ComponentView {
  id: UUID;
  componentId: UUID;
  userId?: UUID;
  sessionId?: string;
  referrer?: string;
  ipAddress?: IPAddress;
  userAgent?: string;
  viewedAt: Timestamp;
}

// =====================================================
// TYPES DE DEMANDE DE COMPOSANT
// =====================================================

/**
 * Demande de composant
 */
export interface ComponentRequest {
  id: UUID;
  userId?: UUID;
  title: string;
  description?: string;
  referenceUrl?: string;
  categorySuggestion?: string;
  voteCount: number;
  status: string;
  completedComponentId?: UUID;
  adminNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

/**
 * Demande avec utilisateur
 */
export interface ComponentRequestWithUser extends ComponentRequest {
  user?: PublicUser;
  hasVoted?: boolean;
}

/**
 * Vote pour une demande
 */
export interface RequestVote {
  id: UUID;
  requestId: UUID;
  userId: UUID;
  createdAt: Timestamp;
}

/**
 * Données pour créer une demande
 */
export interface CreateComponentRequestData {
  title: string;
  description?: string;
  referenceUrl?: string;
  categorySuggestion?: string;
}

// =====================================================
// TYPES DE RECHERCHE ET FILTRAGE
// =====================================================

/**
 * Filtres pour les composants
 */
export interface ComponentFilters {
  subcategoryId?: UUID;
  categoryId?: UUID;
  productId?: UUID;
  isFree?: boolean;
  requiredTier?: LicenseTier;
  status?: ComponentStatus;
  framework?: FrameworkType;
  cssFramework?: CssFramework;
  isNew?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  search?: string;
  hasConversionRate?: boolean;
  minConversionRate?: number;
  supportsDarkMode?: boolean;
}

/**
 * Options de tri pour les composants
 */
export interface ComponentSortOptions {
  field: "name" | "createdAt" | "updatedAt" | "publishedAt" | "viewCount" | "copyCount" | "conversionRate" | "sortOrder";
  direction: "asc" | "desc";
}

// =====================================================
// TYPES DE STATISTIQUES
// =====================================================

/**
 * Statistiques d'un composant
 */
export interface ComponentStats {
  id: UUID;
  name: string;
  slug: string;
  viewCount: number;
  copyCount: number;
  downloadCount: number;
  favoriteCount: number;
  conversionRate?: number;
  popularFrameworks: { framework: FrameworkType; count: number }[];
  popularCssFrameworks: { cssFramework: CssFramework; count: number }[];
  dailyViews: { date: string; views: number }[];
  dailyCopies: { date: string; copies: number }[];
}

/**
 * Statistiques globales des composants
 */
export interface GlobalComponentStats {
  totalComponents: number;
  publishedComponents: number;
  freeComponents: number;
  premiumComponents: number;
  totalViews: number;
  totalCopies: number;
  totalDownloads: number;
  averageConversionRate?: number;
  topComponents: {
    id: UUID;
    name: string;
    slug: string;
    viewCount: number;
    copyCount: number;
  }[];
  popularTags: { tag: string; count: number }[];
  frameworkDistribution: { framework: FrameworkType; count: number }[];
}