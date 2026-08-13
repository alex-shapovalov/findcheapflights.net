import type { Metadata } from 'next'
import { APP_NAME, SITE_URL } from './constants'

export const SITE_NAME = APP_NAME
export const SITE_DOMAIN = 'findcheapflights.net'

export const DEFAULT_TITLE = 'Find Cheap Flights — Hunt Live Cheap Fares'
export const DEFAULT_DESCRIPTION =
  'Find cheap flights from nearby airports or to a city you already want. Flexible dates, price bounds, and one free live fare hunt on findcheapflights.net.'

export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`

export const noIndexRobots = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
} satisfies Metadata['robots']

export const indexRobots = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
} satisfies Metadata['robots']

export const noIndexMetadata = {
  robots: noIndexRobots,
} satisfies Metadata

export const INDEXABLE_PATHS = new Set(['/', '/pricing', '/terms', '/privacy'])

export const X_ROBOTS_INDEX =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

export const X_ROBOTS_NOINDEX = 'noindex, nofollow'

export function xRobotsTag(pathname: string) {
  const isPreview =
    process.env.VERCEL_ENV != null && process.env.VERCEL_ENV !== 'production'
  if (!isPreview && INDEXABLE_PATHS.has(pathname)) {
    return X_ROBOTS_INDEX
  }
  return X_ROBOTS_NOINDEX
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title?: string
  description: string
  path: string
}): Metadata {
  const url = new URL(path, SITE_URL).toString()
  const resolvedTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  return {
    title: title ?? { absolute: DEFAULT_TITLE },
    description,
    alternates: { canonical: path },
    robots: indexRobots,
    openGraph: {
      type: 'website',
      url,
      title: resolvedTitle,
      description,
      siteName: SITE_NAME,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
    },
  }
}

export const HOME_FAQS = [
  {
    question: 'What is findcheapflights.net?',
    answer:
      'Find Cheap Flights is a live fare hunter. You pick airports near you and a continent — or lock a destination and let origins flex — then an aggressive model searches public fare pages for stupid-cheap tickets.',
  },
  {
    question: 'How is this different from Google Flights?',
    answer:
      'Google Flights is a timetable. We hunt. Flexible origins, flexible destinations, date windows, night ranges, and a price ceiling — then a deal-seeking model reads live public fares instead of a GDS.',
  },
  {
    question: 'Is there a free cheap-flight search?',
    answer:
      'Yes. You get one free live fare hunt without signing in. After that, sign in and subscribe to Pro for $5/month or $50/year for 25 searches a day.',
  },
  {
    question: 'Do you book the ticket?',
    answer:
      'No. We find the fare and show you where it was listed. You book on the airline or OTA yourself.',
  },
  {
    question: 'What trip types can I search?',
    answer:
      'Round trip or one way, with optional min/max price, a date window, and a stay length. Origins can expand to airports within about six hours of home.',
  },
] as const

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: [SITE_DOMAIN, 'FindCheapFlights'],
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: SITE_DOMAIN,
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    description: DEFAULT_DESCRIPTION,
  }
}

export function softwareJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'One free live fare hunt per account',
    },
  }
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQS.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function pricingJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: `${SITE_NAME} Pro`,
    url: `${SITE_URL}/pricing`,
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'Pro Monthly',
        price: '5.00',
        priceCurrency: 'USD',
        url: `${SITE_URL}/pricing`,
        description: '25 live cheap-flight hunts per day',
      },
      {
        '@type': 'Offer',
        name: 'Pro Yearly',
        price: '50.00',
        priceCurrency: 'USD',
        url: `${SITE_URL}/pricing`,
        description: '25 live cheap-flight hunts per day, two months free',
      },
    ],
  }
}
