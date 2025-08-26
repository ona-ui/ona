import type { HttpContext } from '@adonisjs/core/http'
import BasePublicController from './base_public_controller.js'
import { stripeService } from '#services/stripe_service'
import { getProductConfig, getStripeProductId, isValidPublicId } from '../../config/product_mapping.js'
import vine from '@vinejs/vine'
import { optionalStripeUrlSchema } from '../../validators/common_validators.js'

/**
 * Schéma de validation pour la création d'une session de checkout avec Price ID (legacy)
 */
const createCheckoutSessionSchema = vine.object({
  priceId: vine.string().trim().minLength(1),
  customerEmail: vine.string().email().optional(),
  successUrl: optionalStripeUrlSchema,
  cancelUrl: optionalStripeUrlSchema,
  metadata: vine.object({}).optional(),
})

/**
 * Schéma de validation pour la création d'une session de checkout avec ID public
 */
const createCheckoutSessionWithPublicIdSchema = vine.object({
  publicId: vine.string().trim().minLength(1),
  customerEmail: vine.string().email().optional(),
  successUrl: optionalStripeUrlSchema,
  cancelUrl: optionalStripeUrlSchema,
  metadata: vine.object({}).optional(),
})

/**
 * Schéma de validation pour récupérer une session
 */
const getSessionSchema = vine.object({
  sessionId: vine.string().trim().minLength(1),
})

/**
 * Contrôleur de paiement pour la gestion des sessions Stripe
 * Gère la création de sessions de checkout et la récupération d'informations de paiement
 */
export default class PaymentController extends BasePublicController {
  
