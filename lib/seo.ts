import type { Metadata } from 'next'
import type { BlogPost } from './blog'
import { APP_NAME, SITE_URL } from './constants'
import type { StoryEntry } from './story'

export const SITE_NAME = APP_NAME
export const SITE_DOMAIN = 'findcheapflights.ai'

export const DEFAULT_TITLE = 'Find Cheap Flights — Hunt Live Cheap Fares'
export const DEFAULT_DESCRIPTION =
  'Find cheap flights from nearby airports or to a city you already want. Flexible dates, price bounds, and one free live fare hunt on findcheapflights.ai.'

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

export const notFoundMetadata = {
  ...noIndexMetadata,
  title: 'Page not found',
  description: 'This page does not exist on findcheapflights.ai.',
} satisfies Metadata

export const INDEXABLE_PATHS = new Set([
  '/',
  '/pricing',
  '/terms',
  '/privacy',
  '/story',
  '/blog',
])

export function isIndexablePath(pathname: string) {
  return (
    INDEXABLE_PATHS.has(pathname) ||
    pathname.startsWith('/story/') ||
    pathname.startsWith('/blog/')
  )
}

export const X_ROBOTS_INDEX =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

export const X_ROBOTS_NOINDEX = 'noindex, nofollow'

export function xRobotsTag(pathname: string) {
  const isPreview =
    process.env.VERCEL_ENV != null && process.env.VERCEL_ENV !== 'production'
  if (!isPreview && isIndexablePath(pathname)) {
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

export function articleMetadata({
  title,
  description,
  path,
  publishedTime,
}: {
  title: string
  description: string
  path: string
  publishedTime: string
}): Metadata {
  const url = new URL(path, SITE_URL).toString()
  const resolvedTitle = `${title} | ${SITE_NAME}`
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: indexRobots,
    openGraph: {
      type: 'article',
      url,
      title: resolvedTitle,
      description,
      siteName: SITE_NAME,
      locale: 'en_US',
      publishedTime,
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
    question: 'What is findcheapflights.ai?',
    answer:
      'Find Cheap Flights is a live fare hunter. You pick airports near you and a continent, or lock a destination and let origins flex, then we search public fare pages for stupid-cheap tickets.',
  },
  {
    question: 'How is this different from Google Flights?',
    answer:
      'Google Flights is a timetable, you need to know where you want to go, and when. Instead, we let you be as flexible as possible and find the trip you didn\'t know you could take. Flexible origins, flexible destinations, date windows, night ranges, and a price ceiling.',
  },
  {
    question: 'Is there a free cheap-flight search?',
    answer:
      'Yes. We offer a one-time free search to try us out. After that, sign in and subscribe to Pro for $11.99/month or $199.99/year for 25 searches a day.',
  },
  {
    question: 'Do you book the ticket?',
    answer:
      'No. We find the fare and show you where it was listed. You book on the airline or OTA yourself. Super simple.',
  },
  {
    question: 'What trip types can I search?',
    answer:
      'Round trip or one way, with optional min/max price, a date window, and a stay length. Origins can expand to airports within about six hours of home.',
  },
  {
    question: 'Can I get cheap flights delivered to my email?',
    answer:
      'Not yet, but it is coming. Save a hunt and we email you when new cheap inventory shows up, weekly or every other week. You do not have to come back to check. We will also send you similar cheap flights you may be interested in.',
  },
  {
    question: 'Will there be a travel blog tailored to me?',
    answer:
      "That's the plan. We want to learn from you and give you a custom personalized blog to help you find the cheap destinations we know you'd love.",
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

export function storyIndexJsonLd(entries: StoryEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} story`,
    url: `${SITE_URL}/story`,
    description:
      'A dated journal of what findcheapflights.ai shipped and what is coming next.',
    blogPost: entries.map(entry => storyEntryJsonLd(entry)),
  }
}

export function storyEntryJsonLd(entry: StoryEntry) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: entry.title,
    datePublished: entry.date,
    url: `${SITE_URL}/story/${entry.slug}`,
    description: entry.summary,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export function blogIndexJsonLd(posts: BlogPost[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} blog`,
    url: `${SITE_URL}/blog`,
    description:
      'Guides on how to find cheap flights: nearby airports, flexible dates, and live fare hunting.',
    blogPost: posts.map(post => blogPostJsonLd(post)[0]),
  }
}

export function blogPostJsonLd(post: BlogPost) {
  const url = `${SITE_URL}/blog/${post.slug}`
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.date,
      url,
      description: post.description,
      mainEntityOfPage: url,
      inLanguage: 'en-US',
      author: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/icon`,
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: `${SITE_URL}/blog`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title,
          item: url,
        },
      ],
    },
  ]
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
        price: '11.99',
        priceCurrency: 'USD',
        url: `${SITE_URL}/pricing`,
        description: '25 live cheap-flight hunts per day',
      },
      {
        '@type': 'Offer',
        name: 'Pro Yearly',
        price: '199.99',
        priceCurrency: 'USD',
        url: `${SITE_URL}/pricing`,
        description: '25 live cheap-flight hunts per day',
      },
    ],
  }
}
