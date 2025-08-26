import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  const host = (() => {
    try {
      return new URL(siteUrl).host
    } catch {
      return 'localhost:3000'
    }
  })()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${siteUrl.replace(/\/$/, '')}/sitemap.xml`,
    host,
  }
}