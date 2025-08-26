import { BaseSeeder } from './base_seeder.js'
import { subcategories } from '../../app/db/schema.js'

/**
 * Seeder pour les sous-catégories
 */
export class SubcategorySeeder extends BaseSeeder {
  async run(): Promise<void> {
    this.log('Début du seeding des sous-catégories...')

    try {
      // Récupérer les IDs des catégories
      const seederData = (global as any).seederData
      if (!seederData?.categories) {
        throw new Error('Les catégories doivent être créées avant les sous-catégories')
      }

      // Vérifier si des sous-catégories existent déjà
      const existingSubcategories = await this.checkExistingData(subcategories)
      
      if (existingSubcategories) {
        this.log('Des sous-catégories existent déjà, nettoyage...')
        await this.truncateTable(subcategories, 'subcategories')
      }

      // Données des sous-catégories organisées par catégorie
      const subcategoryData = [
        // Navigation
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.navigation,
          name: 'Headers',
          slug: 'headers',
          description: 'En-têtes de site web avec navigation principale',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.navigation,
          name: 'Footers',
          slug: 'footers',
          description: 'Pieds de page avec liens et informations',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.navigation,
          name: 'Menus',
          slug: 'menus',
          description: 'Menus de navigation et dropdowns',
          sortOrder: 3,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.navigation,
          name: 'Sidebars',
          slug: 'sidebars',
          description: 'Barres latérales de navigation',
          sortOrder: 4,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.navigation,
          name: 'Breadcrumbs',
          slug: 'breadcrumbs',
          description: 'Fils d\'Ariane pour la navigation',
          sortOrder: 5,
          isActive: true,
          ...this.generateTimestamps()
        },

        // Forms
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.forms,
          name: 'Login Forms',
          slug: 'login-forms',
          description: 'Formulaires de connexion optimisés',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.forms,
          name: 'Contact Forms',
          slug: 'contact-forms',
          description: 'Formulaires de contact haute conversion',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.forms,
          name: 'Newsletter',
          slug: 'newsletter',
          description: 'Formulaires d\'inscription newsletter',
          sortOrder: 3,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.forms,
          name: 'Registration',
          slug: 'registration',
          description: 'Formulaires d\'inscription utilisateur',
          sortOrder: 4,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.forms,
          name: 'Search Forms',
          slug: 'search-forms',
          description: 'Formulaires de recherche avancée',
          sortOrder: 5,
          isActive: true,
          ...this.generateTimestamps()
        },

        // Layout
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.layout,
          name: 'Grid Systems',
          slug: 'grid-systems',
          description: 'Systèmes de grilles responsives',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.layout,
          name: 'Containers',
          slug: 'containers',
          description: 'Conteneurs et wrappers',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.layout,
          name: 'Sections',
          slug: 'sections',
          description: 'Sections de page structurées',
          sortOrder: 3,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.layout,
          name: 'Columns',
          slug: 'columns',
          description: 'Layouts en colonnes',
          sortOrder: 4,
          isActive: true,
          ...this.generateTimestamps()
        },

