import { BaseService, ValidationError, NotFoundError, UnauthorizedError } from './base_service.js';
import { componentVersionRepository, componentRepository, userRepository } from '../repositories/index.js';
import type { PaginationOptions } from '../repositories/base_repository.js';
import { componentVersions } from '../db/schema.js';

// Types locaux basés sur le schéma de base de données
type ComponentVersion = typeof componentVersions.$inferSelect;
type CreateComponentVersionData = typeof componentVersions.$inferInsert;
type UpdateComponentVersionData = Partial<typeof componentVersions.$inferInsert>;

export interface ComponentVersionWithAccess extends ComponentVersion {
  hasAccess: boolean;
  canViewCode: boolean;
  canCopy: boolean;
  canDownload: boolean;
  codeToShow: string | null; // Code à afficher selon les permissions
}

export interface VersionComparison {
  hasChanges: boolean;
  changedFields: string[];
  contentHash: string;
}

export interface FrameworkVariant {
  framework: 'html' | 'react' | 'vue' | 'svelte' | 'alpine' | 'angular';
  cssFramework: 'tailwind_v3' | 'tailwind_v4' | 'vanilla_css';
  version: ComponentVersion | null;
  isAvailable: boolean;
}

export interface ComponentVersionStats {
  totalVersions: number;
  frameworkBreakdown: Array<{
    framework: string;
    cssFramework: string;
    count: number;
  }>;
  latestVersion: string;
  defaultFramework: string;
}

/**
 * Service de gestion des versions de composants
 * Gère le versioning automatique, la compilation des previews et les variantes multi-framework
 */
export class ComponentVersionService extends BaseService {
  /**
   * Récupère une version par ID avec contrôle d'accès
   */
  async getVersionById(id: string, userId?: string): Promise<ComponentVersionWithAccess> {
    this.logOperation('getVersionById', { id, userId });

    const version = await componentVersionRepository.findById(id);
    this.validateExists(version, 'Version du composant');

    return await this.addAccessControl(version!, userId);
  }

  /**
   * Récupère la version par défaut d'un composant
   */
  async getDefaultVersion(componentId: string, userId?: string): Promise<ComponentVersionWithAccess> {
    this.logOperation('getDefaultVersion', { componentId, userId });

    let version = await componentVersionRepository.findDefault(componentId);
    
    // Si pas de version par défaut, prendre la plus récente
    if (!version) {
      version = await componentVersionRepository.findLatest(componentId);
    }

    this.validateExists(version, 'Version par défaut du composant');

    return await this.addAccessControl(version!, userId);
  }

  /**
   * Récupère une version spécifique par framework
   */
  async getVersionByFramework(
    componentId: string,
    framework: 'html' | 'react' | 'vue' | 'svelte' | 'alpine' | 'angular',
    cssFramework?: 'tailwind_v3' | 'tailwind_v4' | 'vanilla_css',
    userId?: string
  ): Promise<ComponentVersionWithAccess> {
    this.logOperation('getVersionByFramework', { componentId, framework, cssFramework, userId });

    const versions = await componentVersionRepository.findByFramework(componentId, framework, cssFramework);
    
    if (versions.length === 0) {
      throw new NotFoundError(`Aucune version disponible pour ${framework}${cssFramework ? ` avec ${cssFramework}` : ''}`);
    }

    // Prendre la version la plus récente
    const latestVersion = versions[0];

    return await this.addAccessControl(latestVersion, userId);
  }

  /**
   * Récupère toutes les versions d'un composant
   */
  async getComponentVersions(componentId: string, options: PaginationOptions = {}, userId?: string) {
    this.logOperation('getComponentVersions', { componentId, options, userId });

    // Vérifier que le composant existe
    const component = await componentRepository.findById(componentId);
    this.validateExists(component, 'Composant');

    const validatedOptions = this.validatePaginationOptions(options);
    const result = await componentVersionRepository.paginate(validatedOptions, componentId);

    // Ajouter le contrôle d'accès pour chaque version
    const versionsWithAccess = await Promise.all(
      result.data.map(version => this.addAccessControl(version, userId))
    );

    return this.createPaginatedResponse({
      ...result,
      data: versionsWithAccess
    }, 'Versions du composant récupérées avec succès');
  }

