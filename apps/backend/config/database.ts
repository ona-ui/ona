import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import env from '#start/env'

// Configuration de la connexion PostgreSQL
const connectionString = env.get('DATABASE_URL')

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Créer le pool de connexions
const pool = new Pool({
  connectionString,
  max: 10, // Pool de connexions
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
})

// Créer l'instance Drizzle
export const db = drizzle(pool)

// Export du pool pour les cas spéciaux
export { pool }