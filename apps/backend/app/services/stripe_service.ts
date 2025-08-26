import Stripe from 'stripe'
import { BaseService, ServiceError, ValidationError } from './base_service.js'

/**
 * Interface pour les paramètres de création d'une session de checkout avec Price ID
 */
export interface CreateCheckoutSessionParams {
  priceId: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

/**
 * Interface pour les paramètres de création d'une session de checkout avec Product ID
 */
export interface CreateCheckoutSessionWithProductParams {
  productId: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

/**
 * Interface pour la réponse de création d'une session
 */
export interface CheckoutSessionResponse {
  sessionId: string
  url: string
  expiresAt: number
}

/**
 * Service Stripe pour la gestion des paiements
 * Gère les sessions de checkout et les interactions avec l'API Stripe
 */
export class StripeService extends BaseService {
  private stripe: Stripe

  constructor() {
    super()
    
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new ServiceError(
        'Clé secrète Stripe manquante',
        'STRIPE_CONFIG_ERROR',
        500,
        { missingKey: 'STRIPE_SECRET_KEY' }
      )
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    })

    this.logOperation('StripeService initialized')
  }

  /**
   * Crée une session de checkout Stripe
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
    try {
      this.logOperation('Creating checkout session', { priceId: params.priceId })

      // Validation des paramètres
      this.validateCheckoutParams(params)

      // Configuration de la session
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_creation: 'always',
        billing_address_collection: 'required',
        metadata: params.metadata || {},
      }

      // Ajout de l'email client si fourni
      if (params.customerEmail) {
        sessionConfig.customer_email = params.customerEmail
      }

      // Création de la session
      const session = await this.stripe.checkout.sessions.create(sessionConfig)

      if (!session.id || !session.url) {
        throw new ServiceError(
          'Erreur lors de la création de la session Stripe',
          'STRIPE_SESSION_ERROR',
          500,
          { sessionId: session.id }
        )
      }

      this.logOperation('Checkout session created successfully', { 
        sessionId: session.id,
        expiresAt: session.expires_at 
      })

      return {
        sessionId: session.id,
        url: session.url,
        expiresAt: session.expires_at || 0,
      }

    } catch (error) {
      this.logError('Failed to create checkout session', error as Error, params)
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new ServiceError(
          `Erreur Stripe: ${error.message}`,
          'STRIPE_API_ERROR',
          400,
          { 
            stripeCode: error.code,
            stripeType: error.type,
            requestId: error.requestId 
          }
        )
      }

      throw error
    }
  }

  /**
   * Crée une session de checkout Stripe à partir d'un Product ID
   * Récupère automatiquement le prix actif du produit
   */
  async createCheckoutSessionWithProduct(params: CreateCheckoutSessionWithProductParams): Promise<CheckoutSessionResponse> {
    try {
      this.logOperation('Creating checkout session with product', { productId: params.productId })

      // Validation des paramètres
      this.validateCheckoutWithProductParams(params)

      // Récupération des prix du produit
      const prices = await this.getProductPrices(params.productId)

      // Sélection du prix actif (on prend le premier prix actif trouvé)
      const activePrice = prices.find(price => price.active)
      if (!activePrice) {
        throw new ServiceError(
          `Aucun prix actif trouvé pour le produit ${params.productId}`,
          'NO_ACTIVE_PRICE',
          400,
          { productId: params.productId }
        )
      }

      this.logOperation('Using active price for product', {
        productId: params.productId,
        priceId: activePrice.id,
        amount: activePrice.unit_amount
      })

      // Configuration de la session
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: activePrice.id,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_creation: 'always',
        billing_address_collection: 'required',
        metadata: {
          productId: params.productId,
          priceId: activePrice.id,
          ...params.metadata
        },
      }

      // Ajout de l'email client si fourni
      if (params.customerEmail) {
        sessionConfig.customer_email = params.customerEmail
      }

      // Création de la session
      const session = await this.stripe.checkout.sessions.create(sessionConfig)

      if (!session.id || !session.url) {
        throw new ServiceError(
          'Erreur lors de la création de la session Stripe',
          'STRIPE_SESSION_ERROR',
          500,
          { sessionId: session.id }
        )
      }

      this.logOperation('Checkout session created successfully with product', {
        sessionId: session.id,
        productId: params.productId,
        priceId: activePrice.id,
        expiresAt: session.expires_at
      })

      return {
        sessionId: session.id,
        url: session.url,
        expiresAt: session.expires_at || 0,
      }

    } catch (error) {
      this.logError('Failed to create checkout session with product', error as Error, params)
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new ServiceError(
          `Erreur Stripe: ${error.message}`,
          'STRIPE_API_ERROR',
          400,
          {
            stripeCode: error.code,
            stripeType: error.type,
            requestId: error.requestId
          }
        )
      }