  /**
   * Crée une session de checkout Stripe avec ID public
   * POST /api/public/payment/create-checkout-session
   */
  async createCheckoutSession({ request, response }: HttpContext) {
    try {
      const requestBody = request.body()

      // Détection du type de requête (legacy avec priceId ou nouveau avec publicId)
      if (requestBody.publicId) {
        return this.createCheckoutSessionWithPublicId({ request, response } as HttpContext)
      } else if (requestBody.priceId) {
        return this.createCheckoutSessionLegacy({ request, response } as HttpContext)
      } else {
        return this.validationError(
          { request, response } as HttpContext,
          {
            publicId: ['ID public requis'],
            priceId: ['Ou ID de prix requis pour compatibilité legacy']
          }
        )
      }

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Crée une session de checkout Stripe avec ID public
   * Nouvelle méthode utilisant le système de mapping
   */
  private async createCheckoutSessionWithPublicId(context: HttpContext) {
    const { request, response } = context
    try {
      // Validation des données d'entrée
      const payload = await vine.validate({
        schema: createCheckoutSessionWithPublicIdSchema,
        data: request.body(),
      })

      // Validation de l'ID public
      if (!isValidPublicId(payload.publicId)) {
        return this.validationError(
          { request, response } as HttpContext,
          { publicId: [`ID public invalide: ${payload.publicId}`] }
        )
      }

      // Récupération de la configuration du produit
      const productConfig = getProductConfig(payload.publicId)!
      const stripeProductId = getStripeProductId(payload.publicId)!

      // URLs par défaut si non fournies
      const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
      const successUrl = payload.successUrl || `${baseUrl}/payment/success`
      const cancelUrl = payload.cancelUrl || `${baseUrl}/payment/cancel`

      this.logPublicAction(
        context,
        'create_checkout_session_with_public_id',
        'payment',
        payload.publicId,
        {
          publicId: payload.publicId,
          stripeProductId,
          productName: productConfig.name,
          hasEmail: !!payload.customerEmail
        }
      )

      // Création de la session via le service Stripe avec Product ID
      const session = await stripeService.createCheckoutSessionWithProduct({
        productId: stripeProductId,
        customerEmail: payload.customerEmail,
        successUrl,
        cancelUrl,
        metadata: {
          source: 'ona-ui-website',
          publicId: payload.publicId,
          productName: productConfig.name,
          tier: productConfig.metadata?.tier || 'unknown',
          ...payload.metadata,
        },
      })

      return this.success(
        context,
        {
          sessionId: session.sessionId,
          url: session.url,
          expiresAt: session.expiresAt,
          productInfo: {
            publicId: payload.publicId,
            name: productConfig.name,
            description: productConfig.description,
          }
        },
        'Session de checkout créée avec succès',
        201
      )

    } catch (error) {
      return this.handleError(context, error)
    }
  }

  /**
   * Crée une session de checkout Stripe (méthode legacy avec Price ID)
   * Maintenue pour compatibilité descendante
   */
  private async createCheckoutSessionLegacy(context: HttpContext) {
    const { request } = context
    try {
      // Validation des données d'entrée
      const payload = await vine.validate({
        schema: createCheckoutSessionSchema,
        data: request.body(),
      })
      
      // URLs par défaut si non fournies
      const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
      const successUrl = payload.successUrl || `${baseUrl}/payment/success`
      const cancelUrl = payload.cancelUrl || `${baseUrl}/payment/cancel`

      this.logPublicAction(
        context,
        'create_checkout_session_legacy',
        'payment',
        payload.priceId,
        {
          priceId: payload.priceId,
          hasEmail: !!payload.customerEmail,
          legacy: true
        }
      )

      // Création de la session via le service Stripe (méthode legacy)
      const session = await stripeService.createCheckoutSession({
        priceId: payload.priceId,
        customerEmail: payload.customerEmail,
        successUrl,
        cancelUrl,
        metadata: {
          source: 'ona-ui-website-legacy',
          ...payload.metadata,
        },
      })

      return this.success(
        context,
        {
          sessionId: session.sessionId,
          url: session.url,
          expiresAt: session.expiresAt,
        },
        'Session de checkout créée avec succès (legacy)',
        201
      )

    } catch (error) {
      return this.handleError(context, error)
    }
  }

  /**
   * Récupère les détails d'une session de checkout
   * GET /api/public/payment/session/:sessionId
   */
  async getSession({ request, response, params }: HttpContext) {
    try {
      // Validation de l'ID de session
      const { sessionId } = await vine.validate({
        schema: getSessionSchema,
        data: { sessionId: params.sessionId },
      })

      this.logPublicAction(
        { request, response } as HttpContext,
        'get_session',
        'payment',
        sessionId
      )

      // Récupération de la session via le service Stripe
      const session = await stripeService.getCheckoutSession(sessionId)

      // Données publiques de la session (sans informations sensibles)
      const publicSessionData = {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total,
        currency: session.currency,
        createdAt: session.created,
        expiresAt: session.expires_at,
        metadata: session.metadata,
      }

      return this.success(
        { request, response } as HttpContext,
        publicSessionData,
        'Détails de la session récupérés avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Vérifie le statut de paiement d'une session
   * GET /api/public/payment/session/:sessionId/status
   */
  async getSessionStatus({ request, response, params }: HttpContext) {
    try {
      // Validation de l'ID de session
      const { sessionId } = await vine.validate({
        schema: getSessionSchema,
        data: { sessionId: params.sessionId },
      })

      this.logPublicAction(
        { request, response } as HttpContext,
        'get_session_status',
        'payment',
        sessionId
      )

      // Vérification du statut de paiement
      const isPaid = await stripeService.isSessionPaid(sessionId)
      const session = await stripeService.getCheckoutSession(sessionId)

      return this.success(
        { request, response } as HttpContext,
        {
          sessionId,
          isPaid,
          paymentStatus: session.payment_status,
          status: session.status,
        },
        'Statut de paiement récupéré avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Vérifie le paiement et retourne les informations pour la page de succès
   * GET /api/public/payment/verify?session_id=:sessionId
   */
  async verifyPayment({ request, response }: HttpContext) {
    try {
      const sessionId = request.qs().session_id

      if (!sessionId) {
        return this.validationError(
          { request, response } as HttpContext,
          { session_id: ['ID de session requis'] }
        )
      }

      // Validation de l'ID de session
      const { sessionId: validatedSessionId } = await vine.validate({
        schema: getSessionSchema,
        data: { sessionId },
      })

      this.logPublicAction(
        { request, response } as HttpContext,
        'verify_payment',
        'payment',
        validatedSessionId
      )

      // Récupération de la session et vérification du paiement
      const session = await stripeService.getCheckoutSession(validatedSessionId)
      const isPaid = await stripeService.isSessionPaid(validatedSessionId)

      // Si le paiement n'est pas réussi
      if (!isPaid || session.payment_status !== 'paid') {
        return this.success(
          { request, response } as HttpContext,
          {
            verified: false,
            status: 'payment_not_completed',
            paymentStatus: session.payment_status,
            sessionStatus: session.status,
          },
          'Paiement non confirmé'
        )
      }

      // Paiement vérifié avec succès
      return this.success(
        { request, response } as HttpContext,
        {
          verified: true,
          status: 'payment_verified',
          paymentStatus: session.payment_status,
          sessionStatus: session.status,
          customerEmail: session.customer_email,
          amountTotal: session.amount_total,
          currency: session.currency,
          metadata: session.metadata,
        },
        'Paiement vérifié avec succès'
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Récupère la clé publique Stripe pour le frontend
   * GET /api/public/payment/config
   */
  async getConfig({ request, response }: HttpContext) {
    try {
      this.logPublicAction(
        { request, response } as HttpContext,
        'get_config',
        'payment'
      )

      const publishableKey = stripeService.getPublishableKey()

      return this.success(
        { request, response } as HttpContext,
        {
          publishableKey,
          currency: 'eur', // Devise par défaut
          country: 'FR',   // Pays par défaut
        },
        'Configuration Stripe récupérée avec succès',
        200,
        { ttl: 3600, key: 'stripe-config' } // Cache 1 heure
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Récupère les informations d'un produit Stripe
   * GET /api/public/payment/product/:productId
   */
  async getProduct({ request, response, params }: HttpContext) {
    try {
      const productId = params.productId

      if (!productId) {
        return this.validationError(
          { request, response } as HttpContext,
          { productId: ['ID de produit requis'] }
        )
      }

      this.logPublicAction(
        { request, response } as HttpContext,
        'get_product',
        'payment',
        productId
      )

      // Récupération du produit via le service Stripe
      const product = await stripeService.getProduct(productId)

      // Données publiques du produit
      const publicProductData = {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: product.metadata,
        active: product.active,
      }

      return this.success(
        { request, response } as HttpContext,
        publicProductData,
        'Informations du produit récupérées avec succès',
        200,
        { ttl: 1800, key: `product-${productId}` } // Cache 30 minutes
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }

  /**
   * Récupère les informations d'un prix Stripe
   * GET /api/public/payment/price/:priceId
   */
  async getPrice({ request, response, params }: HttpContext) {
    try {
      const priceId = params.priceId

      if (!priceId) {
        return this.validationError(
          { request, response } as HttpContext,
          { priceId: ['ID de prix requis'] }
        )
      }

      this.logPublicAction(
        { request, response } as HttpContext,
        'get_price',
        'payment',
        priceId
      )

      // Récupération du prix via le service Stripe
      const price = await stripeService.getPrice(priceId)

      // Données publiques du prix
      const publicPriceData = {
        id: price.id,
        unitAmount: price.unit_amount,
        currency: price.currency,
        type: price.type,
        recurring: price.recurring,
        metadata: price.metadata,
        active: price.active,
        productId: typeof price.product === 'string' ? price.product : price.product?.id,
      }

      return this.success(
        { request, response } as HttpContext,
        publicPriceData,
        'Informations du prix récupérées avec succès',
        200,
        { ttl: 1800, key: `price-${priceId}` } // Cache 30 minutes
      )

    } catch (error) {
      return this.handleError({ request, response } as HttpContext, error)
    }
  }
}