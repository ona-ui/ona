import type { HttpContext } from '@adonisjs/core/http';
import BasePublicController from './base_public_controller.js';
import { paymentProcessingService } from '#services/payment_processing_service';
import type { StripeWebhookEventType, CheckoutSessionCompletedData } from '#services/payment_processing_service';
import Stripe from 'stripe';
import env from '#start/env';

/**
 * Contrôleur pour les webhooks Stripe
 * Gère la réception et le traitement sécurisé des événements Stripe
 */
export default class WebhookController extends BasePublicController {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    super();
    
    // Initialiser Stripe
    const secretKey = env.get('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });

    // Récupérer le secret webhook
    const webhookSecret = env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }
    this.webhookSecret = webhookSecret;
  }

  /**
   * Endpoint principal pour recevoir les webhooks Stripe
   * POST /api/public/webhooks/stripe
   */
  async handleStripeWebhook({ request, response }: HttpContext) {
    this.logPublicAction(
      { request, response } as HttpContext,
      'stripe_webhook_received',
      'webhook',
      'stripe'
    );

    try {
      // 1. Récupérer le payload brut et la signature
      const payload = request.raw();
      const signature = request.header('stripe-signature');

      if (!signature || !payload) {
        return this.validationError(
          { request, response } as HttpContext,
          { signature: ['Signature Stripe manquante ou payload vide'] }
        );
      }

      // 2. Vérifier la signature Stripe
      let event: Stripe.Event;
      try {
        event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      } catch (err) {
        console.error('Invalid Stripe signature:', err);
        
        return this.validationError(
          { request, response } as HttpContext,
          { signature: ['Signature Stripe invalide'] }
        );
      }

      // 3. Logger l'événement reçu
      console.log('Stripe webhook event received:', {
        eventId: event.id,
        eventType: event.type,
        livemode: event.livemode,
        created: event.created
      });

      // 4. Traiter l'événement selon son type
      const result = await this.processWebhookEvent(event);

      // 5. Retourner une réponse de succès
      return this.success(
        { request, response } as HttpContext,
        {
          eventId: event.id,
          eventType: event.type,
          processed: result.processed,
          message: result.message
        },
        'Webhook traité avec succès'
      );

    } catch (error) {
      console.error('Webhook processing failed:', error);

      return this.handleError({ request, response } as HttpContext, error);
    }
  }

  /**
   * Traite un événement webhook selon son type
   */
  private async processWebhookEvent(event: Stripe.Event): Promise<{ processed: boolean; message: string }> {
    const eventType = event.type as StripeWebhookEventType;

    switch (eventType) {
      case 'checkout.session.completed':
        return await this.handleCheckoutSessionCompleted(event);
      
      case 'checkout.session.expired':
        return await this.handleCheckoutSessionExpired(event);
      
      case 'payment_intent.payment_failed':
        return await this.handlePaymentFailed(event);
      
      default:
        console.log('Unhandled webhook event type:', {
          eventId: event.id,
          eventType: event.type
        });
        
        return {
          processed: false,
          message: `Type d'événement non géré: ${event.type}`
        };
    }
  }

  /**
   * Traite l'événement checkout.session.completed
   */
  private async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<{ processed: boolean; message: string }> {
    console.log('Processing checkout.session.completed:', {
      eventId: event.id,
      sessionId: (event.data.object as any).id
    });

    try {
      console.log('🔍 Step A: Extracting session data from event...');
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('✅ Step A: Session data extracted', {
        sessionId: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total
      });

      // Valider que la session est complète et payée
      console.log('🔍 Step B: Validating payment status...');
      if (session.payment_status !== 'paid') {
        console.log('❌ Step B: Payment not completed', { paymentStatus: session.payment_status });
        return {
          processed: false,
          message: `Session non payée: ${session.payment_status}`
        };
      }
      console.log('✅ Step B: Payment status is paid');

      // Récupérer l'email du client depuis customer_email ou depuis l'objet customer
      console.log('🔍 Step C: Extracting customer email...', {
        customer_email: session.customer_email,
        customer: session.customer,
        customer_type: typeof session.customer
      });

      let customerEmail = session.customer_email;
      
      // Si customer_email n'est pas disponible, essayer de récupérer depuis l'objet customer
      if (!customerEmail && session.customer) {
        try {
          console.log('🔍 Step C.1: Retrieving customer details from Stripe...');
          const customer = await this.stripe.customers.retrieve(
            typeof session.customer === 'string' ? session.customer : session.customer.id
          ) as Stripe.Customer;
          
          if (customer && !customer.deleted && customer.email) {
            customerEmail = customer.email;
            console.log('✅ Step C.1: Customer email retrieved from customer object:', customerEmail);
          }
        } catch (customerError) {
          console.error('❌ Step C.1: Failed to retrieve customer details:', customerError);
        }
      }

      if (!customerEmail) {
        console.log('❌ Step C: Customer email missing from both session and customer object');
        return {
          processed: false,
          message: 'Email client manquant dans la session et l\'objet customer'
        };
      }
      console.log('✅ Step C: Customer email found:', customerEmail);

      // Préparer les données pour le service de traitement
      console.log('🔍 Step D: Preparing session data for processing...');
      const sessionData: CheckoutSessionCompletedData = {
        sessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
        customerId: typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id,
        customerEmail: customerEmail,
        amountTotal: session.amount_total || 0,
        currency: session.currency || 'eur',
        metadata: session.metadata || {},
        paymentStatus: session.payment_status
      };
      console.log('✅ Step D: Session data prepared', sessionData);

      // Traiter le paiement
      console.log('🔍 Step E: Calling payment processing service...');
      const result = await paymentProcessingService.processCheckoutSessionCompleted(sessionData);
      console.log('✅ Step E: Payment processing service called', { success: result.success });

      if (result.success) {
        console.log('Checkout session processed successfully:', {
          eventId: event.id,
          sessionId: session.id,
          userId: result.userId,
          licenseId: result.licenseId,
          isNewUser: result.isNewUser,
          magicLinkSent: result.magicLinkSent
        });

        return {
          processed: true,
          message: `Paiement traité avec succès - Utilisateur: ${result.userId}, Licence: ${result.licenseId}`
        };
      } else {
        console.error('Payment processing failed:', {
          eventId: event.id,
          sessionId: session.id,
          error: result.error
        });

        return {
          processed: false,
          message: `Échec du traitement: ${result.error}`
        };
      }

    } catch (error) {
      console.error('Error processing checkout.session.completed:', error, {
        eventId: event.id
      });

      return {
        processed: false,
        message: `Erreur lors du traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Traite l'événement checkout.session.expired
   */
  private async handleCheckoutSessionExpired(event: Stripe.Event): Promise<{ processed: boolean; message: string }> {
    console.log('Processing checkout.session.expired:', {
      eventId: event.id,
      sessionId: (event.data.object as any).id
    });

    try {
      const session = event.data.object as Stripe.Checkout.Session;
      
      await paymentProcessingService.processCheckoutSessionExpired(session.id);

      return {
        processed: true,
        message: `Session expirée traitée: ${session.id}`
      };

    } catch (error) {
      console.error('Error processing checkout.session.expired:', error, {
        eventId: event.id
      });

      return {
        processed: false,
        message: `Erreur lors du traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Traite l'événement payment_intent.payment_failed
   */
  private async handlePaymentFailed(event: Stripe.Event): Promise<{ processed: boolean; message: string }> {
    console.log('Processing payment_intent.payment_failed:', {
      eventId: event.id,
      paymentIntentId: (event.data.object as any).id
    });

    try {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      const failureReason = paymentIntent.last_payment_error?.message || 'Raison inconnue';
      
      await paymentProcessingService.processPaymentFailed(paymentIntent.id, failureReason);

      return {
        processed: true,
        message: `Échec de paiement traité: ${paymentIntent.id}`
      };

    } catch (error) {
      console.error('Error processing payment_intent.payment_failed:', error, {
        eventId: event.id
      });

      return {
        processed: false,
        message: `Erreur lors du traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Endpoint de test pour vérifier que le webhook fonctionne
   * GET /api/public/webhooks/stripe/test
   */
  async testWebhook({ request, response }: HttpContext) {
    this.logPublicAction(
      { request, response } as HttpContext,
      'webhook_test',
      'webhook',
      'test'
    );

    return this.success(
      { request, response } as HttpContext,
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        webhookEndpoint: '/api/public/webhooks/stripe',
        supportedEvents: [
          'checkout.session.completed',
          'checkout.session.expired',
          'payment_intent.payment_failed'
        ]
      },
      'Webhook endpoint opérationnel'
    );
  }

  /**
   * Endpoint pour obtenir les statistiques des webhooks
   * GET /api/public/webhooks/stripe/stats
   */
  async getWebhookStats({ request, response }: HttpContext) {
    this.logPublicAction(
      { request, response } as HttpContext,
      'webhook_stats',
      'webhook',
      'stats'
    );

    // Pour le moment, retourner des stats basiques
    // Dans une implémentation complète, on pourrait stocker les stats en DB
    return this.success(
      { request, response } as HttpContext,
      {
        endpoint: '/api/public/webhooks/stripe',
        status: 'active',
        supportedEvents: [
          'checkout.session.completed',
          'checkout.session.expired',
          'payment_intent.payment_failed'
        ],
        lastCheck: new Date().toISOString()
      },
      'Statistiques des webhooks'
    );
  }
}