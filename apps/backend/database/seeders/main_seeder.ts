import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { BaseSeeder } from './base_seeder.js'
import { ProductSeeder } from './product_seeder.js'
import { UserSeeder } from './user_seeder.js'
import { LicenseSeeder } from './license_seeder.js'
import { CategorySeeder } from './category_seeder.js'
import { SubcategorySeeder } from './subcategory_seeder.js'
import { ComponentSeeder } from './component_seeder.js'
import { ComponentVersionSeeder } from './component_version_seeder.js'
import env from '#start/env'

/**
 * Seeder principal qui orchestre tous les autres seeders
 */
export class MainSeeder extends BaseSeeder {
  private seeders: BaseSeeder[] = []

  constructor(db: ReturnType<typeof drizzle>) {
    super(db)
    
    // Initialiser tous les seeders dans l'ordre de dépendance
    this.seeders = [
      new ProductSeeder(db),
      new UserSeeder(db),
      new LicenseSeeder(db),
      new CategorySeeder(db),
      new SubcategorySeeder(db),
      new ComponentSeeder(db),
      new ComponentVersionSeeder(db)
    ]
  }

  async run(): Promise<void> {
    const startTime = Date.now()
    this.log('🚀 Début du seeding complet de la base de données Ona UI')
    this.log('=' .repeat(60))

    try {
      // Initialiser le stockage global des données
      ;(global as any).seederData = {}

      // Exécuter tous les seeders dans l'ordre
      for (let i = 0; i < this.seeders.length; i++) {
        const seeder = this.seeders[i]
        const seederName = seeder.constructor.name
        
        this.log(`\n📦 [${i + 1}/${this.seeders.length}] Exécution de ${seederName}...`)
        
        const seederStartTime = Date.now()
        await seeder.run()
        const seederDuration = Date.now() - seederStartTime
        
        this.log(`✅ ${seederName} terminé en ${seederDuration}ms`)
        
        // Petit délai entre les seeders pour éviter les conflits
        await this.delay(100)
      }

      const totalDuration = Date.now() - startTime
      
      this.log('\n' + '=' .repeat(60))
      this.log('🎉 Seeding complet terminé avec succès!')
      this.log(`⏱️  Durée totale: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`)
      
      // Afficher les statistiques finales
      await this.displayFinalStats()

    } catch (error) {
      const totalDuration = Date.now() - startTime
      this.log('\n' + '=' .repeat(60))
      this.log('❌ Erreur lors du seeding!')
      this.log(`⏱️  Durée avant erreur: ${totalDuration}ms`)
      this.handleError(error, 'run()')
    }
  }

