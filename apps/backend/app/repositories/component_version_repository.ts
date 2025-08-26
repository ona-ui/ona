import { eq, and, desc, count, SQL } from 'drizzle-orm';
import { db, PaginationOptions, PaginationResult } from './base_repository.js';
import { componentVersions, components } from '../db/schema.js';

export class ComponentVersionRepository {
  async findById(id: string): Promise<typeof componentVersions.$inferSelect | null> {
    const result = await db.select().from(componentVersions).where(eq(componentVersions.id, id)).limit(1);
    return result[0] || null;
  }

  async findByComponentId(componentId: string): Promise<(typeof componentVersions.$inferSelect)[]> {
    return db
      .select()
      .from(componentVersions)
      .where(eq(componentVersions.componentId, componentId))
      .orderBy(desc(componentVersions.createdAt));
  }

  async findLatest(componentId: string): Promise<typeof componentVersions.$inferSelect | null> {
    const result = await db
      .select()
      .from(componentVersions)
      .where(eq(componentVersions.componentId, componentId))
      .orderBy(desc(componentVersions.createdAt))
      .limit(1);
    return result[0] || null;
  }

  async findDefault(componentId: string): Promise<typeof componentVersions.$inferSelect | null> {
    const result = await db
      .select()
      .from(componentVersions)
      .where(and(eq(componentVersions.componentId, componentId), eq(componentVersions.isDefault, true)))
      .limit(1);
    return result[0] || null;
  }

  async findByFramework(
    componentId: string,
    framework: 'html' | 'react' | 'vue' | 'svelte' | 'alpine' | 'angular',
    cssFramework?: 'tailwind_v3' | 'tailwind_v4' | 'vanilla_css'
  ): Promise<(typeof componentVersions.$inferSelect)[]> {
    let whereCondition: SQL<unknown> = and(
      eq(componentVersions.componentId, componentId),
      eq(componentVersions.framework, framework)
    )!;

    if (cssFramework) {
      whereCondition = and(
        eq(componentVersions.componentId, componentId),
        eq(componentVersions.framework, framework),
        eq(componentVersions.cssFramework, cssFramework)
      )!;
    }

    return db
      .select()
      .from(componentVersions)
      .where(whereCondition)
      .orderBy(desc(componentVersions.createdAt));
  }

