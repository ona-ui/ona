
import env from '#start/env'
import { defineConfig } from '@julr/adonisjs-prometheus'
import { httpCollector } from '@julr/adonisjs-prometheus/collectors/http_collector'
import { cacheCollector } from '@julr/adonisjs-prometheus/collectors/cache_collector'
import { systemCollector } from '@julr/adonisjs-prometheus/collectors/system_collector'

export default defineConfig({
  /**
   * Endpoint where metrics will be exposed
   */
  endpoint: '/metrics',

  /**
   * A prefix that will be added to all metrics
   * names
   */
  metricsPrefix: env.get('APP_NAME'),

  /**
   * List of IPs that are allowed to access the
   * metrics endpoint. If empty, then everyone
   * can access the endpoint
   */
  ipsWhitelist: ['83.114.59.193', '80.15.118.132', '162.19.230.171'],

  /**
   * List of collectors that will be registered
   * and expose new metrics.
   *
   * Feel free to remove collectors that you
   * don't want to use
   */
  collectors: [
    httpCollector(),
    //mailCollector(),
    //lucidCollector(),
    cacheCollector({
      /**
       * Group cache keys to reduce metric cardinality
       * 
       * Example: Transform 'users:1', 'users:2', etc. into 'users:*'
       * to avoid creating individual metrics for each user ID
       */
      keyGroups: [
        // [/^users:(d+)$/, 'users:*'],
        // [/^posts:(d+)$/, 'posts:*'],
        // [/^session:[w-]+$/, 'session:*'],
      ],
    }),
    systemCollector(),
  ],
})