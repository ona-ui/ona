import { BaseService, ValidationError, ConflictError } from './base_service.js';
import { userRepository } from '../repositories/index.js';
import type { PaginationOptions } from '../repositories/base_repository.js';
import { users } from '../db/schema.js';

// Types locaux basés sur le schéma de base de données
type User = typeof users.$inferSelect;
type CreateUserData = typeof users.$inferInsert;
type UpdateUserData = Partial<typeof users.$inferInsert>;
type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserServiceOptions {
  skipPasswordValidation?: boolean;
  skipEmailValidation?: boolean;
}

export interface UserPermissions {
  canAccessPremium: boolean;
  canManageUsers: boolean;
  canManageComponents: boolean;
  canManageCategories: boolean;
  maxApiCalls: number;
  teamSeats: number;
}

export interface UserSubscriptionInfo {
  hasActiveSubscription: boolean;
  tier: 'free' | 'pro' | 'team' | 'enterprise';
  expiresAt?: Date;
  teamSeats?: number;
  usedSeats?: number;
}

/**
 * Service de gestion des utilisateurs
 * Gère l'authentification, les permissions, les profils et les abonnements
 */
export class UserService extends BaseService {
  /**
   * Récupère un utilisateur par ID avec validation
   */
  async getUserById(id: string, requestingUserId?: string): Promise<User> {
    this.logOperation('getUserById', { id, requestingUserId });

    const user = await userRepository.findById(id);
    this.validateExists(user, 'Utilisateur');

    // Vérifier les permissions pour accéder aux données d'un autre utilisateur
    if (requestingUserId && requestingUserId !== id) {
      const requestingUser = await userRepository.findById(requestingUserId);
      this.validatePermissions(requestingUser, 'admin');
    }

    return this.sanitizeUserData(user);
  }

