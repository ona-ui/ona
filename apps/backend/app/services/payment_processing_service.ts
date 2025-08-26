import { BaseService, ServiceError, ConflictError } from './base_service.js';
import { UserService } from './user_service.js';
import { licenseService } from './license_service.js';
import { emailService } from './email_service.js';
import { auth } from '../lib/auth.js';
import type { StripeWebhookEventType } from '../types/stripe_types.js';

// Export du type pour le contrôleur webhook
export type { StripeWebhookEventType };

export interface CheckoutSessionCompletedData {
  sessionId: string;
  paymentIntentId?: string;
  customerId?: string;
  customerEmail: string;
  amountTotal: number;
  currency: string;
  metadata: Record<string, string>;
  paymentStatus: string;
}

export interface PaymentProcessingResult {
  success: boolean;
  userId: string;
  licenseId: string;
  licenseKey: string;
  isNewUser: boolean;
  magicLinkSent: boolean;
  error?: string;
}

/**
 * Service de traitement des paiements
 * Orchestre le processus complet de traitement d'un paiement Stripe :
 * - Création/récupération de l'utilisateur
 * - Création de la licence premium
 * - Envoi du magic link de bienvenue
 */
export class PaymentProcessingService extends BaseService {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  /**
   * Traite un événement checkout.session.completed de Stripe
   */
  async processCheckoutSessionCompleted(sessionData: CheckoutSessionCompletedData): Promise<PaymentProcessingResult> {
    this.logOperation('processCheckoutSessionCompleted', {
      sessionId: sessionData.sessionId,
      customerEmail: sessionData.customerEmail,
      amountTotal: sessionData.amountTotal
    });

    try {
      // 1. Vérifier que la session n'a pas déjà été traitée
      console.log('🔍 Step 1: Checking for duplicate processing...', {
        sessionId: sessionData.sessionId,
        paymentIntentId: sessionData.paymentIntentId
      });
      await this.checkDuplicateProcessing(sessionData.sessionId, sessionData.paymentIntentId);
      console.log('✅ Step 1: No duplicate processing detected');

      // 2. Créer ou récupérer l'utilisateur
      console.log('👤 Step 2: Creating or getting user...', {
        customerEmail: sessionData.customerEmail
      });
      const { user, isNewUser } = await this.createOrGetUser(sessionData.customerEmail);
      console.log('✅ Step 2: User processed successfully', {
        userId: user.id,
        isNewUser,
        userEmail: user.email
      });

      // 3. Déterminer le tier de licence basé sur le montant ou les métadonnées
      console.log('🎯 Step 3: Determining license tier...', {
        amountTotal: sessionData.amountTotal,
        metadata: sessionData.metadata
      });
      const licenseTier = this.determineLicenseTier(sessionData);
      console.log('✅ Step 3: License tier determined', { licenseTier });

      // 4. Créer la licence premium
      console.log('📄 Step 4: Creating license...', {
        userId: user.id,
        tier: licenseTier,
        stripePaymentId: sessionData.paymentIntentId,
        amountPaid: sessionData.amountTotal
      });
      const license = await licenseService.createLicense({
        userId: user.id,
        tier: licenseTier,
        stripePaymentId: sessionData.paymentIntentId,
        stripeCustomerId: sessionData.customerId,
        amountPaid: sessionData.amountTotal,
        currency: sessionData.currency.toUpperCase(),
        paymentStatus: 'completed',
        isLifetime: true,
        notes: `Licence créée automatiquement via webhook Stripe - Session: ${sessionData.sessionId}`
      });
      console.log('✅ Step 4: License created successfully', {
        licenseId: license.id,
        licenseKey: license.licenseKey
      });

      // 5. Envoyer le magic link de bienvenue
      console.log('📧 Step 5: Sending welcome magic link...', {
        userEmail: user.email,
        userName: user.name,
        isNewUser
      });
      let magicLinkSent = false;
      try {
        await this.sendWelcomeMagicLink(user.email, user.name || undefined, isNewUser);
        magicLinkSent = true;
        console.log('✅ Step 5: Welcome magic link sent successfully');
      } catch (emailError) {
        // Log l'erreur mais ne fait pas échouer le processus
        console.error('❌ Step 5: Failed to send welcome magic link', emailError);
        this.logError('Failed to send welcome magic link', emailError as Error, {
          userId: user.id,
          email: user.email
        });
      }

      const result: PaymentProcessingResult = {
        success: true,
        userId: user.id,
        licenseId: license.id,
        licenseKey: license.licenseKey,
        isNewUser,
        magicLinkSent
      };

      this.logOperation('processCheckoutSessionCompleted success', {
        sessionId: sessionData.sessionId,
        userId: user.id,
        licenseId: license.id,
        isNewUser,
        magicLinkSent
      });

      return result;

    } catch (error) {
      this.logError('Failed to process checkout session', error as Error, {
        sessionId: sessionData.sessionId,
        customerEmail: sessionData.customerEmail
      });

      return {
        success: false,
        userId: '',
        licenseId: '',
        licenseKey: '',
        isNewUser: false,
        magicLinkSent: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Traite un événement checkout.session.expired de Stripe
   */
  async processCheckoutSessionExpired(sessionId: string): Promise<void> {
    this.logOperation('processCheckoutSessionExpired', { sessionId });

    // Pour le moment, on log simplement l'événement
    // Dans le futur, on pourrait envoyer un email de relance
    this.logOperation('Checkout session expired', { sessionId });
  }

  /**
   * Traite un événement payment_intent.payment_failed de Stripe
   */
  async processPaymentFailed(paymentIntentId: string, failureReason?: string): Promise<void> {
    this.logOperation('processPaymentFailed', { paymentIntentId, failureReason });

    // Chercher une licence associée à ce paiement et la marquer comme échouée
    const license = await licenseService.getLicenseByStripePayment(paymentIntentId);
    if (license) {
      await licenseService.updatePaymentStatus(license.id, 'failed');
      await licenseService.deactivateLicense(license.id, `Paiement échoué: ${failureReason || 'Raison inconnue'}`);
    }
  }

  /**
   * Crée ou récupère un utilisateur par email
   */
  private async createOrGetUser(email: string): Promise<{ user: any; isNewUser: boolean }> {
    this.logOperation('createOrGetUser', { email });
    console.log('👤 Searching for existing user...', { email });

    try {
      // Chercher un utilisateur existant
      let user = await this.userService.getUserByEmail(email);
      let isNewUser = false;

      if (!user) {
        console.log('👤 No existing user found, creating new user...');
        // Créer un nouvel utilisateur
        const name = this.extractNameFromEmail(email);
        console.log('👤 Extracted name from email:', { name, email });
        
        user = await this.userService.createUser({
          email: email.toLowerCase(),
          name,
          emailVerified: false, // Sera vérifié via magic link
          role: 'user'
        }, {
          skipEmailValidation: false,
          skipPasswordValidation: true
        });

        isNewUser = true;
        console.log('✅ New user created successfully', { userId: user.id, email });
        this.logOperation('New user created', { userId: user.id, email });
      } else {
        console.log('✅ Existing user found', { userId: user.id, email });
        this.logOperation('Existing user found', { userId: user.id, email });
      }

      return { user, isNewUser };
    } catch (error) {
      console.error('❌ Error in createOrGetUser:', error);
      throw error;
    }
  }

  /**
   * Détermine le tier de licence basé sur les données de la session
   */
  private determineLicenseTier(sessionData: CheckoutSessionCompletedData): 'pro' | 'team' | 'enterprise' {
    // Vérifier d'abord les métadonnées
    if (sessionData.metadata.tier) {
      const tier = sessionData.metadata.tier.toLowerCase();
      if (['pro', 'team', 'enterprise'].includes(tier)) {
        return tier as 'pro' | 'team' | 'enterprise';
      }
    }

    // Déterminer basé sur le montant (en centimes)
    const amountInEuros = sessionData.amountTotal / 100;

    if (amountInEuros >= 500) {
      return 'enterprise';
    } else if (amountInEuros >= 200) {
      return 'team';
    } else {
      return 'pro';
    }
  }

  /**
   * Extrait un nom à partir d'une adresse email
   */
  private extractNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    
    // Remplacer les caractères spéciaux par des espaces et capitaliser
    return localPart
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Envoie un magic link de bienvenue à l'utilisateur
   */
  private async sendWelcomeMagicLink(email: string, name?: string, isNewUser: boolean = false): Promise<void> {
    this.logOperation('sendWelcomeMagicLink', { email, name, isNewUser });

    try {
      // Générer un magic link via Better Auth
      const magicLinkUrl = await this.generateMagicLink(email);

      if (isNewUser) {
        // Email de bienvenue avec magic link pour nouveaux utilisateurs
        await this.sendNewUserWelcomeEmail(email, name, magicLinkUrl);
      } else {
        // Email de confirmation d'achat avec magic link pour utilisateurs existants
        await this.sendExistingUserPurchaseEmail(email, name, magicLinkUrl);
      }

    } catch (error) {
      this.logError('Failed to send welcome magic link', error as Error, { email });
      throw error;
    }
  }

  /**
   * Génère un magic link pour l'utilisateur via Better Auth
   */
  private async generateMagicLink(email: string): Promise<string> {
    try {
      console.log('🔗 Generating magic link via Better Auth...', { email });
      this.logOperation('generateMagicLink via Better Auth', { email });
      
      // Utiliser Better Auth pour générer un vrai magic link
      console.log('🔗 Calling auth.api.signInMagicLink...');
      const result = await auth.api.signInMagicLink({
        body: {
          email,
          callbackURL: '/dashboard',
          newUserCallbackURL: '/welcome',
          errorCallbackURL: '/auth/error'
        },
        headers: {}
      });

      console.log('🔗 Better Auth response received:', { result, type: typeof result });

      // Better Auth retourne l'URL du magic link dans la réponse
      if (result && typeof result === 'object' && 'url' in result) {
        const magicLinkUrl = (result as any).url;
        console.log('✅ Magic link generated successfully', { email, url: magicLinkUrl });
        this.logOperation('Magic link generated successfully', { email, url: magicLinkUrl });
        return magicLinkUrl;
      }

      // Fallback si la structure de réponse est différente
      console.error('❌ Unexpected Better Auth response structure:', { result });
      this.logError('Unexpected Better Auth response structure', new Error('Invalid response'), { result });
      throw new Error('Failed to generate magic link: Invalid Better Auth response');

    } catch (error) {
      console.error('❌ Error generating magic link via Better Auth:', error);
      this.logError('Failed to generate magic link via Better Auth', error as Error, { email });
      throw new ServiceError('Impossible de générer le magic link', 'MAGIC_LINK_GENERATION_FAILED');
    }
  }

  /**
   * Envoie un email de bienvenue pour un nouvel utilisateur
   */
  private async sendNewUserWelcomeEmail(email: string, name: string | undefined, magicLink: string): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur Ona UI - Votre licence premium est prête !</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #1f2937;
            font-size: 28px;
            margin: 0;
            font-weight: 700;
        }
        .content {
            text-align: center;
        }
        .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 20px;
        }
        .success-message {
            background: #d1fae5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            color: #065f46;
        }
        .magic-link-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }
        .features {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🎨 Ona UI</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Bienvenue${name ? ` ${name}` : ''} ! 🎉
            </div>
            
            <div class="success-message">
                <h3 style="margin-top: 0;">✅ Paiement confirmé !</h3>
                <p>Votre licence premium Ona UI est maintenant active. Vous avez accès à tous nos composants premium et intégrations.</p>
            </div>
            
            <p>Cliquez sur le bouton ci-dessous pour accéder à votre compte et commencer à utiliser vos composants premium :</p>
            
            <a href="${magicLink}" class="magic-link-button">
                🚀 Accéder à mon compte premium
            </a>
            
            <div class="features">
                <h3 style="color: #1f2937; margin-top: 0;">🎯 Ce qui vous attend :</h3>
                <ul style="color: #4b5563;">
                    <li>200+ composants premium haute conversion</li>
                    <li>Intégrations pré-configurées (Stripe, Supabase, etc.)</li>
                    <li>Code source complet et personnalisable</li>
                    <li>Support prioritaire de notre équipe</li>
                    <li>Mises à jour à vie incluses</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>Merci de faire confiance à Ona UI !</p>
            <p>L'équipe Ona UI</p>
        </div>
    </div>
</body>
</html>
    `;

    const textContent = `
Bienvenue${name ? ` ${name}` : ''} !

✅ Paiement confirmé !
Votre licence premium Ona UI est maintenant active.

Accédez à votre compte premium : ${magicLink}

Ce qui vous attend :
- 200+ composants premium haute conversion
- Intégrations pré-configurées (Stripe, Supabase, etc.)
- Code source complet et personnalisable
- Support prioritaire de notre équipe
- Mises à jour à vie incluses

Merci de faire confiance à Ona UI !
L'équipe Ona UI
    `;

    await emailService.sendEmail({
      to: email,
      toName: name,
      subject: "🎉 Bienvenue sur Ona UI - Votre licence premium est prête !",
      htmlContent,
      textContent
    });
  }

  /**
   * Envoie un email de confirmation d'achat pour un utilisateur existant
   */
  private async sendExistingUserPurchaseEmail(email: string, name: string | undefined, magicLink: string): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Merci pour votre achat - Ona UI</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; font-size: 28px; margin: 0; font-weight: 700;">🎨 Ona UI</h1>
        </div>
        
        <div style="text-align: center;">
            <h2 style="color: #374151; margin-bottom: 20px;">Merci${name ? ` ${name}` : ''} ! ✨</h2>
            
            <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; color: #065f46;">
                <h3 style="margin-top: 0;">✅ Paiement confirmé !</h3>
                <p>Votre nouvelle licence premium a été ajoutée à votre compte.</p>
            </div>
            
            <p>Connectez-vous à votre compte pour accéder à vos nouveaux composants premium :</p>
            
            <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0;">
                🔐 Se connecter à mon compte
            </a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #9ca3af;">
            <p>L'équipe Ona UI</p>
        </div>
    </div>
</body>
</html>
    `;

    const textContent = `
Merci${name ? ` ${name}` : ''} !

✅ Paiement confirmé !
Votre nouvelle licence premium a été ajoutée à votre compte.

Connectez-vous à votre compte : ${magicLink}

L'équipe Ona UI
    `;

    await emailService.sendEmail({
      to: email,
      toName: name,
      subject: "✅ Paiement confirmé - Accédez à vos composants premium",
      htmlContent,
      textContent
    });
  }

  /**
   * Vérifie qu'une session n'a pas déjà été traitée
   */
  private async checkDuplicateProcessing(sessionId: string, paymentIntentId?: string): Promise<void> {
    console.log('🔍 Checking duplicate processing with:', { sessionId, paymentIntentId });
    
    // Vérifier d'abord avec le paymentIntentId si disponible (plus fiable)
    if (paymentIntentId) {
      const existingLicenseByPayment = await licenseService.getLicenseByStripePayment(paymentIntentId);
      if (existingLicenseByPayment) {
        console.log('❌ Duplicate processing detected by paymentIntentId:', paymentIntentId);
        throw new ConflictError(`Payment ${paymentIntentId} déjà traité`);
      }
    }
    
    // Vérifier aussi avec le sessionId comme fallback
    const existingLicenseBySession = await licenseService.getLicenseByStripePayment(sessionId);
    if (existingLicenseBySession) {
      console.log('❌ Duplicate processing detected by sessionId:', sessionId);
      throw new ConflictError(`Session ${sessionId} déjà traitée`);
    }
    
    console.log('✅ No duplicate processing detected');
  }

}

// Instance singleton
export const paymentProcessingService = new PaymentProcessingService();