import { eq, and, desc, asc, count, SQL, like, gte, isNotNull, sql } from 'drizzle-orm';
import { db, PaginationOptions, PaginationResult } from './base_repository.js';
import { components, subcategories } from '../db/schema.js';

export interface ComponentFilters {
  subcategoryId?: string;
  categoryId?: string;
  productId?: string;
  isFree?: boolean;
  status?: 'draft' | 'published' | 'archived' | 'deprecated';
  isNew?: boolean;
  isFeatured?: boolean;
  search?: string;
  hasConversionRate?: boolean;
  minConversionRate?: number;
}

export class ComponentRepository {
  async findById(id: string): Promise<typeof components.$inferSelect | null> {
    const result = await db.select().from(components).where(eq(components.id, id)).limit(1);
    return result[0] || null;
  }

  async findBySlug(slug: string, subcategoryId?: string): Promise<typeof components.$inferSelect | null> {
    let whereCondition: SQL<unknown> = eq(components.slug, slug);
    
    if (subcategoryId) {
      whereCondition = and(eq(components.slug, slug), eq(components.subcategoryId, subcategoryId))!;
    }
    
    const result = await db.select().from(components).where(whereCondition).limit(1);
    return result[0] || null;
  }

  async findPublic(): Promise<(typeof components.$inferSelect)[]> {
    return db
      .select()
      .from(components)
      .where(eq(components.status, 'published'))
      .orderBy(desc(components.publishedAt));
  }

  async findFree(): Promise<(typeof components.$inferSelect)[]> {
    return db
      .select()
      .from(components)
      .where(and(eq(components.isFree, true), eq(components.status, 'published')))
      .orderBy(desc(components.publishedAt));
  }

  async findPremium(): Promise<(typeof components.$inferSelect)[]> {
    return db
      .select()
      .from(components)
      .where(and(eq(components.isFree, false), eq(components.status, 'published')))
      .orderBy(desc(components.publishedAt));
  }

  async findBySubcategoryId(subcategoryId: string): Promise<(typeof components.$inferSelect)[]> {
    return db
      .select()
      .from(components)
      .where(and(eq(components.subcategoryId, subcategoryId), eq(components.status, 'published')))
      .orderBy(asc(components.sortOrder), desc(components.publishedAt));
  }

  async findByCategoryId(categoryId: string): Promise<(typeof components.$inferSelect)[]> {
    return db
      .select({
        id: components.id,
        subcategoryId: components.subcategoryId,
        name: components.name,
        slug: components.slug,
        description: components.description,
        isFree: components.isFree,
        requiredTier: components.requiredTier,
        accessType: components.accessType,
        status: components.status,
        isNew: components.isNew,
        isFeatured: components.isFeatured,
        conversionRate: components.conversionRate,
        testedCompanies: components.testedCompanies,
        previewImageLarge: components.previewImageLarge,
        previewImageSmall: components.previewImageSmall,
        previewVideoUrl: components.previewVideoUrl,
        tags: components.tags,
        sortOrder: components.sortOrder,
        viewCount: components.viewCount,
        copyCount: components.copyCount,
        publishedAt: components.publishedAt,
        createdAt: components.createdAt,
        updatedAt: components.updatedAt,
        archivedAt: components.archivedAt,
      })
      .from(components)
      .innerJoin(subcategories, eq(components.subcategoryId, subcategories.id))
      .where(and(eq(subcategories.categoryId, categoryId), eq(components.status, 'published')))
      .orderBy(asc(components.sortOrder), desc(components.publishedAt));
  }

  async search(query: string): Promise<(typeof components.$inferSelect)[]> {
    const searchPattern = `%${query}%`;
    return db
      .select()
      .from(components)
      .where(
        and(
          eq(components.status, 'published'),
          like(components.name, searchPattern)
        )
      )
      .orderBy(desc(components.viewCount));
  }