  /**
   * Récupère un utilisateur par email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    this.logOperation('getUserByEmail', { email });

    if (!this.validateEmail(email)) {
      throw new ValidationError('Format d\'email invalide');
    }

    const user = await userRepository.findByEmail(email);
    return user ? this.sanitizeUserData(user) : null;
  }

  /**
   * Récupère un utilisateur par nom d'utilisateur
   */
  async getUserByUsername(username: string): Promise<User | null> {
    this.logOperation('getUserByUsername', { username });

    if (!username || username.length < 3) {
      throw new ValidationError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    }

    const user = await userRepository.findByUsername(username);
    return user ? this.sanitizeUserData(user) : null;
  }

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(userData: CreateUserData, options: UserServiceOptions = {}): Promise<User> {
    this.logOperation('createUser', { email: userData.email, username: userData.username });

    // Validation des données
    this.validateInput(userData, ['email', 'name']);
    
    if (!options.skipEmailValidation && !this.validateEmail(userData.email)) {
      throw new ValidationError('Format d\'email invalide');
    }

    // Vérifier l'unicité de l'email
    const existingUserByEmail = await userRepository.findByEmail(userData.email);
    if (existingUserByEmail) {
      throw new ConflictError('Un utilisateur avec cet email existe déjà');
    }

    // Vérifier l'unicité du nom d'utilisateur si fourni
    if (userData.username) {
      const existingUserByUsername = await userRepository.findByUsername(userData.username);
      if (existingUserByUsername) {
        throw new ConflictError('Ce nom d\'utilisateur est déjà pris');
      }
    }

    // Générer un nom d'utilisateur si non fourni
    if (!userData.username) {
      userData.username = await this.generateUniqueUsername(userData.name || userData.email.split('@')[0]);
    }

    // Préparer les données pour l'insertion
    const userToCreate = {
      id: this.generateId(),
      email: userData.email.toLowerCase(),
      name: userData.name,
      username: userData.username,
      role: (userData.role || 'user') as UserRole,
      emailVerified: userData.emailVerified || false,
      image: userData.image || null,
      bio: userData.bio || null,
      website: userData.website || null,
      company: userData.company || null,
      location: userData.location || null,
      twitterHandle: userData.twitterHandle || null,
      githubUsername: userData.githubUsername || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      deletedAt: null,
    };

    const createdUser = await userRepository.create(userToCreate);
    
    this.logOperation('createUser success', { userId: createdUser.id });
    return this.sanitizeUserData(createdUser);
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(id: string, userData: UpdateUserData, requestingUserId: string): Promise<User> {
    this.logOperation('updateUser', { id, requestingUserId });

    const existingUser = await userRepository.findById(id);
    this.validateExists(existingUser, 'Utilisateur');

    // Vérifier les permissions
    const requestingUser = await userRepository.findById(requestingUserId);
    if (requestingUserId !== id) {
      this.validatePermissions(requestingUser, 'admin');
    }

    // Valider l'email si modifié
    if (userData.email && userData.email !== existingUser!.email) {
      if (!this.validateEmail(userData.email)) {
        throw new ValidationError('Format d\'email invalide');
      }
      
      const existingUserByEmail = await userRepository.findByEmail(userData.email);
      if (existingUserByEmail && existingUserByEmail.id !== id) {
        throw new ConflictError('Un utilisateur avec cet email existe déjà');
      }
    }

    // Valider le nom d'utilisateur si modifié
    if (userData.username && userData.username !== existingUser!.username) {
      const existingUserByUsername = await userRepository.findByUsername(userData.username);
      if (existingUserByUsername && existingUserByUsername.id !== id) {
        throw new ConflictError('Ce nom d\'utilisateur est déjà pris');
      }
    }

    // Seuls les admins peuvent changer les rôles
    if (userData.role && userData.role !== existingUser!.role) {
      this.validatePermissions(requestingUser, 'admin');
    }

    // Nettoyer les données
    const allowedFields = [
      'name', 'username', 'bio', 'website', 'company', 'location',
      'twitterHandle', 'githubUsername', 'image', 'emailVerified'
    ];
    
    if (requestingUser?.role === 'admin' || requestingUser?.role === 'super_admin') {
      allowedFields.push('role', 'email');
    }

    const sanitizedData = this.sanitizeInput<UpdateUserData>(userData, allowedFields);
    
    if (sanitizedData.email) {
      sanitizedData.email = sanitizedData.email.toLowerCase();
    }

    const updatedUser = await userRepository.update(id, sanitizedData);
    this.validateExists(updatedUser, 'Utilisateur mis à jour');

    this.logOperation('updateUser success', { userId: id });
    return this.sanitizeUserData(updatedUser);
  }

  /**
   * Supprime un utilisateur (soft delete)
   */
  async deleteUser(id: string, requestingUserId: string): Promise<void> {
    this.logOperation('deleteUser', { id, requestingUserId });

    const userToDelete = await userRepository.findById(id);
    this.validateExists(userToDelete, 'Utilisateur');

    const requestingUser = await userRepository.findById(requestingUserId);
    
    // Seuls les admins peuvent supprimer d'autres utilisateurs
    if (requestingUserId !== id) {
      this.validatePermissions(requestingUser, 'admin');
    }

    // Empêcher la suppression du dernier super admin
    if (userToDelete!.role === 'super_admin') {
      const superAdmins = await userRepository.findByRole('super_admin');
      if (superAdmins.length <= 1) {
        throw new ValidationError('Impossible de supprimer le dernier super administrateur');
      }
    }

    await userRepository.update(id, { deletedAt: new Date() });
    this.logOperation('deleteUser success', { userId: id });
  }

  /**
   * Liste les utilisateurs avec pagination
   */
  async listUsers(options: PaginationOptions, requestingUserId: string) {
    this.logOperation('listUsers', { options, requestingUserId });

    const requestingUser = await userRepository.findById(requestingUserId);
    this.validatePermissions(requestingUser, 'admin');

    const validatedOptions = this.validatePaginationOptions(options);
    const result = await userRepository.paginate(validatedOptions);

    // Nettoyer les données utilisateur
    const sanitizedData = result.data.map(user => this.sanitizeUserData(user));

    return this.createPaginatedResponse({
      ...result,
      data: sanitizedData
    }, 'Utilisateurs récupérés avec succès');
  }

  /**
   * Vérifie les permissions d'un utilisateur
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    this.logOperation('getUserPermissions', { userId });

    const user = await userRepository.findById(userId);
    this.validateExists(user, 'Utilisateur');

    const subscriptionInfo = await this.getUserSubscriptionInfo(userId);

    return {
      canAccessPremium: subscriptionInfo.hasActiveSubscription,
      canManageUsers: user!.role === 'admin' || user!.role === 'super_admin',
      canManageComponents: user!.role === 'admin' || user!.role === 'super_admin',
      canManageCategories: user!.role === 'admin' || user!.role === 'super_admin',
      maxApiCalls: this.getMaxApiCalls(subscriptionInfo.tier),
      teamSeats: subscriptionInfo.teamSeats || 1,
    };
  }

  /**
   * Récupère les informations d'abonnement d'un utilisateur
   */
  async getUserSubscriptionInfo(userId: string): Promise<UserSubscriptionInfo> {
    this.logOperation('getUserSubscriptionInfo', { userId });

    const user = await userRepository.findById(userId);
    this.validateExists(user, 'Utilisateur');

    // Pour le MVP, on simule les informations d'abonnement
    // À remplacer par la logique réelle avec les licences
    const hasActiveSubscription = await userRepository.checkSubscription(userId);

    return {
      hasActiveSubscription,
      tier: hasActiveSubscription ? 'pro' : 'free',
      teamSeats: hasActiveSubscription ? 5 : 1,
      usedSeats: 1,
    };
  }

  /**
   * Met à jour la date de dernière connexion
   */
  async updateLastLogin(userId: string): Promise<void> {
    this.logOperation('updateLastLogin', { userId });

    await userRepository.update(userId, { 
      lastLoginAt: new Date() 
    });
  }

  /**
   * Recherche des utilisateurs actifs
   */
  async getActiveUsers(): Promise<User[]> {
    this.logOperation('getActiveUsers');

    const users = await userRepository.findActiveUsers();
    return users.map(user => this.sanitizeUserData(user));
  }

  /**
   * Génère un nom d'utilisateur unique
   */
  private async generateUniqueUsername(baseName: string): Promise<string> {
    let username = this.generateSlug(baseName);
    let counter = 1;

    while (await userRepository.findByUsername(username)) {
      username = `${this.generateSlug(baseName)}-${counter}`;
      counter++;
    }

    return username;
  }

  /**
   * Nettoie les données utilisateur sensibles
   */
  private sanitizeUserData(user: any): User {
    const { ...sanitizedUser } = user;
    
    // Supprimer les champs sensibles si nécessaire
    // (pour le moment, on garde tous les champs car ils sont déjà publics dans le schéma)
    
    return sanitizedUser;
  }

  /**
   * Détermine le nombre maximum d'appels API selon le tier
   */
  private getMaxApiCalls(tier: string): number {
    const limits = {
      free: 100,
      pro: 1000,
      team: 5000,
      enterprise: 50000,
    };

    return limits[tier as keyof typeof limits] || limits.free;
  }

  /**
   * Valide si un utilisateur peut accéder à du contenu premium
   */
  async canAccessPremium(userId: string): Promise<boolean> {
    const subscriptionInfo = await this.getUserSubscriptionInfo(userId);
    return subscriptionInfo.hasActiveSubscription;
  }

  /**
   * Valide si un utilisateur peut effectuer une action admin
   */
  async canPerformAdminAction(userId: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    return user?.role === 'admin' || user?.role === 'super_admin';
  }
}