import { BaseSeeder } from './base_seeder.js'
import { categories } from '../../app/db/schema.js'

/**
 * Seeder pour les catégories principales
 */
export class CategorySeeder extends BaseSeeder {
  async run(): Promise<void> {
    this.log('Début du seeding des catégories...')

    try {
      // Récupérer l'ID du produit principal
      const seederData = (global as any).seederData
      if (!seederData?.mainProductId) {
        throw new Error('Les produits doivent être créés avant les catégories')
      }

      // Vérifier si des catégories existent déjà
      const existingCategories = await this.checkExistingData(categories)
      
      if (existingCategories) {
        this.log('Des catégories existent déjà, nettoyage...')
        await this.truncateTable(categories, 'categories')
      }

      // Données des catégories principales
      const categoryData = [
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Navigation',
          slug: 'navigation',
          description: 'Composants de navigation : headers, menus, sidebars, breadcrumbs et barres de navigation optimisés pour la conversion',
          iconName: 'navigation',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Forms',
          slug: 'forms',
          description: 'Formulaires haute conversion : login, contact, newsletter, checkout et validation avancée',
          iconName: 'forms',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Layout',
          slug: 'layout',
          description: 'Structures de mise en page : grids, containers, sections et wrappers responsifs',
          iconName: 'layout',
          sortOrder: 3,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'E-commerce',
          slug: 'ecommerce',
          description: 'Composants e-commerce : produits, panier, pricing, checkout et paiement optimisés',
          iconName: 'shopping-cart',
          sortOrder: 4,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Marketing',
          slug: 'marketing',
          description: 'Sections marketing : hero, CTA, testimonials, pricing et landing pages haute conversion',
          iconName: 'megaphone',
          sortOrder: 5,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Content',
          slug: 'content',
          description: 'Composants de contenu : articles, blogs, galleries, médias et présentations',
          iconName: 'document-text',
          sortOrder: 6,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Dashboard',
          slug: 'dashboard',
          description: 'Composants d\'interface admin : tableaux, graphiques, statistiques et contrôles',
          iconName: 'chart-bar',
          sortOrder: 7,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Authentication',
          slug: 'authentication',
          description: 'Composants d\'authentification : login, register, forgot password et profils utilisateur',
          iconName: 'lock-closed',
          sortOrder: 8,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Feedback',
          slug: 'feedback',
          description: 'Composants de feedback : notifications, alerts, modals, tooltips et messages',
          iconName: 'chat-bubble-left',
          sortOrder: 9,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Data Display',
          slug: 'data-display',
          description: 'Affichage de données : tables, listes, cards, badges et indicateurs',
          iconName: 'table-cells',
          sortOrder: 10,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Interactive',
          slug: 'interactive',
          description: 'Composants interactifs : sliders, tabs, accordions, dropdowns et animations',
          iconName: 'cursor-arrow-rays',
          sortOrder: 11,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          productId: seederData.mainProductId,
          name: 'Social',
          slug: 'social',
          description: 'Composants sociaux : partage, commentaires, profils et intégrations réseaux sociaux',
          iconName: 'share',
          sortOrder: 12,
          isActive: true,
          ...this.generateTimestamps()
        }
      ]

      // Insertion des catégories
      await this.batchInsert(categories, categoryData, 10, 'categories')

      this.log(`✅ ${categoryData.length} catégories créées avec succès`)

      // Stocker les IDs pour les autres seeders
      ;(global as any).seederData.categoryIds = categoryData.map(c => c.id)
      ;(global as any).seederData.categories = categoryData.reduce((acc, cat) => {
        acc[cat.slug] = cat.id
        return acc
      }, {} as Record<string, string>)

      this.log('IDs des catégories stockés pour les autres seeders')

      // Log des catégories créées
      categoryData.forEach(cat => {
        this.log(`  - ${cat.name} (${cat.slug})`)
      })

    } catch (error) {
      this.handleError(error, 'run()')
    }
  }
}