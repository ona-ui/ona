import { BaseSeeder } from './base_seeder.js'
import { components } from '../../app/db/schema.js'

/**
 * Seeder pour les composants
 */
export class ComponentSeeder extends BaseSeeder {
  async run(): Promise<void> {
    this.log('Début du seeding des composants...')

    try {
      // Récupérer les données des seeders précédents
      const seederData = (global as any).seederData
      if (!seederData?.subcategories) {
        throw new Error('Les sous-catégories doivent être créées avant les composants')
      }

      // Vérifier si des composants existent déjà
      const existingComponents = await this.checkExistingData(components)
      
      if (existingComponents) {
        this.log('Des composants existent déjà, nettoyage...')
        await this.truncateTable(components, 'components')
      }

      // Composants gratuits (30 composants open-source)
      const freeComponents = this.generateFreeComponents(seederData.subcategories)
      
      // Composants premium (200+ sections premium)
      const premiumComponents = this.generatePremiumComponents(seederData.subcategories)

      // Combiner tous les composants
      const allComponents = [...freeComponents, ...premiumComponents]

      // Insertion des composants par lots
      await this.batchInsert(components, allComponents, 50, 'components')

      this.log(`✅ ${allComponents.length} composants créés avec succès`)
      this.log(`  - ${freeComponents.length} composants gratuits`)
      this.log(`  - ${premiumComponents.length} composants premium`)

      // Stocker les IDs pour les autres seeders
      ;(global as any).seederData.componentIds = allComponents.map(c => c.id)
      ;(global as any).seederData.freeComponentIds = freeComponents.map(c => c.id)
      ;(global as any).seederData.premiumComponentIds = premiumComponents.map(c => c.id)

      this.log('IDs des composants stockés pour les autres seeders')

    } catch (error) {
      this.handleError(error, 'run()')
    }
  }

