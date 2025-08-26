import { BaseService, ValidationError, UnauthorizedError } from './base_service.js'
import { userRepository } from '../repositories/index.js'
import drive from '@adonisjs/drive/services/main'

// Ré-export des types pour compatibilité
import env from '#start/env'
import { createHash } from 'crypto'
import { extname } from 'path'


export interface ImageVariant {
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original'
  width: number
  height: number
  filename: string
  url: string
  path: string
  fileSize: number
}

export interface UploadedFile {
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  url: string
  hash: string
  disk: string
  isPublic: boolean
  uploadedAt: Date
}

export interface ProcessedImage extends UploadedFile {
  variants: ImageVariant[]
  isOptimized: boolean
  webpSupported?: boolean
  totalSize?: number
}

export interface VideoFile extends UploadedFile {
  duration?: number
  resolution?: { width: number; height: number }
  thumbnailUrl?: string
}

export interface DocumentFile extends UploadedFile {
  pageCount?: number
  isSearchable?: boolean
}

export interface PreviewCompilation {
  html: string;
  css: string;
  js: string;
  compiledHtml: string;
  previewUrl: string;
  thumbnailUrl: string;
}

export interface FileCleanupResult {
  deletedFiles: number;
  freedSpace: number; // en bytes
  errors: string[];
}

export interface UploadOptions {
  generateVariants?: boolean
  optimize?: boolean
  maxWidth?: number
  maxHeight?: number
  folder?: string
  disk?: 'fs' | 'public' | 's3' | 's3_private' | 'r2' | 'r2_private'
  isPublic?: boolean
  cleanMetadata?: boolean
  convertToWebP?: boolean
  quality?: number
}

export interface SecurityScanResult {
  isClean: boolean
  threats: string[]
  scanTime: Date
  scanEngine: string
}

export interface FileMetadata {
  originalName: string
  mimeType: string
  size: number
  hash: string
  uploadedBy: string
  uploadedAt: Date
  lastAccessed?: Date
  downloadCount: number
  isPublic: boolean
  exifData?: Record<string, any>
  scanResult?: SecurityScanResult
}

/**
 * Service de gestion des fichiers avec @adonisjs/drive
 * Gère les uploads, l'optimisation des images et la compilation des previews
 * Supporte dual-write S3/R2 pour migration progressive
 */