  /**
   * Affiche les statistiques finales du seeding
   */
  private async displayFinalStats(): Promise<void> {
    this.log('\n📊 Statistiques finales:')
    this.log('-' .repeat(40))

    const seederData = (global as any).seederData

    if (seederData.productIds) {
      this.log(`📦 Produits: ${seederData.productIds.length}`)
    }

    if (seederData.userIds) {
      this.log(`👥 Utilisateurs: ${seederData.userIds.length}`)
      this.log(`   - Super Admin: admin@ona-ui.com`)
      this.log(`   - Admin: editor@ona-ui.com`)
      this.log(`   - Pro: pro@ona-ui.com`)
      this.log(`   - Team: team@ona-ui.com`)
      this.log(`   - Free: free@ona-ui.com`)
    }

    if (seederData.licenseIds) {
      this.log(`🔑 Licences: ${seederData.licenseIds.length}`)
    }

    if (seederData.categoryIds) {
      this.log(`📂 Catégories: ${seederData.categoryIds.length}`)
    }

    if (seederData.subcategoryIds) {
      this.log(`📁 Sous-catégories: ${seederData.subcategoryIds.length}`)
    }

    if (seederData.componentIds) {
      this.log(`🧩 Composants: ${seederData.componentIds.length}`)
      
      if (seederData.freeComponentIds) {
        this.log(`   - Gratuits: ${seederData.freeComponentIds.length}`)
      }
      
      if (seederData.premiumComponentIds) {
        this.log(`   - Premium: ${seederData.premiumComponentIds.length}`)
      }
    }

    if (seederData.versionIds) {
      this.log(`🔄 Versions: ${seederData.versionIds.length}`)
    }

    this.log('\n🔗 URLs de test:')
    this.log('-' .repeat(40))
    this.log('🌐 Frontend: http://localhost:3000')
    this.log('🔧 API: http://localhost:3333')
    this.log('📚 Admin: http://localhost:3333/admin')

    this.log('\n🔐 Comptes de test:')
    this.log('-' .repeat(40))
    this.log('Super Admin: admin@ona-ui.com / admin123')
    this.log('Admin: editor@ona-ui.com / editor123')
    this.log('Pro User: pro@ona-ui.com / pro123')
    this.log('Team User: team@ona-ui.com / team123')
    this.log('Free User: free@ona-ui.com / free123')

    this.log('\n💡 Prochaines étapes:')
    this.log('-' .repeat(40))
    this.log('1. Démarrer le serveur: npm run dev')
    this.log('2. Tester les endpoints API')
    this.log('3. Vérifier l\'interface admin')
    this.log('4. Tester les composants gratuits/premium')
    this.log('5. Valider les permissions par tier')
  }

  /**
   * Nettoie toutes les données (utiliser avec précaution!)
   */
  async cleanAll(): Promise<void> {
    this.log('🧹 Nettoyage complet de la base de données...')
    this.log('⚠️  ATTENTION: Toutes les données vont être supprimées!')

    try {
      // Utiliser la nouvelle méthode qui gère les contraintes FK
      await this.truncateAllTables()
      
      this.log('✅ Nettoyage complet terminé')

    } catch (error) {
      this.handleError(error, 'cleanAll()')
    }
  }

  /**
   * Vérifie l'intégrité des données après seeding
   */
  async verifyIntegrity(): Promise<boolean> {
    this.log('🔍 Vérification de l\'intégrité des données...')

    try {
      const seederData = (global as any).seederData
      let isValid = true

      // Vérifications de base
      if (!seederData.productIds || seederData.productIds.length === 0) {
        this.log('❌ Aucun produit trouvé')
        isValid = false
      }

      if (!seederData.userIds || seederData.userIds.length < 5) {
        this.log('❌ Nombre insuffisant d\'utilisateurs')
        isValid = false
      }

      if (!seederData.categoryIds || seederData.categoryIds.length === 0) {
        this.log('❌ Aucune catégorie trouvée')
        isValid = false
      }

      if (!seederData.componentIds || seederData.componentIds.length < 30) {
        this.log('❌ Nombre insuffisant de composants')
        isValid = false
      }

      if (isValid) {
        this.log('✅ Intégrité des données vérifiée avec succès')
      } else {
        this.log('❌ Problèmes d\'intégrité détectés')
      }

      return isValid

    } catch (error) {
      this.log('❌ Erreur lors de la vérification d\'intégrité')
      this.handleError(error, 'verifyIntegrity()')
      return false
    }
  }
}

/**
 * Fonction utilitaire pour exécuter le seeding principal
 */
export async function runMainSeeder() {
  // Configuration de la base de données
  const pool = new Pool({
    connectionString: env.get('DATABASE_URL') || "postgresql://postgres:postgres@127.0.0.1:5432/ona-ui-dev"
  })

  const db = drizzle(pool)
  const mainSeeder = new MainSeeder(db)

  try {
    await mainSeeder.run()
    
    // Vérifier l'intégrité après le seeding
    const isValid = await mainSeeder.verifyIntegrity()
    
    if (!isValid) {
      console.log('⚠️  Des problèmes d\'intégrité ont été détectés')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Erreur fatale lors du seeding:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Exécuter le seeder si ce fichier est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runMainSeeder()
}