#!/usr/bin/env node

/**
 * Script de test pour vérifier la syntaxe et la structure des seeders
 * 
 * Ce script teste :
 * - L'importation de tous les seeders
 * - La validation de la structure des classes
 * - La génération de données de test
 * - Les helpers utilitaires
 */

import { 
  SeederHelpers,
  
  ProductSeeder,
  UserSeeder,
  LicenseSeeder,
  CategorySeeder,
  SubcategorySeeder,
  ComponentSeeder,
  ComponentVersionSeeder,
  MainSeeder,
  getSeederConfig
} from './index.js'

/**
 * Tests des helpers
 */
function testHelpers() {
  console.log('🧪 Test des helpers...')
  
  try {
    // Test génération UUID
    const uuid = SeederHelpers.generateUuid()
    console.log(`  ✅ UUID généré: ${uuid}`)
    
    // Test génération slug
    const slug = SeederHelpers.generateSlug('Mon Composant Test')
    console.log(`  ✅ Slug généré: ${slug}`)
    
    // Test génération clé de licence
    const licenseKey = SeederHelpers.generateLicenseKey()
    console.log(`  ✅ Clé de licence: ${licenseKey}`)
    
    // Test génération email
    const email = SeederHelpers.generateTestEmail('test')
    console.log(`  ✅ Email de test: ${email}`)
    
    // Test génération taux de conversion
    const conversionRate = SeederHelpers.generateConversionRate()
    console.log(`  ✅ Taux de conversion: ${conversionRate}%`)
    
    // Test génération tags
    const tags = SeederHelpers.generateComponentTags('navigation')
    console.log(`  ✅ Tags générés: ${tags.join(', ')}`)
    
    // Test génération entreprises
    const companies = SeederHelpers.generateTestedCompanies()
    console.log(`  ✅ Entreprises: ${companies.join(', ')}`)
    
    // Test génération HTML
    const html = SeederHelpers.generateComponentHTML('Test Button', 'forms')
    console.log(`  ✅ HTML généré (${html.length} caractères)`)
    
    // Test génération dépendances
    const deps = SeederHelpers.generateDependencies('react')
    console.log(`  ✅ Dépendances React: ${Object.keys(deps).join(', ')}`)
    
    console.log('  ✅ Tous les helpers fonctionnent correctement')
    
  } catch (error) {
    console.error('  ❌ Erreur dans les helpers:', error)
    return false
  }
  
  return true
}

/**
 * Tests de la configuration
 */
function testConfiguration() {
  console.log('🧪 Test de la configuration...')
  
  try {
    const config = getSeederConfig()
    console.log(`  ✅ Configuration chargée pour l'environnement: ${process.env.NODE_ENV || 'development'}`)
    console.log(`  ✅ Utilisateurs: ${config.users}`)
    console.log(`  ✅ Composants gratuits: ${config.freeComponents}`)
    console.log(`  ✅ Composants premium: ${config.premiumComponents}`)
    console.log(`  ✅ Catégories: ${config.categories}`)
    console.log(`  ✅ Sous-catégories: ${config.subcategories}`)
    
    return true
  } catch (error) {
    console.error('  ❌ Erreur dans la configuration:', error)
    return false
  }
}

/**
 * Tests de structure des classes
 */
function testSeederClasses() {
  console.log('🧪 Test de la structure des classes...')
  
  const seeders = [
    { name: 'ProductSeeder', class: ProductSeeder },
    { name: 'UserSeeder', class: UserSeeder },
    { name: 'LicenseSeeder', class: LicenseSeeder },
    { name: 'CategorySeeder', class: CategorySeeder },
    { name: 'SubcategorySeeder', class: SubcategorySeeder },
    { name: 'ComponentSeeder', class: ComponentSeeder },
    { name: 'ComponentVersionSeeder', class: ComponentVersionSeeder },
    { name: 'MainSeeder', class: MainSeeder }
  ]
  
  try {
    for (const { name, class: SeederClass } of seeders) {
      // Vérifier que la classe existe
      if (typeof SeederClass !== 'function') {
        throw new Error(`${name} n'est pas une classe valide`)
      }
      
      // Vérifier l'héritage de BaseSeeder (sauf MainSeeder qui a sa propre logique)
      if (name !== 'MainSeeder') {
        const prototype = SeederClass.prototype
        if (!prototype || typeof prototype.run !== 'function') {
          throw new Error(`${name} ne possède pas la méthode run()`)
        }
      }
      
      console.log(`  ✅ ${name} - Structure valide`)
    }
    
    console.log('  ✅ Toutes les classes de seeders sont valides')
    return true
    
  } catch (error) {
    console.error('  ❌ Erreur dans la structure des classes:', error)
    return false
  }
}

