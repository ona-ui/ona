/**
 * Types d'authentification et utilisateurs pour l'application Ona UI
 */

import type { 
  UUID, 
  Timestamp, 
  IPAddress, 
  UserRole, 
  AuthProvider, 
  PaymentStatus, 
  LicenseTier, 
  FrameworkType, 
  CssFramework,
  TokenType,
  TeamRole,
  APIScopes
} from "./common.js";

// =====================================================
// TYPES UTILISATEUR
// =====================================================

/**
 * Utilisateur de base (entité principale)
 */
export interface User {
  id: UUID;
  email: string;
  name?: string;
  username?: string;
  fullName?: string;
  image?: string;
  avatarUrl?: string;
  role: UserRole;
  emailVerified: boolean;
  emailVerifiedAt?: Timestamp;
  passwordHash?: string;
  provider: AuthProvider;
  providerId?: string;

  // Profil utilisateur
  bio?: string;
  website?: string;
  company?: string;
  location?: string;
  twitterHandle?: string;
  githubUsername?: string;

  // Préférences
  preferredFramework: FrameworkType;
  preferredCss: CssFramework;
  darkModeDefault: boolean;

  // Métadonnées
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

/**
 * Données publiques d'un utilisateur (pour les API publiques)
 */
export interface PublicUser {
  id: UUID;
  name?: string;
  username?: string;
  image?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  company?: string;
  location?: string;
  twitterHandle?: string;
  githubUsername?: string;
  createdAt: Timestamp;
}

/**
 * Profil utilisateur complet (pour l'utilisateur connecté)
 */
export interface UserProfile extends User {
  // Statistiques
  componentCount?: number;
  downloadCount?: number;
  favoriteCount?: number;
  
  // Licence active
  activeLicense?: UserLicense;
}

/**
 * Données pour créer un utilisateur
 */
export interface CreateUserData {
  email: string;
  name?: string;
  username?: string;
  fullName?: string;
  passwordHash?: string;
  provider?: AuthProvider;
  providerId?: string;
  image?: string;
  role?: UserRole;
}

/**
 * Données pour mettre à jour un utilisateur
 */
export interface UpdateUserData {
  name?: string;
  username?: string;
  fullName?: string;
  image?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  company?: string;
  location?: string;
  twitterHandle?: string;
  githubUsername?: string;
  preferredFramework?: FrameworkType;
  preferredCss?: CssFramework;
  darkModeDefault?: boolean;
}

// =====================================================
// TYPES D'AUTHENTIFICATION
// =====================================================

/**
 * Token d'authentification
 */
export interface AuthToken {
  id: UUID;
  userId: UUID;
  tokenHash: string;
  tokenType: TokenType;
  expiresAt: Timestamp;
  lastUsedAt?: Timestamp;
  ipAddress?: IPAddress;
  userAgent?: string;
  createdAt: Timestamp;
}

/**
 * Session utilisateur
 */
export interface Session {
  id: UUID;
  userId: UUID;
  token: string;
  expiresAt: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Compte externe (OAuth)
 */
export interface Account {
  id: UUID;
  accountId: string;
  providerId: string;
  userId: UUID;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: Timestamp;
  refreshTokenExpiresAt?: Timestamp;
  scope?: string;
  password?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Vérification (email, etc.)
 */
export interface Verification {
  id: UUID;
  identifier: string;
  value: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// =====================================================
// TYPES DE LICENCE
// =====================================================

/**
 * Licence utilisateur
 */
export interface License {
  id: UUID;
  userId: UUID;
  licenseKey: string;
  tier: LicenseTier;

  // Paiement Stripe
  stripePaymentId?: string;
  stripeCustomerId?: string;
  stripeInvoiceId?: string;
  amountPaid: number;
  currency: string;
  paymentStatus: PaymentStatus;

  // Gestion des sièges
  seatsAllowed: number;
  seatsUsed: number;

  // Validité
  validFrom: Timestamp;
  validUntil?: Timestamp;
  isLifetime: boolean;
  isActive: boolean;

  // Réductions
  isEarlyBird: boolean;
  discountPercentage: number;
  discountCode?: string;

  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Licence utilisateur avec informations étendues
 */
export interface UserLicense extends License {
  user: PublicUser;
  teamMembers?: LicenseTeamMember[];
}

/**
 * Membre d'équipe de licence
 */
export interface LicenseTeamMember {
  id: UUID;
  licenseId: UUID;
  userId: UUID;
  invitedBy?: UUID;
  role: TeamRole;
  joinedAt: Timestamp;
  
  // Relations
  user: PublicUser;
  inviter?: PublicUser;
}

/**
 * Données pour créer une licence
 */
export interface CreateLicenseData {
  userId: UUID;
  tier: LicenseTier;
  amountPaid: number;
  currency?: string;
  stripePaymentId?: string;
  stripeCustomerId?: string;
  stripeInvoiceId?: string;
  seatsAllowed?: number;
  isLifetime?: boolean;
  discountPercentage?: number;
  discountCode?: string;
}

// =====================================================
// TYPES D'API KEY
// =====================================================

/**
 * Clé API
 */
export interface APIKey {
  id: UUID;
  userId: UUID;
  licenseId?: UUID;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: APIScopes;
  rateLimitPerHour: number;
  lastUsedAt?: Timestamp;
  usageCount: number;
  isActive: boolean;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  revokedAt?: Timestamp;
}

/**
 * Données pour créer une clé API
 */
export interface CreateAPIKeyData {
  name: string;
  scopes: APIScopes;
  rateLimitPerHour?: number;
  expiresAt?: Timestamp;
}

/**
 * Clé API avec le token en clair (seulement à la création)
 */
export interface APIKeyWithToken extends APIKey {
  token: string;
}

// =====================================================
// TYPES D'AUTHENTIFICATION POUR L'API
// =====================================================

/**
 * Contexte d'authentification
 */
export interface AuthContext {
  user: User;
  session?: Session;
  apiKey?: APIKey;
  license?: License;
  permissions: string[];
}

/**
 * Données de connexion
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Données d'inscription
 */
export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  username?: string;
  acceptTerms: boolean;
}

/**
 * Réponse d'authentification
 */
export interface AuthResponse {
  user: UserProfile;
  token?: string;
  expiresAt?: Timestamp;
}

/**
 * Données de réinitialisation de mot de passe
 */
export interface ResetPasswordData {
  token: string;
  password: string;
}

/**
 * Données de changement de mot de passe
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}