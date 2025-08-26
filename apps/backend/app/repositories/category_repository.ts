import { eq, and, asc, count, SQL } from 'drizzle-orm';
import { db, PaginationOptions, PaginationResult } from './base_repository.js';
import { categories, products, subcategories } from '../db/schema.js';

export class CategoryRepository {
  async findById(id: string): Promise<typeof categories.$inferSelect | null> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0] || null;
  }

  async findBySlug(slug: string, productId?: string): Promise<typeof categories.$inferSelect | null> {
    let whereCondition: SQL<unknown> = eq(categories.slug, slug);
    
    if (productId) {
      whereCondition = and(eq(categories.slug, slug), eq(categories.productId, productId))!;
    }
    
    const result = await db.select().from(categories).where(whereCondition).limit(1);
    return result[0] || null;
  }

  async findByProductId(productId: string): Promise<(typeof categories.$inferSelect)[]> {
    return db
      .select()
      .from(categories)
      .where(and(eq(categories.productId, productId), eq(categories.isActive, true)))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  async findWithSubcategories(categoryId: string) {
    // Récupérer la catégorie
    const category = await this.findById(categoryId);
    if (!category) return null;

    // Récupérer les sous-catégories avec comptage des composants
    const subcategoriesWithCount = await db
      .select({
        id: subcategories.id,
        categoryId: subcategories.categoryId,
        name: subcategories.name,
        slug: subcategories.slug,
        description: subcategories.description,
        sortOrder: subcategories.sortOrder,
        isActive: subcategories.isActive,
        createdAt: subcategories.createdAt,
        updatedAt: subcategories.updatedAt,
      })
      .from(subcategories)
      .where(and(eq(subcategories.categoryId, categoryId), eq(subcategories.isActive, true)))
      .orderBy(asc(subcategories.sortOrder), asc(subcategories.name));

    return {
      ...category,
      subcategories: subcategoriesWithCount,
    };
  }

  async findWithProduct(categoryId: string) {
    const result = await db
      .select({
        // Catégorie
        id: categories.id,
        productId: categories.productId,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        iconName: categories.iconName,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        // Produit
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          sortOrder: products.sortOrder,
          isActive: products.isActive,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        },
      })
      .from(categories)
      .innerJoin(products, eq(categories.productId, products.id))
      .where(eq(categories.id, categoryId))
      .limit(1);

    return result[0] || null;
  }

  async create(categoryData: typeof categories.$inferInsert): Promise<typeof categories.$inferSelect> {
    const result = await db.insert(categories).values(categoryData).returning();
    return result[0];
  }

  async update(id: string, categoryData: Partial<typeof categories.$inferInsert>): Promise<typeof categories.$inferSelect | null> {
    const result = await db
      .update(categories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  async paginate(options: PaginationOptions = {}): Promise<PaginationResult<typeof categories.$inferSelect>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    // Count total
    const totalResult = await db.select({ count: count() }).from(categories);
    const total = totalResult[0].count;

    // Get data
    const data = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name))
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

  async findActive(): Promise<(typeof categories.$inferSelect)[]> {
    return db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }
}