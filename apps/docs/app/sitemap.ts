import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl.replace(/\/$/, '')
  const now = new Date()

  // Routes publiques principales à exposer dans le sitemap
  const routes = [
    '',                 // /
    '/pricing',
    '/docs',
    '/docs/components',
  ]

  return routes.map((path) => ({
    url: `${base}${path || '/'}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : 0.7,
  }))
}