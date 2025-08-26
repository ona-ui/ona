import { eq, and, asc, count, SQL } from 'drizzle-orm';
import { db, PaginationOptions, PaginationResult } from './base_repository.js';
import { subcategories, categories, products } from '../db/schema.js';

export class SubcategoryRepository {
  async findById(id: string): Promise<typeof subcategories.$inferSelect | null> {
    const result = await db.select().from(subcategories).where(eq(subcategories.id, id)).limit(1);
    return result[0] || null;
  }

  async findBySlug(slug: string, categoryId?: string): Promise<typeof subcategories.$inferSelect | null> {
    let whereCondition: SQL<unknown> = eq(subcategories.slug, slug);
    
    if (categoryId) {
      whereCondition = and(eq(subcategories.slug, slug), eq(subcategories.categoryId, categoryId))!;
    }
    
    const result = await db.select().from(subcategories).where(whereCondition).limit(1);
    return result[0] || null;
  }

  async findByCategoryId(categoryId: string): Promise<(typeof subcategories.$inferSelect)[]> {
    return db
      .select()
      .from(subcategories)
      .where(and(eq(subcategories.categoryId, categoryId), eq(subcategories.isActive, true)))
      .orderBy(asc(subcategories.sortOrder), asc(subcategories.name));
  }

  async findWithCategory(subcategoryId: string) {
    const result = await db
      .select({
        // Sous-catégorie
        id: subcategories.id,
        categoryId: subcategories.categoryId,
        name: subcategories.name,
        slug: subcategories.slug,
        description: subcategories.description,
        sortOrder: subcategories.sortOrder,
        isActive: subcategories.isActive,
        createdAt: subcategories.createdAt,
        updatedAt: subcategories.updatedAt,
        // Catégorie
        category: {
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
        },
      })
      .from(subcategories)
      .innerJoin(categories, eq(subcategories.categoryId, categories.id))
      .where(eq(subcategories.id, subcategoryId))
      .limit(1);

    return result[0] || null;
  }

  async findWithFullHierarchy(subcategoryId: string) {
    const result = await db
      .select({
        // Sous-catégorie
        subcategory_id: subcategories.id,
        subcategory_categoryId: subcategories.categoryId,
        subcategory_name: subcategories.name,
        subcategory_slug: subcategories.slug,
        subcategory_description: subcategories.description,
        subcategory_sortOrder: subcategories.sortOrder,
        subcategory_isActive: subcategories.isActive,
        subcategory_createdAt: subcategories.createdAt,
        subcategory_updatedAt: subcategories.updatedAt,
        // Catégorie
        category_id: categories.id,
        category_productId: categories.productId,
        category_name: categories.name,
        category_slug: categories.slug,
        category_description: categories.description,
        category_iconName: categories.iconName,
        category_sortOrder: categories.sortOrder,
        category_isActive: categories.isActive,
        category_createdAt: categories.createdAt,
        category_updatedAt: categories.updatedAt,
        // Produit
        product_id: products.id,
        product_name: products.name,
        product_slug: products.slug,
        product_description: products.description,
        product_sortOrder: products.sortOrder,
        product_isActive: products.isActive,
        product_createdAt: products.createdAt,
        product_updatedAt: products.updatedAt,
      })
      .from(subcategories)
      .innerJoin(categories, eq(subcategories.categoryId, categories.id))
      .innerJoin(products, eq(categories.productId, products.id))
      .where(eq(subcategories.id, subcategoryId))
      .limit(1);

    if (!result[0]) return null;

    const row = result[0];
    return {
      id: row.subcategory_id,
      categoryId: row.subcategory_categoryId,
      name: row.subcategory_name,
      slug: row.subcategory_slug,
      description: row.subcategory_description,
      sortOrder: row.subcategory_sortOrder,
      isActive: row.subcategory_isActive,
      createdAt: row.subcategory_createdAt,
      updatedAt: row.subcategory_updatedAt,
      category: {
        id: row.category_id,
        productId: row.category_productId,
        name: row.category_name,
        slug: row.category_slug,
        description: row.category_description,
        iconName: row.category_iconName,
        sortOrder: row.category_sortOrder,
        isActive: row.category_isActive,
        createdAt: row.category_createdAt,
        updatedAt: row.category_updatedAt,
        product: {
          id: row.product_id,
          name: row.product_name,
          slug: row.product_slug,
          description: row.product_description,
          sortOrder: row.product_sortOrder,
          isActive: row.product_isActive,
          createdAt: row.product_createdAt,
          updatedAt: row.product_updatedAt,
        },
      },
    };
  }

  async create(subcategoryData: typeof subcategories.$inferInsert): Promise<typeof subcategories.$inferSelect> {
    const result = await db.insert(subcategories).values(subcategoryData).returning();
    return result[0];
  }

  async update(id: string, subcategoryData: Partial<typeof subcategories.$inferInsert>): Promise<typeof subcategories.$inferSelect | null> {
    const result = await db
      .update(subcategories)
      .set({ ...subcategoryData, updatedAt: new Date() })
      .where(eq(subcategories.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(subcategories).where(eq(subcategories.id, id));
    return (result.rowCount || 0) > 0;
  }

  async paginate(options: PaginationOptions = {}): Promise<PaginationResult<typeof subcategories.$inferSelect>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    // Count total
    const totalResult = await db.select({ count: count() }).from(subcategories);
    const total = totalResult[0].count;

    // Get data
    const data = await db
      .select()
      .from(subcategories)
      .orderBy(asc(subcategories.sortOrder), asc(subcategories.name))
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

  async findActive(): Promise<(typeof subcategories.$inferSelect)[]> {
    return db
      .select()
      .from(subcategories)
      .where(eq(subcategories.isActive, true))
      .orderBy(asc(subcategories.sortOrder), asc(subcategories.name));
  }
}