  async findWithFilters(filters: ComponentFilters): Promise<(typeof components.$inferSelect)[]> {
    // Si on filtre par catégorie, on doit faire une jointure
    if (filters.categoryId) {
      const conditions: SQL<unknown>[] = [eq(components.status, filters.status || 'published')];

      if (filters.subcategoryId) {
        conditions.push(eq(components.subcategoryId, filters.subcategoryId));
      }

      if (filters.isFree !== undefined) {
        conditions.push(eq(components.isFree, filters.isFree));
      }

      if (filters.isNew !== undefined) {
        conditions.push(eq(components.isNew, filters.isNew));
      }

      if (filters.isFeatured !== undefined) {
        conditions.push(eq(components.isFeatured, filters.isFeatured));
      }

      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(like(components.name, searchPattern));
      }

      if (filters.hasConversionRate) {
        conditions.push(isNotNull(components.conversionRate));
      }

      if (filters.minConversionRate) {
        conditions.push(gte(components.conversionRate, filters.minConversionRate.toString()));
      }

      return db
        .select({
          id: components.id,
          subcategoryId: components.subcategoryId,
          name: components.name,
          slug: components.slug,
          description: components.description,
          isFree: components.isFree,
          requiredTier: components.requiredTier,
          accessType: components.accessType,
          status: components.status,
          isNew: components.isNew,
          isFeatured: components.isFeatured,
          conversionRate: components.conversionRate,
          testedCompanies: components.testedCompanies,
          previewImageLarge: components.previewImageLarge,
          previewImageSmall: components.previewImageSmall,
          previewVideoUrl: components.previewVideoUrl,
          tags: components.tags,
          sortOrder: components.sortOrder,
          viewCount: components.viewCount,
          copyCount: components.copyCount,
          publishedAt: components.publishedAt,
          createdAt: components.createdAt,
          updatedAt: components.updatedAt,
          archivedAt: components.archivedAt,
        })
        .from(components)
        .innerJoin(subcategories, eq(components.subcategoryId, subcategories.id))
        .where(and(eq(subcategories.categoryId, filters.categoryId), ...conditions))
        .orderBy(asc(components.sortOrder), desc(components.publishedAt));
    }

    // Sans filtre de catégorie, logique existante
    const conditions: SQL<unknown>[] = [];

    // Toujours filtrer par statut publié par défaut
    conditions.push(eq(components.status, filters.status || 'published'));

    if (filters.subcategoryId) {
      conditions.push(eq(components.subcategoryId, filters.subcategoryId));
    }

    if (filters.isFree !== undefined) {
      conditions.push(eq(components.isFree, filters.isFree));
    }

    if (filters.isNew !== undefined) {
      conditions.push(eq(components.isNew, filters.isNew));
    }