  /**
   * Récupère les variantes disponibles pour un composant
   */
  async getFrameworkVariants(componentId: string): Promise<FrameworkVariant[]> {
    this.logOperation('getFrameworkVariants', { componentId });

    const frameworks = ['html', 'react', 'vue', 'svelte', 'alpine', 'angular'] as const;
    const cssFrameworks = ['tailwind_v3', 'tailwind_v4', 'vanilla_css'] as const;

    const variants: FrameworkVariant[] = [];

    for (const framework of frameworks) {
      for (const cssFramework of cssFrameworks) {
        const versions = await componentVersionRepository.findByFramework(componentId, framework, cssFramework);
        
        variants.push({
          framework,
          cssFramework,
          version: versions.length > 0 ? versions[0] : null,
          isAvailable: versions.length > 0,
        });
      }
    }

    return variants;
  }

  /**
   * Crée une nouvelle version avec versioning automatique
   */
  async createVersion(
    versionData: CreateComponentVersionData,
    requestingUserId: string,
    forceNewVersion: boolean = false
  ): Promise<ComponentVersion> {
    this.logOperation('createVersion', { 
      componentId: versionData.componentId, 
      framework: versionData.framework,
      forceNewVersion 
    });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    // Validation des données
    this.validateInput(versionData, ['componentId', 'framework', 'cssFramework', 'codePreview']);

    // Vérifier que le composant existe
    const component = await componentRepository.findById(versionData.componentId);
    this.validateExists(component, 'Composant');

    // Vérifier s'il faut créer une nouvelle version ou mettre à jour l'existante
    const existingVersion = await componentVersionRepository.findByFramework(
      versionData.componentId,
      versionData.framework,
      versionData.cssFramework
    );

    if (existingVersion.length > 0 && !forceNewVersion) {
      const latestVersion = existingVersion[0];
      
      // Comparer le contenu pour détecter les changements
      const comparison = this.compareVersionContent(latestVersion, versionData);
      
      if (!comparison.hasChanges) {
        this.logOperation('createVersion - no changes detected', { versionId: latestVersion.id });
        return latestVersion;
      }

      // Mettre à jour la version existante si les changements sont mineurs
      if (comparison.changedFields.length <= 2 && !comparison.changedFields.includes('codePreview')) {
        return await this.updateVersion(latestVersion.id, versionData, requestingUserId);
      }
    }

    // Générer le numéro de version automatiquement
    const versionNumber = await this.generateVersionNumber(versionData.componentId, versionData.framework);

    // Calculer le hash du contenu
    this.calculateContentHash(
      (versionData.codePreview || '') + (versionData.codeFull || '') + (versionData.codeEncrypted || '')
    );

    // Préparer les données pour l'insertion
    const versionToCreate = {
      id: this.generateId(),
      componentId: versionData.componentId,
      versionNumber,
      framework: versionData.framework,
      cssFramework: versionData.cssFramework,
      codePreview: versionData.codePreview,
      codeFull: versionData.codeFull || null,
      codeEncrypted: versionData.codeEncrypted || null,
      dependencies: versionData.dependencies || null,
      configRequired: versionData.configRequired || null,
      supportsDarkMode: versionData.supportsDarkMode ?? false,
      darkModeCode: versionData.darkModeCode || null,
      integrations: versionData.integrations || null,
      integrationCode: versionData.integrationCode || null,
      files: versionData.files || null,
      isDefault: versionData.isDefault ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdVersion = await componentVersionRepository.create(versionToCreate);
    
    this.logOperation('createVersion success', { 
      versionId: createdVersion.id, 
      versionNumber: createdVersion.versionNumber 
    });
    
    return createdVersion;
  }

  /**
   * Met à jour une version existante
   */
  async updateVersion(
    id: string, 
    versionData: UpdateComponentVersionData, 
    requestingUserId: string
  ): Promise<ComponentVersion> {
    this.logOperation('updateVersion', { id });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    const existingVersion = await componentVersionRepository.findById(id);
    this.validateExists(existingVersion, 'Version du composant');

    // Nettoyer les données
    const allowedFields = [
      'codePreview', 'codeFull', 'codeEncrypted', 'dependencies', 'configRequired',
      'supportsDarkMode', 'darkModeCode', 'integrations', 'integrationCode', 'files', 'isDefault'
    ];
    const sanitizedData = this.sanitizeInput<UpdateComponentVersionData>(versionData, allowedFields);

    const updatedVersion = await componentVersionRepository.update(id, sanitizedData);
    this.validateExists(updatedVersion, 'Version mise à jour');

    this.logOperation('updateVersion success', { versionId: id });
    return updatedVersion!;
  }

  /**
   * Supprime une version
   */
  async deleteVersion(id: string, requestingUserId: string): Promise<void> {
    this.logOperation('deleteVersion', { id });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    const version = await componentVersionRepository.findById(id);
    this.validateExists(version, 'Version du composant');

    // Empêcher la suppression de la version par défaut
    if (version!.isDefault) {
      throw new ValidationError('Impossible de supprimer la version par défaut');
    }

    await componentVersionRepository.delete(id);
    this.logOperation('deleteVersion success', { versionId: id });
  }

  /**
   * Définit une version comme version par défaut
   */
  async setAsDefault(id: string, requestingUserId: string): Promise<void> {
    this.logOperation('setAsDefault', { id });

    // Valider les permissions admin
    await this.validateAdminPermissions(requestingUserId);

    const success = await componentVersionRepository.setAsDefault(id);
    
    if (!success) {
      throw new NotFoundError('Version non trouvée');
    }

    this.logOperation('setAsDefault success', { versionId: id });
  }

  /**
   * Compile automatiquement les previews pour iframe
   */
  async compilePreview(versionId: string): Promise<string> {
    this.logOperation('compilePreview', { versionId });

    const version = await componentVersionRepository.findById(versionId);
    this.validateExists(version, 'Version du composant');

    // Récupérer les informations du composant
    const versionWithComponent = await componentVersionRepository.findWithComponent(versionId);
    this.validateExists(versionWithComponent, 'Version avec composant');

    const compiledHtml = this.generatePreviewHtml(versionWithComponent!);
    
    this.logOperation('compilePreview success', { versionId });
    return compiledHtml;
  }

  /**
   * Récupère les statistiques d'une version
   */
  async getVersionStats(componentId: string): Promise<ComponentVersionStats> {
    this.logOperation('getVersionStats', { componentId });

    const stats = await componentVersionRepository.getVersionStats(componentId);
    const latestVersion = await componentVersionRepository.findLatest(componentId);
    const defaultVersion = await componentVersionRepository.findDefault(componentId);

    return {
      totalVersions: stats.totalVersions,
      frameworkBreakdown: stats.byFramework.map(item => ({
        framework: item.framework,
        cssFramework: item.cssFramework,
        count: item.count,
      })),
      latestVersion: latestVersion?.versionNumber || '1.0.0',
      defaultFramework: defaultVersion?.framework || 'react',
    };
  }

  /**
   * Ajoute le contrôle d'accès à une version
   */
  private async addAccessControl(version: ComponentVersion, userId?: string): Promise<ComponentVersionWithAccess> {
    // Récupérer les informations du composant
    const component = await componentRepository.findById(version.componentId);
    
    if (!component) {
      throw new NotFoundError('Composant associé non trouvé');
    }

    // Si le composant est gratuit, accès complet
    if (component.isFree) {
      return {
        ...version,
        hasAccess: true,
        canViewCode: true,
        canCopy: true,
        canDownload: true,
        codeToShow: version.codeFull || version.codePreview,
      };
    }

    // Si pas d'utilisateur, accès preview seulement
    if (!userId) {
      return {
        ...version,
        hasAccess: false,
        canViewCode: false,
        canCopy: false,
        canDownload: false,
        codeToShow: version.codePreview, // Toujours montrer le preview
      };
    }

    // Vérifier l'accès premium
    const hasAccess = await this.checkPremiumAccess(userId);
    
    if (hasAccess) {
      return {
        ...version,
        hasAccess: true,
        canViewCode: true,
        canCopy: true,
        canDownload: true,
        codeToShow: version.codeFull || version.codePreview,
      };
    }

    return {
      ...version,
      hasAccess: false,
      canViewCode: false,
      canCopy: false,
      canDownload: false,
      codeToShow: version.codePreview, // Toujours montrer le preview
    };
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
   * Compare le contenu de deux versions pour détecter les changements
   */
  private compareVersionContent(existingVersion: ComponentVersion, newData: CreateComponentVersionData): VersionComparison {
    const changedFields: string[] = [];

    // Comparer les champs importants
    if (existingVersion.codePreview !== newData.codePreview) {
      changedFields.push('codePreview');
    }
    if (existingVersion.codeFull !== (newData.codeFull || null)) {
      changedFields.push('codeFull');
    }
    if (existingVersion.dependencies !== (newData.dependencies || null)) {
      changedFields.push('dependencies');
    }
    if (existingVersion.supportsDarkMode !== (newData.supportsDarkMode ?? false)) {
      changedFields.push('supportsDarkMode');
    }
    if (existingVersion.darkModeCode !== (newData.darkModeCode || null)) {
      changedFields.push('darkModeCode');
    }

    // Calculer le hash du nouveau contenu
    const contentHash = this.calculateContentHash(
      (newData.codePreview || '') + (newData.codeFull || '') + (newData.codeEncrypted || '')
    );

    return {
      hasChanges: changedFields.length > 0,
      changedFields,
      contentHash,
    };
  }

  /**
   * Génère automatiquement un numéro de version
   */
  private async generateVersionNumber(componentId: string, framework: string): Promise<string> {
    const existingVersions = await componentVersionRepository.findByFramework(componentId, framework as any);
    
    if (existingVersions.length === 0) {
      return '1.0.0';
    }

    // Extraire le numéro de version le plus élevé
    const versionNumbers = existingVersions
      .map(v => v.versionNumber)
      .map(v => {
        const parts = v.split('.').map(Number);
        return { major: parts[0] || 1, minor: parts[1] || 0, patch: parts[2] || 0 };
      })
      .sort((a, b) => {
        if (a.major !== b.major) return b.major - a.major;
        if (a.minor !== b.minor) return b.minor - a.minor;
        return b.patch - a.patch;
      });

    const latest = versionNumbers[0];
    
    // Incrémenter la version patch
    return `${latest.major}.${latest.minor}.${latest.patch + 1}`;
  }

  /**
   * Génère le HTML compilé pour le preview
   */
  private generatePreviewHtml(versionWithComponent: any): string {
    const { version, component } = versionWithComponent;
    
    const baseHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${component.name} - Preview</title>
    ${this.getCssFrameworkLinks(version.cssFramework)}
    <style>
        body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
        .preview-container { max-width: 1200px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="preview-container">
        ${version.codePreview || '<!-- Aucun code de preview disponible -->'}
    </div>
    ${this.getFrameworkScripts(version.framework)}
</body>
</html>`;

    return baseHtml;
  }

  /**
   * Récupère les liens CSS selon le framework CSS
   */
  private getCssFrameworkLinks(cssFramework: string): string {
    switch (cssFramework) {
      case 'tailwind_v3':
        return '<script src="https://cdn.tailwindcss.com"></script>';
      case 'tailwind_v4':
        return '<script src="https://cdn.tailwindcss.com"></script>';
      case 'vanilla_css':
        return '';
      default:
        return '<script src="https://cdn.tailwindcss.com"></script>';
    }
  }

  /**
   * Récupère les scripts selon le framework JS
   */
  private getFrameworkScripts(framework: string): string {
    switch (framework) {
      case 'react':
        return `
          <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        `;
      case 'vue':
        return '<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>';
      case 'alpine':
        return '<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>';
      case 'svelte':
        return '<!-- Svelte components need to be compiled -->';
      case 'angular':
        return '<!-- Angular components need to be compiled -->';
      default:
        return '';
    }
  }

  /**
   * Valide les permissions d'administration
   */
  private async validateAdminPermissions(userId: string): Promise<void> {
    if (!userId) {
      throw new UnauthorizedError('Authentification requise');
    }

    const user = await userRepository.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      throw new UnauthorizedError('Permissions administrateur requises');
    }
  }
}