        // E-commerce
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.ecommerce,
          name: 'Product Cards',
          slug: 'product-cards',
          description: 'Cartes produit optimisées',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.ecommerce,
          name: 'Shopping Cart',
          slug: 'shopping-cart',
          description: 'Paniers d\'achat et mini-cart',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.ecommerce,
          name: 'Pricing Tables',
          slug: 'pricing-tables',
          description: 'Tableaux de prix convertissants',
          sortOrder: 3,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.ecommerce,
          name: 'Checkout',
          slug: 'checkout',
          description: 'Processus de commande optimisé',
          sortOrder: 4,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.ecommerce,
          name: 'Product Filters',
          slug: 'product-filters',
          description: 'Filtres et tri de produits',
          sortOrder: 5,
          isActive: true,
          ...this.generateTimestamps()
        },

        // Marketing
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.marketing,
          name: 'Hero Sections',
          slug: 'hero-sections',
          description: 'Sections hero haute conversion',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.marketing,
          name: 'Call to Action',
          slug: 'call-to-action',
          description: 'Boutons et sections CTA',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.marketing,
          name: 'Testimonials',
          slug: 'testimonials',
          description: 'Témoignages clients et avis',
          sortOrder: 3,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.marketing,
          name: 'Features',
          slug: 'features',
          description: 'Sections de fonctionnalités',
          sortOrder: 4,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.marketing,
          name: 'Stats',
          slug: 'stats',
          description: 'Statistiques et métriques',
          sortOrder: 5,
          isActive: true,
          ...this.generateTimestamps()
        },

        // Content
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.content,
          name: 'Blog Posts',
          slug: 'blog-posts',
          description: 'Articles de blog et contenu',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.content,
          name: 'Media Gallery',
          slug: 'media-gallery',
          description: 'Galeries d\'images et médias',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.content,
          name: 'Text Blocks',
          slug: 'text-blocks',
          description: 'Blocs de texte formatés',
          sortOrder: 3,
          isActive: true,
          ...this.generateTimestamps()
        },

        // Dashboard
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.dashboard,
          name: 'Charts',
          slug: 'charts',
          description: 'Graphiques et visualisations',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.dashboard,
          name: 'Data Tables',
          slug: 'data-tables',
          description: 'Tableaux de données avancés',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.dashboard,
          name: 'Widgets',
          slug: 'widgets',
          description: 'Widgets de tableau de bord',
          sortOrder: 3,
          isActive: true,
          ...this.generateTimestamps()
        },

        // Authentication
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.authentication,
          name: 'Login Pages',
          slug: 'login-pages',
          description: 'Pages de connexion complètes',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.authentication,
          name: 'User Profiles',
          slug: 'user-profiles',
          description: 'Profils utilisateur et paramètres',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },

        // Feedback
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.feedback,
          name: 'Notifications',
          slug: 'notifications',
          description: 'Notifications et alertes',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.feedback,
          name: 'Modals',
          slug: 'modals',
          description: 'Fenêtres modales et popups',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },

        // Data Display
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories['data-display'],
          name: 'Cards',
          slug: 'cards',
          description: 'Cartes d\'information',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories['data-display'],
          name: 'Lists',
          slug: 'lists',
          description: 'Listes et éléments de liste',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },

        // Interactive
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.interactive,
          name: 'Tabs',
          slug: 'tabs',
          description: 'Onglets et navigation par onglets',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.interactive,
          name: 'Accordions',
          slug: 'accordions',
          description: 'Accordéons et contenus pliables',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },

        // Social
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.social,
          name: 'Social Share',
          slug: 'social-share',
          description: 'Boutons de partage social',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          categoryId: seederData.categories.social,
          name: 'Comments',
          slug: 'comments',
          description: 'Systèmes de commentaires',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        }
      ]

      // Insertion des sous-catégories
      await this.batchInsert(subcategories, subcategoryData, 20, 'subcategories')

      this.log(`✅ ${subcategoryData.length} sous-catégories créées avec succès`)

      // Stocker les IDs pour les autres seeders
      ;(global as any).seederData.subcategoryIds = subcategoryData.map(sc => sc.id)
      ;(global as any).seederData.subcategories = subcategoryData.reduce((acc, subcat) => {
        acc[subcat.slug] = subcat.id
        return acc
      }, {} as Record<string, string>)

      this.log('IDs des sous-catégories stockés pour les autres seeders')

      // Log du nombre de sous-catégories par catégorie
      const countByCategory = subcategoryData.reduce((acc, subcat) => {
        const categoryName = Object.keys(seederData.categories).find(
          key => seederData.categories[key] === subcat.categoryId
        )
        acc[categoryName || 'unknown'] = (acc[categoryName || 'unknown'] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      Object.entries(countByCategory).forEach(([category, count]) => {
        this.log(`  - ${category}: ${count} sous-catégories`)
      })

    } catch (error) {
      this.handleError(error, 'run()')
    }
  }
}