      throw error
    }
  }

  /**
   * Récupère les prix d'un produit Stripe
   */
  async getProductPrices(productId: string): Promise<Stripe.Price[]> {
    try {
      this.logOperation('Retrieving product prices', { productId })

      if (!productId) {
        throw new ValidationError('ID de produit requis')
      }

      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
      })

      this.logOperation('Product prices retrieved successfully', {
        productId,
        priceCount: prices.data.length
      })

      return prices.data

    } catch (error) {
      this.logError('Failed to retrieve product prices', error as Error, { productId })
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new ServiceError(
          `Erreur Stripe: ${error.message}`,
          'STRIPE_API_ERROR',
          400,
          {
            stripeCode: error.code,
            stripeType: error.type,
            requestId: error.requestId
          }
        )
      }

      throw error
    }
  }

  /**
   * Récupère les détails d'une session de checkout
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      this.logOperation('Retrieving checkout session', { sessionId })

      if (!sessionId) {
        throw new ValidationError('ID de session requis')
      }

      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer', 'payment_intent'],
      })

      this.logOperation('Checkout session retrieved successfully', { 
        sessionId,
        status: session.payment_status 
      })

      return session

    } catch (error) {
      this.logError('Failed to retrieve checkout session', error as Error, { sessionId })
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new ServiceError(
          `Erreur Stripe: ${error.message}`,
          'STRIPE_API_ERROR',
          400,
          { 
            stripeCode: error.code,
            stripeType: error.type,
            requestId: error.requestId 
          }
        )
      }

      throw error
    }
  }

  /**
   * Vérifie si une session de checkout est payée
   */
  async isSessionPaid(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getCheckoutSession(sessionId)
      return session.payment_status === 'paid'
    } catch (error) {
      this.logError('Failed to check session payment status', error as Error, { sessionId })
      return false
    }
  }

  /**
   * Récupère les informations d'un produit Stripe
   */
  async getProduct(productId: string): Promise<Stripe.Product> {
    try {
      this.logOperation('Retrieving product', { productId })

      if (!productId) {
        throw new ValidationError('ID de produit requis')
      }

      const _product = await this.stripe.products.retrieve(productId)

      this.logOperation('Product retrieved successfully', {
        productId,
        name: _product.name
      })

      return _product

    } catch (error) {
      this.logError('Failed to retrieve product', error as Error, { productId })
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new ServiceError(
          `Erreur Stripe: ${error.message}`,
          'STRIPE_API_ERROR',
          400,
          { 
            stripeCode: error.code,
            stripeType: error.type,
            requestId: error.requestId 
          }
        )
      }

      throw error
    }
  }

  /**
   * Récupère les informations d'un prix Stripe
   */
  async getPrice(priceId: string): Promise<Stripe.Price> {
    try {
      this.logOperation('Retrieving price', { priceId })

      if (!priceId) {
        throw new ValidationError('ID de prix requis')
      }

      const price = await this.stripe.prices.retrieve(priceId)

      this.logOperation('Price retrieved successfully', { 
        priceId,
        amount: price.unit_amount 
      })

      return price

    } catch (error) {
      this.logError('Failed to retrieve price', error as Error, { priceId })
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new ServiceError(
          `Erreur Stripe: ${error.message}`,
          'STRIPE_API_ERROR',
          400,
          { 
            stripeCode: error.code,
            stripeType: error.type,
            requestId: error.requestId 
          }
        )
      }

      throw error
    }
  }

  /**
   * Valide les paramètres de création d'une session de checkout
   */
  private validateCheckoutParams(params: CreateCheckoutSessionParams): void {
    const requiredFields = ['priceId', 'successUrl', 'cancelUrl']
    this.validateInput(params, requiredFields)

    // Validation de l'email si fourni
    if (params.customerEmail && !this.validateEmail(params.customerEmail)) {
      throw new ValidationError('Format d\'email invalide', { 
        email: params.customerEmail 
      })
    }

    // Validation des URLs
    if (!this.isValidUrl(params.successUrl)) {
      throw new ValidationError('URL de succès invalide', { 
        successUrl: params.successUrl 
      })
    }

    if (!this.isValidUrl(params.cancelUrl)) {
      throw new ValidationError('URL d\'annulation invalide', { 
        cancelUrl: params.cancelUrl 
      })
    }
  }

  /**
   * Valide qu'une chaîne est une URL valide
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Valide les paramètres de création d'une session de checkout avec Product ID
   */
  private validateCheckoutWithProductParams(params: CreateCheckoutSessionWithProductParams): void {
    const requiredFields = ['productId', 'successUrl', 'cancelUrl']
    this.validateInput(params, requiredFields)

    // Validation de l'email si fourni
    if (params.customerEmail && !this.validateEmail(params.customerEmail)) {
      throw new ValidationError('Format d\'email invalide', {
        email: params.customerEmail
      })
    }

    // Validation des URLs
    if (!this.isValidUrl(params.successUrl)) {
      throw new ValidationError('URL de succès invalide', {
        successUrl: params.successUrl
      })
    }

    if (!this.isValidUrl(params.cancelUrl)) {
      throw new ValidationError('URL d\'annulation invalide', {
        cancelUrl: params.cancelUrl
      })
    }
  }

  /**
   * Récupère la clé publique Stripe pour le frontend
   */
  getPublishableKey(): string {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY
    if (!publishableKey) {
      throw new ServiceError(
        'Clé publique Stripe manquante',
        'STRIPE_CONFIG_ERROR',
        500,
        { missingKey: 'STRIPE_PUBLISHABLE_KEY' }
      )
    }
    return publishableKey
  }
}

// Instance singleton du service
export const stripeService = new StripeService()