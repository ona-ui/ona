import { BaseService } from './base_service.js'
import { FileService, type UploadOptions as FileUploadOptions } from './file_service.js'
import {
  type BatchUploadResult,
  type UploadOptions as AssetUploadOptions,
  type AssetMetadata,
  type SharedAsset,
  type ComponentSpecificAsset
} from '../types/assets.js'
import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

/**
 * Service d'upload intelligent vers R2 avec déduplication par hash
 * Extension du FileService existant avec upload parallèle et retry
 */
export class BatchUploadService extends BaseService {
  private readonly fileService: FileService
  private readonly maxConcurrency = 10
  private readonly retryDelayBase = 1000 // 1 seconde

  constructor() {
    super()
    this.fileService = new FileService()
  }

  /**
   * Upload en batch d'une liste d'assets avec déduplication
   */
  async uploadAssets(
    assets: (AssetMetadata | SharedAsset | ComponentSpecificAsset)[],
    userId: string,
    options: AssetUploadOptions = {}
  ): Promise<BatchUploadResult> {
    this.logOperation('uploadAssets', { 
      assetCount: assets.length, 
      userId,
      options
    })

    const startTime = Date.now()
    const concurrency = Math.min(options.concurrency || this.maxConcurrency, this.maxConcurrency)
    const retryAttempts = options.retryAttempts || 3
    
    const uploadedAssets: BatchUploadResult['uploadedAssets'] = []
    const skippedAssets: BatchUploadResult['skippedAssets'] = []
    const errors: string[] = []

    // Diviser les assets en batches
    const batches = this.createBatches(assets, concurrency)

    for (const batch of batches) {
      const batchPromises = batch.map(asset => 
        this.uploadSingleAsset(asset, userId, options, retryAttempts)
      )

      const batchResults = await Promise.allSettled(batchPromises)
      
      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i]
        const asset = batch[i]
        
        if (result.status === 'fulfilled') {
          if (result.value.uploaded) {
            uploadedAssets.push(result.value.data!)
          } else {
            skippedAssets.push({
              localPath: asset.path,
              reason: result.value.reason || 'Fichier déjà existant',
              existingUrl: result.value.existingUrl || ''
            })
          }
        } else {
          errors.push(`${asset.path}: ${result.reason}`)
          this.logError('uploadAssets - batch error', new Error(result.reason), { asset: asset.path })
        }
      }
    }

    const totalSize = uploadedAssets.reduce((sum, asset) => sum + asset.size, 0)
    const uploadDuration = Date.now() - startTime

    const batchResult: BatchUploadResult = {
      uploadedAssets,
      skippedAssets,
      totalUploaded: uploadedAssets.length,
      totalSkipped: skippedAssets.length,
      totalSize,
      uploadDuration,
      errors
    }

    this.logOperation('uploadAssets completed', {
      uploaded: batchResult.totalUploaded,
      skipped: batchResult.totalSkipped,
      errors: batchResult.errors.length,
      duration: this.formatDuration(uploadDuration),
      totalSize: this.formatBytes(totalSize)
    })

    return batchResult
  }

  /**
   * Upload parallèle d'assets partagés vers un dossier dédié
   */
  async uploadSharedAssets(
    sharedAssets: SharedAsset[],
    userId: string,
    options: AssetUploadOptions = {}
  ): Promise<BatchUploadResult> {
    this.logOperation('uploadSharedAssets', { count: sharedAssets.length })

    // Configurer les headers de cache pour les assets partagés
    const sharedOptions: AssetUploadOptions = {
      ...options,
      cacheHeaders: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...options.cacheHeaders
      }
    }

    return this.uploadAssets(sharedAssets, userId, sharedOptions)
  }

  /**
   * Upload d'assets spécifiques à un composant
   */
  async uploadComponentAssets(
    componentAssets: ComponentSpecificAsset[],
    userId: string,
    options: AssetUploadOptions = {}
  ): Promise<BatchUploadResult> {
    this.logOperation('uploadComponentAssets', { count: componentAssets.length })

    // Grouper par composant pour organiser l'upload
    const assetsByComponent = this.groupAssetsByComponent(componentAssets)
    
    const allResults: BatchUploadResult[] = []

    for (const [, assets] of assetsByComponent.entries()) {
      const componentOptions: AssetUploadOptions = {
        ...options,
        cacheHeaders: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          ...options.cacheHeaders
        }
      }

      const result = await this.uploadAssets(assets, userId, componentOptions)
      allResults.push(result)
    }

    // Agrégé les résultats
    return this.aggregateResults(allResults)
  }

  /**
   * Upload avec retry automatique et gestion d'erreurs
   */
  private async uploadSingleAsset(
    asset: AssetMetadata | SharedAsset | ComponentSpecificAsset,
    userId: string,
    options: AssetUploadOptions,
    retryAttempts: number
  ): Promise<{
    uploaded: boolean
    data?: BatchUploadResult['uploadedAssets'][0]
    reason?: string
    existingUrl?: string
  }> {
    const fullPath = this.resolveAssetPath(asset.path)
    
    try {
      // Vérifier si le fichier existe déjà par hash
      if (options.skipExisting !== false) {
        const existingFile = await this.checkIfAssetExists(asset.hash)
        if (existingFile) {
          return {
            uploaded: false,
            reason: 'Fichier déjà existant (même hash)',
            existingUrl: existingFile.url
          }
        }
      }

      // Lire le fichier
      const fileContent = await fs.readFile(fullPath)
      
      // Vérifier l'intégrité par hash
      const actualHash = this.calculateHash(fileContent)
      if (actualHash !== asset.hash) {
        throw new Error('Hash mismatch - fichier modifié depuis l\'extraction')
      }

      // Upload avec retry
      const uploadedFile = await this.uploadWithRetry(
        fileContent,
        asset,
        userId,
        options,
        retryAttempts
      )

      return {
        uploaded: true,
        data: {
          localPath: asset.path,
          remotePath: uploadedFile.path,
          url: uploadedFile.url,
          hash: uploadedFile.hash,
          size: uploadedFile.size,
          uploadedAt: uploadedFile.uploadedAt
        }
      }

    } catch (error) {
      this.logError('uploadSingleAsset', error as Error, { assetPath: asset.path })
      throw error
    }
  }

  /**
   * Upload avec logique de retry
   */
  private async uploadWithRetry(
    fileContent: Buffer,
    asset: AssetMetadata | SharedAsset | ComponentSpecificAsset,
    userId: string,
    options: AssetUploadOptions,
    retryAttempts: number
  ): Promise<{
    path: string
    url: string
    hash: string
    size: number
    uploadedAt: Date
  }> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Déterminer le type MIME
        const mimeType = this.getMimeType(asset.filename)
        
        // Préparer les options pour FileService avec nom original préservé
        const fileServiceOptions: FileUploadOptions = {
          folder: this.generateFolderPath(asset, options),
          disk: 'r2', // Forcer l'usage de R2
          isPublic: true,
          generateVariants: options.generateThumbnails,
          optimize: options.optimizeImages
        }
        
        // Nettoyer le nom de fichier pour éviter les caractères spéciaux
        const cleanFilename = this.sanitizeFilename(asset.filename)

        // Upload via FileService avec nom nettoyé
        const uploadResult = await this.fileService.uploadFileWithPreservedName(
          fileContent,
          cleanFilename, // Utiliser le nom nettoyé (ex: index-wnm6efqb.js)
          mimeType,
          userId,
          fileServiceOptions
        )

        return {
          path: uploadResult.path,
          url: uploadResult.url,
          hash: uploadResult.hash,
          size: uploadResult.size,
          uploadedAt: uploadResult.uploadedAt
        }

      } catch (error) {
        lastError = error as Error
        
        if (attempt < retryAttempts) {
          const delay = this.retryDelayBase * Math.pow(2, attempt - 1) // Backoff exponentiel
          this.logOperation('uploadWithRetry - retrying', { 
            attempt, 
            nextAttempt: attempt + 1, 
            delay,
            error: error.message 
          })
          
          await this.sleep(delay)
        }
      }
    }

    throw lastError || new Error('Upload failed after all retry attempts')
  }

  /**
   * Vérifie si un asset existe déjà par hash
   */
  private async checkIfAssetExists(
    _hash: string
  ): Promise<{ url: string } | null> {
    try {
      // Pour le MVP, on retourne null (pas de déduplication avancée)
      // Dans une implémentation complète, on vérifierait une base de métadonnées
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Résout le chemin absolu d'un asset
   */
  private resolveAssetPath(relativePath: string): string {
    // Obtenir le chemin du fichier actuel dans un module ES6
    const currentFile = fileURLToPath(import.meta.url)
    const currentDir = dirname(currentFile)
    
    const basePath = path.resolve(currentDir, '../../../../../components-compiler/dist-obf')
    return path.join(basePath, relativePath)
  }

  /**
   * Génère le chemin de dossier pour un asset
   */
  private generateFolderPath(
    asset: AssetMetadata | SharedAsset | ComponentSpecificAsset,
    _options: AssetUploadOptions
  ): string {
    // Si c'est un asset partagé
    if ('isShared' in asset && asset.isShared) {
      return 'shared/assets'
    }
    
    // Si c'est un asset spécifique à un composant
    if ('component' in asset && asset.component && asset.component !== 'shared') {
      const [category, number] = asset.component.split('-')
      return `components/${category}/${number}/v1.0.0/assets`
    }
    
    return 'assets'
  }

  /**
   * Divise une liste en batches de taille fixe
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    
    return batches
  }

  /**
   * Groupe les assets par composant
   */
  private groupAssetsByComponent(
    assets: ComponentSpecificAsset[]
  ): Map<string, ComponentSpecificAsset[]> {
    const groups = new Map<string, ComponentSpecificAsset[]>()
    
    for (const asset of assets) {
      const key = asset.component
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(asset)
    }
    
    return groups
  }

  /**
   * Agrège plusieurs résultats d'upload
   */
  private aggregateResults(results: BatchUploadResult[]): BatchUploadResult {
    const aggregated: BatchUploadResult = {
      uploadedAssets: [],
      skippedAssets: [],
      totalUploaded: 0,
      totalSkipped: 0,
      totalSize: 0,
      uploadDuration: 0,
      errors: []
    }

    for (const result of results) {
      aggregated.uploadedAssets.push(...result.uploadedAssets)
      aggregated.skippedAssets.push(...result.skippedAssets)
      aggregated.totalUploaded += result.totalUploaded
      aggregated.totalSkipped += result.totalSkipped
      aggregated.totalSize += result.totalSize
      aggregated.uploadDuration = Math.max(aggregated.uploadDuration, result.uploadDuration)
      aggregated.errors.push(...result.errors)
    }

    return aggregated
  }

  /**
   * Calcule le hash SHA256 d'un buffer
   */
  private calculateHash(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex')
  }

  /**
   * Nettoie le nom de fichier pour supprimer les caractères non autorisés
   */
  private sanitizeFilename(filename: string): string {
    // Garder l'extension
    const ext = path.extname(filename)
    const nameWithoutExt = path.basename(filename, ext)

    // Supprimer les caractères spéciaux et les espaces
    let sanitized = nameWithoutExt
      .replace(/[()\s\-]+/g, '-') // Remplacer parenthèses, espaces et tirets multiples par un seul tiret
      .replace(/[^a-zA-Z0-9\-_.]/g, '') // Supprimer tous les caractères spéciaux sauf alphanumériques, tirets, underscores et points
      .replace(/^-+|-+$/g, '') // Supprimer les tirets au début et à la fin

    // Préserver la casse pour les fichiers JavaScript et CSS
    if (ext !== '.js' && ext !== '.mjs' && ext !== '.css') {
      sanitized = sanitized.toLowerCase()
    }

    // S'assurer qu'on a au moins un nom valide
    const finalName = sanitized || 'asset'

    // Log pour debug
    if (filename !== `${finalName}${ext}`) {
      this.logOperation('sanitizeFilename', {
        original: filename,
        sanitized: `${finalName}${ext}`
      })
    }

    return `${finalName}${ext}`
  }

  /**
   * Détermine le type MIME d'un fichier
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.js': 'application/javascript',
      '.mjs': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm'
    }

    return mimeTypes[ext] || 'application/octet-stream'
  }

  /**
   * Pause l'exécution pour le retry
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Formate une durée en millisecondes
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  /**
   * Formate les bytes en format lisible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export const batchUploadService = new BatchUploadService()