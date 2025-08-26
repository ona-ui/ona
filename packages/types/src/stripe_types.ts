/**
 * Types TypeScript pour l'intégration Stripe
 * Définit les interfaces et types utilisés dans les services et contrôleurs Stripe
 */

/**
 * Interface pour les paramètres de création d'une session de checkout
 */
export interface CreateCheckoutSessionParams {
  priceId: string
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
 * Interface pour les données publiques d'une session Stripe
 */
export interface PublicSessionData {
  id: string
  status: string
  paymentStatus: string
  customerEmail: string | null
  amountTotal: number | null
  currency: string | null
  createdAt: number
  expiresAt: number | null
  metadata: Record<string, string>
}

/**
 * Interface pour le statut de paiement d'une session
 */
export interface SessionPaymentStatus {
  sessionId: string
  isPaid: boolean
  paymentStatus: string
  status: string
}

/**
 * Interface pour la configuration Stripe publique
 */
export interface StripePublicConfig {
  publishableKey: string
  currency: string
  country: string
}

/**
 * Interface pour les données publiques d'un produit Stripe
 */
export interface PublicProductData {
  id: string
  name: string
  description: string | null
  images: string[]
  metadata: Record<string, string>
  active: boolean
}

/**
 * Interface pour les données publiques d'un prix Stripe
 */
export interface PublicPriceData {
  id: string
  unitAmount: number | null
  currency: string
  type: string
  recurring: any | null
  metadata: Record<string, string>
  active: boolean
  productId: string | undefined
}

/**
 * Interface pour les erreurs Stripe
 */
export interface StripeErrorDetails {
  stripeCode?: string
  stripeType?: string
  requestId?: string
}

/**
 * Types d'événements Stripe pour les webhooks
 */
export type StripeWebhookEventType =
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'customer.created'
  | 'customer.updated'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'

/**
 * Interface pour les données d'un webhook Stripe
 */
export interface StripeWebhookData {
  id: string
  object: string
  type: StripeWebhookEventType
  created: number
  data: {
    object: any
    previous_attributes?: any
  }
  livemode: boolean
  pending_webhooks: number
  request: {
    id: string | null
    idempotency_key: string | null
  }
}

/**
 * Interface pour les métadonnées de session personnalisées
 */
export interface SessionMetadata {
  source: string
  userId?: string
  productType?: string
  campaignId?: string
  referrer?: string
  [key: string]: string | undefined
}

/**
 * Interface pour les options de création de session étendues
 */
export interface ExtendedCheckoutSessionParams extends CreateCheckoutSessionParams {
  allowPromotionCodes?: boolean
  billingAddressCollection?: 'auto' | 'required'
  customerCreation?: 'always' | 'if_required'
  paymentMethodTypes?: string[]
  mode?: 'payment' | 'subscription' | 'setup'
  submitType?: 'auto' | 'book' | 'donate' | 'pay'
  locale?: string
}

/**
 * Interface pour les statistiques de paiement
 */
export interface PaymentStats {
  totalSessions: number
  completedSessions: number
  failedSessions: number
  totalRevenue: number
  conversionRate: number
  averageOrderValue: number
}

/**
 * Interface pour les filtres de recherche de sessions
 */
export interface SessionFilters {
  status?: string
  paymentStatus?: string
  createdAfter?: Date
  createdBefore?: Date
  customerEmail?: string
  amountMin?: number
  amountMax?: number
}

/**
 * Interface pour la réponse paginée de sessions
 */
export interface PaginatedSessionsResponse {
  sessions: PublicSessionData[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: SessionFilters
}

/**
 * Types pour les modes de paiement Stripe
 */
export type StripePaymentMode = 'payment' | 'subscription' | 'setup'

/**
 * Types pour les statuts de session Stripe
 */
export type StripeSessionStatus = 'open' | 'complete' | 'expired'

/**
 * Types pour les statuts de paiement Stripe
 */
export type StripePaymentStatus = 'paid' | 'unpaid' | 'no_payment_required'

/**
 * Interface pour les événements de cycle de vie des paiements
 */
export interface PaymentLifecycleEvent {
  sessionId: string
  event: 'created' | 'completed' | 'failed' | 'expired'
  timestamp: Date
  metadata?: Record<string, any>
}

/**
 * Interface pour les données de facturation
 */
export interface BillingDetails {
  name?: string
  email?: string
  phone?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
}

/**
 * Interface pour les informations de paiement complètes
 */
export interface PaymentInfo {
  sessionId: string
  paymentIntentId?: string
  customerId?: string
  amount: number
  currency: string
  status: StripePaymentStatus
  paymentMethod?: string
  billingDetails?: BillingDetails
  createdAt: Date
  completedAt?: Date
}