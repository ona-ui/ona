/**
 * Configuration du mapping entre IDs publics et Product IDs Stripe
 * Ce fichier centralise la correspondance entre les identifiants publics simples
 * utilisés côté frontend et les vrais Product IDs Stripe
 */

export interface ProductConfig {
  /** ID public utilisé côté frontend */
  publicId: string
  /** Product ID Stripe réel */
  stripeProductId: string
  /** Nom du produit pour les logs */
  name: string
  /** Description du produit */
  description: string
  /** Prix par défaut en centimes (pour affichage) */
  defaultPrice?: number
  /** Devise */
  currency: string
  /** Métadonnées additionnelles */
  metadata?: Record<string, string>
}

/**
 * Mapping des produits disponibles
 * Ajoutez ici vos nouveaux produits avec leurs Product IDs Stripe
 */
export const PRODUCT_MAPPING: Record<string, ProductConfig> = {
  'pro': {
    publicId: 'pro',
    stripeProductId: process.env.STRIPE_PRODUCT_ID_PRO || 'prod_example_pro',
    name: 'Pro License',
    description: 'Licence professionnelle avec accès complet',
    defaultPrice: 7000,
    currency: 'eur',
    metadata: {
      tier: 'pro',
      lifetime: 'true'
    }
  },
  'team': {
    publicId: 'team',
    stripeProductId: process.env.STRIPE_PRODUCT_ID_TEAM || 'prod_example_team',
    name: 'Team License',
    description: 'Licence équipe pour plusieurs développeurs',
    defaultPrice: 19900, // 199€ en centimes
    currency: 'eur',
    metadata: {
      tier: 'team',
      lifetime: 'true',
      seats: '5'
    }
  },
  'enterprise': {
    publicId: 'enterprise',
    stripeProductId: process.env.STRIPE_PRODUCT_ID_ENTERPRISE || 'prod_example_enterprise',
    name: 'Enterprise License',
    description: 'Licence entreprise avec support prioritaire',
    defaultPrice: 49900, // 499€ en centimes
    currency: 'eur',
    metadata: {
      tier: 'enterprise',
      lifetime: 'true',
      seats: 'unlimited',
      support: 'priority'
    }
  }
}

/**
 * Récupère la configuration d'un produit par son ID public
 */
export function getProductConfig(publicId: string): ProductConfig | null {
  return PRODUCT_MAPPING[publicId] || null
}

/**
 * Récupère le Product ID Stripe à partir d'un ID public
 */
export function getStripeProductId(publicId: string): string | null {
  const config = getProductConfig(publicId)
  return config ? config.stripeProductId : null
}

/**
 * Valide qu'un ID public existe dans le mapping
 */
export function isValidPublicId(publicId: string): boolean {
  return publicId in PRODUCT_MAPPING
}

/**
 * Récupère tous les IDs publics disponibles
 */
export function getAvailablePublicIds(): string[] {
  return Object.keys(PRODUCT_MAPPING)
}

/**
 * Récupère toutes les configurations de produits
 */
export function getAllProductConfigs(): ProductConfig[] {
  return Object.values(PRODUCT_MAPPING)
}