import type { MetadataRoute } from 'next'
import { APP_NAME, SITE_URL } from '@/lib/constants'
import { DEFAULT_DESCRIPTION } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: 'Cheap Flights',
    description: DEFAULT_DESCRIPTION,
    start_url: '/',
    id: SITE_URL,
    lang: 'en',
    display: 'standalone',
    background_color: '#071018',
    theme_color: '#071018',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
