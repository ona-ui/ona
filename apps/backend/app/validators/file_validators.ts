/**
 * Validators de fichiers et uploads pour l'application Ona UI
 * 
 * Ce fichier contient tous les schémas de validation pour la gestion
 * des fichiers, uploads d'images, vidéos et autres assets.
 */

import vine from '@vinejs/vine'
import {
  uuidSchema,
  urlSchema,
} from './common_validators.js'

/* =====================================================
   CONSTANTES DE VALIDATION DE FICHIERS
   ===================================================== */

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
] as const

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo', // .avi
] as const

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
] as const

/* =====================================================
   VALIDATORS D'UPLOAD D'IMAGES
   ===================================================== */

/**
 * Schéma de validation pour l'upload d'images
 */
export const uploadImageSchema = vine.object({
  // Métadonnées du fichier
  filename: vine.string().trim().minLength(1).maxLength(255),
  mimeType: vine.enum(ALLOWED_IMAGE_TYPES),
  size: vine.number().min(1).max(MAX_IMAGE_SIZE),
  
  // Dimensions (optionnelles, calculées automatiquement)
  width: vine.number().min(1).optional(),
  height: vine.number().min(1).optional(),
  
  // Contexte d'utilisation
  purpose: vine.enum([
    'avatar',
    'component_preview_large',
    'component_preview_small',
    'category_icon',
    'general',
  ]).optional(),
  
  // Compression et optimisation
  quality: vine.number().min(1).max(100).optional(),
  autoOptimize: vine.boolean().optional(),
  generateThumbnails: vine.boolean().optional(),
  
  // Métadonnées optionnelles
  alt: vine.string().trim().maxLength(255).optional(),
  caption: vine.string().trim().maxLength(500).optional(),
})

/**
 * Schéma de validation pour la mise à jour des métadonnées d'image
 */
export const updateImageMetadataSchema = vine.object({
  filename: vine.string().trim().minLength(1).maxLength(255).optional(),
  alt: vine.string().trim().maxLength(255).optional(),
  caption: vine.string().trim().maxLength(500).optional(),
  tags: vine.array(vine.string().trim().minLength(1)).optional(),
})

/* =====================================================
   VALIDATORS D'UPLOAD DE VIDÉOS
   ===================================================== */

/**
 * Schéma de validation pour l'upload de vidéos
 */
export const uploadVideoSchema = vine.object({
  // Métadonnées du fichier
  filename: vine.string().trim().minLength(1).maxLength(255),
  mimeType: vine.enum(ALLOWED_VIDEO_TYPES),
  size: vine.number().min(1).max(MAX_VIDEO_SIZE),
  
  // Dimensions et durée (optionnelles, calculées automatiquement)
  width: vine.number().min(1).optional(),
  height: vine.number().min(1).optional(),
  duration: vine.number().min(0).optional(),
  
  // Contexte d'utilisation
  purpose: vine.enum([
    'component_preview',
    'tutorial',
    'demo',
    'general',
  ]).optional(),
  
  // Options de traitement
  generateThumbnail: vine.boolean().optional(),
  thumbnailTime: vine.number().min(0).optional(), // Temps en secondes pour la thumbnail
  autoCompress: vine.boolean().optional(),
  
  // Métadonnées optionnelles
  title: vine.string().trim().maxLength(255).optional(),
  description: vine.string().trim().maxLength(1000).optional(),
})

/**
 * Schéma de validation pour la mise à jour des métadonnées de vidéo
 */
export const updateVideoMetadataSchema = vine.object({
  filename: vine.string().trim().minLength(1).maxLength(255).optional(),
  title: vine.string().trim().maxLength(255).optional(),
  description: vine.string().trim().maxLength(1000).optional(),
  tags: vine.array(vine.string().trim().minLength(1)).optional(),
})

/* =====================================================
   VALIDATORS D'UPLOAD DE DOCUMENTS
   ===================================================== */

/**
 * Schéma de validation pour l'upload de documents
 */
export const uploadDocumentSchema = vine.object({
  // Métadonnées du fichier
  filename: vine.string().trim().minLength(1).maxLength(255),
  mimeType: vine.enum(ALLOWED_DOCUMENT_TYPES),
  size: vine.number().min(1).max(MAX_DOCUMENT_SIZE),
  
  // Contexte d'utilisation
  purpose: vine.enum([
    'component_readme',
    'component_documentation',
    'license',
    'terms',
    'privacy',
    'general',
  ]).optional(),
  
  // Métadonnées optionnelles
  title: vine.string().trim().maxLength(255).optional(),
  description: vine.string().trim().maxLength(1000).optional(),
  version: vine.string().trim().maxLength(20).optional(),
})

/* =====================================================
   VALIDATORS DE MÉTADONNÉES DE FICHIERS
   ===================================================== */

/**
 * Schéma de validation pour les métadonnées génériques de fichiers
 */
export const fileMetadataSchema = vine.object({
  // Informations de base
  originalName: vine.string().trim().minLength(1).maxLength(255),
  filename: vine.string().trim().minLength(1).maxLength(255),
  mimeType: vine.string().trim().minLength(1),
  size: vine.number().min(1),
  
  // Hachage et intégrité
  hash: vine.string().trim().optional(),
  checksum: vine.string().trim().optional(),
  
  // Localisation
  path: vine.string().trim().minLength(1),
  url: urlSchema.optional(),
  cdnUrl: urlSchema.optional(),
  
  // Métadonnées étendues
  metadata: vine.object({
    width: vine.number().min(1).optional(),
    height: vine.number().min(1).optional(),
    duration: vine.number().min(0).optional(),
    bitrate: vine.number().min(0).optional(),
    format: vine.string().trim().optional(),
    codec: vine.string().trim().optional(),
  }).optional(),
  
  // Tags et classification
  tags: vine.array(vine.string().trim().minLength(1)).optional(),
  category: vine.string().trim().optional(),
  
  // Informations d'upload
  uploadedBy: uuidSchema.optional(),
  uploadedAt: vine.date().optional(),
})

