import { eq, and, desc, count, isNull } from 'drizzle-orm';
import { db, PaginationOptions, PaginationResult } from './base_repository.js';
import { users, licenses } from '../db/schema.js';

export class UserRepository {
  async findById(id: string): Promise<typeof users.$inferSelect | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<typeof users.$inferSelect | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async findByUsername(username: string): Promise<typeof users.$inferSelect | null> {
    if (!username) return null;
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async findByRole(role: 'user' | 'admin' | 'super_admin'): Promise<(typeof users.$inferSelect)[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async create(userData: typeof users.$inferInsert): Promise<typeof users.$inferSelect> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async update(id: string, userData: Partial<typeof users.$inferInsert>): Promise<typeof users.$inferSelect | null> {
    const result = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async paginate(options: PaginationOptions = {}): Promise<PaginationResult<typeof users.$inferSelect>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    // Count total
    const totalResult = await db.select({ count: count() }).from(users);
    const total = totalResult[0].count;

    // Get data
    const data = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async checkSubscription(userId: string): Promise<boolean> {
    try {
      // Vérifier si l'utilisateur a une licence active et valide
      const result = await db
        .select({ count: count() })
        .from(licenses)
        .where(
          and(
            eq(licenses.userId, userId),
            eq(licenses.isActive, true),
            eq(licenses.paymentStatus, 'completed'),
            // Vérifier que la licence n'est pas expirée (pour les licences non-lifetime)
            // Si validUntil est null (lifetime) ou dans le futur, c'est valide
            // Note: isNull(licenses.validUntil) pour les licences lifetime
            // ou gte(licenses.validUntil, new Date()) pour les licences avec expiration
          )
        );
      
      const hasActiveLicense = result[0].count > 0;
      
      // Log pour debug
      console.log(`[UserRepository] checkSubscription for user ${userId}: ${hasActiveLicense}`);
      
      return hasActiveLicense;
    } catch (error) {
      console.error(`[UserRepository] Error checking subscription for user ${userId}:`, error);
      // En cas d'erreur, retourner false par sécurité
      return false;
    }
  }

  async findActiveUsers(): Promise<(typeof users.$inferSelect)[]> {
    return db
      .select()
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(desc(users.lastLoginAt));
  }
}