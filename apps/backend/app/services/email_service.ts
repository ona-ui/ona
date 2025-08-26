import { Resend } from 'resend';
import env from '#start/env';

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  textContent?: string;
  htmlContent?: string;
  templateId?: number;
  params?: Record<string, any>;
}

export interface MagicLinkEmailOptions {
  email: string;
  name?: string;
  magicLink: string;
  token: string;
}

export class EmailService {
  private resend: Resend;
  private defaultSender = {
    name: "Ona UI",
    email: "noreply@notifications.ona-ui.com"
  };

  constructor() {
    // Configuration de l'API Resend
    const resendApiKey = env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    
    this.resend = new Resend(resendApiKey);
  }

  /**
   * Envoie un email générique
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const emailData: any = {
        from: `${this.defaultSender.name} <${this.defaultSender.email}>`,
        to: [options.to],
        subject: options.subject,
      };

      if (options.htmlContent) {
        emailData.html = options.htmlContent;
      }
      
      if (options.textContent) {
        emailData.text = options.textContent;
      }

      // Note: Resend ne supporte pas les templates comme Brevo
      // Si templateId est fourni, on ignore pour le moment
      if (options.templateId) {
        console.warn('Template ID ignoré - Resend ne supporte pas les templates comme Brevo');
      }

      await this.resend.emails.send(emailData);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
    }
  }

  /**
   * Envoie un email de magic link
   */
  async sendMagicLinkEmail(options: MagicLinkEmailOptions): Promise<void> {
    const htmlContent = this.generateMagicLinkHtml(options);
    const textContent = this.generateMagicLinkText(options);

    await this.sendEmail({
      to: options.email,
      toName: options.name,
      subject: "Connexion à Ona UI - Lien magique",
      htmlContent,
      textContent
    });
  }

  /**
   * Génère le contenu HTML pour l'email de magic link
   */
  private generateMagicLinkHtml(options: MagicLinkEmailOptions): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion à Ona UI</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
        .message {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.5;
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
            transition: transform 0.2s;
        }
        .magic-link-button:hover {
            transform: translateY(-2px);
        }
        .expiry-notice {
            font-size: 14px;
            color: #9ca3af;
            margin-top: 20px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #9ca3af;
        }
        .security-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
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
                Bonjour${options.name ? ` ${options.name}` : ''} ! 👋
            </div>
            
            <div class="message">
                Vous avez demandé à vous connecter à Ona UI. Cliquez sur le bouton ci-dessous pour accéder à votre compte en toute sécurité.
            </div>
            
            <a href="${options.magicLink}" class="magic-link-button">
                🔐 Se connecter à Ona UI
            </a>
            
            <div class="expiry-notice">
                Ce lien est valide pendant 5 minutes pour des raisons de sécurité.
            </div>
            
            <div class="security-notice">
                <strong>🛡️ Note de sécurité :</strong> Si vous n'avez pas demandé cette connexion, vous pouvez ignorer cet email en toute sécurité.
            </div>
        </div>
        
        <div class="footer">
            <p>Cet email a été envoyé par Ona UI</p>
            <p>Vous recevez cet email car vous avez demandé une connexion par lien magique.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Génère le contenu texte pour l'email de magic link
   */
  private generateMagicLinkText(options: MagicLinkEmailOptions): string {
    return `
Bonjour${options.name ? ` ${options.name}` : ''} !

Vous avez demandé à vous connecter à Ona UI.

Cliquez sur ce lien pour accéder à votre compte :
${options.magicLink}

Ce lien est valide pendant 5 minutes pour des raisons de sécurité.

Si vous n'avez pas demandé cette connexion, vous pouvez ignorer cet email en toute sécurité.

---
Ona UI - Composants premium pour développeurs
    `.trim();
  }

  /**
   * Envoie un email de bienvenue
   */
  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur Ona UI</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; font-size: 28px; margin: 0; font-weight: 700;">🎨 Ona UI</h1>
        </div>
        
        <div style="text-align: center;">
            <h2 style="color: #374151; margin-bottom: 20px;">Bienvenue${name ? ` ${name}` : ''} ! 🎉</h2>
            
            <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
                Merci de rejoindre Ona UI ! Vous avez maintenant accès à notre bibliothèque de composants premium 
                conçus pour créer des interfaces qui convertissent.
            </p>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin-top: 0;">🚀 Prochaines étapes</h3>
                <ul style="text-align: left; color: #4b5563;">
                    <li>Explorez notre collection de composants</li>
                    <li>Découvrez les intégrations pré-configurées</li>
                    <li>Rejoignez notre communauté de développeurs</li>
                </ul>
            </div>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #9ca3af;">
            <p>L'équipe Ona UI</p>
        </div>
    </div>
</body>
</html>
    `;

    const textContent = `
Bienvenue${name ? ` ${name}` : ''} !

Merci de rejoindre Ona UI ! Vous avez maintenant accès à notre bibliothèque de composants premium conçus pour créer des interfaces qui convertissent.

Prochaines étapes :
- Explorez notre collection de composants
- Découvrez les intégrations pré-configurées  
- Rejoignez notre communauté de développeurs

L'équipe Ona UI
    `;

    await this.sendEmail({
      to: email,
      toName: name,
      subject: "Bienvenue sur Ona UI ! 🎉",
      htmlContent,
      textContent
    });
  }
}

// Instance singleton
export const emailService = new EmailService();