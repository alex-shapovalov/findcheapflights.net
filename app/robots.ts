import type { MetadataRoute } from 'next'
import { isCanonicalSite, SITE_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  if (!isCanonicalSite) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/history', '/success'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
