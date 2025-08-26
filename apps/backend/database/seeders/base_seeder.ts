import { drizzle } from 'drizzle-orm/node-postgres'
import { SeederHelpers } from './utils/seeder_helpers.js'

/**
 * Classe de base pour tous les seeders
 */
export abstract class BaseSeeder {
  protected db: ReturnType<typeof drizzle>
  protected helpers = SeederHelpers

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db
  }

  /**
   * Méthode abstraite à implémenter par chaque seeder
   */
  abstract run(): Promise<void>

  /**
   * Log avec le nom du seeder
   */
  protected log(message: string, data?: any): void {
    const seederName = this.constructor.name
    console.log(`[${new Date().toISOString()}] [${seederName}] ${message}`, data || '')
  }

  /**
   * Gère les erreurs avec contexte
   */
  protected handleError(error: any, context: string): void {
    const seederName = this.constructor.name
    console.error(`[${seederName}] Erreur dans ${context}:`, error)
    throw error
  }

  /**
   * Vérifie si des données existent déjà
   */
  protected async checkExistingData(table: any, condition?: any): Promise<boolean> {
    try {
      const query = condition ? this.db.select().from(table).where(condition) : this.db.select().from(table)
      const result = await query.limit(1)
      return result.length > 0
    } catch (error) {
      this.log(`Erreur lors de la vérification des données existantes: ${error}`)
      return false
    }
  }

  /**
   * Nettoie une table (attention: supprime toutes les données)
   */
  protected async truncateTable(table: any, tableName: string): Promise<void> {
    try {
      // Désactiver temporairement les contraintes de clés étrangères
      await this.db.execute(`SET session_replication_role = replica;`)
      
      // Supprimer toutes les données
      await this.db.delete(table)
      
      // Réactiver les contraintes de clés étrangères
      await this.db.execute(`SET session_replication_role = DEFAULT;`)
      
      this.log(`Table ${tableName} vidée`)
    } catch (error) {
      // S'assurer que les contraintes sont réactivées même en cas d'erreur
      try {
        await this.db.execute(`SET session_replication_role = DEFAULT;`)
      } catch (resetError) {
        console.error('Erreur lors de la réactivation des contraintes:', resetError)
      }
      this.handleError(error, `truncateTable(${tableName})`)
    }
  }

  /**
   * Nettoie toutes les tables dans le bon ordre (en respectant les dépendances)
   */
  protected async truncateAllTables(): Promise<void> {
    try {
      this.log('Nettoyage complet de toutes les tables...')
      
      // Désactiver temporairement les contraintes de clés étrangères
      await this.db.execute(`SET session_replication_role = replica;`)
      
      // Ordre de suppression (des tables dépendantes vers les tables principales)
      const tablesToClean = [
        'component_versions',
        'components',
        'subcategories',
        'categories',
        'license_team_members',
        'licenses',
        'users',
        'products'
      ]
      
      for (const tableName of tablesToClean) {
        try {
          await this.db.execute(`DELETE FROM "${tableName}";`)
          this.log(`Table ${tableName} vidée`)
        } catch (error) {
          // Continuer même si une table n'existe pas
          this.log(`Impossible de vider la table ${tableName}: ${error}`)
        }
      }
      
      // Réactiver les contraintes de clés étrangères
      await this.db.execute(`SET session_replication_role = DEFAULT;`)
      
      this.log('Nettoyage complet terminé')
    } catch (error) {
      // S'assurer que les contraintes sont réactivées même en cas d'erreur
      try {
        await this.db.execute(`SET session_replication_role = DEFAULT;`)
      } catch (resetError) {
        console.error('Erreur lors de la réactivation des contraintes:', resetError)
      }
      this.handleError(error, 'truncateAllTables')
    }
  }

  /**
   * Insert en lot pour de meilleures performances
   */
  protected async batchInsert<T>(
    table: any,
    data: T[],
    batchSize: number = 100,
    tableName: string = 'unknown'
  ): Promise<void> {
    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        await this.db.insert(table).values(batch)
        this.log(`Inséré ${batch.length} enregistrements dans ${tableName} (${i + batch.length}/${data.length})`)
      }
    } catch (error) {
      this.handleError(error, `batchInsert(${tableName})`)
    }
  }

  /**
   * Génère des timestamps cohérents
   */
  protected generateTimestamps(baseDate?: Date): { createdAt: Date; updatedAt: Date } {
    const created = baseDate || new Date()
    const updated = new Date(created.getTime() + Math.random() * 86400000) // +0-24h
    
    return {
      createdAt: created,
      updatedAt: updated
    }
  }

  /**
   * Génère une date de publication aléatoire dans le passé
   */
  protected generatePublishedAt(): Date {
    const now = new Date()
    const monthsAgo = Math.floor(Math.random() * 12) + 1 // 1-12 mois
    return new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.floor(Math.random() * 28) + 1)
  }

  /**
   * Attendre un délai (utile pour éviter les conflits de timestamps)
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}