/**
 * Test de génération de données
 */
async function testDataGeneration() {
  console.log('🧪 Test de génération de données...')
  
  try {
    // Simuler des données globales
    ;(global as any).seederData = {
      productIds: [SeederHelpers.generateUuid()],
      mainProductId: SeederHelpers.generateUuid(),
      userIds: Array.from({ length: 5 }, () => SeederHelpers.generateUuid()),
      categories: {
        'navigation': SeederHelpers.generateUuid(),
        'forms': SeederHelpers.generateUuid(),
        'marketing': SeederHelpers.generateUuid()
      },
      subcategories: {
        'headers': SeederHelpers.generateUuid(),
        'login-forms': SeederHelpers.generateUuid(),
        'hero-sections': SeederHelpers.generateUuid()
      }
    }
    
    console.log('  ✅ Données globales simulées')
    
    // Test génération de mots de passe
    const hashedPassword = await SeederHelpers.hashPassword('test123')
    console.log(`  ✅ Mot de passe hashé (${hashedPassword.length} caractères)`)
    
    // Test génération de dates
    const randomDate = SeederHelpers.randomDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    )
    console.log(`  ✅ Date aléatoire générée: ${randomDate.toISOString()}`)
    
    // Test génération d'intégrations
    const integrations = SeederHelpers.generateIntegrations()
    console.log(`  ✅ Intégrations générées: ${Object.keys(integrations).join(', ')}`)
    
    console.log('  ✅ Génération de données réussie')
    return true
    
  } catch (error) {
    console.error('  ❌ Erreur dans la génération de données:', error)
    return false
  }
}

/**
 * Test de validation des imports
 */
function testImports() {
  console.log('🧪 Test des imports...')
  
  try {
    // Vérifier que tous les exports sont disponibles
    const exports = [
      'SeederHelpers',
      'BaseSeeder',
      'ProductSeeder',
      'UserSeeder',
      'LicenseSeeder',
      'CategorySeeder',
      'SubcategorySeeder',
      'ComponentSeeder',
      'ComponentVersionSeeder',
      'MainSeeder',
      'getSeederConfig'
    ]
    
    for (const exportName of exports) {
      if (eval(exportName) === undefined) {
        throw new Error(`Export manquant: ${exportName}`)
      }
      console.log(`  ✅ ${exportName} importé correctement`)
    }
    
    console.log('  ✅ Tous les imports sont valides')
    return true
    
  } catch (error) {
    console.error('  ❌ Erreur dans les imports:', error)
    return false
  }
}

/**
 * Fonction principale de test
 */
async function runTests() {
  console.log('🚀 Début des tests des seeders Ona UI')
  console.log('=' .repeat(50))
  
  const tests = [
    { name: 'Imports', fn: testImports },
    { name: 'Configuration', fn: testConfiguration },
    { name: 'Helpers', fn: testHelpers },
    { name: 'Classes', fn: testSeederClasses },
    { name: 'Génération de données', fn: testDataGeneration }
  ]
  
  let passedTests = 0
  let totalTests = tests.length
  
  for (const test of tests) {
    console.log(`\n📋 Test: ${test.name}`)
    console.log('-' .repeat(30))
    
    try {
      const result = await test.fn()
      if (result) {
        passedTests++
        console.log(`✅ ${test.name} - RÉUSSI`)
      } else {
        console.log(`❌ ${test.name} - ÉCHOUÉ`)
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERREUR:`, error)
    }
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('📊 Résultats des tests')
  console.log(`✅ Tests réussis: ${passedTests}/${totalTests}`)
  console.log(`❌ Tests échoués: ${totalTests - passedTests}/${totalTests}`)
  
  if (passedTests === totalTests) {
    console.log('🎉 Tous les tests sont passés! Les seeders sont prêts à être utilisés.')
    console.log('\n💡 Prochaines étapes:')
    console.log('1. Configurer la base de données')
    console.log('2. Exécuter: npm run seed')
    console.log('3. Vérifier: npm run seed:verify')
    return true
  } else {
    console.log('⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.')
    return false
  }
}

// Exécuter les tests si ce fichier est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('❌ Erreur fatale lors des tests:', error)
    process.exit(1)
  })
}

export { runTests }