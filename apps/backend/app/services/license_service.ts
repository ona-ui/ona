import { BaseService, ConflictError, NotFoundError } from './base_service.js';
import { licenseRepository, userRepository } from '../repositories/index.js';
import { licenses } from '../db/schema.js';
import { randomBytes } from 'crypto';

// Types basés sur le schéma de base de données
type License = typeof licenses.$inferSelect;
type CreateLicenseData = typeof licenses.$inferInsert;
type UpdateLicenseData = Partial<typeof licenses.$inferInsert>;
type LicenseTier = 'free' | 'pro' | 'team' | 'enterprise';
type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';

export interface CreateLicenseParams {
  userId: string;
  tier: LicenseTier;
  stripePaymentId?: string;
  stripeCustomerId?: string;
  stripeInvoiceId?: string;
  amountPaid: number;
  currency?: string;
  paymentStatus?: PaymentStatus;
  isLifetime?: boolean;
  seatsAllowed?: number;
  discountPercentage?: number;
  discountCode?: string;
  notes?: string;
}

export interface LicenseInfo {
  id: string;
  userId: string;
  licenseKey: string;
  tier: LicenseTier;
  isActive: boolean;
  isLifetime: boolean;
  seatsAllowed: number;
  seatsUsed: number;
  validFrom: Date;
  validUntil?: Date;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  currency: string;
  createdAt: Date;
}

/**
 * Service de gestion des licences
 * Gère la création, validation et gestion des licences premium
 */
export class LicenseService extends BaseService {
  
  /**
   * Crée une nouvelle licence pour un utilisateur
   */
  async createLicense(params: CreateLicenseParams): Promise<License> {
    this.logOperation('createLicense', { 
      userId: params.userId, 
      tier: params.tier,
      stripePaymentId: params.stripePaymentId 
    });

    // Validation des paramètres
    this.validateInput(params, ['userId', 'tier', 'amountPaid']);

    // Vérifier que l'utilisateur existe
    const user = await userRepository.findById(params.userId);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    // Vérifier qu'il n'y a pas déjà une licence active pour ce paiement Stripe
    if (params.stripePaymentId) {
      const existingLicense = await licenseRepository.findByStripePaymentId(params.stripePaymentId);
      if (existingLicense) {
        throw new ConflictError('Une licence existe déjà pour ce paiement Stripe');
      }
    }

    // Générer une clé de licence unique
    const licenseKey = await this.generateUniqueLicenseKey();

    // Déterminer le nombre de sièges selon le tier
    const seatsAllowed = params.seatsAllowed || this.getDefaultSeats(params.tier);

    // Préparer les données de la licence
    const licenseData: CreateLicenseData = {
      id: this.generateId(),
      userId: params.userId,
      licenseKey,
      tier: params.tier,
      stripePaymentId: params.stripePaymentId || null,
      stripeCustomerId: params.stripeCustomerId || null,
      stripeInvoiceId: params.stripeInvoiceId || null,
      amountPaid: params.amountPaid,
      currency: params.currency || 'EUR',
      paymentStatus: params.paymentStatus || 'completed',
      seatsAllowed,
      seatsUsed: 0,
      validFrom: new Date(),
      validUntil: params.isLifetime === false ? this.calculateExpiryDate(params.tier) : null,
      isLifetime: params.isLifetime !== false, // Par défaut lifetime
      isActive: true,
      isEarlyBird: false,
      discountPercentage: params.discountPercentage || 0,
      discountCode: params.discountCode || null,
      notes: params.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Créer la licence
    const createdLicense = await licenseRepository.create(licenseData);

    this.logOperation('createLicense success', { 
      licenseId: createdLicense.id,
      licenseKey: createdLicense.licenseKey 
    });

    return createdLicense;
  }

  /**
   * Récupère une licence par ID
   */
  async getLicenseById(id: string): Promise<License | null> {
    this.logOperation('getLicenseById', { id });
    return await licenseRepository.findById(id);
  }

  /**
   * Récupère une licence par clé de licence
   */
  async getLicenseByKey(licenseKey: string): Promise<License | null> {
    this.logOperation('getLicenseByKey', { licenseKey });
    return await licenseRepository.findByLicenseKey(licenseKey);
  }

  /**
   * Récupère toutes les licences actives d'un utilisateur
   */
  async getUserActiveLicenses(userId: string): Promise<License[]> {
    this.logOperation('getUserActiveLicenses', { userId });
    return await licenseRepository.findActiveLicensesByUserId(userId);
  }

  /**
   * Récupère la licence premium la plus élevée d'un utilisateur
   */
  async getUserHighestLicense(userId: string): Promise<License | null> {
    this.logOperation('getUserHighestLicense', { userId });

    const userLicenses = await this.getUserActiveLicenses(userId);
    
    if (!userLicenses.length) {
      return null;
    }

    // Trier par tier (enterprise > team > pro > free)
    const tierOrder = { enterprise: 4, team: 3, pro: 2, free: 1 };
    
    return userLicenses.sort((a, b) => 
      tierOrder[b.tier as keyof typeof tierOrder] - tierOrder[a.tier as keyof typeof tierOrder]
    )[0];
  }

  /**
   * Vérifie si un utilisateur a accès à un tier spécifique
   */
  async checkUserAccess(userId: string, requiredTier: LicenseTier): Promise<boolean> {
    this.logOperation('checkUserAccess', { userId, requiredTier });

    const highestLicense = await this.getUserHighestLicense(userId);
    
    if (!highestLicense) {
      return requiredTier === 'free';
    }

    return this.compareTiers(highestLicense.tier as LicenseTier, requiredTier);
  }

  /**
   * Met à jour une licence
   */
  async updateLicense(id: string, updateData: UpdateLicenseData): Promise<License> {
    this.logOperation('updateLicense', { id });

    const existingLicense = await this.getLicenseById(id);
    if (!existingLicense) {
      throw new NotFoundError('Licence non trouvée');
    }

    const updatedLicense = await licenseRepository.update(id, updateData);
    if (!updatedLicense) {
      throw new NotFoundError('Erreur lors de la mise à jour de la licence');
    }

    this.logOperation('updateLicense success', { licenseId: id });
    return updatedLicense;
  }

  /**
   * Désactive une licence
   */
  async deactivateLicense(id: string, reason?: string): Promise<void> {
    this.logOperation('deactivateLicense', { id, reason });
    await licenseRepository.deactivate(id, reason);
  }

  /**
   * Récupère une licence par paiement Stripe
   */
  async getLicenseByStripePayment(stripePaymentId: string): Promise<License | null> {
    this.logOperation('getLicenseByStripePayment', { stripePaymentId });
    return await licenseRepository.findByStripePaymentId(stripePaymentId);
  }

  /**
   * Met à jour le statut de paiement d'une licence
   */
  async updatePaymentStatus(licenseId: string, paymentStatus: PaymentStatus): Promise<void> {
    this.logOperation('updatePaymentStatus', { licenseId, paymentStatus });

    await this.updateLicense(licenseId, { paymentStatus });
  }

  /**
   * Génère une clé de licence unique
   */
  private async generateUniqueLicenseKey(): Promise<string> {
    let licenseKey: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      licenseKey = this.generateLicenseKey();
      attempts++;

      const existing = await this.getLicenseByKey(licenseKey);
      if (!existing) {
        break;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Impossible de générer une clé de licence unique');
      }
    } while (attempts < maxAttempts);

    return licenseKey;
  }

