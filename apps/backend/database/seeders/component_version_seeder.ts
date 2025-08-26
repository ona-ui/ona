import { BaseSeeder } from './base_seeder.js'
import { componentVersions } from '../../app/db/schema.js'

/**
 * Seeder pour les versions de composants
 */
export class ComponentVersionSeeder extends BaseSeeder {
  async run(): Promise<void> {
    this.log('Début du seeding des versions de composants...')

    try {
      // Récupérer les données des seeders précédents
      const seederData = (global as any).seederData
      if (!seederData?.componentIds) {
        throw new Error('Les composants doivent être créés avant leurs versions')
      }

      // Vérifier si des versions existent déjà
      const existingVersions = await this.checkExistingData(componentVersions)
      
      if (existingVersions) {
        this.log('Des versions de composants existent déjà, nettoyage...')
        await this.truncateTable(componentVersions, 'component_versions')
      }

      const allVersions = []

      // Générer des versions pour chaque composant
      for (const componentId of seederData.componentIds) {
        const versions = await this.generateVersionsForComponent(componentId)
        allVersions.push(...versions)
      }

      // Insertion des versions une par une pour éviter la limite de paramètres PostgreSQL
      this.log(`Insertion de ${allVersions.length} versions de composants...`)
      let insertedCount = 0
      
      for (const version of allVersions) {
        try {
          await this.db.insert(componentVersions).values(version)
          insertedCount++
          
          // Log du progrès tous les 50 insertions
          if (insertedCount % 50 === 0) {
            this.log(`Inséré ${insertedCount}/${allVersions.length} versions`)
          }
        } catch (error) {
          this.handleError(error, `insertion version ${version.id}`)
          throw error
        }
      }
      
      this.log(`Inséré ${insertedCount} versions au total`)

      this.log(`✅ ${allVersions.length} versions de composants créées avec succès`)

      // Statistiques par framework
      const frameworkStats = allVersions.reduce((acc, version) => {
        acc[version.framework] = (acc[version.framework] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      Object.entries(frameworkStats).forEach(([framework, count]) => {
        this.log(`  - ${framework}: ${count} versions`)
      })

      // Stocker les IDs pour les autres seeders
      ;(global as any).seederData.versionIds = allVersions.map(v => v.id)

      this.log('IDs des versions stockés pour les autres seeders')

    } catch (error) {
      this.handleError(error, 'run()')
    }
  }

  /**
   * Génère les versions pour un composant donné
   */
  private async generateVersionsForComponent(componentId: string) {
    const frameworks = ['html', 'react', 'vue', 'svelte', 'angular'] as const
    const _cssFrameworks = ['tailwind_v4', 'tailwind_v3', 'vanilla_css'] as const
    const versions = []

    // Chaque composant a 1-2 frameworks pour éviter trop de versions
    const mainFrameworks = this.helpers.randomChoices([...frameworks], this.helpers.randomInt(1, 2))
    
    for (const framework of mainFrameworks) {
      // Choisir 1 CSS framework pour ce framework
      const _cssFrameworksForThis = this.helpers.randomChoices([..._cssFrameworks], 1)
      
      for (const _cssFramework of _cssFrameworksForThis) {
        const version = {
          id: this.helpers.generateUuid(),
          componentId,
          versionNumber: '1.0.0',
          framework,
          cssFramework: _cssFramework,
          codePreview: this.generatePreviewCode(framework, _cssFramework),
          codeFull: this.generateFullCode(framework, _cssFramework),
          codeEncrypted: null, // Pour les composants premium, sera chiffré
          dependencies: this.helpers.generateDependencies(framework),
          configRequired: this.generateConfigRequired(framework),
          supportsDarkMode: this.helpers.randomInt(1, 10) <= 7, // 70% supportent le dark mode
          darkModeCode: null as string | null, // Sera généré si supportsDarkMode = true
          integrations: this.helpers.generateIntegrations(),
          integrationCode: this.generateIntegrationCode(),
          files: this.generateFiles(framework, _cssFramework),
          isDefault: _cssFramework === 'tailwind_v4' && framework === 'react', // React + Tailwind v4 par défaut
          ...this.generateTimestamps()
        }

        // Générer le code dark mode si supporté
        if (version.supportsDarkMode) {
          version.darkModeCode = this.generateDarkModeCode(framework, _cssFramework)
        }

        versions.push(version)
      }
    }

    // Générer des versions supplémentaires pour moins de composants
    if (this.helpers.randomInt(1, 10) <= 1) { // 10% des composants ont des versions multiples
      const firstCssFramework = this.helpers.randomChoices([..._cssFrameworks], 1)[0]
      const additionalVersions = this.generateAdditionalVersions(componentId, mainFrameworks[0], firstCssFramework)
      versions.push(...additionalVersions)
    }

    return versions
  }

  /**
   * Génère des versions supplémentaires (1.1.0, 2.0.0, etc.)
   */
  private generateAdditionalVersions(componentId: string, framework: string, _cssFramework: string) {
    const versions = []
    const versionNumbers = ['1.1.0', '1.2.0', '2.0.0']
    const selectedVersions = this.helpers.randomChoices(versionNumbers, this.helpers.randomInt(1, 2))

    for (const versionNumber of selectedVersions) {
      versions.push({
        id: this.helpers.generateUuid(),
        componentId,
        versionNumber,
        framework: framework as any,
        cssFramework: _cssFramework as any,
        codePreview: this.generatePreviewCode(framework, _cssFramework),
        codeFull: this.generateFullCode(framework, _cssFramework),
        codeEncrypted: null,
        dependencies: this.helpers.generateDependencies(framework),
        configRequired: this.generateConfigRequired(framework),
        supportsDarkMode: this.helpers.randomInt(1, 10) <= 8, // 80% pour les versions plus récentes
        darkModeCode: this.generateDarkModeCode(framework, _cssFramework),
        integrations: this.helpers.generateIntegrations(),
        integrationCode: this.generateIntegrationCode(),
        files: this.generateFiles(framework, _cssFramework),
        isDefault: false,
        ...this.generateTimestamps()
      })
    }

    return versions
  }

  /**
   * Génère le code de prévisualisation
   */
  private generatePreviewCode(framework: string, _cssFramework: string): string {
    const baseCode = this.helpers.generateComponentHTML('Preview Component', 'preview')
    
    switch (framework) {
      case 'react':
        return `import React from 'react';

export default function PreviewComponent() {
  return (
    ${baseCode.replace(/class=/g, 'className=')}
  );
}`

      case 'vue':
        return `<template>
  ${baseCode}
</template>

<script>
export default {
  name: 'PreviewComponent'
}
</script>`

      case 'svelte':
        return `${baseCode}

<style>
  /* Styles Svelte */
</style>`

      case 'angular':
        return `import { Component } from '@angular/core';

@Component({
  selector: 'app-preview',
  template: \`${baseCode}\`
})
export class PreviewComponent {}`

      default:
        return baseCode
    }
  }

  /**
   * Génère le code complet
   */
  private generateFullCode(framework: string, _cssFramework: string): string {
    const previewCode = this.generatePreviewCode(framework, _cssFramework)
    const additionalFeatures = `
// Fonctionnalités avancées
// - Animations et transitions
// - Gestion d'état
// - Accessibilité complète
// - Tests unitaires inclus
`
    
    return previewCode + additionalFeatures
  }

  /**
   * Génère le code dark mode
   */
  private generateDarkModeCode(framework: string, _cssFramework: string): string {
    return `/* Dark Mode Styles */
.dark {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
  --border-color: #333333;
}

/* Framework-specific dark mode implementation */
${framework === 'react' ? '// React dark mode hooks' : ''}
${framework === 'vue' ? '// Vue dark mode composables' : ''}
`
  }

  /**
   * Génère la configuration requise
   */
  private generateConfigRequired(framework: string): Record<string, any> {
    const baseConfig = {
      tailwindConfig: {
        required: true,
        content: ['./src/**/*.{js,ts,jsx,tsx}'],
        theme: {
          extend: {}
        }
      }
    }

    switch (framework) {
      case 'react':
        return {
          ...baseConfig,
          reactConfig: {
            version: '^18.0.0',
            features: ['hooks', 'context']
          }
        }

      case 'vue':
        return {
          ...baseConfig,
          vueConfig: {
            version: '^3.0.0',
            features: ['composition-api', 'teleport']
          }
        }

      case 'svelte':
        return {
          ...baseConfig,
          svelteConfig: {
            version: '^4.0.0',
            features: ['stores', 'transitions']
          }
        }

      default:
        return baseConfig
    }
  }

  /**
   * Génère le code d'intégration
   */
  private generateIntegrationCode(): Record<string, any> {
    return {
      stripe: {
        setup: `// Configuration Stripe
const stripe = Stripe('pk_test_...');`,
        usage: `// Utilisation dans le composant
const handlePayment = async () => {
  // Code de paiement
};`
      },
      supabase: {
        setup: `// Configuration Supabase
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);`,
        usage: `// Utilisation dans le composant
const { data, error } = await supabase.from('table').select();`
      }
    }
  }

  /**
   * Génère les fichiers associés
   */
  private generateFiles(framework: string, _cssFramework: string): Record<string, any> {
    const baseFiles = {
      'component.css': this.helpers.generateComponentCSS(),
      'component.js': this.helpers.generateComponentJS()
    }

    switch (framework) {
      case 'react':
        return {
          ...baseFiles,
          'Component.tsx': 'React TypeScript component',
          'Component.test.tsx': 'Jest tests',
          'index.ts': 'Export file'
        }

      case 'vue':
        return {
          ...baseFiles,
          'Component.vue': 'Vue SFC component',
          'Component.spec.ts': 'Vitest tests'
        }

      case 'svelte':
        return {
          ...baseFiles,
          'Component.svelte': 'Svelte component',
          'Component.test.js': 'Jest tests'
        }

      default:
        return baseFiles
    }
  }
}