/* =====================================================
   VALIDATORS DE TRAITEMENT D'IMAGES
   ===================================================== */

/**
 * Schéma de validation pour le redimensionnement d'images
 */
export const resizeImageSchema = vine.object({
  fileId: uuidSchema,
  width: vine.number().min(1).max(4000).optional(),
  height: vine.number().min(1).max(4000).optional(),
  maintainAspectRatio: vine.boolean().optional(),
  quality: vine.number().min(1).max(100).optional(),
  format: vine.enum(['jpeg', 'png', 'webp']).optional(),
})

/**
 * Schéma de validation pour la génération de thumbnails
 */
export const generateThumbnailSchema = vine.object({
  fileId: uuidSchema,
  sizes: vine.array(
    vine.object({
      name: vine.string().trim().minLength(1),
      width: vine.number().min(1).max(1000),
      height: vine.number().min(1).max(1000),
      quality: vine.number().min(1).max(100).optional(),
    })
  ).minLength(1),
  format: vine.enum(['jpeg', 'png', 'webp']).optional(),
})

/* =====================================================
   VALIDATORS DE GESTION DE FICHIERS
   ===================================================== */

/**
 * Schéma de validation pour la suppression de fichiers
 */
export const deleteFileSchema = vine.object({
  fileId: uuidSchema,
  deleteFromStorage: vine.boolean().optional(),
  reason: vine.string().trim().maxLength(255).optional(),
})

/**
 * Schéma de validation pour la recherche de fichiers
 */
export const searchFilesSchema = vine.object({
  // Recherche textuelle
  q: vine.string().trim().minLength(1).maxLength(255).optional(),
  
  // Filtres par type
  mimeType: vine.string().trim().optional(),
  category: vine.string().trim().optional(),
  purpose: vine.string().trim().optional(),
  
  // Filtres par taille
  minSize: vine.number().min(0).optional(),
  maxSize: vine.number().min(0).optional(),
  
  // Filtres par dimensions (pour images/vidéos)
  minWidth: vine.number().min(1).optional(),
  maxWidth: vine.number().min(1).optional(),
  minHeight: vine.number().min(1).optional(),
  maxHeight: vine.number().min(1).optional(),
  
  // Filtres par dates
  uploadedAfter: vine.date().optional(),
  uploadedBefore: vine.date().optional(),
  
  // Filtres par utilisateur
  uploadedBy: uuidSchema.optional(),
  
  // Tags
  tags: vine.array(vine.string()).optional(),
  
  // Pagination et tri
  page: vine.number().min(1).optional(),
  limit: vine.number().min(1).max(100).optional(),
  sortBy: vine.enum(['filename', 'size', 'uploadedAt', 'mimeType']).optional(),
  sortOrder: vine.enum(['asc', 'desc']).optional(),
})

/* =====================================================
   VALIDATORS D'OPTIMISATION
   ===================================================== */

/**
 * Schéma de validation pour l'optimisation d'images
 */
export const optimizeImageSchema = vine.object({
  fileId: uuidSchema,
  quality: vine.number().min(1).max(100).optional(),
  progressive: vine.boolean().optional(),
  stripMetadata: vine.boolean().optional(),
  convertToWebP: vine.boolean().optional(),
})

/**
 * Schéma de validation pour la compression de vidéos
 */
export const compressVideoSchema = vine.object({
  fileId: uuidSchema,
  quality: vine.enum(['low', 'medium', 'high']).optional(),
  maxBitrate: vine.number().min(100).optional(),
  maxResolution: vine.enum(['480p', '720p', '1080p']).optional(),
  format: vine.enum(['mp4', 'webm']).optional(),
})

/* =====================================================
   VALIDATORS DE VALIDATION DE CONTENU
   ===================================================== */

/**
 * Schéma de validation pour la validation de code
 */
export const validateCodeFileSchema = vine.object({
  content: vine.string().trim().minLength(1),
  language: vine.enum([
    'html',
    'css',
    'javascript',
    'typescript',
    'jsx',
    'tsx',
    'json',
    'markdown',
  ]),
  validateSyntax: vine.boolean().optional(),
  validateSecurity: vine.boolean().optional(),
  maxLines: vine.number().min(1).optional(),
})

/**
 * Schéma de validation pour la validation de sécurité des fichiers
 */
export const validateFileSecuritySchema = vine.object({
  fileId: uuidSchema,
  scanForMalware: vine.boolean().optional(),
  validateContent: vine.boolean().optional(),
  checkFileIntegrity: vine.boolean().optional(),
})

/* =====================================================
   VALIDATORS DE BATCH OPERATIONS
   ===================================================== */

/**
 * Schéma de validation pour les opérations en lot sur les fichiers
 */
export const batchFileOperationSchema = vine.object({
  fileIds: vine.array(uuidSchema).minLength(1).maxLength(100),
  operation: vine.enum(['delete', 'optimize', 'move', 'tag', 'categorize']),
  parameters: vine.object({
    // Pour l'opération 'move'
    newPath: vine.string().trim().optional(),
    
    // Pour l'opération 'tag'
    tags: vine.array(vine.string().trim().minLength(1)).optional(),
    
    // Pour l'opération 'categorize'
    category: vine.string().trim().optional(),
    
    // Pour l'opération 'optimize'
    quality: vine.number().min(1).max(100).optional(),
  }).optional(),
})