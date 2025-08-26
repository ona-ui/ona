import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK', 'fs'),

  /**
   * Configuration des services de stockage pour Ona UI
   * - fs: Stockage local pour développement et fichiers temporaires
   * - s3: Stockage cloud pour production (AWS S3 ou compatible)
   * - public: Stockage public pour fichiers accessibles directement
   */
  services: {
    /**
     * Disque local pour développement et fichiers temporaires
     */
    fs: services.fs({
      location: app.makePath('storage'),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
      appUrl: env.get('APP_URL'),
    }),

    /**
     * Disque public pour fichiers accessibles publiquement
     * Utilisé pour les images optimisées, thumbnails, etc.
     */
    public: services.fs({
      location: app.makePath('public/uploads'),
      serveFiles: true,
      routeBasePath: '/public-uploads',
      visibility: 'public',
      appUrl: env.get('APP_URL'),
    }),

    /**
     * Stockage S3 pour production
     * Compatible avec AWS S3, DigitalOcean Spaces, etc.
     */
    s3: services.s3({
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY', ''),
      },
      region: env.get('AWS_REGION', 'us-east-1'),
      bucket: env.get('AWS_BUCKET', 'ona-ui-bucket'),
      endpoint: env.get('AWS_ENDPOINT'), // Pour DigitalOcean Spaces ou autres
      visibility: 'public',
      // Configuration pour CDN
      cdnUrl: env.get('AWS_CDN_URL'),
    }),

    /**
     * Stockage S3 privé pour fichiers sensibles
     */
    s3_private: services.s3({
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY', ''),
      },
      region: env.get('AWS_REGION', 'us-east-1'),
      bucket: env.get('AWS_PRIVATE_BUCKET', 'ona-ui-private-bucket'),
      endpoint: env.get('AWS_ENDPOINT'),
      visibility: 'private',
    }),

    /**
     * Stockage Cloudflare R2 pour production
     * Compatible S3 avec endpoint Cloudflare R2
     */
    r2: services.s3({
      credentials: {
        accessKeyId: env.get('R2_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('R2_SECRET_ACCESS_KEY', ''),
      },
      region: 'auto', // R2 utilise toujours 'auto'
      bucket: env.get('R2_BUCKET', 'ona-ui-r2-public'),
      endpoint: env.get('R2_ENDPOINT'),
      forcePathStyle: true, // Requis pour R2
      visibility: 'public',
      // Configuration CDN
      //cdnUrl: env.get('R2_CDN_URL'),
      // Configuration critique pour éviter erreurs SDK
      requestChecksumCalculation: 'WHEN_REQUIRED',
    }),

    /**
     * Stockage Cloudflare R2 privé pour fichiers sensibles
     */
    r2_private: services.s3({
      credentials: {
        accessKeyId: env.get('R2_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('R2_SECRET_ACCESS_KEY', ''),
      },
      region: 'auto', // R2 utilise toujours 'auto'
      bucket: env.get('R2_PRIVATE_BUCKET', 'ona-ui-r2-private'),
      endpoint: env.get('R2_ENDPOINT'),
      forcePathStyle: true, // Requis pour R2
      visibility: 'private',
      // Configuration critique pour éviter erreurs SDK
      requestChecksumCalculation: 'WHEN_REQUIRED',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}