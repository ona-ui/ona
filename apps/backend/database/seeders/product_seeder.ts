import { BaseSeeder } from './base_seeder.js'
import { products } from '../../app/db/schema.js'

/**
 * Seeder pour les produits
 */
export class ProductSeeder extends BaseSeeder {
  async run(): Promise<void> {
    this.log('Début du seeding des produits...')

    try {
      // Vérifier si des produits existent déjà
      const existingProducts = await this.checkExistingData(products)
      
      if (existingProducts) {
        this.log('Des produits existent déjà, nettoyage...')
        await this.truncateTable(products, 'products')
      }

      // Données des produits
      const productData = [
        {
          id: this.helpers.generateUuid(),
          name: 'Ona UI Components',
          slug: 'ona-ui-components',
          description: 'Collection premium de composants UI extraits de startups à succès avec des taux de conversion élevés',
          sortOrder: 1,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          name: 'Ona Templates',
          slug: 'ona-templates',
          description: 'Templates complets de landing pages et applications web optimisés pour la conversion',
          sortOrder: 2,
          isActive: true,
          ...this.generateTimestamps()
        },
        {
          id: this.helpers.generateUuid(),
          name: 'Ona Blocks',
          slug: 'ona-blocks',
          description: 'Blocs de contenu réutilisables pour construire rapidement des interfaces modernes',
          sortOrder: 3,
          isActive: true,
          ...this.generateTimestamps()
        }
      ]

      // Insertion des produits
      await this.batchInsert(products, productData, 10, 'products')

      this.log(`✅ ${productData.length} produits créés avec succès`)

      // Stocker les IDs pour les autres seeders
      ;(global as any).seederData = (global as any).seederData || {}
      ;(global as any).seederData.productIds = productData.map(p => p.id)
      ;(global as any).seederData.mainProductId = productData[0].id // Ona UI Components

    } catch (error) {
      this.handleError(error, 'run()')
    }
  }
}