  /**
   * Génère les composants gratuits
   */
  private generateFreeComponents(subcategories: Record<string, string>) {
    const freeComponents = [
      // Navigation - Headers
      {
        id: this.helpers.generateUuid(),
        subcategoryId: subcategories['headers'],
        name: 'Simple Header',
        slug: 'simple-header',
        description: 'En-tête simple avec logo et navigation principale',
        isFree: true,
        requiredTier: 'free' as const,
        accessType: 'full_access' as const,
        status: 'published' as const,
        isNew: false,
        isFeatured: true,
        conversionRate: this.helpers.generateConversionRate(),
        testedCompanies: this.helpers.generateTestedCompanies(),
        previewImageLarge: '/images/components/simple-header-large.jpg',
        previewImageSmall: '/images/components/simple-header-small.jpg',
        tags: this.helpers.generateComponentTags('navigation'),
        sortOrder: 1,
        viewCount: this.helpers.randomInt(500, 2000),
        copyCount: this.helpers.randomInt(100, 500),
        publishedAt: this.generatePublishedAt(),
        ...this.generateTimestamps()
      },

      // Navigation - Menus
      {
        id: this.helpers.generateUuid(),
        subcategoryId: subcategories['menus'],
        name: 'Dropdown Menu',
        slug: 'dropdown-menu',
        description: 'Menu déroulant responsive avec sous-menus',
        isFree: true,
        requiredTier: 'free' as const,
        accessType: 'full_access' as const,
        status: 'published' as const,
        isNew: false,
        isFeatured: false,
        conversionRate: this.helpers.generateConversionRate(),
        testedCompanies: this.helpers.generateTestedCompanies(),
        previewImageLarge: '/images/components/dropdown-menu-large.jpg',
        previewImageSmall: '/images/components/dropdown-menu-small.jpg',
        tags: this.helpers.generateComponentTags('navigation'),
        sortOrder: 2,
        viewCount: this.helpers.randomInt(300, 1500),
        copyCount: this.helpers.randomInt(80, 300),
        publishedAt: this.generatePublishedAt(),
        ...this.generateTimestamps()
      },

      // Forms - Login
      {
        id: this.helpers.generateUuid(),
        subcategoryId: subcategories['login-forms'],
        name: 'Basic Login Form',
        slug: 'basic-login-form',
        description: 'Formulaire de connexion simple et efficace',
        isFree: true,
        requiredTier: 'free' as const,
        accessType: 'full_access' as const,
        status: 'published' as const,
        isNew: false,
        isFeatured: true,
        conversionRate: this.helpers.generateConversionRate(),
        testedCompanies: this.helpers.generateTestedCompanies(),
        previewImageLarge: '/images/components/basic-login-form-large.jpg',
        previewImageSmall: '/images/components/basic-login-form-small.jpg',
        tags: this.helpers.generateComponentTags('forms'),
        sortOrder: 3,
        viewCount: this.helpers.randomInt(800, 3000),
        copyCount: this.helpers.randomInt(200, 800),
        publishedAt: this.generatePublishedAt(),
        ...this.generateTimestamps()
      },

      // Forms - Contact
      {
        id: this.helpers.generateUuid(),
        subcategoryId: subcategories['contact-forms'],
        name: 'Contact Form',
        slug: 'contact-form',
        description: 'Formulaire de contact avec validation',
        isFree: true,
        requiredTier: 'free' as const,
        accessType: 'full_access' as const,
        status: 'published' as const,
        isNew: false,
        isFeatured: false,
        conversionRate: this.helpers.generateConversionRate(),
        testedCompanies: this.helpers.generateTestedCompanies(),
        previewImageLarge: '/images/components/contact-form-large.jpg',
        previewImageSmall: '/images/components/contact-form-small.jpg',
        tags: this.helpers.generateComponentTags('forms'),
        sortOrder: 4,
        viewCount: this.helpers.randomInt(600, 2500),
        copyCount: this.helpers.randomInt(150, 600),
        publishedAt: this.generatePublishedAt(),
        ...this.generateTimestamps()
      },

      // Layout - Grid
      {
        id: this.helpers.generateUuid(),
        subcategoryId: subcategories['grid-systems'],
        name: 'Responsive Grid',
        slug: 'responsive-grid',
        description: 'Système de grille responsive 12 colonnes',
        isFree: true,
        requiredTier: 'free' as const,
        accessType: 'full_access' as const,
        status: 'published' as const,
        isNew: false,
        isFeatured: false,
        conversionRate: this.helpers.generateConversionRate(),
        testedCompanies: this.helpers.generateTestedCompanies(),
        previewImageLarge: '/images/components/responsive-grid-large.jpg',
        previewImageSmall: '/images/components/responsive-grid-small.jpg',
        tags: this.helpers.generateComponentTags('layout'),
        sortOrder: 5,
        viewCount: this.helpers.randomInt(400, 1800),
        copyCount: this.helpers.randomInt(100, 400),
        publishedAt: this.generatePublishedAt(),
        ...this.generateTimestamps()
      },

      // Marketing - Hero
      {
        id: this.helpers.generateUuid(),
        subcategoryId: subcategories['hero-sections'],
        name: 'Simple Hero',
        slug: 'simple-hero',
        description: 'Section hero minimaliste avec CTA',
        isFree: true,
        requiredTier: 'free' as const,
        accessType: 'full_access' as const,
        status: 'published' as const,
        isNew: true,
        isFeatured: true,
        conversionRate: this.helpers.generateConversionRate(),
        testedCompanies: this.helpers.generateTestedCompanies(),
        previewImageLarge: '/images/components/simple-hero-large.jpg',
        previewImageSmall: '/images/components/simple-hero-small.jpg',
        tags: this.helpers.generateComponentTags('marketing'),
        sortOrder: 6,
        viewCount: this.helpers.randomInt(1000, 4000),
        copyCount: this.helpers.randomInt(300, 1000),
        publishedAt: this.generatePublishedAt(),
        ...this.generateTimestamps()
      },

      // Data Display - Cards
      {
        id: this.helpers.generateUuid(),
        subcategoryId: subcategories['cards'],
        name: 'Basic Card',
        slug: 'basic-card',
        description: 'Carte d\'information basique avec image',
        isFree: true,
        requiredTier: 'free' as const,
        accessType: 'full_access' as const,
        status: 'published' as const,
        isNew: false,
        isFeatured: false,
        conversionRate: this.helpers.generateConversionRate(),
        testedCompanies: this.helpers.generateTestedCompanies(),
        previewImageLarge: '/images/components/basic-card-large.jpg',
        previewImageSmall: '/images/components/basic-card-small.jpg',
        tags: this.helpers.generateComponentTags('data-display'),
        sortOrder: 7,
        viewCount: this.helpers.randomInt(700, 2800),
        copyCount: this.helpers.randomInt(180, 700),
        publishedAt: this.generatePublishedAt(),
        ...this.generateTimestamps()
      }
    ]

    // Générer plus de composants gratuits pour atteindre 30
    const additionalFreeComponents = this.generateAdditionalFreeComponents(subcategories, 23)
    
    return [...freeComponents, ...additionalFreeComponents]
  }

