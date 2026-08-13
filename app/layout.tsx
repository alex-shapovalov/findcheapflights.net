import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Geist, Geist_Mono } from 'next/font/google'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { Providers } from '@/components/providers'
import {
  AFTER_AUTH_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  SITE_URL,
} from '@/lib/constants'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  indexRobots,
  SITE_NAME,
  TITLE_TEMPLATE,
} from '@/lib/seo'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  themeColor: '#071018',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'travel',
  keywords: [
    'find cheap flights',
    'cheap flights',
    'findcheapflights.net',
    'flexible date flights',
    'nearby airport deals',
    'fare hunter',
  ],
  robots: indexRobots,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  appleWebApp: {
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider
          signInUrl={SIGN_IN_PATH}
          signUpUrl={SIGN_UP_PATH}
          signInFallbackRedirectUrl={AFTER_AUTH_PATH}
          signUpFallbackRedirectUrl={AFTER_AUTH_PATH}
          appearance={{
            variables: {
              colorPrimary: '#e8b84a',
              colorBackground: '#0e1a24',
              borderRadius: '0.75rem',
            },
          }}
        >
          <Providers>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-gold focus:px-3 focus:py-2 focus:text-ink"
            >
              Skip to content
            </a>
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
