import { BaseService, ValidationError, ConflictError } from './base_service.js';
import { componentRepository, componentVersionRepository, userRepository } from '../repositories/index.js';
import type { PaginationOptions } from '../repositories/base_repository.js';
import { componentVersions } from '../db/schema.js';

// Types locaux basés sur le schéma de base de données
type ComponentVersion = typeof componentVersions.$inferSelect;
type CreateVersionData = typeof componentVersions.$inferInsert;
type UpdateVersionData = Partial<typeof componentVersions.$inferInsert>;

/**
 * Service de gestion des versions de composants
 * Gère la création, mise à jour, suppression et validation des versions
 */
export class VersionService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Récupère une version par ID
   */
  async getVersionById(id: string): Promise<ComponentVersion> {
    this.logOperation('getVersionById', { id });

    const version = await componentVersionRepository.findById(id);
    this.validateExists(version, 'Version de composant');

    return version!;
  }

  /**
   * Récupère toutes les versions d'un composant
   */
  async getVersionsByComponentId(componentId: string, userId?: string): Promise<ComponentVersion[]> {
    this.logOperation('getVersionsByComponentId', { componentId, userId });

    

    // Vérifier que le composant existe
    const component = await componentRepository.findById(componentId);
    this.validateExists(component, 'Composant');

    // Si le composant est premium et l'utilisateur n'a pas d'accès, retourner des versions limitées
    if (!component!.isFree && userId) {
      const hasPremiumAccess = await this.checkPremiumAccess(userId);
      if (!hasPremiumAccess) {
        // Retourner des versions avec le code sensible masqué
        const allVersions = await componentVersionRepository.findByComponentId(componentId);
        return this.filterSensitiveVersionData(allVersions);
      }
    } else if (!component!.isFree && !userId) {
      // Utilisateur non connecté, masquer le code sensible
      const allVersions = await componentVersionRepository.findByComponentId(componentId);
      return this.filterSensitiveVersionData(allVersions);
    }

    // Si le composant est gratuit ou que l'utilisateur a un accès premium, retourner toutes les versions
    return await componentVersionRepository.findByComponentId(componentId);
  }

  /**
   * Récupère la version par défaut d'un composant
   */
  async getDefaultVersion(componentId: string, userId?: string): Promise<ComponentVersion | null> {
    this.logOperation('getDefaultVersion', { componentId, userId });

    const version = await componentVersionRepository.findDefault(componentId);
    if (!version) return null;

    // Vérifier que le composant existe
    const component = await componentRepository.findById(componentId);
    this.validateExists(component, 'Composant');

    // Si le composant est premium et l'utilisateur n'a pas d'accès, filtrer les données sensibles
    if (!component!.isFree && userId) {
      const hasPremiumAccess = await this.checkPremiumAccess(userId);
      if (!hasPremiumAccess) {
        return this.filterSensitiveVersionData([version])[0];
      }
    } else if (!component!.isFree && !userId) {
      // Utilisateur non connecté, masquer le code sensible
      return this.filterSensitiveVersionData([version])[0];
    }

    return version;
  }

  /**
   * Récupère une version spécifique par framework
   */
  async getVersionByFramework(
    componentId: string,
    framework: 'html' | 'react' | 'vue' | 'svelte' | 'alpine' | 'angular',
    cssFramework: 'tailwind_v3' | 'tailwind_v4' | 'vanilla_css',
    userId?: string
  ): Promise<ComponentVersion | null> {
    this.logOperation('getVersionByFramework', { componentId, framework, cssFramework, userId });

    const versions = await componentVersionRepository.findByFramework(componentId, framework, cssFramework);
    if (versions.length === 0) return null;
    
    const version = versions[0];

    // Vérifier que le composant existe
    const component = await componentRepository.findById(componentId);
    this.validateExists(component, 'Composant');

    // Si le composant est premium et l'utilisateur n'a pas d'accès, filtrer les données sensibles
    if (!component!.isFree && userId) {
      const hasPremiumAccess = await this.checkPremiumAccess(userId);
      if (!hasPremiumAccess) {
        return this.filterSensitiveVersionData([version])[0];
      }
    } else if (!component!.isFree && !userId) {
      // Utilisateur non connecté, masquer le code sensible
      return this.filterSensitiveVersionData([version])[0];
    }

    return version;
  }

  /**
   * Crée une nouvelle version de composant
   */
  async createVersion(versionData: CreateVersionData, requestingUserId: string): Promise<ComponentVersion> {
    this.logOperation('createVersion', { 
      componentId: versionData.componentId,
      framework: versionData.framework,
      cssFramework: versionData.cssFramework
    });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    // Validation des données
    this.validateInput(versionData, ['componentId', 'framework', 'cssFramework', 'versionNumber']);

    // Vérifier que le composant existe
    const component = await componentRepository.findById(versionData.componentId);
    this.validateExists(component, 'Composant');

    // Vérifier l'unicité de la combinaison composant/framework/cssFramework/version
    const existingVersion = await componentVersionRepository.findByVersion(
      versionData.componentId,
      versionData.versionNumber,
      versionData.framework,
      versionData.cssFramework
    );

    if (existingVersion) {
      throw new ConflictError(
        `Une version ${versionData.versionNumber} existe déjà pour ${versionData.framework}/${versionData.cssFramework}`
      );
    }

    // Préparer les données pour l'insertion
    const versionToCreate = {
      id: this.generateId(),
      componentId: versionData.componentId,
      versionNumber: versionData.versionNumber,
      framework: versionData.framework,
      cssFramework: versionData.cssFramework,
      codePreview: versionData.codePreview || null,
      codeFull: versionData.codeFull || null,
      codeEncrypted: versionData.codeEncrypted || null,
      dependencies: versionData.dependencies || null,
      configRequired: versionData.configRequired || null,
      supportsDarkMode: versionData.supportsDarkMode || false,
      darkModeCode: versionData.darkModeCode || null,
      integrations: versionData.integrations || null,
      integrationCode: versionData.integrationCode || null,
      files: versionData.files || null,
      isDefault: versionData.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdVersion = await componentVersionRepository.create(versionToCreate);

    this.logOperation('createVersion success', { versionId: createdVersion.id });
    return createdVersion;
  }

  /**
   * Met à jour une version de composant
   */
  async updateVersion(id: string, versionData: UpdateVersionData, requestingUserId: string): Promise<ComponentVersion> {
    this.logOperation('updateVersion', { id });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    const existingVersion = await componentVersionRepository.findById(id);
    this.validateExists(existingVersion, 'Version de composant');

    // Nettoyer les données
    const allowedFields = [
      'versionNumber', 'codePreview', 'codeFull', 'codeEncrypted', 'dependencies',
      'configRequired', 'supportsDarkMode', 'darkModeCode', 'integrations',
      'integrationCode', 'files', 'isDefault'
    ];
    const sanitizedData = this.sanitizeInput<UpdateVersionData>(versionData, allowedFields);

    const updatedVersion = await componentVersionRepository.update(id, sanitizedData);
    this.validateExists(updatedVersion, 'Version mise à jour');

    this.logOperation('updateVersion success', { versionId: id });
    return updatedVersion!;
  }

  /**
   * Supprime une version de composant
   */
  async deleteVersion(id: string, requestingUserId: string): Promise<void> {
    this.logOperation('deleteVersion', { id });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    const version = await componentVersionRepository.findById(id);
    this.validateExists(version, 'Version de composant');

    // Vérifier que ce n'est pas la seule version du composant
    const allVersions = await componentVersionRepository.findByComponentId(version!.componentId);
    if (allVersions.length === 1) {
      throw new ValidationError('Impossible de supprimer la dernière version d\'un composant');
    }

    // Si c'est la version par défaut, en définir une autre comme par défaut
    if (version!.isDefault) {
      const otherVersion = allVersions.find((v: ComponentVersion) => v.id !== id);
      if (otherVersion) {
        await componentVersionRepository.setAsDefault(otherVersion.id);
      }
    }

    await componentVersionRepository.delete(id);
    this.logOperation('deleteVersion success', { versionId: id });
  }

  /**
   * Définit une version comme version par défaut
   */
  async setAsDefault(id: string, requestingUserId: string): Promise<ComponentVersion> {
    this.logOperation('setAsDefault', { id });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    const version = await componentVersionRepository.findById(id);
    this.validateExists(version, 'Version de composant');

    await componentVersionRepository.setAsDefault(id);

    const updatedVersion = await componentVersionRepository.findById(id);
    this.logOperation('setAsDefault success', { versionId: id });
    return updatedVersion!;
  }

  /**
   * Liste les versions avec pagination
   */
  async listVersions(componentId: string, options: PaginationOptions) {
    this.logOperation('listVersions', { componentId, options });

    const validatedOptions = this.validatePaginationOptions(options);
    const result = await componentVersionRepository.paginate(validatedOptions, componentId);

    return this.createPaginatedResponse(result, 'Versions récupérées avec succès');
  }

  /**
   * Obtient le nombre de versions pour un composant
   */
  async getVersionsCount(componentId: string): Promise<number> {
    this.logOperation('getVersionsCount', { componentId });

    const stats = await componentVersionRepository.getVersionStats(componentId);
    return stats.totalVersions;
  }

  /**
   * Obtient la répartition par framework pour un composant
   */
  async getFrameworkBreakdown(componentId: string): Promise<Array<{ framework: string; cssFramework: string; count: number }>> {
    this.logOperation('getFrameworkBreakdown', { componentId });

    const stats = await componentVersionRepository.getVersionStats(componentId);
    return stats.byFramework;
  }

  /**
   * Valide les permissions d'administration
   */
  private async validateAdminPermissions(userId: string): Promise<void> {
    if (!userId) {
      throw new ValidationError('ID utilisateur requis');
    }
    // TODO: Intégrer avec UserService pour vérifier les permissions réelles
  }

  /**
   * Vérifie l'accès premium d'un utilisateur
   */
  private async checkPremiumAccess(userId: string): Promise<boolean> {
    try {
      return await userRepository.checkSubscription(userId);
    } catch (error) {
      this.logError('checkPremiumAccess', error as Error, { userId });
      return false;
    }
  }

  /**
   * Filtre les données sensibles des versions pour les utilisateurs sans accès premium
   */
  private filterSensitiveVersionData(versions: ComponentVersion[]): ComponentVersion[] {
    return versions.map(version => ({
      ...version,
      codeFull: null,
      codeEncrypted: null,
      darkModeCode: null,
      integrationCode: null,
      files: null,
    }));
  }
}