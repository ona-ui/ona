#!/usr/bin/env node

/**
 * Script d'exécution des seeders Ona UI
 * 
 * Usage:
 *   npm run seed              # Exécute tous les seeders
 *   npm run seed:clean        # Nettoie et re-seed
 *   npm run seed:verify       # Vérifie l'intégrité
 *   npm run seed:users        # Seed uniquement les utilisateurs
 *   npm run seed:components   # Seed uniquement les composants
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { 
  MainSeeder,
  ProductSeeder,
  UserSeeder,
  LicenseSeeder,
  CategorySeeder,
  SubcategorySeeder,
  ComponentSeeder,
  ComponentVersionSeeder,
  getSeederConfig
} from './index.js'

// Configuration de la base de données
const createDbConnection = () => {
  const pool = new Pool({
    connectionString: "postgresql://postgres:WByp9StWFQzbWZOpOIO3Mw1LbhRVgycXCi4qq7tI3mMQJgjACxijdHhbh17qnrBR@147.79.100.38:3009/ona-db",
  })

  return drizzle(pool)
}

/**
 * Exécute tous les seeders
 */
async function runAllSeeders() {
  console.log('🚀 Exécution de tous les seeders...')
  
  const db = createDbConnection()
  const mainSeeder = new MainSeeder(db)
  
  try {
    await mainSeeder.run()
    console.log('✅ Tous les seeders ont été exécutés avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des seeders:', error)
    process.exit(1)
  }
}

/**
 * Nettoie et re-seed
 */
async function cleanAndSeed() {
  console.log('🧹 Nettoyage et re-seeding...')
  
  const db = createDbConnection()
  const mainSeeder = new MainSeeder(db)
  
  try {
    await mainSeeder.cleanAll()
    await mainSeeder.run()
    console.log('✅ Nettoyage et seeding terminés!')
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage/seeding:', error)
    process.exit(1)
  }
}

/**
 * Vérifie l'intégrité des données
 */
async function verifyIntegrity() {
  console.log('🔍 Vérification de l\'intégrité...')
  
  const db = createDbConnection()
  const mainSeeder = new MainSeeder(db)
  
  try {
    const isValid = await mainSeeder.verifyIntegrity()
    if (isValid) {
      console.log('✅ Intégrité vérifiée avec succès!')
    } else {
      console.log('❌ Problèmes d\'intégrité détectés!')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    process.exit(1)
  }
}

/**
 * Exécute un seeder spécifique
 */
async function runSpecificSeeder(seederName: string) {
  console.log(`🎯 Exécution du seeder: ${seederName}`)
  
  const db = createDbConnection()
  let seeder

  switch (seederName.toLowerCase()) {
    case 'products':
      seeder = new ProductSeeder(db)
      break
    case 'users':
      seeder = new UserSeeder(db)
      break
    case 'licenses':
      seeder = new LicenseSeeder(db)
      break
    case 'categories':
      seeder = new CategorySeeder(db)
      break
    case 'subcategories':
      seeder = new SubcategorySeeder(db)
      break
    case 'components':
      seeder = new ComponentSeeder(db)
      break
    case 'versions':
      seeder = new ComponentVersionSeeder(db)
      break
    default:
      console.error(`❌ Seeder inconnu: ${seederName}`)
      console.log('Seeders disponibles: products, users, licenses, categories, subcategories, components, versions')
      process.exit(1)
  }

  try {
    await seeder.run()
    console.log(`✅ Seeder ${seederName} exécuté avec succès!`)
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution du seeder ${seederName}:`, error)
    process.exit(1)
  }
}

/**
 * Affiche les informations de configuration
 */
function showConfig() {
  const config = getSeederConfig()
  const env = process.env.NODE_ENV || 'development'
  
  console.log('📋 Configuration des seeders')
  console.log('=' .repeat(40))
  console.log(`Environnement: ${env}`)
  console.log(`Utilisateurs: ${config.users}`)
  console.log(`Composants gratuits: ${config.freeComponents}`)
  console.log(`Composants premium: ${config.premiumComponents}`)
  console.log(`Catégories: ${config.categories}`)
  console.log(`Sous-catégories: ${config.subcategories}`)
  console.log(`Versions par composant: ${config.versionsPerComponent}`)
}

/**
 * Affiche l'aide
 */
function showHelp() {
  console.log('🔧 Script des seeders Ona UI')
  console.log('=' .repeat(40))
  console.log('Usage:')
  console.log('  npm run seed                    # Exécute tous les seeders')
  console.log('  npm run seed:clean              # Nettoie et re-seed')
  console.log('  npm run seed:verify             # Vérifie l\'intégrité')
  console.log('  npm run seed:config             # Affiche la configuration')
  console.log('  npm run seed:help               # Affiche cette aide')
  console.log('')
  console.log('Seeders spécifiques:')
  console.log('  npm run seed:products           # Seed les produits')
  console.log('  npm run seed:users              # Seed les utilisateurs')
  console.log('  npm run seed:licenses           # Seed les licences')
  console.log('  npm run seed:categories         # Seed les catégories')
  console.log('  npm run seed:subcategories      # Seed les sous-catégories')
  console.log('  npm run seed:components         # Seed les composants')
  console.log('  npm run seed:versions           # Seed les versions')
  console.log('')
  console.log('Variables d\'environnement:')
  console.log('  DB_HOST                         # Host de la base (défaut: localhost)')
  console.log('  DB_PORT                         # Port de la base (défaut: 5432)')
  console.log('  DB_DATABASE                     # Nom de la base (défaut: ona_ui)')
  console.log('  DB_USER                         # Utilisateur (défaut: postgres)')
  console.log('  DB_PASSWORD                     # Mot de passe (défaut: password)')
  console.log('  NODE_ENV                        # Environnement (défaut: development)')
}

/**
 * Point d'entrée principal
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'clean':
      await cleanAndSeed()
      break
    case 'verify':
      await verifyIntegrity()
      break
    case 'config':
      showConfig()
      break
    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break
    case 'products':
    case 'users':
    case 'licenses':
    case 'categories':
    case 'subcategories':
    case 'components':
    case 'versions':
      await runSpecificSeeder(command)
      break
    default:
      if (command && !['all', 'run'].includes(command)) {
        console.log(`❌ Commande inconnue: ${command}`)
        showHelp()
        process.exit(1)
      }
      await runAllSeeders()
      break
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
}

export { main as runSeeders }