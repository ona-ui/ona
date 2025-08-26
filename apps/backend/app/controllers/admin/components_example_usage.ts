/**
 * Exemple d'utilisation des contrôleurs admin pour les composants et leurs versions
 * 
 * Ce fichier montre comment configurer les routes et middlewares pour utiliser
 * les contrôleurs ComponentsController et ComponentVersionsController.
 */

// =====================================================
// EXEMPLE DE CONFIGURATION DES ROUTES
// =====================================================

/*
// Dans start/routes.ts

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Groupe de routes admin avec authentification et permissions
router.group(() => {
  
  // ===== ROUTES COMPOSANTS =====
  
  // Liste des composants avec filtres avancés
  router.get('/components', [ComponentsController, 'index'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.read' })
    ])
  
  // Détails d'un composant avec versions et statistiques
  router.get('/components/:id', [ComponentsController, 'show'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.read' })
    ])
  
  // Création d'un composant avec upload de fichiers
  router.post('/components', [ComponentsController, 'store'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])
  
  // Mise à jour d'un composant
  router.put('/components/:id', [ComponentsController, 'update'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])
  
  // Suppression d'un composant
  router.delete('/components/:id', [ComponentsController, 'destroy'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.delete' })
    ])
  
  // Duplication d'un composant
  router.post('/components/:id/duplicate', [ComponentsController, 'duplicate'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])
  
  // Changement de statut (draft/published/archived)
  router.post('/components/:id/status', [ComponentsController, 'changeStatus'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.publish' })
    ])
  
  // Statistiques détaillées d'un composant
  router.get('/components/:id/stats', [ComponentsController, 'getStats'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.read' })
    ])
  
  // Upload de fichiers (images/vidéos)
  router.post('/components/:id/upload', [ComponentsController, 'uploadFiles'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])
  
  // Génération de preview
  router.get('/components/:id/preview', [ComponentsController, 'getPreview'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.read' })
    ])
  
  // Vérification d'unicité de slug
  router.post('/components/check-slug', [ComponentsController, 'checkSlug'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.read' })
    ])
  
  // Opérations en lot
  router.post('/components/batch', [ComponentsController, 'batch'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])

  // ===== ROUTES VERSIONS DE COMPOSANTS =====
  
  // Liste des versions d'un composant
  router.get('/components/:componentId/versions', [ComponentVersionsController, 'index'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.read' })
    ])
  
  // Détails d'une version
  router.get('/components/:componentId/versions/:id', [ComponentVersionsController, 'show'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.read' })
    ])
  
  // Création d'une nouvelle version
  router.post('/components/:componentId/versions', [ComponentVersionsController, 'store'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])
  
  // Mise à jour d'une version
  router.put('/components/:componentId/versions/:id', [ComponentVersionsController, 'update'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])
  
  // Suppression d'une version
  router.delete('/components/:componentId/versions/:id', [ComponentVersionsController, 'destroy'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.delete' })
    ])
  
  // Comparaison entre deux versions
  router.get('/components/:componentId/versions/:id/compare/:compareId', [ComponentVersionsController, 'compare'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.read' })
    ])
  
  // Définir une version comme par défaut
  router.post('/components/:componentId/versions/:id/set-default', [ComponentVersionsController, 'setActive'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])
  
  // Compilation manuelle d'un preview
  router.post('/components/:componentId/versions/:id/compile', [ComponentVersionsController, 'compile'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])
  
  // Liste des frameworks disponibles
  router.get('/components/:componentId/frameworks', [ComponentVersionsController, 'getFrameworks'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.read' })
    ])
  
  // Création d'une variante pour un nouveau framework
  router.post('/components/:componentId/frameworks/:framework/variants', [ComponentVersionsController, 'createVariant'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])
  
  // Validation du code d'une version
  router.post('/components/:componentId/versions/:id/validate', [ComponentVersionsController, 'validateCode'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.read' })
    ])
  
  // Opérations en lot sur les versions
  router.post('/components/:componentId/versions/batch', [ComponentVersionsController, 'batch'])
    .use([
      middleware.auth(),
      middleware.admin(),
      middleware.permissions({ permission: 'components.write' })
    ])

}).prefix('/admin')
*/

// =====================================================
// EXEMPLES DE REQUÊTES API
// =====================================================