  async findByVersion(
    componentId: string,
    versionNumber: string,
    framework: 'html' | 'react' | 'vue' | 'svelte' | 'alpine' | 'angular',
    cssFramework: 'tailwind_v3' | 'tailwind_v4' | 'vanilla_css'
  ): Promise<typeof componentVersions.$inferSelect | null> {
    const result = await db
      .select()
      .from(componentVersions)
      .where(
        and(
          eq(componentVersions.componentId, componentId),
          eq(componentVersions.versionNumber, versionNumber),
          eq(componentVersions.framework, framework),
          eq(componentVersions.cssFramework, cssFramework)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async create(versionData: typeof componentVersions.$inferInsert): Promise<typeof componentVersions.$inferSelect> {
    // Si c'est marqué comme version par défaut, on doit d'abord désactiver les autres versions par défaut
    if (versionData.isDefault) {
      await this.clearDefaultVersions(versionData.componentId);
    }

    const result = await db.insert(componentVersions).values(versionData).returning();
    return result[0];
  }

  async update(id: string, versionData: Partial<typeof componentVersions.$inferInsert>): Promise<typeof componentVersions.$inferSelect | null> {
    // Si on marque cette version comme par défaut, on doit désactiver les autres
    if (versionData.isDefault) {
      const currentVersion = await this.findById(id);
      if (currentVersion) {
        await this.clearDefaultVersions(currentVersion.componentId);
      }
    }

    const result = await db
      .update(componentVersions)
      .set({ ...versionData, updatedAt: new Date() })
      .where(eq(componentVersions.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(componentVersions).where(eq(componentVersions.id, id));
    return (result.rowCount || 0) > 0;
  }

  async setAsDefault(id: string): Promise<boolean> {
    const version = await this.findById(id);
    if (!version) return false;

    // Désactiver toutes les versions par défaut pour ce composant
    await this.clearDefaultVersions(version.componentId);

    // Marquer cette version comme par défaut
    const result = await db
      .update(componentVersions)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(componentVersions.id, id));

    return (result.rowCount || 0) > 0;
  }

  private async clearDefaultVersions(componentId: string): Promise<void> {
    await db
      .update(componentVersions)
      .set({ isDefault: false })
      .where(and(eq(componentVersions.componentId, componentId), eq(componentVersions.isDefault, true)));
  }

  async getVersionStats(componentId: string) {
    const versions = await db
      .select({
        framework: componentVersions.framework,
        cssFramework: componentVersions.cssFramework,
        count: count(),
      })
      .from(componentVersions)
      .where(eq(componentVersions.componentId, componentId))
      .groupBy(componentVersions.framework, componentVersions.cssFramework);

    const totalVersions = await db
      .select({ count: count() })
      .from(componentVersions)
      .where(eq(componentVersions.componentId, componentId));

    return {
      totalVersions: totalVersions[0].count,
      byFramework: versions,
    };
  }

  async findWithComponent(versionId: string) {
    const result = await db
      .select({
        // Version
        version_id: componentVersions.id,
        version_componentId: componentVersions.componentId,
        version_versionNumber: componentVersions.versionNumber,
        version_framework: componentVersions.framework,
        version_cssFramework: componentVersions.cssFramework,
        version_codePreview: componentVersions.codePreview,
        version_codeFull: componentVersions.codeFull,
        version_codeEncrypted: componentVersions.codeEncrypted,
        version_dependencies: componentVersions.dependencies,
        version_configRequired: componentVersions.configRequired,
        version_supportsDarkMode: componentVersions.supportsDarkMode,
        version_darkModeCode: componentVersions.darkModeCode,
        version_integrations: componentVersions.integrations,
        version_integrationCode: componentVersions.integrationCode,
        version_files: componentVersions.files,
        version_isDefault: componentVersions.isDefault,
        version_createdAt: componentVersions.createdAt,
        version_updatedAt: componentVersions.updatedAt,
        // Composant
        component_id: components.id,
        component_name: components.name,
        component_slug: components.slug,
        component_description: components.description,
        component_isFree: components.isFree,
        component_status: components.status,
      })
      .from(componentVersions)
      .innerJoin(components, eq(componentVersions.componentId, components.id))
      .where(eq(componentVersions.id, versionId))
      .limit(1);

    if (!result[0]) return null;

    const row = result[0];
    return {
      id: row.version_id,
      componentId: row.version_componentId,
      versionNumber: row.version_versionNumber,
      framework: row.version_framework,
      cssFramework: row.version_cssFramework,
      codePreview: row.version_codePreview,
      codeFull: row.version_codeFull,
      codeEncrypted: row.version_codeEncrypted,
      dependencies: row.version_dependencies,
      configRequired: row.version_configRequired,
      supportsDarkMode: row.version_supportsDarkMode,
      darkModeCode: row.version_darkModeCode,
      integrations: row.version_integrations,
      integrationCode: row.version_integrationCode,
      files: row.version_files,
      isDefault: row.version_isDefault,
      createdAt: row.version_createdAt,
      updatedAt: row.version_updatedAt,
      component: {
        id: row.component_id,
        name: row.component_name,
        slug: row.component_slug,
        description: row.component_description,
        isFree: row.component_isFree,
        status: row.component_status,
      },
    };
  }

  async paginate(
    options: PaginationOptions = {},
    componentId?: string
  ): Promise<PaginationResult<typeof componentVersions.$inferSelect>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    if (componentId) {
      // Count total avec filtre
      const totalResult = await db
        .select({ count: count() })
        .from(componentVersions)
        .where(eq(componentVersions.componentId, componentId));
      const total = totalResult[0].count;

      // Get data avec filtre
      const data = await db
        .select()
        .from(componentVersions)
        .where(eq(componentVersions.componentId, componentId))
        .orderBy(desc(componentVersions.createdAt))
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
    } else {
      // Count total sans filtre
      const totalResult = await db.select({ count: count() }).from(componentVersions);
      const total = totalResult[0].count;

      // Get data sans filtre
      const data = await db
        .select()
        .from(componentVersions)
        .orderBy(desc(componentVersions.createdAt))
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
}