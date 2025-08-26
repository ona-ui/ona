/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(['fs', 'public', 's3', 's3_private', 'r2', 'r2_private'] as const),
  STORAGE_PROVIDER: Env.schema.enum.optional(['s3', 'r2', 'dual', 'fs'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring AWS S3 storage
  |----------------------------------------------------------
  */
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  AWS_REGION: Env.schema.string.optional(),
  AWS_BUCKET: Env.schema.string.optional(),
  AWS_PRIVATE_BUCKET: Env.schema.string.optional(),
  AWS_ENDPOINT: Env.schema.string.optional(),
  AWS_CDN_URL: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Cloudflare R2 storage
  |----------------------------------------------------------
  */
  R2_ACCOUNT_ID: Env.schema.string.optional(),
  R2_ACCESS_KEY_ID: Env.schema.string.optional(),
  R2_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  R2_BUCKET: Env.schema.string.optional(),
  R2_PRIVATE_BUCKET: Env.schema.string.optional(),
  R2_ENDPOINT: Env.schema.string.optional(),
  R2_CDN_URL: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for file upload configuration
  |----------------------------------------------------------
  */
  MAX_FILE_SIZE: Env.schema.number.optional(),
  MAX_IMAGE_SIZE: Env.schema.number.optional(),
  ENABLE_ANTIVIRUS_SCAN: Env.schema.boolean.optional(),


  RESEND_API_KEY: Env.schema.string()
})