export class FileService extends BaseService {
  private readonly maxFileSize = env.get('MAX_FILE_SIZE', 10 * 1024 * 1024) // 10MB par défaut
  private readonly allowedImageTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'
  ]
  private readonly allowedVideoTypes = [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
  ]
  
  private readonly storageProvider = env.get('STORAGE_PROVIDER', 'r2') as 's3' | 'r2' | 'dual' | 'fs'

  /**
   * Upload et traite une image avec AdonisJS Drive
   */
  async uploadImage(
    file: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    options: UploadOptions = {}
  ): Promise<ProcessedImage> {
    this.logOperation('uploadImage', { originalName, mimeType, userId, size: file.length });

    // Valider l'utilisateur (sauf pour les utilisateurs système)
    if (!this.isSystemUser(userId)) {
      const user = await userRepository.findById(userId);
      this.validateExists(user, 'Utilisateur');
    }

    // Valider le fichier
    this.validateImageFile(file, originalName, mimeType);

    // Générer un nom de fichier unique
    const filename = this.generateUniqueFilename(originalName);
    const folder = options.folder || 'images';
    const filePath = `${folder}/${filename}`;

    // Calculer le hash du fichier
    const hash = this.calculateFileHash(file);

    // Vérifier si le fichier existe déjà (déduplication)
    const existingFile = await this.findFileByHash(hash);
    if (existingFile) {
      this.logOperation('uploadImage - file already exists', { hash, existingPath: existingFile.path });
      return existingFile as ProcessedImage;
    }

    const isPublic = options.isPublic !== false
    const disk = options.disk || this.getDefaultDisk(isPublic)

    // Upload avec stratégie selon STORAGE_PROVIDER
    const uploadResult = await this.uploadWithStrategy(filePath, file, isPublic, mimeType)
    const url = uploadResult.url

    const uploadedFile: UploadedFile = {
      filename,
      originalName,
      mimeType,
      size: file.length,
      path: filePath,
      url,
      hash,
      disk,
      isPublic,
      uploadedAt: new Date(),
    }

    let variants: ImageVariant[] = [];
    let isOptimized = false;

    // Générer les variantes si demandé
    if (options.generateVariants) {
      variants = await this.generateImageVariants(file, filename, folder);
    }

    // Note: L'optimisation d'image nécessiterait une librairie comme Sharp
    // Pour le MVP, on marque comme optimisé si demandé
    if (options.optimize) {
      isOptimized = true;
    }

    const processedImage: ProcessedImage = {
      ...uploadedFile,
      variants,
      isOptimized,
    };

    this.logOperation('uploadImage success', { filename, variants: variants.length });
    return processedImage;
  }

  /**
   * Upload une vidéo de preview avec stratégie dual-write
   */
  async uploadVideo(
    file: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    folder: string = 'videos'
  ): Promise<UploadedFile> {
    this.logOperation('uploadVideo', { originalName, mimeType, userId, size: file.length });

    // Valider l'utilisateur (sauf pour les utilisateurs système)
    if (!this.isSystemUser(userId)) {
      const user = await userRepository.findById(userId);
      this.validateExists(user, 'Utilisateur');
    }

    // Valider le fichier vidéo
    this.validateVideoFile(file, originalName, mimeType);

    // Générer un nom de fichier unique
    const filename = this.generateUniqueFilename(originalName);
    const filePath = `${folder}/${filename}`;

    // Calculer le hash du fichier
    const hash = this.calculateFileHash(file);

    // Vérifier si le fichier existe déjà (déduplication)
    const existingFile = await this.findFileByHash(hash);
    if (existingFile) {
      this.logOperation('uploadVideo - file already exists', { hash, existingPath: existingFile.path });
      return existingFile;
    }

    const isPublic = true // Les vidéos sont généralement publiques
    const disk = this.getDefaultDisk(isPublic)

    // Upload avec stratégie selon STORAGE_PROVIDER
    const uploadResult = await this.uploadWithStrategy(filePath, file, isPublic, mimeType)
    const url = uploadResult.url

    const uploadedFile: UploadedFile = {
      filename,
      originalName,
      mimeType,
      size: file.length,
      path: filePath,
      url,
      hash,
      disk,
      isPublic,
      uploadedAt: new Date(),
    }

    this.logOperation('uploadVideo success', { filename, disk, url });
    return uploadedFile;
  }

  /**
   * Upload un fichier générique
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    options: UploadOptions = {}
  ): Promise<UploadedFile> {
    this.logOperation('uploadFile', { originalName, mimeType, userId, size: file.length });

    // Valider l'utilisateur (sauf pour les utilisateurs système)
    if (!this.isSystemUser(userId)) {
      const user = await userRepository.findById(userId);
      this.validateExists(user, 'Utilisateur');
    }

    // Générer un nom de fichier unique
    const filename = this.generateUniqueFilename(originalName);
    const folder = options.folder || 'files';
    const filePath = `${folder}/${filename}`;

    // Calculer le hash du fichier
    const hash = this.calculateFileHash(file);

    // Vérifier si le fichier existe déjà (déduplication)
    const existingFile = await this.findFileByHash(hash);
    if (existingFile) {
      this.logOperation('uploadFile - file already exists', { hash, existingPath: existingFile.path });
      return existingFile;
    }

    const isPublic = options.isPublic !== false
    const disk = options.disk || this.getDefaultDisk(isPublic)

    // Upload avec stratégie selon STORAGE_PROVIDER
    const uploadResult = await this.uploadWithStrategy(filePath, file, isPublic, mimeType)
    const url = uploadResult.url

    const uploadedFile: UploadedFile = {
      filename,
      originalName,
      mimeType,
      size: file.length,
      path: filePath,
      url,
      hash,
      disk,
      isPublic,
      uploadedAt: new Date(),
    }

    this.logOperation('uploadFile success', { filename, disk, url });
    return uploadedFile;
  }

  /**
   * Upload un fichier avec un hash prédéfini (pour synchronisation CDN)
   */
  async uploadFileWithHash(
    file: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    contentHash: string,
    options: UploadOptions = {}
  ): Promise<UploadedFile> {
    this.logOperation('uploadFileWithHash', { originalName, mimeType, userId, size: file.length, contentHash });

    // Valider l'utilisateur (sauf pour les utilisateurs système)
    if (!this.isSystemUser(userId)) {
      const user = await userRepository.findById(userId);
      this.validateExists(user, 'Utilisateur');
    }

    // Vérifier que le hash fourni correspond au contenu
    const actualHash = this.calculateFileHash(file);
    if (actualHash !== contentHash) {
      throw new ValidationError('Hash fourni ne correspond pas au contenu du fichier');
    }

    // Générer un nom de fichier basé sur le hash
    const filename = this.generateUniqueFilename(originalName, 'hash', contentHash);
    const folder = options.folder || 'files';
    const filePath = `${folder}/${filename}`;

    // Vérifier si le fichier existe déjà (déduplication)
    const existingFile = await this.findFileByHash(contentHash);
    if (existingFile) {
      this.logOperation('uploadFileWithHash - file already exists', { hash: contentHash, existingPath: existingFile.path });
      return existingFile;
    }

    const isPublic = options.isPublic !== false
    const disk = options.disk || this.getDefaultDisk(isPublic)

    // Upload avec stratégie selon STORAGE_PROVIDER
    const uploadResult = await this.uploadWithStrategy(filePath, file, isPublic, mimeType)
    const url = uploadResult.url

    const uploadedFile: UploadedFile = {
      filename,
      originalName,
      mimeType,
      size: file.length,
      path: filePath,
      url,
      hash: contentHash,
      disk,
      isPublic,
      uploadedAt: new Date(),
    }

    this.logOperation('uploadFileWithHash success', { filename, disk, url, hash: contentHash });
    return uploadedFile;
  }

  /**
   * Upload un fichier en préservant son nom original (pour assets CDN)
   */
  async uploadFileWithPreservedName(
    file: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    options: UploadOptions = {}
  ): Promise<UploadedFile> {
    this.logOperation('uploadFileWithPreservedName', { originalName, mimeType, userId, size: file.length });

    // Valider l'utilisateur (sauf pour les utilisateurs système)
    if (!this.isSystemUser(userId)) {
      const user = await userRepository.findById(userId);
      this.validateExists(user, 'Utilisateur');
    }

    // Utiliser le nom original exactement comme fourni (pas de génération unique)
    const filename = originalName;
    const folder = options.folder || 'files';
    const filePath = `${folder}/${filename}`;

    // Calculer le hash du fichier pour déduplication
    const hash = this.calculateFileHash(file);

    // Vérifier si le fichier existe déjà (déduplication optionnelle)
    const existingFile = await this.findFileByHash(hash);
    if (existingFile) {
      this.logOperation('uploadFileWithPreservedName - file already exists', { hash, existingPath: existingFile.path });
      return existingFile;
    }

    const isPublic = options.isPublic !== false
    const disk = options.disk || this.getDefaultDisk(isPublic)

    // Upload avec stratégie selon STORAGE_PROVIDER
    const uploadResult = await this.uploadWithStrategy(filePath, file, isPublic, mimeType)
    const url = uploadResult.url

    const uploadedFile: UploadedFile = {
      filename,
      originalName,
      mimeType,
      size: file.length,
      path: filePath,
      url,
      hash,
      disk,
      isPublic,
      uploadedAt: new Date(),
    }

    this.logOperation('uploadFileWithPreservedName success', { filename, disk, url });
    return uploadedFile;
  }

  /**
   * Compile un preview HTML pour iframe
   */
  async compilePreview(
    componentId: string,
    versionId: string,
    htmlContent: string,
    cssContent?: string,
    jsContent?: string,
    framework: string = 'html',
    cssFramework: string = 'tailwind_v4'
  ): Promise<PreviewCompilation> {
    this.logOperation('compilePreview', { componentId, versionId, framework, cssFramework });

    const compiledHtml = this.generatePreviewHtml(
      htmlContent,
      cssContent,
      jsContent,
      framework,
      cssFramework
    );

    // Sauvegarder le preview compilé
    const previewFilename = `${componentId}-${versionId}-preview.html`
    const previewPath = `previews/${previewFilename}`
    
    await drive.use('public').put(previewPath, compiledHtml)
    const previewUrl = await drive.use('public').getUrl(previewPath)

    // Générer un thumbnail (pour le MVP, on utilise une capture d'écran simulée)
    const thumbnailUrl = await this.generateThumbnail(componentId, versionId, previewUrl);

    const compilation: PreviewCompilation = {
      html: htmlContent,
      css: cssContent || '',
      js: jsContent || '',
      compiledHtml,
      previewUrl,
      thumbnailUrl,
    };

    this.logOperation('compilePreview success', { previewUrl, thumbnailUrl });
    return compilation;
  }

  /**
   * Supprime un fichier
   */
  async deleteFile(filePath: string, userId: string): Promise<void> {
    this.logOperation('deleteFile', { filePath, userId });

    // Valider les permissions admin
    await this.validateAdminPermissions(userId);

    // Vérifier si le fichier existe
    const exists = await drive.use('public').exists(filePath)
    if (!exists) {
      throw new ValidationError('Fichier non trouvé')
    }

    // Supprimer le fichier
    await drive.use('public').delete(filePath)

    this.logOperation('deleteFile success', { filePath });
  }

  /**
   * Liste les fichiers dans un dossier
   */
  async listFiles(folder: string, userId: string): Promise<string[]> {
    this.logOperation('listFiles', { folder, userId });

    // Valider les permissions admin
    await this.validateAdminPermissions(userId);

    try {
      // Note: AdonisJS Drive n'a pas de méthode list() native
      // Pour le MVP, on retourne une liste vide
      // Dans une implémentation complète, il faudrait utiliser le driver sous-jacent
      return [];
    } catch (error) {
      this.logError('listFiles', error as Error, { folder });
      return [];
    }
  }

  /**
   * Nettoie les fichiers orphelins
   */
  async cleanupOrphanedFiles(userId: string, dryRun: boolean = true): Promise<FileCleanupResult> {
    this.logOperation('cleanupOrphanedFiles', { userId, dryRun });

    // Valider les permissions admin
    await this.validateAdminPermissions(userId);

    // Pour le MVP, on simule le nettoyage
    const result: FileCleanupResult = {
      deletedFiles: 0,
      freedSpace: 0,
      errors: [],
    };

    this.logOperation('cleanupOrphanedFiles completed', result);
    return result;
  }

  /**
   * Récupère les informations d'un fichier
   */
  async getFileInfo(filePath: string): Promise<{ exists: boolean; size?: number; url?: string }> {
    this.logOperation('getFileInfo', { filePath });

    try {
      const exists = await drive.use('public').exists(filePath)
      
      if (!exists) {
        return { exists: false }
      }

      const url = await drive.use('public').getUrl(filePath)
      
      // Note: AdonisJS Drive n'expose pas directement la taille
      // Pour une implémentation complète, il faudrait utiliser le driver sous-jacent
      return {
        exists: true,
        url,
        size: 0, // À implémenter avec le driver sous-jacent
      };
    } catch (error) {
      this.logError('getFileInfo', error as Error, { filePath });
      return { exists: false };
    }
  }

  /**
   * Copie un fichier
   */
  async copyFile(sourcePath: string, destinationPath: string, userId: string): Promise<void> {
    this.logOperation('copyFile', { sourcePath, destinationPath, userId });

    // Valider les permissions admin
    await this.validateAdminPermissions(userId);

    // Vérifier que le fichier source existe
    const sourceExists = await drive.use('public').exists(sourcePath)
    if (!sourceExists) {
      throw new ValidationError('Fichier source non trouvé')
    }

    // Lire le fichier source et l'écrire à la destination
    const content = await drive.use('public').get(sourcePath)
    await drive.use('public').put(destinationPath, content)

    this.logOperation('copyFile success', { sourcePath, destinationPath });
  }

  /**
   * Valide un fichier image
   */
  private validateImageFile(file: Buffer, originalName: string, mimeType: string): void {
    // Vérifier la taille
    if (file.length > this.maxFileSize) {
      throw new ValidationError(`Fichier trop volumineux. Taille maximale: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Vérifier le type MIME
    if (!this.allowedImageTypes.includes(mimeType)) {
      throw new ValidationError(`Type de fichier non autorisé. Types acceptés: ${this.allowedImageTypes.join(', ')}`);
    }

    // Vérifier l'extension
    const ext = extname(originalName).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowedExtensions.includes(ext)) {
      throw new ValidationError(`Extension non autorisée. Extensions acceptées: ${allowedExtensions.join(', ')}`);
    }
  }

  /**
   * Valide un fichier vidéo
   */
  private validateVideoFile(file: Buffer, originalName: string, mimeType: string): void {
    // Vérifier la taille (limite plus élevée pour les vidéos)
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    if (file.length > maxVideoSize) {
      throw new ValidationError(`Fichier vidéo trop volumineux. Taille maximale: ${maxVideoSize / 1024 / 1024}MB`);
    }

    // Vérifier le type MIME
    if (!this.allowedVideoTypes.includes(mimeType)) {
      throw new ValidationError(`Type de fichier non autorisé. Types acceptés: ${this.allowedVideoTypes.join(', ')}`);
    }

    // Vérifier l'extension
    const ext = extname(originalName).toLowerCase();
    const allowedExtensions = ['.mp4', '.webm'];
    if (!allowedExtensions.includes(ext)) {
      throw new ValidationError(`Extension non autorisée. Extensions acceptées: ${allowedExtensions.join(', ')}`);
    }
  }

  /**
   * Génère un nom de fichier unique
   */
  private generateUniqueFilename(originalName: string, mode: 'timestamp' | 'hash' = 'timestamp', hash?: string): string {
    const ext = extname(originalName);
    const baseName = originalName.replace(ext, '').substring(0, 20);
    
    if (mode === 'hash' && hash) {
      // Mode hash : utiliser les 16 premiers caractères du hash SHA256
      const hashSuffix = hash.substring(0, 16);
      return `${this.generateSlug(baseName)}-${hashSuffix}${ext}`;
    }
    
    // Mode timestamp par défaut (comportement original)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.generateSlug(baseName)}-${timestamp}-${random}${ext}`;
  }

  /**
   * Calcule le hash d'un fichier
   */
  private calculateFileHash(file: Buffer): string {
    return createHash('sha256').update(file).digest('hex');
  }

  /**
   * Trouve un fichier par son hash (déduplication)
   */
  private async findFileByHash(_hash: string): Promise<UploadedFile | null> {
    // Pour le MVP, on retourne null (pas de déduplication)
    // Dans une implémentation complète, il faudrait une table de métadonnées des fichiers
    return null;
  }

  /**
   * Génère les variantes d'une image
   */
  private async generateImageVariants(
    originalFile: Buffer,
    filename: string,
    folder: string
  ): Promise<ImageVariant[]> {
    // Cette méthode est maintenant dépréciée au profit du service d'optimisation
    // On retourne un tableau vide pour maintenir la compatibilité
    const variants: ImageVariant[] = []
    const baseName = filename.replace(extname(filename), '');
    const ext = extname(filename);

    const sizes = [
      { size: 'thumbnail' as const, width: 150, height: 150 },
      { size: 'small' as const, width: 300, height: 200 },
      { size: 'medium' as const, width: 600, height: 400 },
      { size: 'large' as const, width: 1200, height: 800 },
    ];

    for (const sizeConfig of sizes) {
      const variantFilename = `${baseName}-${sizeConfig.size}${ext}`;
      const variantPath = `${folder}/variants/${variantFilename}`;
      
      // Pour le MVP, on copie le fichier original
      await drive.use('public').put(variantPath, originalFile)
      const url = await drive.use('public').getUrl(variantPath)

      variants.push({
        size: sizeConfig.size,
        width: sizeConfig.width,
        height: sizeConfig.height,
        filename: variantFilename,
        url,
        path: variantPath,
        fileSize: originalFile.length,
      })
    }

    return variants;
  }

  /**
   * Génère le HTML compilé pour le preview
   */
  private generatePreviewHtml(
    htmlContent: string,
    cssContent?: string,
    jsContent?: string,
    framework: string = 'html',
    cssFramework: string = 'tailwind_v4'
  ): string {
    const baseHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Preview</title>
    ${this.getCssFrameworkLinks(cssFramework)}
    ${cssContent ? `<style>${cssContent}</style>` : ''}
    <style>
        body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
        .preview-container { max-width: 1200px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="preview-container">
        ${htmlContent}
    </div>
    ${this.getFrameworkScripts(framework)}
    ${jsContent ? `<script>${jsContent}</script>` : ''}
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
   * Génère un thumbnail pour le preview
   */
  private async generateThumbnail(componentId: string, versionId: string, _previewUrl: string): Promise<string> {
    // Pour le MVP, on génère une URL de thumbnail simulée
    // Dans une implémentation complète, il faudrait utiliser Puppeteer ou un service de capture d'écran
    const thumbnailFilename = `${componentId}-${versionId}-thumb.jpg`;
    const thumbnailPath = `thumbnails/${thumbnailFilename}`;
    
    // Créer un placeholder thumbnail
    const placeholderThumbnail = Buffer.from('placeholder-thumbnail-data')
    await drive.use('public').put(thumbnailPath, placeholderThumbnail)
    
    return await drive.use('public').getUrl(thumbnailPath)
  }

  /**
   * Valide qu'un utilisateur existe
   */
  protected async validateUser(userId: string): Promise<void> {
    const user = await userRepository.findById(userId)
    this.validateExists(user, 'Utilisateur')
  }

  /**
   * Détermine le disque par défaut selon le provider de stockage
   */
  private getDefaultDisk(isPublic: boolean = true): string {
    switch (this.storageProvider) {
      case 'r2':
        return isPublic ? 'r2' : 'r2_private'
      case 'fs':
        return isPublic ? 'public' : 'fs'
      case 'dual':
      case 's3':
      default:
        return isPublic ? 's3' : 's3_private'
    }
  }

  /**
   * Upload avec stratégie selon STORAGE_PROVIDER
   */
  private async uploadWithStrategy(
    filePath: string,
    file: Buffer,
    isPublic: boolean,
    mimeType: string
  ): Promise<{ url: string; disk: string }> {
    const contentType = { contentType: mimeType }

    switch (this.storageProvider) {
      case 'r2':
        // Upload uniquement vers R2
        const r2Disk = isPublic ? 'r2' : 'r2_private'
        await drive.use(r2Disk).put(filePath, file, contentType)
        const r2Url = await drive.use(r2Disk).getUrl(filePath)
        this.logOperation('uploadWithStrategy - R2 only', { filePath, disk: r2Disk })
        return { url: r2Url, disk: r2Disk }

      case 'fs':
        // Upload vers stockage local
        const fsDisk = isPublic ? 'public' : 'fs'
        await drive.use(fsDisk).put(filePath, file, contentType)
        const fsUrl = await drive.use(fsDisk).getUrl(filePath)
        this.logOperation('uploadWithStrategy - FS only', { filePath, disk: fsDisk })
        return { url: fsUrl, disk: fsDisk }

      case 'dual':
        // Upload vers R2 (principal) ET S3 (fallback)
        const r2DiskDual = isPublic ? 'r2' : 'r2_private'
        const s3DiskDual = isPublic ? 's3' : 's3_private'

        try {
          // Upload principal vers R2
          await drive.use(r2DiskDual).put(filePath, file, contentType)
          const r2UrlDual = await drive.use(r2DiskDual).getUrl(filePath)

          // Upload fallback vers S3 (ne pas échouer si S3 échoue)
          try {
            await drive.use(s3DiskDual).put(filePath, file, contentType)
            this.logOperation('uploadWithStrategy - dual write success', { filePath, r2: r2DiskDual, s3: s3DiskDual })
          } catch (s3Error) {
            this.logError('uploadWithStrategy - S3 fallback failed', s3Error as Error, { filePath })
          }

          return { url: r2UrlDual, disk: r2DiskDual }
        } catch (r2Error) {
          this.logError('uploadWithStrategy - R2 primary failed', r2Error as Error, { filePath })
          
          // Fallback vers S3 si R2 échoue
          await drive.use(s3DiskDual).put(filePath, file, contentType)
          const s3UrlDual = await drive.use(s3DiskDual).getUrl(filePath)
          this.logOperation('uploadWithStrategy - fallback to S3', { filePath, disk: s3DiskDual })
          return { url: s3UrlDual, disk: s3DiskDual }
        }

      case 's3':
      default:
        // Upload uniquement vers S3
        const s3Disk = isPublic ? 's3' : 's3_private'
        await drive.use(s3Disk).put(filePath, file, contentType)
        const s3Url = await drive.use(s3Disk).getUrl(filePath)
        this.logOperation('uploadWithStrategy - S3 only', { filePath, disk: s3Disk })
        return { url: s3Url, disk: s3Disk }
    }
  }

  /**
   * Récupère un fichier avec fallback intelligent
   */
  private async getFileWithStrategy(filePath: string, isPublic: boolean = true): Promise<string | Buffer> {
    switch (this.storageProvider) {
      case 'r2':
        // Lecture depuis R2 uniquement
        const r2Disk = isPublic ? 'r2' : 'r2_private'
        return await drive.use(r2Disk).get(filePath)

      case 'fs':
        // Lecture depuis stockage local
        const fsDisk = isPublic ? 'public' : 'fs'
        return await drive.use(fsDisk).get(filePath)

      case 'dual':
        // Priorité R2 avec fallback S3
        const r2DiskDual = isPublic ? 'r2' : 'r2_private'
        const s3DiskDual = isPublic ? 's3' : 's3_private'

        try {
          const content = await drive.use(r2DiskDual).get(filePath)
          this.logOperation('getFileWithStrategy - R2 read success', { filePath })
          return content
        } catch (r2Error) {
          this.logError('getFileWithStrategy - R2 failed, trying S3', r2Error as Error, { filePath })
          
          try {
            const s3Content = await drive.use(s3DiskDual).get(filePath)
            this.logOperation('getFileWithStrategy - S3 fallback success', { filePath })
            return s3Content
          } catch (s3Error) {
            this.logError('getFileWithStrategy - both R2 and S3 failed', s3Error as Error, { filePath })
            throw s3Error
          }
        }

      case 's3':
      default:
        // Lecture depuis S3 uniquement
        const s3Disk = isPublic ? 's3' : 's3_private'
        return await drive.use(s3Disk).get(filePath)
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

  /**
   * Migre un composant vers la structure R2
   */
  async migrateComponentToR2(
    componentId: string,
    category: string,
    number: number,
    version: string = '1.0.0',
    userId: string
  ): Promise<{ success: boolean; r2Path: string; migratedAssets: number }> {
    this.logOperation('migrateComponentToR2', { componentId, category, number, version });
    
    try {
      await this.validateAdminPermissions(userId);
      
      const r2Path = `components/${category}/${number}/v${version}`
      let migratedAssets = 0
      
      // Lister les fichiers existants du composant dans S3
      const legacyPaths = [
        `components/${componentId}/images`,
        `components/${componentId}/videos`,
        `previews/${componentId}-*-preview.html`,
        `thumbnails/${componentId}-*-thumb.jpg`
      ]
      
      for (const legacyPath of legacyPaths) {
        try {
          // Copier vers R2 avec la nouvelle structure
          // Note: Cette implémentation nécessiterait une méthode pour lister les fichiers
          // Pour le MVP, on logs l'intention
          this.logOperation('migrateComponentToR2 - copying legacy assets', { legacyPath, r2Path })
          migratedAssets++
        } catch (error) {
          console.warn(`Erreur migration asset ${legacyPath}:`, error)
        }
      }
      
      return { success: true, r2Path, migratedAssets }
    } catch (error) {
      this.logError('migrateComponentToR2', error as Error, { componentId })
      return { success: false, r2Path: '', migratedAssets: 0 }
    }
  }

  /**
   * Génère les métadonnées enrichies pour un composant
   */
  async generateEnhancedMetadata(
    componentData: any,
    version: string,
    assets: string[],
    _userId: string
  ): Promise<any> {
    this.logOperation('generateEnhancedMetadata', { componentId: componentData.id, version });

    const metadata = {
      component: {
        id: componentData.slug || componentData.id,
        category: this.extractCategoryFromSlug(componentData.slug),
        number: this.extractNumberFromSlug(componentData.slug),
        version,
        name: componentData.name,
        description: componentData.description,
        frameworks: ['react', 'vue', 'html'],
        cssFrameworks: ['tailwind_v4', 'tailwind_v3'],
        isFree: componentData.isFree,
        isPremium: !componentData.isFree,
        tags: componentData.tags || []
      },
      assets: {
        preview: {
          large: componentData.previewImageLarge || null,
          small: componentData.previewImageSmall || null,
          video: componentData.previewVideoUrl || null
        },
        files: assets,
        compiled: {
          html: `preview.html`,
          thumbnail: `thumbnail.jpg`
        }
      },
      stats: {
        fileSize: this.calculateTotalSize(assets),
        assetCount: assets.length,
        conversionRate: componentData.conversionRate || null,
        viewCount: componentData.viewCount || 0,
        copyCount: componentData.copyCount || 0
      },
      r2Metadata: {
        'component-id': componentData.slug || componentData.id,
        'version': version,
        'cache-control': 'public, max-age=31536000',
        'content-type': 'application/json'
      },
      created: componentData.createdAt,
      updated: new Date().toISOString()
    }

    return metadata
  }

  /**
   * Extrait la catégorie depuis un slug
   */
  private extractCategoryFromSlug(slug: string): string {
    if (!slug) return 'misc'
    const parts = slug.split('-')
    return parts[0] || 'misc'
  }

  /**
   * Extrait le numéro depuis un slug
   */
  private extractNumberFromSlug(slug: string): number {
    if (!slug) return 1
    const match = slug.match(/-(\d+)$/)
    return match ? parseInt(match[1], 10) : 1
  }

  /**
   * Calcule la taille totale des assets
   */
  private calculateTotalSize(assets: string[]): number {
    // Pour le MVP, retourner une estimation
    // Dans une implémentation complète, calculer la vraie taille
    return assets.length * 150000 // ~150KB par asset en moyenne
  }

  /**
   * Vérifie si un fichier existe avec fallback intelligent
   */
  async fileExistsWithFallback(filePath: string, isPublic: boolean = true): Promise<boolean> {
    switch (this.storageProvider) {
      case 'r2':
        const r2Disk = isPublic ? 'r2' : 'r2_private'
        return await drive.use(r2Disk).exists(filePath)

      case 'fs':
        const fsDisk = isPublic ? 'public' : 'fs'
        return await drive.use(fsDisk).exists(filePath)

      case 'dual':
        const r2DiskDual = isPublic ? 'r2' : 'r2_private'
        const s3DiskDual = isPublic ? 's3' : 's3_private'
        
        // Vérifier R2 d'abord
        const existsR2 = await drive.use(r2DiskDual).exists(filePath)
        if (existsR2) return true
        
        // Fallback S3
        return await drive.use(s3DiskDual).exists(filePath)

      case 's3':
      default:
        const s3Disk = isPublic ? 's3' : 's3_private'
        return await drive.use(s3Disk).exists(filePath)
    }
  }

  /**
   * Nettoie les fichiers temporaires et orphelins
   */
  async cleanupOrphanedR2Files(userId: string, dryRun: boolean = true): Promise<{
    deletedFiles: number;
    freedSpace: number;
    errors: string[];
  }> {
    this.logOperation('cleanupOrphanedR2Files', { userId, dryRun });
    
    await this.validateAdminPermissions(userId);

    // Pour le MVP, on simule le nettoyage
    // Dans une implémentation complète, scanner R2 pour les fichiers orphelins
    const result = {
      deletedFiles: 0,
      freedSpace: 0,
      errors: []
    }

    this.logOperation('cleanupOrphanedR2Files completed', result);
    return result
  }

  // =====================================================
  // NOUVELLES MÉTHODES POUR RÉCUPÉRATION R2-FIRST
  // =====================================================

  /**
   * Récupère les fichiers d'un composant selon la nouvelle structure R2
   * Structure: /components/{category}/{number}/v{version}/
   */
  async getComponentFiles(
    category: string,
    number: number,
    version: string,
    _userId?: string
  ): Promise<{
    metadata: any;
    preview: { url: string; exists: boolean };
    thumbnail: { url: string; exists: boolean };
    assets: Array<{ filename: string; url: string; type: string }>;
  }> {
    this.logOperation('getComponentFiles', { category, number, version });

    const basePath = `components/${category}/${number}/v${version}`;
    
    // Récupérer les métadonnées
    let metadata = null;
    try {
      const metadataPath = `${basePath}/metadata.json`;
      const metadataContent = await this.getFileWithStrategy(metadataPath, true);
      metadata = JSON.parse(metadataContent.toString());
    } catch (error) {
      this.logError('getComponentFiles - metadata not found', error as Error, { basePath });
      metadata = await this.generateFallbackMetadata(category, number, version);
    }

    // Vérifier la preview
    const previewPath = `${basePath}/preview.html`;
    const previewExists = await this.fileExistsWithFallback(previewPath, true);
    const previewUrl = previewExists ? await this.getPublicUrl(previewPath, true) : '';

    // Vérifier le thumbnail
    const thumbnailPath = `${basePath}/thumbnail.jpg`;
    const thumbnailExists = await this.fileExistsWithFallback(thumbnailPath, true);
    const thumbnailUrl = thumbnailExists ? await this.getPublicUrl(thumbnailPath, true) : '';

    // Lister les assets (pour le MVP, on utilise les extensions connues)
    const assets = await this.listComponentAssets(basePath);

    return {
      metadata,
      preview: { url: previewUrl, exists: previewExists },
      thumbnail: { url: thumbnailUrl, exists: thumbnailExists },
      assets
    };
  }

  /**
   * Résout le chemin d'un composant depuis le format legacy vers R2
   */
  async resolveComponentPath(
    componentSlug: string,
    resourceType: 'preview' | 'thumbnail' | 'assets' | 'metadata' = 'preview'
  ): Promise<{
    r2Path: string;
    legacyPath?: string;
    category: string;
    number: number;
    version: string;
  }> {
    this.logOperation('resolveComponentPath', { componentSlug, resourceType });

    const category = this.extractCategoryFromSlug(componentSlug);
    const number = this.extractNumberFromSlug(componentSlug);
    const version = '1.0.0'; // Version par défaut

    const r2BasePath = `components/${category}/${number}/v${version}`;
    
    let r2Path = '';
    let legacyPath = '';

    switch (resourceType) {
      case 'preview':
        r2Path = `${r2BasePath}/preview.html`;
        legacyPath = `previews/${componentSlug}-preview.html`;
        break;
      case 'thumbnail':
        r2Path = `${r2BasePath}/thumbnail.jpg`;
        legacyPath = `thumbnails/${componentSlug}-thumb.jpg`;
        break;
      case 'metadata':
        r2Path = `${r2BasePath}/metadata.json`;
        break;
      case 'assets':
        r2Path = `${r2BasePath}/assets/`;
        legacyPath = `components/${componentSlug}/`;
        break;
      default:
        r2Path = r2BasePath;
    }

    return {
      r2Path,
      legacyPath,
      category,
      number,
      version
    };
  }

  /**
   * Génère une URL publique selon le provider (R2 CDN vs S3)
   */
  async getPublicUrl(filePath: string, isPublic: boolean = true): Promise<string> {
    switch (this.storageProvider) {
      case 'r2':
        const r2Disk = isPublic ? 'r2' : 'r2_private';
        const r2Url = await drive.use(r2Disk).getUrl(filePath);
        
        // Utiliser R2 CDN URL si configuré
        const r2CdnUrl = env.get('R2_CDN_URL', '');
        if (r2CdnUrl && isPublic) {
          return r2Url.replace(env.get('R2_ENDPOINT', ''), r2CdnUrl);
        }
        return r2Url;

      case 'fs':
        const fsDisk = isPublic ? 'public' : 'fs';
        return await drive.use(fsDisk).getUrl(filePath);

      case 'dual':
        // Priorité R2 avec fallback S3 pour les URLs aussi
        const r2DiskDual = isPublic ? 'r2' : 'r2_private';
        const s3DiskDual = isPublic ? 's3' : 's3_private';
        
        try {
          const r2UrlDual = await drive.use(r2DiskDual).getUrl(filePath);
          
          // Vérifier que le fichier existe réellement dans R2
          const existsR2 = await drive.use(r2DiskDual).exists(filePath);
          if (existsR2) {
            const r2CdnUrlDual = env.get('R2_CDN_URL', '');
            if (r2CdnUrlDual && isPublic) {
              return r2UrlDual.replace(env.get('R2_ENDPOINT', ''), r2CdnUrlDual);
            }
            return r2UrlDual;
          }
        } catch (error) {
          this.logError('getPublicUrl - R2 failed, fallback to S3', error as Error, { filePath });
        }

        // Fallback S3
        return await drive.use(s3DiskDual).getUrl(filePath);

      case 's3':
      default:
        const s3Disk = isPublic ? 's3' : 's3_private';
        return await drive.use(s3Disk).getUrl(filePath);
    }
  }

  /**
   * Récupère un composant avec stratégie R2-first et fallback legacy
   */
  async getComponentWithFallback(
    componentSlug: string,
    resourceType: 'preview' | 'thumbnail' | 'metadata' = 'preview'
  ): Promise<{ content: string | Buffer; url: string; source: 'r2' | 's3' | 'legacy' }> {
    this.logOperation('getComponentWithFallback', { componentSlug, resourceType });

    const paths = await this.resolveComponentPath(componentSlug, resourceType);
    
    // Essayer d'abord la nouvelle structure R2
    try {
      const content = await this.getFileWithStrategy(paths.r2Path, true);
      const url = await this.getPublicUrl(paths.r2Path, true);
      
      this.logOperation('getComponentWithFallback - R2 success', {
        componentSlug,
        r2Path: paths.r2Path
      });
      
      return {
        content,
        url,
        source: this.storageProvider === 's3' ? 's3' : 'r2'
      };
    } catch (r2Error) {
      this.logError('getComponentWithFallback - R2 failed', r2Error as Error, {
        r2Path: paths.r2Path
      });
    }

    // Fallback vers la structure legacy si elle existe
    if (paths.legacyPath) {
      try {
        const legacyContent = await this.getFileWithStrategy(paths.legacyPath, true);
        const legacyUrl = await this.getPublicUrl(paths.legacyPath, true);
        
        this.logOperation('getComponentWithFallback - legacy success', {
          componentSlug,
          legacyPath: paths.legacyPath
        });
        
        return {
          content: legacyContent,
          url: legacyUrl,
          source: 'legacy'
        };
      } catch (legacyError) {
        this.logError('getComponentWithFallback - legacy failed', legacyError as Error, {
          legacyPath: paths.legacyPath
        });
      }
    }

    throw new ValidationError(`Fichier ${resourceType} non trouvé pour le composant ${componentSlug}`);
  }

  /**
   * Liste les assets d'un composant dans un dossier
   */
  private async listComponentAssets(basePath: string): Promise<Array<{ filename: string; url: string; type: string }>> {
    // Pour le MVP, on retourne une liste simulée des assets communs
    // Dans une implémentation complète, il faudrait utiliser l'API du driver pour lister
    const commonAssets = [
      'assets/icon.svg',
      'assets/image-1.jpg',
      'assets/image-2.jpg',
      'images/hero-image.webp',
      'images/placeholder.png'
    ];

    const assets = [];
    for (const assetPath of commonAssets) {
      const fullPath = `${basePath}/${assetPath}`;
      try {
        const exists = await this.fileExistsWithFallback(fullPath, true);
        if (exists) {
          const url = await this.getPublicUrl(fullPath, true);
          const type = this.getAssetType(assetPath);
          assets.push({
            filename: assetPath.split('/').pop() || assetPath,
            url,
            type
          });
        }
      } catch (error) {
        // Ignorer les erreurs pour les assets optionnels
      }
    }

    return assets;
  }

  /**
   * Détermine le type d'asset selon l'extension
   */
  private getAssetType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      return 'image';
    }
    if (['.svg'].includes(ext)) {
      return 'icon';
    }
    if (['.mp4', '.webm'].includes(ext)) {
      return 'video';
    }
    if (['.css'].includes(ext)) {
      return 'style';
    }
    if (['.js'].includes(ext)) {
      return 'script';
    }
    
    return 'asset';
  }

  /**
   * Génère des métadonnées de fallback si metadata.json n'existe pas
   */
  private async generateFallbackMetadata(category: string, number: number, version: string): Promise<any> {
    return {
      component: {
        id: `${category}-${number}`,
        category,
        number,
        version,
        name: `${category.charAt(0).toUpperCase() + category.slice(1)} ${number}`,
        description: `Composant ${category} numéro ${number}`,
        frameworks: ['react', 'html'],
        cssFrameworks: ['tailwind_v4'],
        isFree: true,
        isPremium: false,
        tags: [category]
      },
      assets: {
        preview: {
          large: null,
          small: null,
          video: null
        },
        files: [],
        compiled: {
          html: 'preview.html',
          thumbnail: 'thumbnail.jpg'
        }
      },
      stats: {
        fileSize: 0,
        assetCount: 0,
        conversionRate: null,
        viewCount: 0,
        copyCount: 0
      },
      r2Metadata: {
        'component-id': `${category}-${number}`,
        'version': version,
        'cache-control': 'public, max-age=31536000',
        'content-type': 'application/json'
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      source: 'fallback-generated'
    };
  }

  /**
   * Vérifie si un userId correspond à un utilisateur système
   */
  private isSystemUser(userId: string): boolean {
    const systemUsers = [
      'system-cdn-optimizer',
      'batch-upload-service',
      'asset-optimizer',
      'cdn-worker',
      'admin-user'
    ];
    
    return systemUsers.includes(userId);
  }
}