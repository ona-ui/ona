import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class CorsDebugMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    
    console.log('🔍 [CORS DEBUG] Requête:', request.method(), request.url())
    console.log('🔍 [CORS DEBUG] Origin:', request.header('origin'))
    console.log('🔍 [CORS DEBUG] Headers:', Object.keys(request.headers()))
    
    if (request.method() === 'OPTIONS') {
      console.log('🔍 [CORS DEBUG] Requête OPTIONS (preflight) détectée')
      console.log('🔍 [CORS DEBUG] Access-Control-Request-Method:', request.header('access-control-request-method'))
      console.log('🔍 [CORS DEBUG] Access-Control-Request-Headers:', request.header('access-control-request-headers'))
    }
    
    await next()
    
    // Log des headers de réponse après traitement
    console.log('🔍 [CORS DEBUG] Réponse status:', response.response.statusCode)
    console.log('🔍 [CORS DEBUG] Headers de réponse CORS:')
    console.log('  - Access-Control-Allow-Origin:', response.response.getHeader('access-control-allow-origin'))
    console.log('  - Access-Control-Allow-Methods:', response.response.getHeader('access-control-allow-methods'))
    console.log('  - Access-Control-Allow-Headers:', response.response.getHeader('access-control-allow-headers'))
    console.log('  - Access-Control-Allow-Credentials:', response.response.getHeader('access-control-allow-credentials'))
  }
}