  /**
   * Génère une clé de licence au format ONA-XXXX-XXXX-XXXX
   */
  private generateLicenseKey(): string {
    const generateSegment = () => {
      return randomBytes(2).toString('hex').toUpperCase();
    };

    return `ONA-${generateSegment()}-${generateSegment()}-${generateSegment()}`;
  }

  /**
   * Détermine le nombre de sièges par défaut selon le tier
   */
  private getDefaultSeats(tier: LicenseTier): number {
    const seatsByTier = {
      free: 1,
      pro: 1,
      team: 5,
      enterprise: 25,
    };

    return seatsByTier[tier] || 1;
  }

  /**
   * Calcule la date d'expiration selon le tier (pour les licences non-lifetime)
   */
  private calculateExpiryDate(tier: LicenseTier): Date {
    const now = new Date();
    
    // Par défaut, toutes les licences sont lifetime
    // Cette méthode est pour les futurs abonnements récurrents
    switch (tier) {
      case 'pro':
      case 'team':
      case 'enterprise':
        // 1 an par défaut
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    }
  }

  /**
   * Compare deux tiers pour vérifier l'accès
   */
  private compareTiers(userTier: LicenseTier, requiredTier: LicenseTier): boolean {
    const tierOrder = { free: 1, pro: 2, team: 3, enterprise: 4 };
    
    return tierOrder[userTier] >= tierOrder[requiredTier];
  }

  /**
   * Valide qu'une licence est active et valide
   */
  async validateLicense(licenseKey: string): Promise<{ valid: boolean; license?: License; reason?: string }> {
    this.logOperation('validateLicense', { licenseKey });

    const license = await this.getLicenseByKey(licenseKey);
    
    if (!license) {
      return { valid: false, reason: 'Licence non trouvée' };
    }

    if (!license.isActive) {
      return { valid: false, license, reason: 'Licence désactivée' };
    }

    if (license.paymentStatus !== 'completed') {
      return { valid: false, license, reason: 'Paiement non confirmé' };
    }

    // Vérifier l'expiration pour les licences non-lifetime
    if (!license.isLifetime && license.validUntil) {
      const now = new Date();
      if (now > license.validUntil) {
        return { valid: false, license, reason: 'Licence expirée' };
      }
    }

    return { valid: true, license };
  }

  /**
   * Récupère les statistiques des licences
   */
  async getLicenseStats(): Promise<{
    total: number;
    active: number;
    byTier: Record<LicenseTier, number>;
    totalRevenue: number;
  }> {
    this.logOperation('getLicenseStats');
    
    const stats = await licenseRepository.getStatistics();
    
    return {
      total: stats.total,
      active: stats.active,
      byTier: stats.byTier as Record<LicenseTier, number>,
      totalRevenue: stats.totalRevenue,
    };
  }
}

// Instance singleton
export const licenseService = new LicenseService();