/*
// 1. Lister les composants avec filtres
GET /admin/components?page=1&limit=20&status=published&isFree=false&framework=react

// 2. Créer un nouveau composant
POST /admin/components
{
  "subcategoryId": "uuid-here",
  "name": "Hero Section Premium",
  "slug": "hero-section-premium",
  "description": "Section hero avec animation et CTA",
  "isFree": false,
  "requiredTier": "pro",
  "status": "draft",
  "conversionRate": 8.5,
  "tags": ["hero", "landing", "animation"]
}

// 3. Créer une nouvelle version
POST /admin/components/uuid-here/versions
{
  "framework": "react",
  "cssFramework": "tailwind_v4",
  "codePreview": "<div className=\"hero\">...</div>",
  "codeFull": "// Code complet React",
  "dependencies": ["react", "framer-motion"],
  "supportsDarkMode": true
}

// 4. Comparer deux versions
GET /admin/components/uuid-here/versions/version1-id/compare/version2-id

// 5. Opération en lot - publier plusieurs composants
POST /admin/components/batch
{
  "operation": "publish",
  "componentIds": ["uuid1", "uuid2", "uuid3"]
}

// 6. Créer une variante Vue.js depuis une version React
POST /admin/components/uuid-here/frameworks/vue/variants
{
  "cssFramework": "tailwind_v4",
  "baseVersionId": "react-version-uuid"
}
*/

// =====================================================
// INTÉGRATION AVEC LES MIDDLEWARES
// =====================================================

/*
// Les contrôleurs utilisent automatiquement :

1. AdminMiddleware : Vérifie que l'utilisateur est admin
   - Contrôle du rôle (admin ou super_admin)
   - Vérification que le compte n'est pas désactivé
   - Logging des accès admin

2. PermissionsMiddleware : Vérifie les permissions granulaires
   - components.read : Lecture des composants et versions
   - components.write : Création/modification
   - components.delete : Suppression
   - components.publish : Changement de statut
   
3. BetterAuthMiddleware : Authentification utilisateur
   - Vérification du token de session
   - Injection des informations utilisateur dans le contexte

// Exemple d'utilisation dans un contrôleur personnalisé :
export default class CustomComponentController extends BaseAdminController {
  async customAction(ctx: AdminHttpContext) {
    // L'utilisateur est automatiquement disponible
    const user = this.getUser(ctx)
    
    // Vérification des permissions
    if (!this.hasPermission(ctx, 'components.write')) {
      return this.forbidden(ctx, 'Permission insuffisante')
    }
    
    // Logging automatique
    this.logAdminAction(ctx, 'custom-action', 'component', 'uuid')
    
    // Gestion d'erreur standardisée
    try {
      // ... logique métier
    } catch (error) {
      return this.handleError(ctx, error)
    }
  }
}
*/

// =====================================================
// FONCTIONNALITÉS AVANCÉES
// =====================================================

/*
1. Versioning automatique intelligent :
   - Détection des changements réels dans le code
   - Incrémentation automatique selon le type de changement
   - Comparaison de hash pour éviter les versions inutiles

2. Gestion des variantes multi-framework :
   - Support React, Vue, Svelte, Angular, Vanilla JS
   - Conversion automatique entre frameworks (structure de base)
   - Validation du code selon le framework

3. Protection du code premium :
   - Validation du statut premium lors de la création/modification
   - Masquage automatique du code pour les utilisateurs non premium
   - Gestion des previews avec watermark pour le contenu premium

4. Upload et gestion des fichiers :
   - Integration avec @adonisjs/drive
   - Upload d'images avec génération de thumbnails
   - Upload de vidéos avec compression
   - Optimisation automatique des images

5. Compilation des previews :
   - Génération automatique de HTML compilé pour iframe
   - Injection des styles CSS selon le framework
   - Minification du code pour la production
   - Cache des previews compilés

6. Analytics et statistiques :
   - Tracking des vues, copies, téléchargements
   - Métriques de conversion par composant
   - Statistiques d'utilisation par framework

7. Opérations en lot :
   - Changement de statut multiple
   - Mise à jour des catégories en lot
   - Génération de previews en lot
   - Export/import de composants
*/

// =====================================================
// BONNES PRATIQUES
// =====================================================

/*
1. Validation des données :
   - Toujours utiliser VineJS pour valider les entrées
   - Utiliser les schémas définis dans component_validators.ts
   - Gérer les erreurs de validation avec handleError()

2. Logging des actions :
   - Utiliser logAdminAction() pour tracer toutes les actions admin
   - Inclure les détails pertinents (IDs, données modifiées)
   - Les logs sont automatiquement enrichis avec l'IP, user-agent, etc.

3. Gestion des erreurs :
   - Utiliser les méthodes de BaseAdminController (notFound, conflict, etc.)
   - Toujours passer par handleError() pour une gestion centralisée
   - Retourner des codes d'erreur HTTP appropriés

4. Sécurité :
   - Toujours vérifier les permissions avant les actions sensibles
   - Valider que les ressources appartiennent au bon contexte
   - Nettoyer les données d'entrée avec sanitizeInput()

5. Performance :
   - Utiliser la pagination pour les listes importantes
   - Mettre en cache les previews compilés
   - Optimiser les requêtes de base de données

6. Versioning intelligent :
   - Laisser le service gérer l'incrémentation automatique
   - Utiliser forceNewVersion seulement quand nécessaire
   - Comparer les hash pour éviter les versions inutiles
*/

export {}