  /**
   * Génère des composants gratuits supplémentaires
   */
  private generateAdditionalFreeComponents(subcategories: Record<string, string>, count: number) {
    const components = []
    const subcategoryKeys = Object.keys(subcategories)
    
    for (let i = 0; i < count; i++) {
      const subcategoryKey = this.helpers.randomChoice(subcategoryKeys)
      const subcategoryId = subcategories[subcategoryKey]
      
      components.push({
        id: this.helpers.generateUuid(),
        subcategoryId,
        name: `Free ${subcategoryKey.replace('-', ' ')} ${i + 8}`,
        slug: `free-${subcategoryKey}-${i + 8}`,
        description: `Composant gratuit pour ${subcategoryKey.replace('-', ' ')}`,
        isFree: true,
        requiredTier: 'free' as const,
        accessType: 'full_access' as const,
        status: 'published' as const,
        isNew: this.helpers.randomInt(1, 10) <= 2, // 20% de chance d'être nouveau
        isFeatured: this.helpers.randomInt(1, 10) <= 1, // 10% de chance d'être featured
        conversionRate: this.helpers.generateConversionRate(),
        testedCompanies: this.helpers.generateTestedCompanies(),
        previewImageLarge: `/images/components/free-${subcategoryKey}-${i + 8}-large.jpg`,
        previewImageSmall: `/images/components/free-${subcategoryKey}-${i + 8}-small.jpg`,
        tags: this.helpers.generateComponentTags(subcategoryKey),
        sortOrder: i + 8,
        viewCount: this.helpers.randomInt(100, 2000),
        copyCount: this.helpers.randomInt(20, 500),
        publishedAt: this.generatePublishedAt(),
        ...this.generateTimestamps()
      })
    }
    
    return components
  }

  /**
   * Génère les composants premium
   */
  private generatePremiumComponents(subcategories: Record<string, string>) {
    const premiumComponents = []
    const subcategoryKeys = Object.keys(subcategories)
    const tiers = ['pro', 'team', 'enterprise']
    const accessTypes = ['preview_only', 'copy', 'full_access', 'download']
    
    // Générer 200+ composants premium
    for (let i = 0; i < 220; i++) {
      const subcategoryKey = this.helpers.randomChoice(subcategoryKeys)
      const subcategoryId = subcategories[subcategoryKey]
      const tier = this.helpers.randomChoice(tiers) as 'pro' | 'team' | 'enterprise'
      const accessType = this.helpers.randomChoice(accessTypes) as 'preview_only' | 'copy' | 'full_access' | 'download'
      
      premiumComponents.push({
        id: this.helpers.generateUuid(),
        subcategoryId,
        name: `Premium ${subcategoryKey.replace('-', ' ')} ${i + 1}`,
        slug: `premium-${subcategoryKey}-${i + 1}`,
        description: `Composant premium haute conversion pour ${subcategoryKey.replace('-', ' ')} - Extrait de startups à succès`,
        isFree: false,
        requiredTier: tier,
        accessType,
        status: this.helpers.randomChoice(['published', 'published', 'published', 'draft']) as 'published' | 'draft', // 75% published
        isNew: this.helpers.randomInt(1, 10) <= 3, // 30% de chance d'être nouveau
        isFeatured: this.helpers.randomInt(1, 10) <= 2, // 20% de chance d'être featured
        conversionRate: this.helpers.generateConversionRate(),
        testedCompanies: this.helpers.generateTestedCompanies(),
        previewImageLarge: `/images/components/premium-${subcategoryKey}-${i + 1}-large.jpg`,
        previewImageSmall: `/images/components/premium-${subcategoryKey}-${i + 1}-small.jpg`,
        previewVideoUrl: this.helpers.randomInt(1, 10) <= 3 ? `/videos/components/premium-${subcategoryKey}-${i + 1}.mp4` : null,
        tags: this.helpers.generateComponentTags(subcategoryKey),
        sortOrder: i + 100,
        viewCount: this.helpers.randomInt(50, 5000),
        copyCount: this.helpers.randomInt(10, 1500),
        publishedAt: this.generatePublishedAt(),
        ...this.generateTimestamps()
      })
    }
    
    return premiumComponents
  }
}