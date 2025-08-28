/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
|
| The HTTP kernel file is used to register the middleware with the server
| or the router.
|
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/**
 * The error handler is used to convert an exception
 * to an HTTP response.
 */
server.errorHandler(() => import('#exceptions/handler'))

/**
 * The server middleware stack runs middleware on all the HTTP
 * requests, even if there is no route registered for
 * the request URL.
 */
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/force_json_response_middleware'),
  () => import('#middleware/cors_debug_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('#middleware/better_auth_middleware'),
  // () => import('#middleware/premium_middleware'),
])

/**
 * The router middleware stack runs middleware on all the HTTP
 * requests with a registered route.
 */
router.use([() => import('@adonisjs/core/bodyparser_middleware'), () => import('@adonisjs/session/session_middleware')])

/**
 * Named middleware collection must be explicitly assigned to
 * the routes or the routes group.
 */
export const middleware = router.named({
  // Authentification
  auth: () => import('#middleware/better_auth_middleware'),
  optionalAuth: () => import('#middleware/optional_auth_middleware'),
  
  // Autorisation
  admin: () => import('#middleware/admin_middleware'),
})