    if (filters.isFeatured !== undefined) {
      conditions.push(eq(components.isFeatured, filters.isFeatured));
    }

    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(like(components.name, searchPattern));
    }

    if (filters.hasConversionRate) {
      conditions.push(isNotNull(components.conversionRate));
    }

    if (filters.minConversionRate) {
      conditions.push(gte(components.conversionRate, filters.minConversionRate.toString()));
    }

    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];
    return db
      .select()
      .from(components)
      .where(whereCondition)
      .orderBy(asc(components.sortOrder), desc(components.publishedAt));
  }

  async create(componentData: typeof components.$inferInsert): Promise<typeof components.$inferSelect> {
    const result = await db.insert(components).values(componentData).returning();
    return result[0];
  }

  async update(id: string, componentData: Partial<typeof components.$inferInsert>): Promise<typeof components.$inferSelect | null> {
    const result = await db
      .update(components)
      .set({ ...componentData, updatedAt: new Date() })
      .where(eq(components.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(components).where(eq(components.id, id));
    return (result.rowCount || 0) > 0;
  }

  async incrementViewCount(id: string): Promise<void> {
    await db
      .update(components)
      .set({ viewCount: sql`${components.viewCount} + 1` })
      .where(eq(components.id, id));
  }

  async incrementCopyCount(id: string): Promise<void> {
    await db
      .update(components)
      .set({ copyCount: sql`${components.copyCount} + 1` })
      .where(eq(components.id, id));
  }

  async paginate(
    options: PaginationOptions = {},
    filters: ComponentFilters = {}
  ): Promise<PaginationResult<typeof components.$inferSelect>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    // Si on filtre par catégorie, on doit faire une jointure
    if (filters.categoryId) {
      const conditions: SQL<unknown>[] = [eq(components.status, filters.status || 'published')];

      if (filters.subcategoryId) {
        conditions.push(eq(components.subcategoryId, filters.subcategoryId));
      }

      if (filters.isFree !== undefined) {
        conditions.push(eq(components.isFree, filters.isFree));
      }

      if (filters.isNew !== undefined) {
        conditions.push(eq(components.isNew, filters.isNew));
      }

      if (filters.isFeatured !== undefined) {
        conditions.push(eq(components.isFeatured, filters.isFeatured));
      }

      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(like(components.name, searchPattern));
      }

      if (filters.hasConversionRate) {
        conditions.push(isNotNull(components.conversionRate));
      }

      if (filters.minConversionRate) {
        conditions.push(gte(components.conversionRate, filters.minConversionRate.toString()));
      }

      const whereCondition = conditions.length > 1 ? and(eq(subcategories.categoryId, filters.categoryId), ...conditions) : eq(subcategories.categoryId, filters.categoryId);

      // Count total avec jointure
      const totalQuery = db
        .select({ count: count() })
        .from(components)
        .innerJoin(subcategories, eq(components.subcategoryId, subcategories.id))
        .where(whereCondition);

      const totalResult = await totalQuery;
      const total = totalResult[0].count;

      // Get data avec jointure
      const data = await db
        .select({
          id: components.id,
          subcategoryId: components.subcategoryId,
          name: components.name,
          slug: components.slug,
          description: components.description,
          isFree: components.isFree,
          requiredTier: components.requiredTier,
          accessType: components.accessType,
          status: components.status,
          isNew: components.isNew,
          isFeatured: components.isFeatured,
          conversionRate: components.conversionRate,
          testedCompanies: components.testedCompanies,
          previewImageLarge: components.previewImageLarge,
          previewImageSmall: components.previewImageSmall,
          previewVideoUrl: components.previewVideoUrl,
          tags: components.tags,
          sortOrder: components.sortOrder,
          viewCount: components.viewCount,
          copyCount: components.copyCount,
          publishedAt: components.publishedAt,
          createdAt: components.createdAt,
          updatedAt: components.updatedAt,
          archivedAt: components.archivedAt,
        })
        .from(components)
        .innerJoin(subcategories, eq(components.subcategoryId, subcategories.id))
        .where(whereCondition)
        .orderBy(asc(components.sortOrder), desc(components.publishedAt))
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

    // Sans filtre de catégorie, logique existante
    const conditions: SQL<unknown>[] = [];
    conditions.push(eq(components.status, filters.status || 'published'));

    if (filters.subcategoryId) {
      conditions.push(eq(components.subcategoryId, filters.subcategoryId));
    }

    if (filters.isFree !== undefined) {
      conditions.push(eq(components.isFree, filters.isFree));
    }

    if (filters.isNew !== undefined) {
      conditions.push(eq(components.isNew, filters.isNew));
    }

    if (filters.isFeatured !== undefined) {
      conditions.push(eq(components.isFeatured, filters.isFeatured));
    }

    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(like(components.name, searchPattern));
    }

    if (filters.hasConversionRate) {
      conditions.push(isNotNull(components.conversionRate));
    }

    if (filters.minConversionRate) {
      conditions.push(gte(components.conversionRate, filters.minConversionRate.toString()));
    }

    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Count total
    const totalResult = await db
      .select({ count: count() })
      .from(components)
      .where(whereCondition);
    const total = totalResult[0].count;

    // Get data
    const data = await db
      .select()
      .from(components)
      .where(whereCondition)
      .orderBy(asc(components.sortOrder), desc(components.publishedAt))
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
}