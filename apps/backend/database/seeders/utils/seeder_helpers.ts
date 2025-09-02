import { randomBytes, createHash } from 'node:crypto'

/**
 * Utilitaires pour les seeders
 */
export class SeederHelpers {
  /**
   * Génère un UUID v4
   */
  static generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * Génère un slug à partir d'un nom
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
      .replace(/\s+/g, '-') // Remplace les espaces par des tirets
      .replace(/-+/g, '-') // Supprime les tirets multiples
      .trim()
  }

  /**
   * Génère une clé de licence unique
   */
  static generateLicenseKey(): string {
    const prefix = 'ONA'
    const segments = []
    
    for (let i = 0; i < 4; i++) {
      const segment = randomBytes(2).toString('hex').toUpperCase()
      segments.push(segment)
    }
    
    return `${prefix}-${segments.join('-')}`
  }

  /**
   * Hash un mot de passe (simple hash pour les tests)
   */
  static async hashPassword(password: string): Promise<string> {
    // Pour les seeders de test, on utilise un hash simple
    // En production, better-auth gère le hashing des mots de passe
    return createHash('sha256').update(password + 'ona-ui-salt').digest('hex')
  }

  /**
   * Génère un email de test
   */
  static generateTestEmail(username: string): string {
    return `${username}@ona-ui.com`
  }

  /**
   * Génère une date aléatoire dans une plage
   */
  static randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  }

  /**
   * Sélectionne un élément aléatoire dans un tableau
   */
  static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  /**
   * Sélectionne plusieurs éléments aléatoires dans un tableau
   */
  static randomChoices<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, array.length))
  }

  /**
   * Génère un nombre aléatoire entre min et max
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Génère un taux de conversion réaliste
   */
  static generateConversionRate(): string {
    // Taux de conversion entre 2% et 15%
    const rate = Math.random() * 13 + 2
    return rate.toFixed(2)
  }

  /**
   * Génère des tags aléatoires pour un composant
   */
  static generateComponentTags(category: string): string[] {
    const baseTags = ['responsive', 'modern', 'clean', 'professional']
    const categoryTags: Record<string, string[]> = {
      navigation: ['header', 'menu', 'navbar', 'sidebar'],
      forms: ['input', 'validation', 'submit', 'contact'],
      layout: ['grid', 'container', 'section', 'wrapper'],
      ecommerce: ['product', 'cart', 'pricing', 'checkout'],
      marketing: ['hero', 'cta', 'testimonial', 'landing']
    }

    const specificTags = categoryTags[category.toLowerCase()] || []
    const allTags = [...baseTags, ...specificTags]
    
    return this.randomChoices(allTags, this.randomInt(2, 4))
  }

  /**
   * Génère des entreprises de test réalistes
   */
  static generateTestedCompanies(): string[] {
    const companies = [
      'Stripe', 'Vercel', 'Linear', 'Notion', 'Figma', 'Framer',
      'Supabase', 'PlanetScale', 'Railway', 'Clerk', 'Resend',
      'Cal.com', 'Lemon Squeezy', 'Tailwind UI', 'Headless UI'
    ]
    
    return this.randomChoices(companies, this.randomInt(1, 3))
  }

  /**
   * Génère du code HTML réaliste pour un composant
   */
  static generateComponentHTML(componentName: string, category: string): string {
    const templates: Record<string, string> = {
      button: `<button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  ${componentName}
</button>`,
      
      card: `<div class="bg-[#F1F0EE] rounded-lg shadow-md p-6">
  <h3 class="text-xl font-semibold mb-2">${componentName}</h3>
  <p class="text-gray-600 mb-4">Description du composant</p>
  <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Action
  </button>
</div>`,

      hero: `<section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
  <div class="container mx-auto px-4 text-center">
    <h1 class="text-5xl font-bold mb-6">${componentName}</h1>
    <p class="text-xl mb-8">Description captivante du produit</p>
    <button class="px-8 py-4 bg-[#F1F0EE] text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
      Commencer
    </button>
  </div>
</section>`,

      form: `<form class="max-w-md mx-auto bg-[#F1F0EE] p-6 rounded-lg shadow-md">
  <h2 class="text-2xl font-bold mb-6">${componentName}</h2>
  <div class="mb-4">
    <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
    <input type="email" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
  </div>
  <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
    Envoyer
  </button>
</form>`
    }

    // Détermine le template basé sur la catégorie ou le nom
    let template = templates.card // template par défaut
    
    if (componentName.toLowerCase().includes('button')) template = templates.button
    else if (componentName.toLowerCase().includes('hero')) template = templates.hero
    else if (componentName.toLowerCase().includes('form') || category.toLowerCase().includes('form')) template = templates.form
    
    return template
  }

  /**
   * Génère du code CSS réaliste
   */
  static generateComponentCSS(): string {
    return `/* Styles personnalisés */
.component {
  transition: all 0.3s ease;
}

.component:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .component {
    padding: 1rem;
  }
}`
  }

  /**
   * Génère du code JavaScript réaliste
   */
  static generateComponentJS(): string {
    return `// Interactions du composant
document.addEventListener('DOMContentLoaded', function() {
  const component = document.querySelector('.component');
  
  if (component) {
    component.addEventListener('click', function(e) {
      // Animation au clic
      this.style.transform = 'scale(0.98)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
    });
  }
});`
  }

  /**
   * Génère des dépendances réalistes pour un framework
   */
  static generateDependencies(framework: string): Record<string, string> {
    const baseDeps = {
      react: {
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        '@types/react': '^18.0.0'
      },
      vue: {
        'vue': '^3.0.0',
        '@vue/composition-api': '^1.0.0'
      },
      svelte: {
        'svelte': '^4.0.0',
        '@sveltejs/kit': '^1.0.0'
      },
      angular: {
        '@angular/core': '^16.0.0',
        '@angular/common': '^16.0.0'
      }
    }

    return baseDeps[framework as keyof typeof baseDeps] || {}
  }

  /**
   * Log avec timestamp pour le debugging
   */
  static log(message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${message}`, data || '')
  }

  /**
   * Génère des métadonnées d'intégration
   */
  static generateIntegrations(): Record<string, any> {
    const integrations = ['stripe', 'supabase', 'posthog', 'resend', 'clerk']
    const selected = this.randomChoices(integrations, this.randomInt(0, 2))
    
    const result: Record<string, any> = {}
    
    selected.forEach(integration => {
      switch (integration) {
        case 'stripe':
          result.stripe = {
            required: true,
            config: ['STRIPE_PUBLIC_KEY', 'STRIPE_SECRET_KEY']
          }
          break
        case 'supabase':
          result.supabase = {
            required: true,
            config: ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
          }
          break
        case 'posthog':
          result.posthog = {
            required: false,
            config: ['POSTHOG_KEY']
          }
          break
      }
    })
    
    return result
  }
}