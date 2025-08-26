/**
 * Types TypeScript pour le système d'assets et d'optimisation
 */

export interface AssetMetadata {
  filename: string
  path: string
  hash: string
  size: number
  mimeType: string
  isShared: boolean
  category?: string
  component?: string
  dependencies: string[]
  lastModified: Date
}

export interface SharedAsset extends AssetMetadata {
  isShared: true
  usageCount: number
  components: string[]
  cdnUrl: string
  cacheHeaders: Record<string, string>
}

export interface ComponentSpecificAsset extends AssetMetadata {
  isShared: false
  component: string
  componentVersion: string
  category: string
  number: number
}

export interface AssetExtractionResult {
  sharedAssets: SharedAsset[]
  componentAssets: ComponentSpecificAsset[]
  totalSize: number
  duplicates: Array<{
    hash: string
    files: string[]
    savings: number
  }>
  extractedAt: Date
}

export interface BatchUploadResult {
  uploadedAssets: Array<{
    localPath: string
    remotePath: string
    url: string
    hash: string
    size: number
    uploadedAt: Date
  }>
  skippedAssets: Array<{
    localPath: string
    reason: string
    existingUrl: string
  }>
  totalUploaded: number
  totalSkipped: number
  totalSize: number
  uploadDuration: number
  errors: string[]
}

export interface AssetMapping {
  hash: string
  originalPath: string
  cdnUrl: string
  localFallback: string
  isShared: boolean
  version: string
  cacheHeaders: Record<string, string>
  expiresAt?: Date
}

export interface AssetMappingResult {
  mappings: AssetMapping[]
  sharedAssetsMapping: Map<string, string>
  componentAssetsMapping: Map<string, Map<string, string>>
  totalMappings: number
  generatedAt: Date
}

export interface OptimizedHtmlResult {
  originalHtml: string
  optimizedHtml: string
  referencedAssets: string[]
  inlinedAssets: string[]
  cdnReferences: string[]
  preloadTags: string[]
  performanceMetrics: {
    originalSize: number
    optimizedSize: number
    compressionRatio: number
    estimatedLoadTime: number
    assetCount: number
    inlineCount: number
  }
  generatedAt: Date
}

export interface ComponentAssetBundle {
  componentId: string
  category: string
  number: number
  version: string
  assets: {
    shared: SharedAsset[]
    specific: ComponentSpecificAsset[]
  }
  html: {
    original: string
    optimized: string
  }
  metadata: {
    totalSize: number
    assetCount: number
    sharedRatio: number
    cacheEfficiency: number
  }
  cdnUrls: {
    assets: Record<string, string>
    html: string
    thumbnail: string
  }
}

export interface UploadOptions {
  concurrency?: number
  retryAttempts?: number
  retryDelay?: number
  skipExisting?: boolean
  generateThumbnails?: boolean
  optimizeImages?: boolean
  cacheHeaders?: Record<string, string>
  metadata?: Record<string, any>
}

export interface AssetAnalytics {
  component: string
  category: string
  totalAssets: number
  sharedAssets: number
  specificAssets: number
  totalSize: number
  duplicateCount: number
  duplicateSize: number
  compressionSavings: number
  cdnHits: number
  cacheEfficiency: number
  lastAnalyzed: Date
}

export interface WorkflowProgress {
  stage: 'extraction' | 'upload' | 'mapping' | 'optimization' | 'completion'
  progress: number
  message: string
  startedAt: Date
  estimatedCompletion?: Date
  errors: string[]
  warnings: string[]
}

export type AssetType = 'javascript' | 'css' | 'image' | 'font' | 'video' | 'document' | 'other'

export interface AssetFilter {
  category?: string
  component?: string
  type?: AssetType
  isShared?: boolean
  minSize?: number
  maxSize?: number
  extensions?: string[]
}

export interface CacheStrategy {
  maxAge: number
  staleWhileRevalidate?: number
  immutable?: boolean
  public?: boolean
  headers: Record<string, string>
}