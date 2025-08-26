import { eq, and, desc, asc, count, gte, gt } from 'drizzle-orm';
import { db } from './base_repository.js';
import { licenses } from '../db/schema.js';

// Types basés sur le schéma de base de données
type License = typeof licenses.$inferSelect;
type CreateLicenseData = typeof licenses.$inferInsert;
type UpdateLicenseData = Partial<typeof licenses.$inferInsert>;

/**
 * Repository pour la gestion des licences
 * Gère les opérations de base de données pour les licences
 */
export class LicenseRepository {

  /**
   * Trouve une licence par ID
   */
  async findById(id: string): Promise<License | null> {
    const result = await db.select().from(licenses).where(eq(licenses.id, id)).limit(1);
    return result[0] || null;
  }

  /**
   * Crée une nouvelle licence
   */
  async create(licenseData: CreateLicenseData): Promise<License> {
    const result = await db.insert(licenses).values(licenseData).returning();
    return result[0];
  }

  /**
   * Met à jour une licence
   */
  async update(id: string, licenseData: UpdateLicenseData): Promise<License | null> {
    const result = await db
      .update(licenses)
      .set({ ...licenseData, updatedAt: new Date() })
      .where(eq(licenses.id, id))
      .returning();
    return result[0] || null;
  }

  /**
   * Trouve une licence par clé de licence
   */
  async findByLicenseKey(licenseKey: string): Promise<License | null> {
    const result = await db.select()
      .from(licenses)
      .where(eq(licenses.licenseKey, licenseKey))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Trouve une licence par ID de paiement Stripe
   */
  async findByStripePaymentId(stripePaymentId: string): Promise<License | null> {
    const result = await db.select()
      .from(licenses)
      .where(eq(licenses.stripePaymentId, stripePaymentId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Trouve toutes les licences actives d'un utilisateur
   */
  async findActiveLicensesByUserId(userId: string): Promise<License[]> {
    return await db.select()
      .from(licenses)
      .where(and(
        eq(licenses.userId, userId),
        eq(licenses.isActive, true)
      ))
      .orderBy(desc(licenses.createdAt));
  }

  /**
   * Trouve toutes les licences d'un utilisateur (actives et inactives)
   */
  async findAllLicensesByUserId(userId: string): Promise<License[]> {
    return await db.select()
      .from(licenses)
      .where(eq(licenses.userId, userId))
      .orderBy(desc(licenses.createdAt));
  }

  /**
   * Trouve les licences par tier
   */
  async findByTier(tier: 'free' | 'pro' | 'team' | 'enterprise'): Promise<License[]> {
    return await db.select()
      .from(licenses)
      .where(eq(licenses.tier, tier))
      .orderBy(desc(licenses.createdAt));
  }

  /**
   * Trouve les licences par statut de paiement
   */
  async findByPaymentStatus(paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed'): Promise<License[]> {
    return await db.select()
      .from(licenses)
      .where(eq(licenses.paymentStatus, paymentStatus))
      .orderBy(desc(licenses.createdAt));
  }

  /**
   * Compte le nombre de licences actives par tier
   */
  async countActiveLicensesByTier(): Promise<Record<string, number>> {
    const results = await db.select({
      tier: licenses.tier,
      count: count()
    })
    .from(licenses)
    .where(eq(licenses.isActive, true))
    .groupBy(licenses.tier);

    const counts: Record<string, number> = {
      free: 0,
      pro: 0,
      team: 0,
      enterprise: 0
    };

    results.forEach(result => {
      counts[result.tier] = Number(result.count);
    });

    return counts;
  }

  /**
   * Calcule le revenu total des licences payées
   */
  async getTotalRevenue(): Promise<number> {
    const results = await db.select({
      amountPaid: licenses.amountPaid
    })
    .from(licenses)
    .where(eq(licenses.paymentStatus, 'completed'));

    return results.reduce((total, license) => total + license.amountPaid, 0);
  }

  /**
   * Trouve les licences expirées (non-lifetime avec validUntil dépassé)
   */
  async findExpiredLicenses(): Promise<License[]> {
    return await db.select()
      .from(licenses)
      .where(and(
        eq(licenses.isLifetime, false),
        eq(licenses.isActive, true)
      ))
      .orderBy(asc(licenses.validUntil));
  }

  /**
   * Trouve les licences avec des sièges disponibles (team/enterprise)
   */
  async findLicensesWithAvailableSeats(userId: string): Promise<License[]> {
    return await db.select()
      .from(licenses)
      .where(and(
        eq(licenses.userId, userId),
        eq(licenses.isActive, true)
      ))
      .orderBy(desc(licenses.seatsAllowed));
  }

  /**
   * Met à jour le nombre de sièges utilisés
   */
  async updateSeatsUsed(licenseId: string, seatsUsed: number): Promise<License | null> {
    const result = await db.update(licenses)
      .set({
        seatsUsed,
        updatedAt: new Date()
      })
      .where(eq(licenses.id, licenseId))
      .returning();

    return result[0] || null;
  }

  /**
   * Désactive une licence
   */
  async deactivate(licenseId: string, reason?: string): Promise<License | null> {
    const notes = reason ? `Désactivée: ${reason}` : 'Licence désactivée';
    
    const result = await db.update(licenses)
      .set({
        isActive: false,
        notes,
        updatedAt: new Date()
      })
      .where(eq(licenses.id, licenseId))
      .returning();

    return result[0] || null;
  }

  /**
   * Réactive une licence
   */
  async reactivate(licenseId: string): Promise<License | null> {
    const result = await db.update(licenses)
      .set({
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(licenses.id, licenseId))
      .returning();

    return result[0] || null;
  }

  /**
   * Trouve les licences récentes (dernières 30 jours)
   */
  async findRecentLicenses(days: number = 30): Promise<License[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return await db.select()
      .from(licenses)
      .where(gte(licenses.createdAt, dateThreshold))
      .orderBy(desc(licenses.createdAt));
  }

  /**
   * Trouve les licences avec des codes de réduction
   */
  async findLicensesWithDiscounts(): Promise<License[]> {
    return await db.select()
      .from(licenses)
      .where(gt(licenses.discountPercentage, 0))
      .orderBy(desc(licenses.discountPercentage));
  }

  /**
   * Statistiques complètes des licences
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byTier: Record<string, number>;
    byPaymentStatus: Record<string, number>;
    totalRevenue: number;
    averageRevenue: number;
  }> {
    // Compter le total
    const totalResult = await db.select({ count: count() }).from(licenses);
    const total = Number(totalResult[0]?.count || 0);

    // Compter les actives
    const activeResult = await db.select({ count: count() })
      .from(licenses)
      .where(eq(licenses.isActive, true));
    const active = Number(activeResult[0]?.count || 0);

    // Par tier
    const byTier = await this.countActiveLicensesByTier();

    // Par statut de paiement
    const paymentStatusResults = await db.select({
      paymentStatus: licenses.paymentStatus,
      count: count()
    })
    .from(licenses)
    .groupBy(licenses.paymentStatus);

    const byPaymentStatus: Record<string, number> = {};
    paymentStatusResults.forEach(result => {
      if (result.paymentStatus) {
        byPaymentStatus[result.paymentStatus] = Number(result.count);
      }
    });

    // Revenu total
    const totalRevenue = await this.getTotalRevenue();
    const averageRevenue = total > 0 ? totalRevenue / total : 0;

    return {
      total,
      active,
      byTier,
      byPaymentStatus,
      totalRevenue,
      averageRevenue
    };
  }
}

// Instance singleton
export const licenseRepository = new LicenseRepository();