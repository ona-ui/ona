/*
|--------------------------------------------------------------------------
| Routes file - Ona UI API
|--------------------------------------------------------------------------
|
| Configuration complète des routes API avec séparation claire public/admin
| Structure organisée par domaines fonctionnels avec middlewares appropriés
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
/*
|--------------------------------------------------------------------------
| Routes publiques - /api/public/
|--------------------------------------------------------------------------
|
| Routes accessibles sans authentification avec middleware optionalAuth
| pour la personnalisation et rate limiting pour éviter l'abus
|
*/
router.group(() => {

  /*
  |--------------------------------------------------------------------------
  | Categories publiques
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // Liste des catégories avec cache long
    router.get('/', '#controllers/public/categories_controller.index')

    // Structure de navigation optimisée
    router.get('/navigation', '#controllers/public/categories_controller.getNavigation')

    // Statistiques publiques des catégories
    router.get('/stats', '#controllers/public/categories_controller.getStats')

    // Détails d'une catégorie par id
    router.get('/:id', '#controllers/public/categories_controller.show')

  }).prefix('/categories')

  /*
  |--------------------------------------------------------------------------
  | Components publiques
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // Liste des composants avec filtres et pagination
    router.get('/', '#controllers/public/components_controller.index')

    // Recherche de composants
    router.get('/search', '#controllers/public/components_controller.search')

    // Composants mis en avant
    router.get('/featured', '#controllers/public/components_controller.getFeatured')

    // Composants populaires
    router.get('/popular', '#controllers/public/components_controller.getPopular')

    // Détails d'un composant par id
    router.get('/:id', '#controllers/public/components_controller.show')

    // Preview compilé d'un composant
    router.get('/:id/preview', '#controllers/public/components_controller.getPreview')

    // Recommandations basées sur un composant
    router.get('/:id/recommendations', '#controllers/public/components_controller.getRecommendations')

    // Assets d'un composant (images, vidéos, etc.)
    router.get('/:id/assets', '#controllers/public/components_controller.getComponentAssets')

    // Incrémenter le compteur de copies d'un composant
    router.post('/:id/copy', '#controllers/public/components_controller.incrementCopyCount')

  }).prefix('/components')
  /*
  |--------------------------------------------------------------------------
  | Paiements Stripe
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // Configuration publique Stripe
    router.get('/config', '#controllers/public/payment_controller.getConfig')

    // Création d'une session de checkout
    router.post('/create-checkout-session', '#controllers/public/payment_controller.createCheckoutSession')

    // Récupération des détails d'une session
    router.get('/session/:sessionId', '#controllers/public/payment_controller.getSession')

    // Vérification du statut de paiement
    router.get('/session/:sessionId/status', '#controllers/public/payment_controller.getSessionStatus')

    // Vérification du paiement pour la page de succès
    router.get('/verify', '#controllers/public/payment_controller.verifyPayment')

    // Informations sur un produit Stripe
    router.get('/product/:productId', '#controllers/public/payment_controller.getProduct')

    // Informations sur un prix Stripe
    router.get('/price/:priceId', '#controllers/public/payment_controller.getPrice')

  }).prefix('/payment')

  /*
  |--------------------------------------------------------------------------
  | Webhooks Stripe
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // Endpoint principal pour recevoir les webhooks Stripe
    router.post('/stripe', '#controllers/public/webhook_controller.handleStripeWebhook')

    // Statistiques des webhooks
    router.get('/stripe/stats', '#controllers/public/webhook_controller.getWebhookStats')

  }).prefix('/webhooks')

  /*
  |--------------------------------------------------------------------------
  | Authentification Better Auth
  |--------------------------------------------------------------------------
  */
  // Routes Better Auth gérées par le middleware

  /*
  |--------------------------------------------------------------------------
  | Dashboard utilisateur
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // Données complètes du dashboard
    router.get('/dashboard', '#controllers/public/user_controller.getDashboardData')

    // Profil utilisateur
    router.get('/profile', '#controllers/public/user_controller.getProfile')

    // Licences utilisateur
    router.get('/licenses', '#controllers/public/user_controller.getLicenses')

    // Statistiques utilisateur
    router.get('/stats', '#controllers/public/user_controller.getStats')

  }).prefix('/user')

}).prefix('/api/public').middleware([middleware.optionalAuth()])

/*
|--------------------------------------------------------------------------
| Routes Better Auth natives - /api/auth/
|--------------------------------------------------------------------------
|
| Les routes Better Auth sont gérées par le BetterAuthMiddleware
| Pas besoin de route explicite ici
|
*/

/*
|--------------------------------------------------------------------------
| Routes administrateur - /api/admin/
|--------------------------------------------------------------------------
|
| Routes protégées nécessitant authentification + permissions admin
| Logging de toutes les actions pour audit et sécurité
|
*/
router.group(() => {

  /*
  |--------------------------------------------------------------------------
  | Categories admin
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // Actions spécialisées (DOIVENT être définies AVANT les routes avec paramètres)
    router.post('/reorder', '#controllers/admin/categories_controller.reorder')
    router.get('/stats/detailed', '#controllers/admin/categories_controller.getStats')
    router.get('/global-stats', '#controllers/admin/categories_controller.getGlobalStats')
    router.post('/check-slug', '#controllers/admin/categories_controller.checkSlug')
    router.get('/export', '#controllers/admin/categories_controller.export')
    router.post('/batch', '#controllers/admin/categories_controller.batch')

    // CRUD de base (routes avec paramètres en dernier)
    router.get('/', '#controllers/admin/categories_controller.index')
    router.post('/', '#controllers/admin/categories_controller.store')
    router.get('/:id', '#controllers/admin/categories_controller.show')
    router.put('/:id', '#controllers/admin/categories_controller.update')
    router.delete('/:id', '#controllers/admin/categories_controller.destroy')

  }).prefix('/categories')

  /*
  |--------------------------------------------------------------------------
  | Subcategories admin
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // CRUD de base
    router.get('/', '#controllers/admin/subcategories_controller.index')
    router.post('/', '#controllers/admin/subcategories_controller.store')
    router.get('/:id', '#controllers/admin/subcategories_controller.show')
    router.put('/:id', '#controllers/admin/subcategories_controller.update')
    router.delete('/:id', '#controllers/admin/subcategories_controller.destroy')

    // Actions spécialisées
    router.post('/:id/move', '#controllers/admin/subcategories_controller.move')
    router.post('/reorder', '#controllers/admin/subcategories_controller.reorder')
    router.post('/check-slug', '#controllers/admin/subcategories_controller.checkSlug')
    router.post('/batch', '#controllers/admin/subcategories_controller.batch')

  }).prefix('/subcategories')

  /*
  |--------------------------------------------------------------------------
  | Components admin
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // CRUD de base
    router.get('/', '#controllers/admin/components_controller.index')
    router.post('/', '#controllers/admin/components_controller.store')
    router.get('/:id', '#controllers/admin/components_controller.show')
    router.put('/:id', '#controllers/admin/components_controller.update')
    router.delete('/:id', '#controllers/admin/components_controller.destroy')

    // Actions spécialisées
    router.post('/:id/duplicate', '#controllers/admin/components_controller.duplicate')
    router.post('/:id/status', '#controllers/admin/components_controller.changeStatus')
    router.get('/:id/stats', '#controllers/admin/components_controller.getStats')
    router.post('/:id/files', '#controllers/admin/components_controller.uploadFiles')
    router.get('/:id/preview', '#controllers/admin/components_controller.getPreview')
    router.post('/batch', '#controllers/admin/components_controller.batch')

  }).prefix('/components')

  /*
  |--------------------------------------------------------------------------
  | Component Versions admin
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // Versions d'un composant
    router.get('/:componentId/versions', '#controllers/admin/component_versions_controller.index')
    router.post('/:componentId/versions', '#controllers/admin/component_versions_controller.store')

    // Gestion individuelle des versions (avec componentId)
    router.get('/:componentId/versions/:id', '#controllers/admin/component_versions_controller.show')
    router.put('/:componentId/versions/:id', '#controllers/admin/component_versions_controller.update')
    router.delete('/:componentId/versions/:id', '#controllers/admin/component_versions_controller.destroy')

    // Actions spécialisées sur les versions (avec componentId)
    router.post('/:componentId/versions/:id/compare/:otherId', '#controllers/admin/component_versions_controller.compare')
    router.post('/:componentId/versions/:id/activate', '#controllers/admin/component_versions_controller.setActive')
    router.post('/:componentId/versions/:id/compile', '#controllers/admin/component_versions_controller.compile')
    router.get('/:componentId/frameworks', '#controllers/admin/component_versions_controller.getFrameworks')
    router.post('/:componentId/versions/:id/variants', '#controllers/admin/component_versions_controller.createVariant')

  }).prefix('/components')

  /*
  |--------------------------------------------------------------------------
  | Version Assets admin
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // Gestion des assets des versions
    router.post('/:componentId/versions/:id/assets', '#controllers/admin/component_versions_controller.uploadAssets')
    router.get('/:componentId/versions/:id/assets', '#controllers/admin/component_versions_controller.getAssets')
    router.delete('/:componentId/versions/:id/assets/:filename', '#controllers/admin/component_versions_controller.deleteAsset')

  }).prefix('/components')

  /*
  |--------------------------------------------------------------------------
  | Files admin
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // Upload de fichiers
    router.post('/images', '#controllers/admin/files_controller.uploadImage')
    router.post('/videos', '#controllers/admin/files_controller.uploadVideo')
    router.post('/batch-upload', '#controllers/admin/files_controller.batchUpload')

    // Gestion des fichiers
    router.get('/:path/info', '#controllers/admin/files_controller.getFileInfo')
    router.delete('/:path', '#controllers/admin/files_controller.deleteFile')

  }).prefix('/files')

}).prefix('/api/admin').middleware([middleware.admin()])

/*
|--------------------------------------------------------------------------
| Routes utilisateur authentifié - /api/user/
|--------------------------------------------------------------------------
|
| Routes pour utilisateurs connectés avec accès premium selon l'endpoint
| Fonctionnalités pour utilisateurs authentifiés non-admin
|
*/
router.group(() => {

  /*
  |--------------------------------------------------------------------------
  | Profil utilisateur
  |--------------------------------------------------------------------------
  */
  router.group(() => {
    // Gestion du profil
    router.get('/', async ({ response }) => {
      // TODO: Implémenter UserController.getProfile
      return response.json({
        message: 'Profile endpoint - À implémenter dans le UserController'
      })
    })

    router.put('/', async ({ response }) => {
      // TODO: Implémenter UserController.updateProfile
      return response.json({
        message: 'Update profile endpoint - À implémenter dans le UserController'
      })
    })

  }).prefix('/profile')

  /*
  |--------------------------------------------------------------------------
  | Permissions et abonnement utilisateur
  |--------------------------------------------------------------------------
  */
  // Permissions de l'utilisateur connecté
  router.get('/permissions', '#controllers/public/user_controller.getPermissions')

  // Informations d'abonnement de l'utilisateur connecté
  router.get('/subscription', '#controllers/public/user_controller.getSubscription')

}).prefix('/api/user').middleware([middleware.auth()])

/*
|--------------------------------------------------------------------------
| Route de santé et informations système
|--------------------------------------------------------------------------
|
| Routes utiles pour le monitoring et les vérifications système
|
*/
router.group(() => {

  // Health check
  router.get('/health', async ({ response }) => {
    return response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    })
  })

  // Informations sur l'API
  router.get('/info', async ({ response }) => {
    return response.json({
      name: 'Ona UI API',
      version: '1.0.0',
      description: 'API pour la bibliothèque de composants Ona UI',
      endpoints: {
        auth: '/api/auth/*',
        public: '/api/public/*',
        admin: '/api/admin/*',
        user: '/api/user/*'
      },
      documentation: 'https://docs.ona-ui.com/api'
    })
  })

}).prefix('/api')

/*
|--------------------------------------------------------------------------
| Route racine pour les redirections Better Auth
|--------------------------------------------------------------------------
|
| Better Auth redirige parfois vers la racine, on gère cela proprement
|
*/
router.get('/', async ({ response, request }) => {
  const error = request.qs().error
  const token = request.qs().token
  
  if (error) {
    return response.json({
      message: 'Authentication error',
      error: error,
      redirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=${error}`
    })
  }
  
  if (token) {
    return response.json({
      message: 'Authentication token received',
      redirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify?token=${token}`
    })
  }
  
  return response.json({
    message: 'Ona UI API Server',
    version: '1.0.0',
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000'
  })
})

/*
|--------------------------------------------------------------------------
| Gestion des routes non trouvées
|--------------------------------------------------------------------------
|
| Retourne une erreur 404 structurée pour les routes API non trouvées
|
*/
router.any('/api/*', async ({ response, request }) => {
  return response.status(404).json({
    error: 'Route non trouvée',
    message: `La route ${request.method()} ${request.url()} n'existe pas`,
    availableEndpoints: {
      auth: '/api/auth/*',
      public: '/api/public/*',
      admin: '/api/admin/* (authentification requise)',
      user: '/api/user/* (authentification requise)'
    },
    timestamp: new Date().toISOString()
  })
})
